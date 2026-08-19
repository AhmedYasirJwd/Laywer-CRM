import { createClient } from "@supabase/supabase-js";

// Service-role client for server-only, cross-user work. Right now that's
// just the notifications cron (src/app/api/cron/notifications), which has
// to look across every user's hearings/tasks/subscriptions on a schedule —
// not just the one signed-in visitor a normal request has.
//
// This key bypasses Row Level Security entirely. Never import this file
// from anything a request initiated by the browser can reach — only from
// the cron route, which authorizes itself via CRON_SECRET instead of a
// user session.
export function createSupabaseAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }

  return createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
