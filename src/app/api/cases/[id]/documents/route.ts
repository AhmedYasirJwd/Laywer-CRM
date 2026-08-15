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

  try {
    await fs.mkdir(caseDir, { recursive: true });
    await fs.writeFile(path.join(caseDir, storedName), bytes);
  } catch {
    // On serverless hosts (e.g. Vercel) the filesystem is read-only outside of
    // /tmp, so writing an uploaded file here fails. Documents need a real
    // database/object-storage backend to work in that kind of deployment —
    // this is expected until that's in place, not a bug in the upload flow.
    return NextResponse.json(
      {
        error:
          "File storage isn't available in this deployment yet (this host's filesystem is read-only). Documents need a database/storage backend to persist here.",
      },
      { status: 503 }
    );
  }

  const doc = await addDocument({
    caseId: id,
    name: file.name,
    size: file.size,
    mimeType: file.type || "application/octet-stream",
    storedPath: path.join(id, storedName),
  });

  return NextResponse.json(doc, { status: 201 });
}
