import { NextRequest, NextResponse } from "next/server";
import { updateTask, deleteTask } from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const patch = await req.json();
  const updated = await updateTask(id, patch);
  if (!updated) return NextResponse.json({ error: "Task not found" }, { status: 404 });
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const ok = await deleteTask(id);
  if (!ok) return NextResponse.json({ error: "Task not found" }, { status: 404 });
  return NextResponse.json({ success: true });
}
