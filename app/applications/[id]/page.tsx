"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { z } from "zod";

const STATUS_VALUES = [
  "wishlist",
  "applied",
  "phone_screen",
  "technical",
  "onsite",
  "offer",
  "accepted",
  "rejected",
  "withdrawn",
] as const;

type Status = (typeof STATUS_VALUES)[number];

const STATUS_LABELS: Record<Status, string> = {
  wishlist: "Wishlist",
  applied: "Applied",
  phone_screen: "Phone Screen",
  technical: "Technical",
  onsite: "Onsite",
  offer: "Offer",
  accepted: "Accepted",
  rejected: "Rejected",
  withdrawn: "Withdrawn",
};

interface Application {
  id: string;
  company: string;
  role: string;
  status: Status;
  url: string | null;
  location: string | null;
  salary_min: number | null;
  salary_max: number | null;
  notes: string | null;
  applied_at: string | null;
  created_at: string;
  updated_at: string;
  available_transitions: Status[];
}

interface TimelineEvent {
  id: string;
  from_status: Status | null;
  to_status: Status;
  notes: string | null;
  created_at: string;
}

function emptyStringToUndefined(value: unknown) {
  if (typeof value !== "string") return value;

  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
}

// This page is not a traditional multi-field form.
// A small payload schema is enough here and keeps the rules explicit.
const transitionPayloadSchema = z.object({
  status: z.enum(STATUS_VALUES),
  notes: z.preprocess(emptyStringToUndefined, z.string().optional()),
});

function formatShortDate(value: string) {
  return new Date(value).toLocaleDateString("en", {
    month: "short",
    day: "numeric",
  });
}

function formatFullDate(value: string) {
  return new Date(value).toLocaleDateString();
}

