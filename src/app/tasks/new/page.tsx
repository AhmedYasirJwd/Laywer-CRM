import { Suspense } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getCases } from "@/lib/db";
import { TaskForm } from "@/components/TaskForm";

export const dynamic = "force-dynamic";

export default async function NewTaskPage() {
  const cases = await getCases();

  return (
    <div>
      <div className="mb-5">
        <Link href="/tasks" className="flex items-center gap-1.5 text-sm font-medium text-muted hover:text-ink">
          <ArrowLeft size={17} />
          Back to Tasks
        </Link>
        <h1 className="mt-2 text-xl font-bold text-ink sm:text-2xl">New Task</h1>
      </div>
      <Suspense>
        <TaskForm cases={cases} />
      </Suspense>
    </div>
  );
}
