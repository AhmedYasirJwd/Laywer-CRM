"use client";

import { useRef, useState } from "react";
import { FileText, Download, Trash2, UploadCloud, Loader2 } from "lucide-react";
import type { CaseDocument } from "@/lib/types";
import { formatDateTime, formatFileSize } from "@/lib/format";

export function DocumentsSection({ caseId, initialDocuments }: { caseId: string; initialDocuments: CaseDocument[] }) {
  const [documents, setDocuments] = useState(initialDocuments);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    setError(null);
    try {
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch(`/api/cases/${caseId}/documents`, { method: "POST", body: formData });
        if (!res.ok) throw new Error("Upload failed");
        const doc: CaseDocument = await res.json();
        setDocuments((docs) => [doc, ...docs]);
      }
    } catch {
      setError("Failed to upload document. Please try again.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/documents/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      setDocuments((docs) => docs.filter((d) => d.id !== id));
    } catch {
      setError("Failed to delete document. Please try again.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      {error && <p className="mb-3 rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-600">{error}</p>}

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="mb-4 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-line px-4 py-3 text-sm font-medium text-muted hover:border-brand-600 hover:text-brand-700 disabled:opacity-60"
      >
        {uploading ? <Loader2 size={16} className="animate-spin" /> : <UploadCloud size={16} />}
        {uploading ? "Uploading..." : "Upload Document"}
      </button>

      {documents.length === 0 ? (
        <p className="text-sm text-muted">No documents uploaded yet.</p>
      ) : (
        <ul className="space-y-2">
          {documents.map((doc) => (
            <li
              key={doc.id}
              className="flex items-center gap-3 rounded-xl border border-line px-3.5 py-3"
            >
              <FileText size={18} className="shrink-0 text-faint" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-ink">{doc.name}</p>
                <p className="text-xs text-muted">
                  {formatFileSize(doc.size)} · {formatDateTime(doc.uploadedAt)}
                </p>
              </div>
              <a
                href={`/api/documents/${doc.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted hover:bg-background hover:text-ink"
                aria-label={`Download ${doc.name}`}
              >
                <Download size={16} />
              </a>
              <button
                type="button"
                onClick={() => handleDelete(doc.id)}
                disabled={deletingId === doc.id}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted hover:bg-red-50 hover:text-red-600 disabled:opacity-60"
                aria-label={`Delete ${doc.name}`}
              >
                {deletingId === doc.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
