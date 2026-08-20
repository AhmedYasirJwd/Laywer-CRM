import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getCases, getTaskById } from "@/lib/db";
import { TaskForm } from "@/components/TaskForm";

export const dynamic = "force-dynamic";

export default async function EditTaskPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [task, cases] = await Promise.all([getTaskById(id), getCases()]);
  if (!task) notFound();

  return (
    <div>
      <div className="mb-5">
        <Link
          href={task.caseId ? `/cases/${task.caseId}` : "/tasks"}
          className="flex items-center gap-1.5 text-sm font-medium text-muted hover:text-ink"
        >
          <ArrowLeft size={17} />
          Back
        </Link>
        <h1 className="mt-2 text-xl font-bold text-ink sm:text-2xl">Edit Task</h1>
      </div>
      <Suspense>
        <TaskForm cases={cases} initial={task} />
      </Suspense>
    </div>
  );
}
