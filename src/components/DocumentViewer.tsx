"use client";

import { useEffect, useRef, useState } from "react";
import { X, Download, ChevronLeft, ChevronRight, Loader2, FileWarning } from "lucide-react";
import type { CaseDocument } from "@/lib/types";
import { formatFileSize, formatDateTime } from "@/lib/format";

function fileUrlFor(doc: CaseDocument): string {
  return `/api/documents/${doc.id}`;
}

// Multi-page PDF preview, rendered to a canvas via pdfjs-dist — the same
// approach as src/components/LawPdfViewer.tsx, so it behaves consistently
// (and works offline once the document's bytes are cached — see
// src/lib/document-offline-cache.ts and the matching handler in public/sw.js).
function PdfPages({ fileUrl }: { fileUrl: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const pdfDocRef = useRef<import("pdfjs-dist").PDFDocumentProxy | null>(null);
  const loadingTaskRef = useRef<import("pdfjs-dist").PDFDocumentLoadingTask | null>(null);
  const renderTaskRef = useRef<{ cancel: () => void } | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [numPages, setNumPages] = useState<number | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const pdfjsLib = await import("pdfjs-dist");
        pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdfjs/pdf.worker.min.mjs";
        const loadingTask = pdfjsLib.getDocument({ url: fileUrl });
        loadingTaskRef.current = loadingTask;
        const doc = await loadingTask.promise;
        if (cancelled) return;
        pdfDocRef.current = doc;
        setNumPages(doc.numPages);
        setStatus("ready");
      } catch (err) {
        console.error("Failed to load PDF", err);
        if (!cancelled) setStatus("error");
      }
    })();
    return () => {
      cancelled = true;
      loadingTaskRef.current?.destroy();
      loadingTaskRef.current = null;
      pdfDocRef.current = null;
    };
  }, [fileUrl]);

  useEffect(() => {
    if (status !== "ready" || !pdfDocRef.current || !canvasRef.current) return;
    let cancelled = false;
    (async () => {
      const doc = pdfDocRef.current!;
      const clampedPage = Math.min(Math.max(currentPage, 1), doc.numPages);
      const pdfPage = await doc.getPage(clampedPage);
      if (cancelled) return;

      const canvas = canvasRef.current!;
      const context = canvas.getContext("2d");
      if (!context) return;

      const containerWidth = containerRef.current?.clientWidth ?? 800;
      const unscaledViewport = pdfPage.getViewport({ scale: 1 });
      const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
      const scale = (Math.min(containerWidth, 900) / unscaledViewport.width) * dpr;
      const viewport = pdfPage.getViewport({ scale });

      canvas.width = viewport.width;
      canvas.height = viewport.height;
      canvas.style.width = `${viewport.width / dpr}px`;
      canvas.style.height = `${viewport.height / dpr}px`;

      renderTaskRef.current?.cancel();
      const renderTask = pdfPage.render({ canvas, canvasContext: context, viewport });
      renderTaskRef.current = renderTask;
      try {
        await renderTask.promise;
      } catch {
        // render was cancelled (e.g. page changed mid-render) — ignore
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [status, currentPage]);

  function goTo(p: number) {
    if (!numPages) return;
    setCurrentPage(Math.min(Math.max(p, 1), numPages));
  }

  return (
    <div className="flex h-full flex-col">
      <div ref={containerRef} className="min-h-0 flex-1 overflow-auto px-2 py-4">
        {status === "loading" && (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-muted">
            <Loader2 size={22} className="animate-spin" />
            <p className="text-sm">Loading preview...</p>
          </div>
        )}
        {status === "error" && (
          <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center text-muted">
            <p className="text-sm font-semibold text-ink">Couldn&apos;t load the PDF preview</p>
            <p className="text-sm">Try downloading the file instead.</p>
          </div>
        )}
        <canvas
          ref={canvasRef}
          className={`mx-auto block rounded-lg shadow-card ${status === "ready" ? "" : "hidden"}`}
        />
      </div>
      {status === "ready" && numPages && numPages > 1 && (
        <div className="flex shrink-0 items-center justify-center gap-3 border-t border-line px-4 py-2.5">
          <button
            type="button"
            onClick={() => goTo(currentPage - 1)}
            disabled={currentPage <= 1}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-background disabled:opacity-30"
            aria-label="Previous page"
          >
            <ChevronLeft size={18} />
          </button>
          <span className="text-xs font-medium text-muted">
            Page {currentPage} of {numPages}
          </span>
          <button
            type="button"
            onClick={() => goTo(currentPage + 1)}
            disabled={currentPage >= numPages}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-background disabled:opacity-30"
            aria-label="Next page"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      )}
    </div>
  );
}

export function DocumentViewer({ document: doc, onClose }: { document: CaseDocument; onClose: () => void }) {
  const fileUrl = fileUrlFor(doc);
  const isImage = doc.mimeType.startsWith("image/");
  const isPdf = doc.mimeType === "application/pdf";
  const isText = doc.mimeType.startsWith("text/");
  const canPreview = isImage || isPdf || isText;

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
    <div
      className="fixed inset-0 z-50 flex flex-col bg-ink/60 backdrop-blur-sm sm:p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={doc.name}
    >
      <div
        className="flex h-full w-full flex-col overflow-hidden bg-surface sm:rounded-2xl sm:shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-line px-4 py-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-ink">{doc.name}</p>
            <p className="truncate text-xs text-muted">
              {formatFileSize(doc.size)} · {formatDateTime(doc.uploadedAt)}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <a
              href={fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-9 w-9 items-center justify-center rounded-lg text-muted hover:bg-background"
              aria-label={`Download ${doc.name}`}
              title="Download"
            >
              <Download size={17} />
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

        <div className="min-h-0 flex-1 overflow-auto bg-background">
          {isImage && (
            <div className="flex min-h-full items-center justify-center p-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={fileUrl}
                alt={doc.name}
                className="max-h-full max-w-full rounded-lg object-contain shadow-card"
              />
            </div>
          )}
          {isPdf && <PdfPages fileUrl={fileUrl} />}
          {isText && !isPdf && (
            <iframe src={fileUrl} title={doc.name} className="h-full w-full border-0 bg-surface" />
          )}
          {!canPreview && (
            <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center text-muted">
              <FileWarning size={28} />
              <div>
                <p className="text-sm font-semibold text-ink">Can&apos;t preview this file type in-app</p>
                <p className="mt-1 text-sm">
                  <a
                    href={fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-brand-600 hover:text-brand-700"
                  >
                    Download {doc.name}
                  </a>{" "}
                  to open it instead.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
