import { NextRequest, NextResponse } from "next/server";
import { getCaseById, updateCase, deleteCase } from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const found = await getCaseById(id);
  if (!found) return NextResponse.json({ error: "Case not found" }, { status: 404 });
  return NextResponse.json(found);
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const patch = await req.json();
  const updated = await updateCase(id, patch);
  if (!updated) return NextResponse.json({ error: "Case not found" }, { status: 404 });
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const ok = await deleteCase(id);
  if (!ok) return NextResponse.json({ error: "Case not found" }, { status: 404 });
  return NextResponse.json({ success: true });
}
