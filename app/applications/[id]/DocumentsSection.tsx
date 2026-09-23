"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Download, Eye, FileText, Trash2, Upload } from "lucide-react";
import { api, apiUrl } from "@/lib/api";
import type { ApplicationDocument, DocumentKind } from "@/lib/types";
import { cardStyle, errorBoxStyle, errorMessage } from "@/lib/ui";
import DocumentPreview from "./DocumentPreview";

// Browsers can show PDFs; Word files have to be downloaded to open
const isPreviewable = (doc: ApplicationDocument) =>
  doc.mime_type === "application/pdf";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_EXTENSIONS = [".pdf", ".doc", ".docx"];

const KIND_LABELS: Record<DocumentKind, string> = {
  resume: "Resume",
  cover_letter: "Cover letter",
  other: "Other",
};

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Quick checks so the user gets instant feedback. The server does the
// real check (it reads the file's bytes), so these are only a courtesy.
function checkFile(file: File) {
  const name = file.name.toLowerCase();
  if (!ALLOWED_EXTENSIONS.some((ext) => name.endsWith(ext))) {
    return "Only PDF, DOC and DOCX files are allowed.";
  }
  if (file.size > MAX_BYTES) {
    return "File is too large. The limit is 5 MB.";
  }
  return null;
}

export default function DocumentsSection({
  applicationId,
}: {
  applicationId: string;
}) {
  const base = `/api/v1/applications/${applicationId}/documents`;
  const inputRef = useRef<HTMLInputElement>(null);
  const [documents, setDocuments] = useState<ApplicationDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [kind, setKind] = useState<DocumentKind>("resume");
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [previewing, setPreviewing] = useState<ApplicationDocument | null>(
    null,
  );
  // Stable so the preview's keyboard listener isn't re-attached each render
  const closePreview = useCallback(() => setPreviewing(null), []);

  const load = useCallback(async () => {
    try {
      const res = await api.get<{ data: ApplicationDocument[] }>(base);
      setDocuments(res.data);
    } catch {
      setError("Could not load documents.");
    } finally {
      setLoading(false);
    }
  }, [base]);

  useEffect(() => {
    void load();
  }, [load]);

  async function uploadFile(file: File) {
    setError("");
    const problem = checkFile(file);
    if (problem) {
      setError(problem);
      return;
    }

    const form = new FormData();
    form.append("kind", kind);
    form.append("file", file);

    setUploading(true);
    try {
      const res = await api.upload<{ data: ApplicationDocument }>(base, form);
      setDocuments((current) => [res.data, ...current]);
    } catch (err) {
      setError(errorMessage(err, "Upload failed. Please try again."));
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  // The download is a plain browser navigation, which can't refresh an
  // expired login by itself. Make one API call first (it refreshes the
  // session if needed), then let the browser fetch the file.
  async function handleDownload(
    event: React.MouseEvent | null,
    doc: ApplicationDocument,
  ) {
    event?.preventDefault();
    setError("");
    try {
      await api.get(base);
      window.location.assign(apiUrl(`${base}/${doc.id}/download`));
    } catch (err) {
      setError(errorMessage(err, "Could not download the file"));
    }
  }

  async function handleDelete(doc: ApplicationDocument) {
    if (!window.confirm(`Delete ${doc.original_name}?`)) return;
    setError("");
    try {
      await api.delete(`${base}/${doc.id}`);
      setDocuments((current) => current.filter((d) => d.id !== doc.id));
    } catch (err) {
      setError(errorMessage(err, "Could not delete document"));
    }
  }

  return (
    <section className="mb-6 rounded-xl p-6" style={cardStyle}>
      <div className="mb-4 flex items-center justify-between gap-4">
        <h2
          className="text-sm font-semibold"
          style={{ color: "var(--text-primary)" }}
        >
          Documents
        </h2>
        <label
          className="flex items-center gap-2 text-xs"
          style={{ color: "var(--text-secondary)" }}
        >
          Upload as
          <select
            value={kind}
            onChange={(e) => setKind(e.target.value as DocumentKind)}
            className="rounded-full px-3 py-1 text-xs outline-none"
            style={{
              backgroundColor: "var(--bg-card-alt)",
              border: "1px solid var(--border-light)",
            }}
          >
            {Object.entries(KIND_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {error && (
        <div
          role="alert"
          className="mb-4 rounded-lg px-4 py-3 text-sm"
          style={errorBoxStyle}
        >
          {error}
        </div>
      )}

      {/* Drop zone: drag a file onto it, or click to pick one */}
      <div
        role="button"
        tabIndex={0}
        aria-label="Upload a document. Drop a file here or press Enter to choose one."
        onClick={() => !uploading && inputRef.current?.click()}
        onKeyDown={(e) => {
          if ((e.key === "Enter" || e.key === " ") && !uploading) {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          const file = e.dataTransfer.files[0];
          if (file && !uploading) void uploadFile(file);
        }}
        className="mb-4 flex cursor-pointer flex-col items-center justify-center rounded-lg px-4 py-8 text-center transition"
        style={{
          border: `2px dashed ${dragOver ? "var(--accent)" : "var(--border)"}`,
          backgroundColor: dragOver ? "var(--bg-green)" : "var(--bg-subtle)",
          cursor: uploading ? "wait" : "pointer",
        }}
      >
        <Upload className="mb-2 h-5 w-5" style={{ color: "var(--accent)" }} />
        <p
          className="text-sm font-medium"
          style={{ color: "var(--text-primary)" }}
        >
          {uploading
            ? "Uploading..."
            : "Drop your resume here, or click to choose"}
        </p>
        <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
          PDF, DOC or DOCX, up to 5 MB
        </p>
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void uploadFile(file);
          }}
        />
      </div>

      {loading ? (
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          Loading...
        </p>
      ) : documents.length > 0 ? (
        <ul className="space-y-2">
          {documents.map((doc) => (
            <li
              key={doc.id}
              className="flex items-center justify-between gap-4 rounded-lg px-4 py-3"
              style={{ backgroundColor: "var(--bg-card-alt)" }}
            >
              <div className="flex min-w-0 items-center gap-3">
                <FileText
                  className="h-4 w-4 shrink-0"
                  style={{ color: "var(--accent)" }}
                />
                <div className="min-w-0">
                  {/* Clicking the name opens the file: a preview for PDFs,
                      a download for Word files */}
                  <button
                    type="button"
                    onClick={() =>
                      isPreviewable(doc)
                        ? setPreviewing(doc)
                        : void handleDownload(null, doc)
                    }
                    className="block max-w-full truncate text-left text-sm font-medium underline-offset-2 hover:underline"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {doc.original_name}
                  </button>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                    {KIND_LABELS[doc.kind]} · {formatSize(doc.size_bytes)} ·{" "}
                    {new Date(doc.created_at).toLocaleDateString("en", {
                      month: "short",
                      day: "numeric",
                    })}
                    {!isPreviewable(doc) && " · Word file, opens as download"}
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 gap-1">
                {isPreviewable(doc) && (
                  <button
                    type="button"
                    onClick={() => setPreviewing(doc)}
                    aria-label={`Preview ${doc.original_name}`}
                    title="Preview"
                    className="rounded-full p-2 transition hover:bg-white"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                )}
                <a
                  href={apiUrl(`${base}/${doc.id}/download`)}
                  onClick={(e) => void handleDownload(e, doc)}
                  aria-label={`Download ${doc.original_name}`}
                  className="rounded-full p-2 transition hover:bg-white"
                  style={{ color: "var(--text-secondary)" }}
                >
                  <Download className="h-4 w-4" />
                </a>
                <button
                  type="button"
                  onClick={() => void handleDelete(doc)}
                  aria-label={`Delete ${doc.original_name}`}
                  className="rounded-full p-2 text-red-700 transition hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : null}

      {previewing && (
        <DocumentPreview
          applicationId={applicationId}
          document={previewing}
          onDownload={() => void handleDownload(null, previewing)}
          onClose={closePreview}
        />
      )}
    </section>
  );
}
