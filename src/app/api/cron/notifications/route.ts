import { NextRequest, NextResponse } from "next/server";
import { runNotificationReminders } from "@/lib/notifications-cron";

// Hit on a schedule by Vercel Cron (see vercel.json) — not by a signed-in
// user, so it's excluded from the normal auth middleware (src/middleware.ts)
// and instead checks CRON_SECRET itself. Vercel automatically sends that
// value as `Authorization: Bearer <CRON_SECRET>` for jobs defined in
// vercel.json, as long as the CRON_SECRET env var is set on the project.
export async function GET(req: NextRequest) {
  const expected = process.env.CRON_SECRET;
  if (!expected) {
    return NextResponse.json({ error: "CRON_SECRET is not configured" }, { status: 500 });
  }

  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${expected}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runNotificationReminders();
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error("Notifications cron failed:", err);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
