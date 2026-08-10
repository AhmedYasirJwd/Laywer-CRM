import { NextRequest, NextResponse } from "next/server";
import { deleteHearing } from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const ok = await deleteHearing(id);
  if (!ok) return NextResponse.json({ error: "Hearing not found" }, { status: 404 });
  return NextResponse.json({ success: true });
}
