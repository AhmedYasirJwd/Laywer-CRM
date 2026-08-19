"use client";

import * as offlineDb from "./offline-db";
import type { Hearing, Task } from "./types";

// Backstop for the server-side reminders (src/lib/notifications-cron.ts).
// The cron works even when this device is completely closed — but it needs
// the *server* to have network to deliver the push. This runs entirely
// on-device against whatever's already cached in IndexedDB (see
// offline-db.ts), so it still fires a reminder if the app is open —
// foreground or a background tab — even while this device has zero
// internet connectivity.
//
// What it can't do: fire while the app itself isn't open at all. No web
// app, installed or not, can wake itself up with no connectivity — that's
// true of any app, not a limitation specific to this one.

const SENT_KEY = "lexcase-local-reminders-sent";
const MAX_TRACKED_TAGS = 500;

function getSentTags(): Set<string> {
  try {
    const raw = localStorage.getItem(SENT_KEY);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

function markSent(tag: string): void {
  try {
    const tags = getSentTags();
    tags.add(tag);
    const trimmed = Array.from(tags).slice(-MAX_TRACKED_TAGS);
    localStorage.setItem(SENT_KEY, JSON.stringify(trimmed));
  } catch {
    // Storage full/unavailable — worst case a reminder repeats once.
  }
}

async function showLocalNotification(title: string, body: string, url: string, tag: string): Promise<void> {
  try {
    const registration = await navigator.serviceWorker.ready;
    await registration.showNotification(title, {
      body,
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      tag,
      renotify: true,
      data: { url },
    } as NotificationOptions & { renotify: boolean });
  } catch {
    // No active service worker registration for some reason — plain
    // Notification still works as a fallback.
    try {
      new Notification(title, { body });
    } catch {
      // Nothing more we can do.
    }
  }
}

export async function checkLocalReminders(): Promise<void> {
  if (typeof window === "undefined") return;
  if (!("Notification" in window) || Notification.permission !== "granted") return;

  const [hearings, tasks] = await Promise.all([
    offlineDb.getAll<Hearing>("hearings"),
    offlineDb.getAll<Task>("tasks"),
  ]);

  const sent = getSentTags();
  const now = Date.now();
  const in1Hour = now + 60 * 60 * 1000;
  const in24Hours = now + 24 * 60 * 60 * 1000;

  for (const hearing of hearings) {
    const t = new Date(hearing.date).getTime();
    if (Number.isNaN(t) || t <= now) continue;

    const tag24 = `hearing-24h-${hearing.id}`;
    if (t <= in24Hours && !sent.has(tag24)) {
      await showLocalNotification("Hearing tomorrow", `${hearing.purpose} at ${hearing.court}`, "/calendar", tag24);
      markSent(tag24);
    }

    const tag1 = `hearing-1h-${hearing.id}`;
    if (t <= in1Hour && !sent.has(tag1)) {
      await showLocalNotification("Hearing in 1 hour", `${hearing.purpose} at ${hearing.court}`, "/calendar", tag1);
      markSent(tag1);
    }
  }

  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().slice(0, 10);

  for (const task of tasks) {
    if (task.status !== "Pending" || !task.dueDate) continue;
    if (task.dueDate.slice(0, 10) !== tomorrowStr) continue;

    const tag = `task-due-${task.id}`;
    if (!sent.has(tag)) {
      await showLocalNotification("Task due tomorrow", task.title, "/tasks", tag);
      markSent(tag);
    }
  }
}