function formatTimelineDate(value: string) {
  return new Date(value).toLocaleString("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatMoney(value: number) {
  return `$${value.toLocaleString()}`;
}

function getInputStyles(hasError: boolean) {
  return {
    backgroundColor: "var(--bg-card-alt)",
    border: `1px solid ${hasError ? "#FCA5A5" : "var(--border)"}`,
    color: "var(--text-primary)",
    boxShadow: hasError ? "0 0 0 4px rgba(252, 165, 165, 0.16)" : "none",
  };
}

export default function ApplicationDetailPage() {
  const { user, isLoading: authLoading, logout } = useAuth();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [application, setApplication] = useState<Application | null>(null);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [transitionError, setTransitionError] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [transitioning, setTransitioning] = useState<Status | "">("");
  const [transitionNote, setTransitionNote] = useState("");

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setPageError("");

    try {
      const [appRes, timelineRes] = await Promise.all([
        api.get<{ data: Application }>(`/api/v1/applications/${id}`),
        api.get<{ data: TimelineEvent[] }>(`/api/v1/applications/${id}/timeline`),
      ]);

      setApplication(appRes.data);
      setTimeline(timelineRes.data);
    } catch {
      setPageError("Could not load this application. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (user && id) {
      void fetchData();
    }
  }, [user, id, fetchData]);

  async function handleTransition(nextStatus: Status) {
    setTransitionError("");

    const parsed = transitionPayloadSchema.safeParse({
      status: nextStatus,
      notes: transitionNote,
    });

    if (!parsed.success) {
      setTransitionError("Could not update status. Please review the note and try again.");
      return;
    }

    setTransitioning(nextStatus);

    try {
      await api.patch(`/api/v1/applications/${id}/status`, parsed.data);
      setTransitionNote("");
      await fetchData();
    } catch (err: unknown) {
      const error = err as { message?: string };
      setTransitionError(error.message || "Failed to update status");
    } finally {
      setTransitioning("");
    }
  }

  async function handleDelete() {
    const confirmed = window.confirm(
      "Are you sure you want to delete this application?",
    );

    if (!confirmed) return;

    setDeleteError("");

    try {
      await api.delete(`/api/v1/applications/${id}`);
      router.push("/applications");
    } catch (err: unknown) {
      const error = err as { message?: string };
      setDeleteError(error.message || "Failed to delete application");
    }
  }

  if (authLoading || !user || loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "var(--bg-page)" }}
      >
        <p style={{ color: "var(--text-muted)" }}>Loading...</p>
      </div>
    );
  }

  if (pageError) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: "var(--bg-page)" }}>
        <nav className="flex items-center justify-between px-8 py-5 lg:px-24">
          <Link
            href="/dashboard"
            className="text-xl font-bold tracking-tight"
            style={{
              fontFamily: "var(--font-manrope)",
              color: "var(--text-primary)",
            }}
          >
            JobTracker
          </Link>

          <div className="flex items-center gap-6">
            <Link
              href="/applications"
              className="text-sm font-medium transition"
              style={{ color: "var(--text-secondary)" }}
            >
              Applications
            </Link>

            <button
              type="button"
              onClick={logout}
              className="text-sm font-medium transition"
              style={{ color: "var(--text-secondary)" }}
            >
              Sign out
            </button>
          </div>
        </nav>

        <div className="mx-auto max-w-3xl px-8 py-12">
          <div
            className="rounded-xl p-12 text-center"
            style={{
              backgroundColor: "var(--bg-card)",
              border: "1px solid var(--border-light)",
            }}
          >
            <p className="text-sm" style={{ color: "#991B1B" }}>
              {pageError}
            </p>

            <div className="mt-4 flex justify-center gap-3">
              <button
                type="button"
                onClick={() => void fetchData()}
                className="rounded-full px-5 py-2 text-xs font-medium"
                style={{ backgroundColor: "var(--accent)", color: "#FFFFFF" }}
              >
                Try again
              </button>

              <Link
                href="/applications"
                className="rounded-full px-5 py-2 text-xs font-medium"
                style={{
                  backgroundColor: "var(--bg-card-alt)",
                  color: "var(--text-secondary)",
                  border: "1px solid var(--border-light)",
                }}
              >
                Back to applications
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!application) return null;

  const noteHasError = false;

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--bg-page)" }}>
      {/* Top nav */}
      <nav className="flex items-center justify-between px-8 py-5 lg:px-24">
        <Link
          href="/dashboard"
          className="text-xl font-bold tracking-tight"
          style={{
            fontFamily: "var(--font-manrope)",
            color: "var(--text-primary)",
          }}
        >
          JobTracker
        </Link>

        <div className="flex items-center gap-6">
          <Link
            href="/applications"
            className="text-sm font-medium transition"
            style={{ color: "var(--text-secondary)" }}
          >
            Applications
          </Link>

          <span className="text-sm" style={{ color: "var(--text-muted)" }}>
            {user.name}
          </span>

          <button
            type="button"
            onClick={logout}
            className="text-sm font-medium transition"
            style={{ color: "var(--text-secondary)" }}
          >
            Sign out
          </button>
        </div>
      </nav>

      <div className="mx-auto max-w-3xl px-8 py-8">
        {/* Back link */}
        <Link
          href="/applications"
          className="mb-6 inline-block text-xs font-medium"
          style={{ color: "var(--text-muted)" }}
        >
          ← Back to applications
        </Link>

        {/* Header */}
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <h1
              className="text-2xl font-bold tracking-tight"
              style={{
                fontFamily: "var(--font-manrope)",
                color: "var(--text-primary)",
              }}
            >
              {application.company}
            </h1>

            <p
              className="mt-1 text-sm"
              style={{ color: "var(--text-secondary)" }}
            >
              {application.role}
              {application.location && ` · ${application.location}`}
            </p>
          </div>

          <span
            className="rounded-full px-4 py-2 text-xs font-medium"
            style={{
              backgroundColor: "var(--bg-green)",
              color: "var(--accent)",
            }}
          >
            {STATUS_LABELS[application.status]}
          </span>
        </div>

        {/* Details */}
        <div
          className="mb-6 rounded-xl p-6"
          style={{
            backgroundColor: "var(--bg-card)",
            border: "1px solid var(--border-light)",
          }}
        >
          <h2
            className="mb-4 text-sm font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            Details
          </h2>

          <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
            {application.url && (
              <div>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  URL
                </p>
                <a
                  href={application.url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="font-medium underline"
                  style={{ color: "var(--accent)" }}
                >
                  View posting
                </a>
              </div>
            )}

            {application.salary_min && (
              <div>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  Salary range
                </p>
                <p style={{ color: "var(--text-primary)" }}>
                  {formatMoney(application.salary_min)}
                  {application.salary_max
                    ? ` - ${formatMoney(application.salary_max)}`
                    : ""}
                </p>
              </div>
            )}

            {application.applied_at && (
              <div>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  Applied
                </p>
                <p style={{ color: "var(--text-primary)" }}>
                  {formatFullDate(application.applied_at)}
                </p>
              </div>
            )}

            <div>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                Added
              </p>
              <p style={{ color: "var(--text-primary)" }}>
                {formatFullDate(application.created_at)}
              </p>
            </div>
          </div>

          {application.notes && (
            <div className="mt-4">
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                Notes
              </p>
              <p
                className="mt-1 text-sm leading-6"
                style={{ color: "var(--text-primary)" }}
              >
                {application.notes}
              </p>
            </div>
          )}
        </div>

        {/* Status transitions */}
        {application.available_transitions.length > 0 && (
          <div
            className="mb-6 rounded-xl p-6"
            style={{
              backgroundColor: "var(--bg-card)",
              border: "1px solid var(--border-light)",
            }}
          >
            <h2
              className="mb-4 text-sm font-semibold"
              style={{ color: "var(--text-primary)" }}
            >
              Update status
            </h2>

            <label
              htmlFor="transition-note"
              className="mb-2 block text-xs font-medium"
              style={{ color: "var(--text-secondary)" }}
            >
              Note
            </label>

            <input
              id="transition-note"
              type="text"
              placeholder="Add a note (optional)"
              value={transitionNote}
              onChange={(e) => {
                setTransitionNote(e.target.value);
                setTransitionError("");
              }}
              disabled={transitioning !== ""}
              className="mb-4 w-full rounded-lg px-4 py-3 text-sm outline-none transition"
              style={getInputStyles(noteHasError)}
            />

            {transitionError && (
              <div
                role="alert"
                aria-live="polite"
                className="mb-4 rounded-lg px-4 py-3 text-sm"
                style={{
                  backgroundColor: "#FEF2F2",
                  color: "#991B1B",
                  border: "1px solid #FECACA",
                }}
              >
                {transitionError}
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              {application.available_transitions.map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => void handleTransition(status)}
                  disabled={transitioning !== ""}
                  className="rounded-full px-4 py-2 text-xs font-medium transition hover:scale-105"
                  style={{
                    backgroundColor:
                      transitioning === status
                        ? "var(--border)"
                        : status === "rejected" || status === "withdrawn"
                          ? "var(--bg-card-alt)"
                          : "var(--bg-green)",
                    color:
                      transitioning === status
                        ? "var(--text-muted)"
                        : status === "rejected" || status === "withdrawn"
                          ? "var(--text-secondary)"
                          : "var(--accent)",
                    border: "1px solid var(--border-light)",
                    cursor: transitioning ? "wait" : "pointer",
                  }}
                >
                  {transitioning === status
                    ? "Updating..."
                    : `Move to ${STATUS_LABELS[status]}`}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Timeline */}
        <div
          className="mb-6 rounded-xl p-6"
          style={{
            backgroundColor: "var(--bg-card)",
            border: "1px solid var(--border-light)",
          }}
        >
          <h2
            className="mb-4 text-sm font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            Timeline
          </h2>

          {timeline.length === 0 ? (
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              No timeline activity yet.
            </p>
          ) : (
            <div className="space-y-4">
              {timeline.map((event, index) => (
                <div key={event.id} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div
                      className="mt-2 h-2 w-2 rounded-full"
                      style={{ backgroundColor: "var(--accent)" }}
                    />
                    {index < timeline.length - 1 && (
                      <div
                        className="mt-1 w-px flex-1"
                        style={{ backgroundColor: "var(--border)" }}
                      />
                    )}
                  </div>

                  <div className="pb-4">
                    <p
                      className="text-sm font-medium"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {event.from_status
                        ? `${STATUS_LABELS[event.from_status]} → ${STATUS_LABELS[event.to_status]}`
                        : `Started as ${STATUS_LABELS[event.to_status]}`}
                    </p>

                    {event.notes && (
                      <p
                        className="mt-1 text-xs"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        {event.notes}
                      </p>
                    )}

                    <p
                      className="mt-1 text-xs"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {formatTimelineDate(event.created_at)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Delete */}
        <div className="flex justify-end">
          <div className="text-right">
            {deleteError && (
              <p className="mb-2 text-xs" style={{ color: "#991B1B" }}>
                {deleteError}
              </p>
            )}

            <button
              type="button"
              onClick={handleDelete}
              className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-medium text-red-700 transition hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-200"
            >
              <Trash2 className="h-4 w-4" />
              Delete application
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


