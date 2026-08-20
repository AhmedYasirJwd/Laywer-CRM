import { NextRequest, NextResponse } from "next/server";
import { deleteHearing, updateHearing } from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const patch = await req.json();
  const updated = await updateHearing(id, patch);
  if (!updated) return NextResponse.json({ error: "Hearing not found" }, { status: 404 });
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const ok = await deleteHearing(id);
  if (!ok) return NextResponse.json({ error: "Hearing not found" }, { status: 404 });
  return NextResponse.json({ success: true });
}
