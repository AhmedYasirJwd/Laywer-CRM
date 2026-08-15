import { NextRequest, NextResponse } from "next/server";
import { addDocument, getCaseById, getDocumentsForCase } from "@/lib/db";
import { createSupabaseServerClient, requireUserId } from "@/lib/supabase/server";
import { DOCUMENTS_BUCKET } from "@/lib/storage";

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

  const userId = await requireUserId();
  const supabase = await createSupabaseServerClient();

  const safeName = file.name.replace(/[^a-zA-Z0-9.\-_ ]/g, "_");
  const storagePath = `user/${userId}/case/${id}/${crypto.randomUUID()}-${safeName}`;

  const { error: uploadError } = await supabase.storage
    .from(DOCUMENTS_BUCKET)
    .upload(storagePath, file, { contentType: file.type || "application/octet-stream" });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const doc = await addDocument({
    caseId: id,
    name: file.name,
    size: file.size,
    mimeType: file.type || "application/octet-stream",
    storedPath: storagePath,
  });

  return NextResponse.json(doc, { status: 201 });
}
