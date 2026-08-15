// One-time import of the old local data/db.json into Supabase, attached to
// one user account. Not used by the running app — run it by hand, once,
// after you've created your first account and run supabase/schema.sql.
//
// Usage:
//   SUPABASE_SERVICE_ROLE_KEY=... node scripts/migrate-to-supabase.mjs <user-uuid>
//
// Where <user-uuid> is your account's id: Supabase Dashboard → Authentication
// → Users → click your user → copy the "User UID" field.
//
// The service role key is only needed here, on your own machine, to bypass
// RLS for this one bulk import — never put it in the app itself or commit it
// anywhere. Find it in Dashboard → Project Settings → API → service_role.

import { readFileSync } from "fs";
import { createClient } from "@supabase/supabase-js";

const userId = process.argv[2];
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;

if (!userId) {
  console.error("Usage: SUPABASE_SERVICE_ROLE_KEY=... node scripts/migrate-to-supabase.mjs <user-uuid>");
  process.exit(1);
}
if (!serviceKey || !url) {
  console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your shell first.");
  process.exit(1);
}

const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });

const db = JSON.parse(readFileSync(new URL("../data/db.json", import.meta.url), "utf-8"));

async function run() {
  console.log(`Importing ${db.cases.length} cases for user ${userId}...`);

  for (const c of db.cases) {
    const { error: caseErr } = await supabase.from("cases").insert({
      id: c.id,
      user_id: userId,
      case_number: c.caseNumber,
      title: c.title,
      court: c.court,
      filing_date: c.filingDate,
      case_type: c.caseType,
      counsel_for: c.counselFor ?? "",
      stage: c.stage,
      status: c.status,
      priority: c.priority,
      notes: c.notes ?? null,
      last_updated: c.lastUpdated,
    });
    if (caseErr) {
      console.error(`  case ${c.id} (${c.title}):`, caseErr.message);
      continue;
    }

    if (c.parties?.length) {
      const { error } = await supabase.from("parties").insert(
        c.parties.map((p, i) => ({
          user_id: userId,
          case_id: c.id,
          position: i,
          name: p.name,
          role: p.role,
          phone: p.phone || null,
          email: p.email || null,
        }))
      );
      if (error) console.error(`  parties for ${c.id}:`, error.message);
    }

    if (c.timeline?.length) {
      const { error } = await supabase.from("timeline_events").insert(
        c.timeline.map((t) => ({
          user_id: userId,
          case_id: c.id,
          title: t.title,
          date: t.date,
          description: t.description ?? "",
          type: t.type ?? "other",
        }))
      );
      if (error) console.error(`  timeline for ${c.id}:`, error.message);
    }
  }

  if (db.hearings?.length) {
    console.log(`Importing ${db.hearings.length} hearings...`);
    const { error } = await supabase.from("hearings").insert(
      db.hearings.map((h) => ({
        id: h.id,
        user_id: userId,
        case_id: h.caseId,
        date: h.date,
        purpose: h.purpose,
        court: h.court,
        counsel_for: h.counselFor ?? null,
      }))
    );
    if (error) console.error("  hearings:", error.message);
  }

  if (db.tasks?.length) {
    console.log(`Importing ${db.tasks.length} tasks...`);
    const { error } = await supabase.from("tasks").insert(
      db.tasks.map((t) => ({
        id: t.id,
        user_id: userId,
        case_id: t.caseId ?? null,
        title: t.title,
        due_date: t.dueDate ?? null,
        status: t.status,
        priority: t.priority ?? null,
      }))
    );
    if (error) console.error("  tasks:", error.message);
  }

  console.log("Done. (Documents/uploaded files weren't stored in db.json and can't be migrated this way —");
  console.log("there weren't any on disk to bring across.)");
}

run();
