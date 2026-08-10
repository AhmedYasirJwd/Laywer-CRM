import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { deleteDocument, getDocumentById } from "@/lib/db";

const UPLOAD_ROOT = path.join(process.cwd(), "data", "uploads");

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const doc = await getDocumentById(id);
  if (!doc) return NextResponse.json({ error: "Document not found" }, { status: 404 });

  try {
    const bytes = await fs.readFile(path.join(UPLOAD_ROOT, doc.storedPath));
    return new NextResponse(new Uint8Array(bytes), {
      headers: {
        "Content-Type": doc.mimeType || "application/octet-stream",
        "Content-Disposition": `inline; filename="${encodeURIComponent(doc.name)}"`,
      },
    });
  } catch {
    return NextResponse.json({ error: "File missing on disk" }, { status: 404 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const doc = await deleteDocument(id);
  if (!doc) return NextResponse.json({ error: "Document not found" }, { status: 404 });
  try {
    await fs.unlink(path.join(UPLOAD_ROOT, doc.storedPath));
  } catch {
    // File already missing on disk — nothing further to clean up.
  }
  return NextResponse.json({ success: true });
}
