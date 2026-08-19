import webpush from "web-push";
import { createSupabaseAdminClient } from "./supabase/admin";

// Deliberately separate from db.ts: db.ts always operates as "whoever is
// signed in right now" via the cookie-bound server client, and Postgres RLS
// does the real access control. A scheduled job has no signed-in user and
// has to look across every account, so it uses the service-role admin
// client instead — kept isolated here so that distinction stays obvious.

/* eslint-disable @typescript-eslint/no-explicit-any */

interface PushPayload {
  title: string;
  body: string;
  url: string;
  tag: string;
}

interface ReminderResult {
  hearingsChecked: number;
  tasksChecked: number;
  notificationsSent: number;
  subscriptionsPruned: number;
  errors: string[];
}

let vapidConfigured = false;

function ensureVapidConfigured() {
  if (vapidConfigured) return;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT;
  if (!publicKey || !privateKey || !subject) {
    throw new Error("Missing NEXT_PUBLIC_VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, or VAPID_SUBJECT");
  }
  webpush.setVapidDetails(subject, publicKey, privateKey);
  vapidConfigured = true;
}

function formatHearingTime(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    weekday: "short",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

// Sends `payload` to every subscription the user has, dropping any
// subscription the push service reports as gone (404/410 — the browser
// unsubscribed, uninstalled, or the endpoint simply expired).
async function sendToUser(
  admin: ReturnType<typeof createSupabaseAdminClient>,
  userId: string,
  payload: PushPayload,
  result: ReminderResult
) {
  const { data: subs, error } = await admin
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth")
    .eq("user_id", userId);

  if (error) {
    result.errors.push(`subscriptions lookup for user ${userId}: ${error.message}`);
    return;
  }
  if (!subs || subs.length === 0) return;

  await Promise.all(
    subs.map(async (sub: any) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          JSON.stringify(payload)
        );
        result.notificationsSent += 1;
      } catch (err: any) {
        const statusCode = err?.statusCode;
        if (statusCode === 404 || statusCode === 410) {
          await admin.from("push_subscriptions").delete().eq("id", sub.id);
          result.subscriptionsPruned += 1;
        } else {
          result.errors.push(`push send to subscription ${sub.id}: ${err?.message ?? String(err)}`);
        }
      }
    })
  );
}

export async function runNotificationReminders(): Promise<ReminderResult> {
  ensureVapidConfigured();
  const admin = createSupabaseAdminClient();
  const result: ReminderResult = {
    hearingsChecked: 0,
    tasksChecked: 0,
    notificationsSent: 0,
    subscriptionsPruned: 0,
    errors: [],
  };

  const now = new Date();
  const in1Hour = new Date(now.getTime() + 60 * 60 * 1000);
  const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  // ---------------------------------------------------------------- hearings --
  // 24-hour-out reminder.
  {
    const { data, error } = await admin
      .from("hearings")
      .select("id, user_id, date, purpose, court, cases(title)")
      .is("reminder_24h_sent_at", null)
      .gt("date", now.toISOString())
      .lte("date", in24Hours.toISOString());

    if (error) {
      result.errors.push(`24h hearings query: ${error.message}`);
    } else {
      for (const hearing of data ?? []) {
        result.hearingsChecked += 1;
        const caseTitle = (hearing as any).cases?.title ?? "your case";
        await sendToUser(admin, hearing.user_id, {
          title: "Hearing tomorrow",
          body: `${caseTitle} — ${hearing.purpose} at ${hearing.court}, ${formatHearingTime(hearing.date)}`,
          url: "/calendar",
          tag: `hearing-24h-${hearing.id}`,
        }, result);
        await admin
          .from("hearings")
          .update({ reminder_24h_sent_at: now.toISOString() })
          .eq("id", hearing.id);
      }
    }
  }

  // 1-hour-out reminder.
  {
    const { data, error } = await admin
      .from("hearings")
      .select("id, user_id, date, purpose, court, cases(title)")
      .is("reminder_1h_sent_at", null)
      .gt("date", now.toISOString())
      .lte("date", in1Hour.toISOString());

    if (error) {
      result.errors.push(`1h hearings query: ${error.message}`);
    } else {
      for (const hearing of data ?? []) {
        result.hearingsChecked += 1;
        const caseTitle = (hearing as any).cases?.title ?? "your case";
        await sendToUser(admin, hearing.user_id, {
          title: "Hearing in 1 hour",
          body: `${caseTitle} — ${hearing.purpose} at ${hearing.court}, ${formatHearingTime(hearing.date)}`,
          url: "/calendar",
          tag: `hearing-1h-${hearing.id}`,
        }, result);
        await admin
          .from("hearings")
          .update({ reminder_1h_sent_at: now.toISOString() })
          .eq("id", hearing.id);
      }
    }
  }

  // ------------------------------------------------------------------- tasks --
  // Tasks only carry a due date (no time of day), so they get a single
  // "due tomorrow" reminder rather than the two hearings get.
  {
    const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().slice(0, 10);

    const { data, error } = await admin
      .from("tasks")
      .select("id, user_id, title, due_date, case_id, cases(title)")
      .is("reminder_sent_at", null)
      .eq("status", "Pending")
      .eq("due_date", tomorrowStr);

    if (error) {
      result.errors.push(`tasks query: ${error.message}`);
    } else {
      for (const task of data ?? []) {
        result.tasksChecked += 1;
        const caseTitle = (task as any).cases?.title;
        await sendToUser(admin, task.user_id, {
          title: "Task due tomorrow",
          body: caseTitle ? `${task.title} — ${caseTitle}` : task.title,
          url: "/tasks",
          tag: `task-due-${task.id}`,
        }, result);
        await admin.from("tasks").update({ reminder_sent_at: now.toISOString() }).eq("id", task.id);
      }
    }
  }

  return result;
}
