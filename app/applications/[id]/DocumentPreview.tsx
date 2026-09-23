"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Download, X } from "lucide-react";
import { api } from "@/lib/api";
import type { ApplicationDocument } from "@/lib/types";
import { errorMessage } from "@/lib/ui";

interface Props {
  applicationId: string;
  document: ApplicationDocument;
  onDownload: () => void;
  onClose: () => void;
}

/*
 * Shows a PDF inside the page using the browser's built-in PDF viewer.
 *
 * The file is fetched with the user's login cookie and turned into a
 * temporary local "blob:" link for the viewer. That works the same in
 * every browser and wherever the file is stored (disk or S3), and the
 * link only exists in this tab until the preview closes.
 */
export default function DocumentPreview({
  applicationId,
  document: doc,
  onDownload,
  onClose,
}: Props) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [error, setError] = useState("");
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    let url: string | null = null;
    let cancelled = false;

    api
      .getBlob(`/api/v1/applications/${applicationId}/documents/${doc.id}/view`)
      .then((blob) => {
        if (cancelled) return;
        url = URL.createObjectURL(blob);
        setBlobUrl(url);
      })
      .catch((err) => {
        if (!cancelled)
          setError(errorMessage(err, "Could not load the preview"));
      });

    // Free the memory held by the blob link when the preview closes
    return () => {
      cancelled = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [applicationId, doc.id]);

  useEffect(() => {
    closeRef.current?.focus();
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(23, 23, 23, 0.45)" }}
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
        className="flex h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-xl"
        style={{
          backgroundColor: "var(--bg-card)",
          boxShadow: "0 24px 48px rgba(23, 23, 23, 0.25)",
        }}
      >
        <header
          className="flex items-center justify-between gap-4 px-5 py-3"
          style={{ borderBottom: "1px solid var(--border-light)" }}
        >
          <h2
            id={titleId}
            className="truncate text-sm font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            {doc.original_name}
          </h2>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={onDownload}
              className="inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-medium"
              style={{
                backgroundColor: "var(--bg-card-alt)",
                color: "var(--text-secondary)",
                border: "1px solid var(--border-light)",
              }}
            >
              <Download className="h-3.5 w-3.5" />
              Download
            </button>
            <button
              ref={closeRef}
              type="button"
              onClick={onClose}
              aria-label="Close preview"
              className="btn btn-quiet inline-flex h-10 w-10 items-center justify-center"
              style={{ color: "var(--text-secondary)" }}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </header>

        <div
          className="flex-1"
          style={{ backgroundColor: "var(--bg-card-alt)" }}
        >
          {error ? (
            <p
              className="p-8 text-center text-sm"
              style={{ color: "var(--danger-text)" }}
            >
              {error}
            </p>
          ) : blobUrl ? (
            <iframe
              src={blobUrl}
              title={`Preview of ${doc.original_name}`}
              className="h-full w-full border-0"
            />
          ) : (
            <p
              className="p-8 text-center text-sm"
              style={{ color: "var(--text-muted)" }}
            >
              Loading preview...
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
