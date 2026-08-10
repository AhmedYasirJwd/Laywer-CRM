import { Avatar } from "@/components/Avatar";
import { PageHeader } from "@/components/PageHeader";

export default function SettingsPage() {
  return (
    <div>
      <PageHeader title="Settings" subtitle="Your profile and workspace preferences" />

      <div className="card flex items-center gap-4 p-5">
        <Avatar name="Yasir Javed" size="lg" />
        <div>
          <p className="text-base font-semibold text-ink">Yasir Javed</p>
          <p className="text-sm text-muted">yasir@lexcase.app</p>
        </div>
      </div>

      <div className="card mt-4 p-5">
        <h2 className="mb-1 text-sm font-semibold text-ink">About the data in this app</h2>
        <p className="text-sm text-muted">
          Case, hearing, and task records are currently stored in a local JSON file (
          <code className="rounded bg-background px-1.5 py-0.5 text-xs">data/db.json</code>) as a placeholder data
          layer. This will be swapped for a proper database in a future update.
        </p>
      </div>
    </div>
  );
}
