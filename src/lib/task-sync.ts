import * as sync from "./sync";
import type { Task } from "./types";

/** Saves a task write (create or update) the same way regardless of
 *  network state — see saveEntity in ./sync for the actual mechanics. */
export async function saveTask(
  localTask: Task,
  op: "create" | "update",
  payload: Record<string, unknown>
): Promise<{ ok: true; synced: boolean; saved: Task } | { ok: false; error: string }> {
  return sync.saveEntity("task", localTask, op, payload);
}

export async function isTaskPending(taskId: string): Promise<boolean> {
  return sync.isPending("task", taskId);
}
