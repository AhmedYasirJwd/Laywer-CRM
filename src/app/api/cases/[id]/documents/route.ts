import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { addDocument, getCaseById, getDocumentsForCase } from "@/lib/db";

const UPLOAD_ROOT = path.join(process.cwd(), "data", "uploads");

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const docs = await getDocumentsForCase(id);
  return NextResponse.json(docs);
}

export async function POST(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const legalCase = await getCaseById(id);
  if (!legalCase) return NextResponse.json({ error: "Case not found" }, { status: 404 });

  const formData = await req.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const safeName = file.name.replace(/[^a-zA-Z0-9.\-_ ]/g, "_");
  const storedName = `${randomUUID()}-${safeName}`;
  const caseDir = path.join(UPLOAD_ROOT, id);
  await fs.mkdir(caseDir, { recursive: true });
  await fs.writeFile(path.join(caseDir, storedName), bytes);

  const doc = await addDocument({
    caseId: id,
    name: file.name,
    size: file.size,
    mimeType: file.type || "application/octet-stream",
    storedPath: path.join(id, storedName),
  });

  return NextResponse.json(doc, { status: 201 });
}
