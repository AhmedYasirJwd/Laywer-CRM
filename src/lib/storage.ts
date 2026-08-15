// The private Supabase Storage bucket that holds uploaded case documents.
// Objects live at `user/{userId}/case/{caseId}/{filename}` — see supabase/schema.sql
// for the bucket definition and its RLS policies.
export const DOCUMENTS_BUCKET = "case-documents";
