"use client";

import { useEffect } from "react";
import { X, ExternalLink } from "lucide-react";

export function LawPdfViewer({
  actName,
  sectionLabel,
  pdfUrl,
  onClose,
}: {
  actName: string;
  sectionLabel?: string;
  pdfUrl: string;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-ink/60 backdrop-blur-sm sm:p-4">
      <div className="flex h-full w-full flex-col overflow-hidden bg-surface sm:rounded-2xl sm:shadow-xl">
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-line px-4 py-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-ink">{actName}</p>
            {sectionLabel && <p className="truncate text-xs text-muted">{sectionLabel}</p>}
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <a
              href={pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-9 w-9 items-center justify-center rounded-lg text-muted hover:bg-background"
              aria-label="Open in new tab"
              title="Open in new tab"
            >
              <ExternalLink size={17} />
            </a>
            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-muted hover:bg-background"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>
        </div>
        <div className="min-h-0 flex-1 bg-background">
          <iframe src={pdfUrl} title={`${actName} PDF`} className="h-full w-full" />
        </div>
      </div>
    </div>
  );
}
