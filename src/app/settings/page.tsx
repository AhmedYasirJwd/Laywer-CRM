import { Avatar } from "@/components/Avatar";
import { PageHeader } from "@/components/PageHeader";
import { NotificationSettings } from "@/components/NotificationSettings";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { signOut } from "@/app/actions/auth";

export default async function SettingsPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const email = user?.email ?? "";
  const fullNameRaw = user?.user_metadata?.full_name;
  const fullName = typeof fullNameRaw === "string" && fullNameRaw.trim() ? fullNameRaw.trim() : "";
  const displayName = fullName || email.split("@")[0] || "";

  return (
    <div>
      <PageHeader title="Settings" subtitle="Your profile and workspace preferences" />

      <div className="card flex items-center justify-between gap-4 p-5">
        <div className="flex items-center gap-4">
          <Avatar name={displayName || "?"} size="lg" />
          <div>
            <p className="text-base font-semibold text-ink">{fullName || email}</p>
            {fullName && <p className="text-sm text-muted">{email}</p>}
            <p className="text-sm text-muted">Signed in</p>
          </div>
        </div>
        <form action={signOut}>
          <button
            type="submit"
            className="rounded-xl border border-line px-4 py-2 text-sm font-semibold text-ink hover:bg-background"
          >
            Sign Out
          </button>
        </form>
      </div>

      <NotificationSettings />

      <div className="card mt-4 p-5">
        <h2 className="mb-1 text-sm font-semibold text-ink">About the data in this app</h2>
        <p className="text-sm text-muted">
          Case, hearing, and task records are stored in Supabase — your data is private to your account and
          isolated from every other user via Postgres row-level security.
        </p>
      </div>
    </div>
  );
}
