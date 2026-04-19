"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

interface Application {
  id: string;
  company: string;
  role: string;
  status: string;
  location: string | null;
  salary_min: number | null;
  salary_max: number | null;
  applied_at: string | null;
  created_at: string;
}

interface ApplicationsResponse {
  data: Application[];
  pagination: {
    page: number;
    per_page: number;
    total: number;
    total_pages: number;
  };
}

const STATUS_LABELS: Record<string, string> = {
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

// Browser form inputs return empty strings.
// For optional fields, convert empty input into undefined so the payload
// lines up better with the backend schema.
function emptyStringToUndefined(value: unknown) {
  if (typeof value !== "string") return value;

  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
}

const addApplicationSchema = z.object({
  company: z
    .string()
    .trim()
    .min(1, "Company name is required")
    .max(255, "Company name must be 255 characters or less"),

  role: z
    .string()
    .trim()
    .min(1, "Role is required")
    .max(255, "Role must be 255 characters or less"),

  url: z.preprocess(
    emptyStringToUndefined,
    z.string().url("Please enter a valid URL").optional(),
  ),

  location: z.preprocess(
    emptyStringToUndefined,
    z
      .string()
      .max(255, "Location must be 255 characters or less")
      .optional(),
  ),
});

type AddApplicationFormInput = z.input<typeof addApplicationSchema>;
type AddApplicationFormValues = z.output<typeof addApplicationSchema>;

function getInputStyles(hasError: boolean) {
  return {
    backgroundColor: "var(--bg-card-alt)",
    border: `1px solid ${hasError ? "#FCA5A5" : "var(--border)"}`,
    color: "var(--text-primary)",
    boxShadow: hasError ? "0 0 0 4px rgba(252, 165, 165, 0.16)" : "none",
  };
}

export default function ApplicationsPage() {
  const { user, isLoading: authLoading, logout } = useAuth();
  const router = useRouter();

  const [applications, setApplications] = useState<Application[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    total: 0,
    total_pages: 0,
  });
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [addServerError, setAddServerError] = useState("");
  const [error, setError] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<AddApplicationFormInput, unknown, AddApplicationFormValues>({
    resolver: zodResolver(addApplicationSchema),
    mode: "onBlur",
    reValidateMode: "onChange",
    defaultValues: {
      company: "",
      role: "",
      url: "",
      location: "",
    },
  });

  // Clear only the API error when the user edits the form again.
  const companyField = register("company", {
    onChange: () => setAddServerError(""),
  });

  const roleField = register("role", {
    onChange: () => setAddServerError(""),
  });

  const urlField = register("url", {
    onChange: () => setAddServerError(""),
  });

  const locationField = register("location", {
    onChange: () => setAddServerError(""),
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  const fetchApplications = useCallback(
    async (page = 1) => {
      setLoading(true);
      setError("");

      try {
        const query = statusFilter
          ? `/api/v1/applications?page=${page}&status=${statusFilter}`
          : `/api/v1/applications?page=${page}`;

        const res = await api.get<ApplicationsResponse>(query);
        setApplications(res.data);
        setPagination(res.pagination);
      } catch {
        setError("Could not load applications. Please try again.");
      } finally {
        setLoading(false);
      }
    },
    [statusFilter],
  );

  useEffect(() => {
    if (user) {
      void fetchApplications(1);
    }
  }, [user, fetchApplications]);

  function handleToggleAdd() {
    if (showAdd) {
      reset({
        company: "",
        role: "",
        url: "",
        location: "",
      });
      clearErrors();
      setAddServerError("");
    }

    setShowAdd((prev) => !prev);
  }

  async function onSubmitAdd(values: AddApplicationFormValues) {
    setAddServerError("");

    try {
      // The resolver gives us trimmed / normalized values here.
      // Optional empty fields have already been converted to undefined.
      await api.post("/api/v1/applications", values);

      reset({
        company: "",
        role: "",
        url: "",
        location: "",
      });

      setShowAdd(false);
      await fetchApplications(1);
    } catch (err: unknown) {
      const error = err as { message?: string };
      setAddServerError(error.message || "Failed to add application");
    }
  }

  if (authLoading || !user) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "var(--bg-page)" }}
      >
        <p style={{ color: "var(--text-muted)" }}>Loading...</p>
      </div>
    );
  }

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
            className="text-sm font-semibold transition"
            style={{ color: "var(--text-primary)" }}
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

      <div className="mx-auto max-w-5xl px-8 py-8">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1
              className="text-2xl font-bold tracking-tight"
              style={{
                fontFamily: "var(--font-manrope)",
                color: "var(--text-primary)",
              }}
            >
              Applications
            </h1>
            <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
              {pagination.total} total
            </p>
          </div>

          <button
            type="button"
            onClick={handleToggleAdd}
            className="rounded-full px-5 py-2 text-sm font-medium transition hover:scale-105"
            style={{ backgroundColor: "var(--accent)", color: "#FFFFFF" }}
          >
            {showAdd ? "Cancel" : "Add application"}
          </button>
        </div>

        {/* Add form */}
        {showAdd && (
          <div
            className="mb-6 rounded-xl p-6"
            style={{
              backgroundColor: "var(--bg-card)",
              border: "1px solid var(--border-light)",
            }}
          >
            <div className="mb-5">
              <h2
                className="text-sm font-semibold"
                style={{ color: "var(--text-primary)" }}
              >
                Add application
              </h2>
              <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
                Start with the essentials. You can add more details later.
              </p>
            </div>

            {addServerError && (
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
                {addServerError}
              </div>
            )}

            <form
              noValidate
              onSubmit={handleSubmit(onSubmitAdd)}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label
                    htmlFor="company"
                    className="mb-2 block text-xs font-medium"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    Company
                  </label>

                  <input
                    id="company"
                    type="text"
                    placeholder="Acme Inc."
                    aria-invalid={Boolean(errors.company)}
                    aria-describedby={errors.company ? "company-error" : undefined}
                    className="w-full rounded-lg px-4 py-3 text-sm outline-none transition"
                    style={getInputStyles(Boolean(errors.company))}
                    {...companyField}
                  />

                  {errors.company && (
                    <p
                      id="company-error"
                      className="mt-2 text-xs"
                      style={{ color: "#B91C1C" }}
                    >
                      {errors.company.message}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="role"
                    className="mb-2 block text-xs font-medium"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    Role
                  </label>

                  <input
                    id="role"
                    type="text"
                    placeholder="Frontend Developer"
                    aria-invalid={Boolean(errors.role)}
                    aria-describedby={errors.role ? "role-error" : undefined}
                    className="w-full rounded-lg px-4 py-3 text-sm outline-none transition"
                    style={getInputStyles(Boolean(errors.role))}
                    {...roleField}
                  />

                  {errors.role && (
                    <p
                      id="role-error"
                      className="mt-2 text-xs"
                      style={{ color: "#B91C1C" }}
                    >
                      {errors.role.message}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="url"
                    className="mb-2 block text-xs font-medium"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    Job URL
                  </label>

                  <input
                    id="url"
                    type="url"
                    placeholder="https://company.com/jobs/123"
                    aria-invalid={Boolean(errors.url)}
                    aria-describedby={errors.url ? "url-error" : undefined}
                    className="w-full rounded-lg px-4 py-3 text-sm outline-none transition"
                    style={getInputStyles(Boolean(errors.url))}
                    {...urlField}
                  />

                  {errors.url && (
                    <p
                      id="url-error"
                      className="mt-2 text-xs"
                      style={{ color: "#B91C1C" }}
                    >
                      {errors.url.message}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="location"
                    className="mb-2 block text-xs font-medium"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    Location
                  </label>

                  <input
                    id="location"
                    type="text"
                    placeholder="Winnipeg, MB"
                    aria-invalid={Boolean(errors.location)}
                    aria-describedby={
                      errors.location ? "location-error" : undefined
                    }
                    className="w-full rounded-lg px-4 py-3 text-sm outline-none transition"
                    style={getInputStyles(Boolean(errors.location))}
                    {...locationField}
                  />

                  {errors.location && (
                    <p
                      id="location-error"
                      className="mt-2 text-xs"
                      style={{ color: "#B91C1C" }}
                    >
                      {errors.location.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 pt-1">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-full px-6 py-2 text-sm font-medium transition"
                  style={{
                    backgroundColor: isSubmitting
                      ? "var(--border)"
                      : "var(--accent)",
                    color: isSubmitting ? "var(--text-muted)" : "#FFFFFF",
                    cursor: isSubmitting ? "wait" : "pointer",
                  }}
                >
                  {isSubmitting ? "Saving..." : "Save application"}
                </button>

                <button
                  type="button"
                  onClick={handleToggleAdd}
                  className="rounded-full px-5 py-2 text-sm font-medium transition"
                  style={{
                    backgroundColor: "var(--bg-card-alt)",
                    color: "var(--text-secondary)",
                    border: "1px solid var(--border-light)",
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Filter */}
        <div className="mb-6 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setStatusFilter("")}
            className="rounded-full px-4 py-2 text-xs transition"
            style={{
              backgroundColor:
                statusFilter === "" ? "var(--accent)" : "var(--bg-card)",
              color: statusFilter === "" ? "#FFFFFF" : "var(--text-secondary)",
              border:
                statusFilter === "" ? "none" : "1px solid var(--border-light)",
            }}
          >
            All
          </button>

          {Object.entries(STATUS_LABELS).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setStatusFilter(key)}
              className="rounded-full px-4 py-2 text-xs transition"
              style={{
                backgroundColor:
                  statusFilter === key ? "var(--accent)" : "var(--bg-card)",
                color:
                  statusFilter === key ? "#FFFFFF" : "var(--text-secondary)",
                border:
                  statusFilter === key
                    ? "none"
                    : "1px solid var(--border-light)",
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Applications list */}
        {error ? (
          <div
            className="rounded-xl p-12 text-center"
            style={{
              backgroundColor: "var(--bg-card)",
              border: "1px solid var(--border-light)",
            }}
          >
            <p className="text-sm" style={{ color: "#991B1B" }}>
              {error}
            </p>

            <button
              type="button"
              onClick={() => void fetchApplications(1)}
              className="mt-3 rounded-full px-5 py-2 text-xs font-medium"
              style={{ backgroundColor: "var(--accent)", color: "#FFFFFF" }}
            >
              Try again
            </button>
          </div>
        ) : loading ? (
          <p style={{ color: "var(--text-muted)" }}>Loading...</p>
        ) : applications.length === 0 ? (
          <div
            className="rounded-xl p-12 text-center"
            style={{
              backgroundColor: "var(--bg-card)",
              border: "1px solid var(--border-light)",
            }}
          >
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              No applications yet. Click &quot;Add application&quot; to get
              started.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {applications.map((app) => (
              <Link
                key={app.id}
                href={`/applications/${app.id}`}
                className="block rounded-xl p-5 transition hover:scale-[1.01]"
                style={{
                  backgroundColor: "var(--bg-card)",
                  border: "1px solid var(--border-light)",
                }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p
                      className="text-sm font-semibold"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {app.company}
                    </p>

                    <p
                      className="mt-1 text-xs"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {app.role}
                      {app.location && ` · ${app.location}`}
                    </p>
                  </div>

                  <div className="text-right">
                    <span
                      className="rounded-full px-3 py-1 text-xs font-medium"
                      style={{
                        backgroundColor: "var(--bg-green)",
                        color: "var(--accent)",
                      }}
                    >
                      {STATUS_LABELS[app.status] || app.status}
                    </span>

                    <p
                      className="mt-2 text-xs"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {new Date(app.created_at).toLocaleDateString("en", {
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination.total_pages > 1 && (
          <div className="mt-8 flex justify-center gap-2">
            {Array.from({ length: pagination.total_pages }, (_, i) => i + 1).map(
              (page) => (
                <button
                  key={page}
                  type="button"
                  onClick={() => void fetchApplications(page)}
                  className="rounded-full px-4 py-2 text-xs transition"
                  style={{
                    backgroundColor:
                      page === pagination.page
                        ? "var(--accent)"
                        : "var(--bg-card)",
                    color:
                      page === pagination.page
                        ? "#FFFFFF"
                        : "var(--text-secondary)",
                    border:
                      page === pagination.page
                        ? "none"
                        : "1px solid var(--border-light)",
                  }}
                >
                  {page}
                </button>
              ),
            )}
          </div>
        )}
      </div>
    </div>
  );
}