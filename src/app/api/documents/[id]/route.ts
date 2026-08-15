import { NextRequest, NextResponse } from "next/server";
import { deleteDocument, getDocumentById } from "@/lib/db";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { DOCUMENTS_BUCKET } from "@/lib/storage";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const doc = await getDocumentById(id);
  if (!doc) return NextResponse.json({ error: "Document not found" }, { status: 404 });

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.storage
    .from(DOCUMENTS_BUCKET)
    .createSignedUrl(doc.storedPath, 60, { download: false });

  if (error || !data) {
    return NextResponse.json({ error: "File missing in storage" }, { status: 404 });
  }

  return NextResponse.redirect(data.signedUrl);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const doc = await deleteDocument(id);
  if (!doc) return NextResponse.json({ error: "Document not found" }, { status: 404 });

  const supabase = await createSupabaseServerClient();
  await supabase.storage.from(DOCUMENTS_BUCKET).remove([doc.storedPath]);
  // If this fails the DB row is already gone — nothing further to clean up.

  return NextResponse.json({ success: true });
}
