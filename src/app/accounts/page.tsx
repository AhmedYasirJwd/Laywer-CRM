import { notFound, redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { formatFileSize, formatDateTime } from "@/lib/format";

// Not in NAV_ITEMS (src/lib/nav.ts) and not linked from anywhere in the
// app on purpose — reached by typing the URL directly. That alone isn't
// real access control though (URLs end up in browser history, server
// logs, etc.), so this still requires being logged in AND being one of
// the emails in ADMIN_EMAILS below. Every other account gets a plain 404
// — not a 403 — so the page's existence isn't confirmed to them either.
//
// Add your own email (comma-separate more if needed) either here or via
// the ADMIN_EMAILS env var:
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export const dynamic = "force-dynamic";

interface UserStats {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  createdAt: string;
  lastSignInAt: string | null;
  cases: number;
  hearings: number;
  tasks: number;
  pendingTasks: number;
  documents: number;
  documentsSize: number;
}

function tally(rows: { user_id: string }[] | null): Map<string, number> {
  const map = new Map<string, number>();
  for (const row of rows ?? []) {
    map.set(row.user_id, (map.get(row.user_id) ?? 0) + 1);
  }
  return map;
}

async function loadStats(): Promise<UserStats[]> {
  const admin = createSupabaseAdminClient();

  // Supabase's admin listUsers() paginates at 50/page by default — bumped
  // here since this is meant to show literally everyone. If this workspace
  // ever grows past 1000 accounts, this needs real pagination.
  const { data: usersPage, error: usersError } = await admin.auth.admin.listUsers({ perPage: 1000 });
  if (usersError) throw new Error(`Failed to list users: ${usersError.message}`);

  const [casesRes, hearingsRes, tasksRes, pendingTasksRes, documentsRes] = await Promise.all([
    admin.from("cases").select("user_id"),
    admin.from("hearings").select("user_id"),
    admin.from("tasks").select("user_id"),
    admin.from("tasks").select("user_id").eq("status", "Pending"),
    admin.from("documents").select("user_id, size"),
  ]);

  const caseCounts = tally(casesRes.data);
  const hearingCounts = tally(hearingsRes.data);
  const taskCounts = tally(tasksRes.data);
  const pendingTaskCounts = tally(pendingTasksRes.data);

  const documentCounts = new Map<string, number>();
  const documentSizes = new Map<string, number>();
  for (const doc of documentsRes.data ?? []) {
    documentCounts.set(doc.user_id, (documentCounts.get(doc.user_id) ?? 0) + 1);
    documentSizes.set(doc.user_id, (documentSizes.get(doc.user_id) ?? 0) + (doc.size ?? 0));
  }

  return usersPage.users
    .map((u): UserStats => {
      const fullNameRaw = u.user_metadata?.full_name;
      const fullName = typeof fullNameRaw === "string" && fullNameRaw.trim() ? fullNameRaw.trim() : "";
      const phoneRaw = u.user_metadata?.phone;
      const phone = typeof phoneRaw === "string" && phoneRaw.trim() ? phoneRaw.trim() : "";
      return {
        id: u.id,
        fullName,
        phone,
        email: u.email ?? "(no email)",
        createdAt: u.created_at,
        lastSignInAt: u.last_sign_in_at ?? null,
        cases: caseCounts.get(u.id) ?? 0,
        hearings: hearingCounts.get(u.id) ?? 0,
        tasks: taskCounts.get(u.id) ?? 0,
        pendingTasks: pendingTaskCounts.get(u.id) ?? 0,
        documents: documentCounts.get(u.id) ?? 0,
        documentsSize: documentSizes.get(u.id) ?? 0,
      };
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export default async function OpsStatsPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // "Normal login required" — not signed in at all still goes to /login,
  // same as every other page in the app.
  if (!user) redirect("/login");

  // Signed in, but not you — 404, not a permissions error, so the page's
  // existence isn't confirmed to anyone who stumbles onto the URL.
  if (!user.email || !ADMIN_EMAILS.includes(user.email.toLowerCase())) notFound();

  if (ADMIN_EMAILS.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-16 text-center">
        <h1 className="text-lg font-semibold text-ink">ADMIN_EMAILS isn&apos;t set</h1>
        <p className="mt-2 text-sm text-muted">
          Add your email to the <code className="rounded bg-background px-1.5 py-0.5">ADMIN_EMAILS</code>{" "}
          environment variable (comma-separate more than one) so this page knows who&apos;s allowed to see it.
        </p>
      </div>
    );
  }

  const stats = await loadStats();
  const totals = stats.reduce(
    (acc, u) => ({
      users: acc.users + 1,
      cases: acc.cases + u.cases,
      hearings: acc.hearings + u.hearings,
      tasks: acc.tasks + u.tasks,
      documents: acc.documents + u.documents,
      documentsSize: acc.documentsSize + u.documentsSize,
    }),
    { users: 0, cases: 0, hearings: 0, tasks: 0, documents: 0, documentsSize: 0 }
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <h1 className="text-xl font-bold text-ink">Workspace stats</h1>
      <p className="mt-1 text-sm text-muted">
        Every account, everything it holds. Unlinked page — see the comment at the top of this file for how
        access is restricted.
      </p>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-5">
        {[
          ["Users", totals.users],
          ["Cases", totals.cases],
          ["Hearings", totals.hearings],
          ["Tasks", totals.tasks],
          ["Documents", totals.documents],
        ].map(([label, value]) => (
          <div key={label as string} className="card p-4">
            <p className="text-xs font-medium text-muted">{label}</p>
            <p className="mt-1 text-2xl font-bold text-ink">{value}</p>
          </div>
        ))}
      </div>
      <p className="mt-2 text-xs text-muted">Total document storage: {formatFileSize(totals.documentsSize)}</p>

      <div className="card mt-6 overflow-x-auto p-0">
        <table className="w-full min-w-[1000px] text-left text-sm">
          <thead>
            <tr className="border-b border-line text-xs font-semibold uppercase tracking-wide text-muted">
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Phone</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Signed up</th>
              <th className="px-4 py-3">Last sign-in</th>
              <th className="px-4 py-3 text-right">Cases</th>
              <th className="px-4 py-3 text-right">Hearings</th>
              <th className="px-4 py-3 text-right">Tasks</th>
              <th className="px-4 py-3 text-right">Pending</th>
              <th className="px-4 py-3 text-right">Docs</th>
              <th className="px-4 py-3 text-right">Doc size</th>
            </tr>
          </thead>
          <tbody>
            {stats.map((u) => (
              <tr key={u.id} className="border-b border-line last:border-0">
                <td className="px-4 py-3 font-medium text-ink">{u.fullName || "—"}</td>
                <td className="px-4 py-3 text-muted">{u.phone || "—"}</td>
                <td className="px-4 py-3 text-muted">{u.email}</td>
                <td className="px-4 py-3 text-muted">{formatDateTime(u.createdAt)}</td>
                <td className="px-4 py-3 text-muted">
                  {u.lastSignInAt ? formatDateTime(u.lastSignInAt) : "Never"}
                </td>
                <td className="px-4 py-3 text-right text-ink">{u.cases}</td>
                <td className="px-4 py-3 text-right text-ink">{u.hearings}</td>
                <td className="px-4 py-3 text-right text-ink">{u.tasks}</td>
                <td className="px-4 py-3 text-right text-ink">{u.pendingTasks}</td>
                <td className="px-4 py-3 text-right text-ink">{u.documents}</td>
                <td className="px-4 py-3 text-right text-ink">{formatFileSize(u.documentsSize)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
