"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

interface StatsOverview {
  data: {
    total: number;
    by_status: Record<string, number>;
    conversion_rates: Record<string, number>;
  };
}

interface WeeklyData {
  data: Array<{ week: string; count: number }>;
}

type Stage = {
  key: string;
  label: string;
};

const PIPELINE_STAGES: Stage[] = [
  { key: "wishlist", label: "Wishlist" },
  { key: "applied", label: "Applied" },
  { key: "phone_screen", label: "Phone Screen" },
  { key: "technical", label: "Technical" },
  { key: "onsite", label: "Onsite" },
  { key: "offer", label: "Offer" },
];

const OUTCOME_STAGES: Stage[] = [
  { key: "accepted", label: "Accepted" },
  { key: "rejected", label: "Rejected" },
  { key: "withdrawn", label: "Withdrawn" },
];

const CONVERSION_LABELS: Record<string, string> = {
  applied_to_phone_screen: "Applied -> Phone Screen",
  phone_screen_to_technical: "Phone Screen -> Technical",
  technical_to_onsite: "Technical -> Onsite",
  onsite_to_offer: "Onsite -> Offer",
};

function formatWeekLabel(value: string) {
  return new Date(value).toLocaleDateString("en", {
    month: "short",
    day: "numeric",
  });
}

function StatCard({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: number | string;
  tone?: "default" | "accent";
}) {
  return (
    <div
      className="rounded-2xl border p-5"
      style={{
        backgroundColor:
          tone === "accent" ? "rgba(16, 185, 129, 0.06)" : "var(--bg-card)",
        borderColor:
          tone === "accent"
            ? "rgba(16, 185, 129, 0.14)"
            : "var(--border-light)",
      }}
    >
      <p className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
        {label}
      </p>
      <p
        className="mt-3 text-3xl font-bold tracking-tight"
        style={{
          fontFamily: "var(--font-manrope)",
          color: tone === "accent" ? "var(--accent)" : "var(--text-primary)",
        }}
      >
        {value}
      </p>
    </div>
  );
}

function SummaryMetric({
  label,
  value,
  meta,
}: {
  label: string;
  value: string | number;
  meta?: string;
}) {
  return (
    <div
      className="rounded-2xl border px-4 py-4"
      style={{
        backgroundColor: "var(--bg-card-alt)",
        borderColor: "var(--border-light)",
      }}
    >
      <p className="text-xs" style={{ color: "var(--text-muted)" }}>
        {label}
      </p>
      <p
        className="mt-2 text-xl font-semibold"
        style={{
          fontFamily: "var(--font-manrope)",
          color: "var(--text-primary)",
        }}
      >
        {value}
      </p>
      {meta && (
        <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
          {meta}
        </p>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const { user, isLoading: authLoading, logout } = useAuth();
  const router = useRouter();

  const [stats, setStats] = useState<StatsOverview | null>(null);
  const [weekly, setWeekly] = useState<WeeklyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [statsRes, weeklyRes] = await Promise.all([
        api.get<StatsOverview>("/api/v1/stats/overview"),
        api.get<WeeklyData>("/api/v1/stats/weekly"),
      ]);

      setStats(statsRes);
      setWeekly(weeklyRes);
    } catch {
      setError("Something went wrong. Please try again in a moment.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      void fetchDashboardData();
    }
  }, [user, fetchDashboardData]);

  const firstName = user?.name?.split(" ")[0] || "there";

  const byStatus = stats?.data.by_status ?? {};
  const conversionRates = stats?.data.conversion_rates ?? {};
  const weeklyPoints = weekly?.data ?? [];

  const totalApplications = stats?.data.total ?? 0;
  const offersCount = byStatus.offer ?? 0;
  const acceptedCount = byStatus.accepted ?? 0;
  const rejectedCount = byStatus.rejected ?? 0;
  const withdrawnCount = byStatus.withdrawn ?? 0;

  const activeInterviews = useMemo(() => {
    return (
      (byStatus.phone_screen ?? 0) +
      (byStatus.technical ?? 0) +
      (byStatus.onsite ?? 0)
    );
  }, [byStatus]);

  const mostActiveStage = useMemo(() => {
    const ranked = PIPELINE_STAGES.map((stage) => ({
      ...stage,
      count: byStatus[stage.key] ?? 0,
    })).sort((a, b) => b.count - a.count);

    return ranked[0];
  }, [byStatus]);

  const hasWeeklyActivity = weeklyPoints.some((item) => item.count > 0);
  const hasEnoughWeeklyData = weeklyPoints.length >= 3;

  const weeklyMax = useMemo(() => {
    return weeklyPoints.length ? Math.max(...weeklyPoints.map((item) => item.count)) : 0;
  }, [weeklyPoints]);

  const weeklyTotal = useMemo(() => {
    return weeklyPoints.reduce((sum, item) => sum + item.count, 0);
  }, [weeklyPoints]);

  // This keeps the dashboard helper text grounded in actual data.
  const insight = useMemo(() => {
    if (totalApplications === 0) {
      return "Start by adding your first application so the dashboard has something to track.";
    }

    if (activeInterviews > 0) {
      return `${activeInterviews} role${activeInterviews === 1 ? "" : "s"} currently sitting in interview stages.`;
    }

    if ((byStatus.applied ?? 0) > 0) {
      return `${byStatus.applied} applied role${byStatus.applied === 1 ? "" : "s"} waiting for the next update.`;
    }

    if ((byStatus.wishlist ?? 0) > 0) {
      return `${byStatus.wishlist} saved role${byStatus.wishlist === 1 ? "" : "s"} ready to move into applications.`;
    }

    return "Keep the pipeline current so your dashboard stays useful at a glance.";
  }, [totalApplications, activeInterviews, byStatus]);

  const conversionMeta = useMemo(() => {
    const passedPhoneScreen =
      (byStatus.phone_screen ?? 0) +
      (byStatus.technical ?? 0) +
      (byStatus.onsite ?? 0) +
      (byStatus.offer ?? 0) +
      (byStatus.accepted ?? 0);

    const passedTechnical =
      (byStatus.technical ?? 0) +
      (byStatus.onsite ?? 0) +
      (byStatus.offer ?? 0) +
      (byStatus.accepted ?? 0);

    const passedOnsite =
      (byStatus.onsite ?? 0) +
      (byStatus.offer ?? 0) +
      (byStatus.accepted ?? 0);

    const passedOffer = (byStatus.offer ?? 0) + (byStatus.accepted ?? 0);

    return {
      applied_to_phone_screen: {
        value: conversionRates.applied_to_phone_screen ?? 0,
        sample: (byStatus.applied ?? 0) + passedPhoneScreen,
      },
      phone_screen_to_technical: {
        value: conversionRates.phone_screen_to_technical ?? 0,
        sample: (byStatus.phone_screen ?? 0) + passedTechnical,
      },
      technical_to_onsite: {
        value: conversionRates.technical_to_onsite ?? 0,
        sample: (byStatus.technical ?? 0) + passedOnsite,
      },
      onsite_to_offer: {
        value: conversionRates.onsite_to_offer ?? 0,
        sample: (byStatus.onsite ?? 0) + passedOffer,
      },
    };
  }, [conversionRates, byStatus]);

  if (authLoading || !user) {
    return (
      <div
        className="flex min-h-screen items-center justify-center"
        style={{ backgroundColor: "var(--bg-page)" }}
      >
        <p style={{ color: "var(--text-muted)" }}>Loading...</p>
      </div>
    );
  }

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

          <span className="text-sm" style={{ color: "var(--text-muted)" }}>
            {user.name}
          </span>

          <button
            type="button"
            onClick={logout}
            className="text-sm font-medium transition hover:scale-105"
            style={{ color: "var(--text-secondary)" }}
          >
            Sign out
          </button>
        </div>
      </nav>

      <div className="mx-auto max-w-6xl px-8 py-8">
        {error ? (
          <div
            className="rounded-2xl border p-10 text-center"
            style={{
              backgroundColor: "var(--bg-card)",
              borderColor: "var(--border-light)",
            }}
          >
            <p className="text-sm" style={{ color: "#991B1B" }}>
              {error}
            </p>

            <button
              type="button"
              onClick={() => void fetchDashboardData()}
              className="mt-4 rounded-full px-5 py-2 text-sm font-medium"
              style={{ backgroundColor: "var(--accent)", color: "#FFFFFF" }}
            >
              Try again
            </button>
          </div>
        ) : loading ? (
          <div className="space-y-8">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={index}
                  className="h-28 animate-pulse rounded-2xl border"
                  style={{
                    backgroundColor: "var(--bg-card)",
                    borderColor: "var(--border-light)",
                  }}
                />
              ))}
            </div>

            <div
              className="h-64 animate-pulse rounded-2xl border"
              style={{
                backgroundColor: "var(--bg-card)",
                borderColor: "var(--border-light)",
              }}
            />

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.45fr_0.95fr]">
              <div
                className="h-64 animate-pulse rounded-2xl border"
                style={{
                  backgroundColor: "var(--bg-card)",
                  borderColor: "var(--border-light)",
                }}
              />
              <div
                className="h-64 animate-pulse rounded-2xl border"
                style={{
                  backgroundColor: "var(--bg-card)",
                  borderColor: "var(--border-light)",
                }}
              />
            </div>
          </div>
        ) : (
          <>
            {/* Top section with one clear message and one clear action */}
            <section className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-xl">
                <h1
                  className="mt-3 text-3xl font-bold tracking-tight lg:text-4xl"
                  style={{
                    fontFamily: "var(--font-manrope)",
                    color: "var(--text-primary)",
                  }}
                >
                  Welcome back, {firstName}
                </h1>

                <p
                  className="mt-3 text-sm leading-7"
                  style={{ color: "var(--text-secondary)" }}
                >
                  A quick view of what is moving forward, where the bottlenecks are,
                  and how your search looks right now.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href="/applications"
                  className="inline-flex rounded-full px-5 py-2.5 text-sm font-medium transition"
                  style={{
                    backgroundColor: "var(--accent)",
                    color: "#FFFFFF",
                  }}
                >
                  View applications
                </Link>
              </div>
            </section>

            {/* Keep the first row focused on the three numbers that matter most */}
            <section className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
              <StatCard label="Total applications" value={totalApplications} />
              <StatCard label="Active interviews" value={activeInterviews} />
              <StatCard label="Offers" value={offersCount} tone="accent" />
            </section>

            {/* One main pipeline card feels calmer than many equal-weight sections */}
            <section
              className="mb-8 rounded-2xl border p-6 lg:p-7"
              style={{
                backgroundColor: "var(--bg-card)",
                borderColor: "var(--border-light)",
              }}
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <h2
                    className="text-base font-semibold"
                    style={{ color: "var(--text-primary)" }}
                  >
                    Pipeline overview
                  </h2>
                  <p
                    className="mt-1 text-sm"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    The core path from saved roles to offers.
                  </p>
                </div>

                <div
                  className="rounded-full px-3 py-1 text-xs font-medium"
                  style={{
                    backgroundColor: "rgba(16, 185, 129, 0.10)",
                    color: "#065F46",
                  }}
                >
                  Most active: {mostActiveStage.label}
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
                {PIPELINE_STAGES.map((stage) => (
                  <div
                    key={stage.key}
                    className="rounded-2xl border px-4 py-4"
                    style={{
                      backgroundColor: "var(--bg-card-alt)",
                      borderColor: "var(--border-light)",
                    }}
                  >
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                      {stage.label}
                    </p>
                    <p
                      className="mt-3 text-2xl font-bold tracking-tight"
                      style={{
                        fontFamily: "var(--font-manrope)",
                        color: "var(--text-primary)",
                      }}
                    >
                      {byStatus[stage.key] ?? 0}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-3">
                {OUTCOME_STAGES.map((stage) => (
                  <SummaryMetric
                    key={stage.key}
                    label={stage.label}
                    value={byStatus[stage.key] ?? 0}
                  />
                ))}
              </div>
            </section>

            <section className="grid grid-cols-1 gap-6 lg:grid-cols-[1.45fr_0.95fr]">
              {/* Weekly activity */}
              <div
                className="rounded-2xl border p-6"
                style={{
                  backgroundColor: "var(--bg-card)",
                  borderColor: "var(--border-light)",
                }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2
                      className="text-base font-semibold"
                      style={{ color: "var(--text-primary)" }}
                    >
                      Weekly activity
                    </h2>
                    <p
                      className="mt-1 text-sm"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      Applications added over the last few weeks.
                    </p>
                  </div>

                  <div
                    className="rounded-full px-3 py-1 text-xs font-medium"
                    style={{
                      backgroundColor: "var(--bg-card-alt)",
                      color: "var(--text-secondary)",
                      border: "1px solid var(--border-light)",
                    }}
                  >
                    {weeklyTotal} total
                  </div>
                </div>

                {!hasWeeklyActivity ? (
                  <div
                    className="mt-6 rounded-2xl border px-5 py-6"
                    style={{
                      backgroundColor: "var(--bg-card-alt)",
                      borderColor: "var(--border-light)",
                    }}
                  >
                    <p
                      className="text-sm font-medium"
                      style={{ color: "var(--text-primary)" }}
                    >
                      No activity yet
                    </p>
                    <p
                      className="mt-1 text-sm"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      Start adding applications and your weekly trend will show up here.
                    </p>
                  </div>
                ) : !hasEnoughWeeklyData ? (
                  <div
                    className="mt-6 rounded-2xl border px-5 py-6"
                    style={{
                      backgroundColor: "var(--bg-card-alt)",
                      borderColor: "var(--border-light)",
                    }}
                  >
                   
                    <p
                      className="mt-1 text-sm"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {weeklyTotal} application{weeklyTotal === 1 ? "" : "s"} added so far.
                    </p>

                    <div className="mt-4 space-y-2">
                      {weeklyPoints.map((item) => (
                        <div
                          key={item.week}
                          className="flex items-center justify-between rounded-xl border px-4 py-3"
                          style={{
                            backgroundColor: "rgba(16, 185, 129, 0.04)",
                            borderColor: "rgba(16, 185, 129, 0.10)",
                          }}
                        >
                          <span
                            className="text-sm"
                            style={{ color: "var(--text-secondary)" }}
                          >
                            Week of {formatWeekLabel(item.week)}
                          </span>
                          <span
                            className="text-sm font-semibold"
                            style={{ color: "var(--text-primary)" }}
                          >
                            {item.count}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="mt-8 flex h-56 items-end gap-3">
                    {weeklyPoints.map((item) => {
                      const height =
                        weeklyMax > 0 ? (item.count / weeklyMax) * 100 : 0;

                      return (
                        <div
                          key={item.week}
                          className="flex flex-1 flex-col items-center gap-3"
                        >
                          <div className="flex h-40 w-full items-end">
                            <div
                              className="w-full rounded-t-xl transition-all"
                              style={{
                                height: `${Math.max(height, 8)}%`,
                                background:
                                  "linear-gradient(to top, var(--accent), rgba(16, 185, 129, 0.55))",
                              }}
                              title={`${item.count} applications`}
                            />
                          </div>

                          <span
                            className="text-xs"
                            style={{ color: "var(--text-muted)" }}
                          >
                            {formatWeekLabel(item.week)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* One summary card is calmer than stacking multiple competing boxes */}
              <div
                className="rounded-2xl border p-6"
                style={{
                  backgroundColor: "var(--bg-card)",
                  borderColor: "var(--border-light)",
                }}
              >
                <h2
                  className="text-base font-semibold"
                  style={{ color: "var(--text-primary)" }}
                >
                  Search summary
                </h2>

                <div className="mt-5 space-y-3">
                  {Object.entries(conversionMeta).map(([key, item]) => (
                    <SummaryMetric
                      key={key}
                      label={CONVERSION_LABELS[key]}
                      value={`${item.value}%`}
                      meta={`Based on ${item.sample} role${item.sample === 1 ? "" : "s"}`}
                    />
                  ))}

                  <div className="grid grid-cols-3 gap-3 pt-1">
                    <SummaryMetric label="Accepted" value={acceptedCount} />
                    <SummaryMetric label="Rejected" value={rejectedCount} />
                    <SummaryMetric label="Withdrawn" value={withdrawnCount} />
                  </div>

                  <div
                    className="rounded-2xl border px-4 py-4"
                    style={{
                      backgroundColor: "var(--bg-card-alt)",
                      borderColor: "var(--border-light)",
                    }}
                  >
                    <p
                      className="text-sm font-medium"
                      style={{ color: "var(--text-primary)" }}
                    >
                      Current insight
                    </p>
                    <p
                      className="mt-1 text-sm leading-6"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {insight}
                    </p>
                  </div>
                </div>
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}


// "use client";

// import Link from "next/link";
// import { useAuth } from "@/contexts/AuthContext";
// import { api } from "@/lib/api";
// import { useCallback, useEffect, useMemo, useState } from "react";
// import { useRouter } from "next/navigation";

// interface StatsOverview {
//   data: {
//     total: number;
//     by_status: Record<string, number>;
//     conversion_rates: Record<string, number>;
//   };
// }

// interface WeeklyData {
//   data: Array<{ week: string; count: number }>;
// }

// type PipelineStage = {
//   key: string;
//   label: string;
// };

// const PIPELINE_STAGES: PipelineStage[] = [
//   { key: "wishlist", label: "Wishlist" },
//   { key: "applied", label: "Applied" },
//   { key: "phone_screen", label: "Phone Screen" },
//   { key: "technical", label: "Technical" },
//   { key: "onsite", label: "Onsite" },
//   { key: "offer", label: "Offer" },
// ];

// const OUTCOME_STAGES: PipelineStage[] = [
//   { key: "accepted", label: "Accepted" },
//   { key: "rejected", label: "Rejected" },
//   { key: "withdrawn", label: "Withdrawn" },
// ];

// function formatWeekLabel(value: string) {
//   return new Date(value).toLocaleDateString("en", {
//     month: "short",
//     day: "numeric",
//   });
// }

// function StatCard({
//   label,
//   value,
//   tone = "default",
// }: {
//   label: string;
//   value: number | string;
//   tone?: "default" | "accent";
// }) {
//   return (
//     <div
//       className="rounded-2xl border p-5"
//       style={{
//         backgroundColor:
//           tone === "accent" ? "rgba(16, 185, 129, 0.06)" : "var(--bg-card)",
//         borderColor:
//           tone === "accent"
//             ? "rgba(16, 185, 129, 0.12)"
//             : "var(--border-light)",
//       }}
//     >
//       <p className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
//         {label}
//       </p>
//       <p
//         className="mt-3 text-3xl font-bold tracking-tight"
//         style={{
//           fontFamily: "var(--font-manrope)",
//           color: tone === "accent" ? "var(--accent)" : "var(--text-primary)",
//         }}
//       >
//         {value}
//       </p>
//     </div>
//   );
// }

// function MiniMetric({
//   label,
//   value,
// }: {
//   label: string;
//   value: number | string;
// }) {
//   return (
//     <div
//       className="rounded-xl border px-4 py-3"
//       style={{
//         backgroundColor: "var(--bg-card-alt)",
//         borderColor: "var(--border-light)",
//       }}
//     >
//       <p className="text-xs" style={{ color: "var(--text-muted)" }}>
//         {label}
//       </p>
//       <p
//         className="mt-2 text-lg font-semibold"
//         style={{
//           fontFamily: "var(--font-manrope)",
//           color: "var(--text-primary)",
//         }}
//       >
//         {value}
//       </p>
//     </div>
//   );
// }

// export default function DashboardPage() {
//   const { user, isLoading: authLoading, logout } = useAuth();
//   const router = useRouter();

//   const [stats, setStats] = useState<StatsOverview | null>(null);
//   const [weekly, setWeekly] = useState<WeeklyData | null>(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState("");

//   useEffect(() => {
//     if (!authLoading && !user) {
//       router.push("/login");
//     }
//   }, [user, authLoading, router]);

//   const fetchDashboardData = useCallback(async () => {
//     setLoading(true);
//     setError("");

//     try {
//       const [statsRes, weeklyRes] = await Promise.all([
//         api.get<StatsOverview>("/api/v1/stats/overview"),
//         api.get<WeeklyData>("/api/v1/stats/weekly"),
//       ]);

//       setStats(statsRes);
//       setWeekly(weeklyRes);
//     } catch {
//       setError("Something went wrong. Please try again in a moment.");
//     } finally {
//       setLoading(false);
//     }
//   }, []);

//   useEffect(() => {
//     if (user) {
//       void fetchDashboardData();
//     }
//   }, [user, fetchDashboardData]);

//   const firstName = user?.name?.split(" ")[0] || "there";

//   const totalApplications = stats?.data.total ?? 0;
//   const byStatus = stats?.data.by_status ?? {};
//   const conversionRates = stats?.data.conversion_rates ?? {};

//   const activeInterviews = useMemo(() => {
//     return (
//       (byStatus.phone_screen ?? 0) +
//       (byStatus.technical ?? 0) +
//       (byStatus.onsite ?? 0)
//     );
//   }, [byStatus]);

//   const offersCount = byStatus.offer ?? 0;
//   const acceptedCount = byStatus.accepted ?? 0;
//   const rejectedCount = byStatus.rejected ?? 0;
//   const withdrawnCount = byStatus.withdrawn ?? 0;

//   const mostActiveStage = useMemo(() => {
//     const ranked = PIPELINE_STAGES.map((stage) => ({
//       ...stage,
//       count: byStatus[stage.key] ?? 0,
//     })).sort((a, b) => b.count - a.count);

//     return ranked[0];
//   }, [byStatus]);

//   const responseRate = useMemo(() => {
//     const applied = byStatus.applied ?? 0;
//     if (applied === 0) return 0;

//     return Math.round((activeInterviews / applied) * 100);
//   }, [activeInterviews, byStatus]);

//   const offerRate =
//     typeof conversionRates.onsite_to_offer === "number"
//       ? conversionRates.onsite_to_offer
//       : 0;

//   const weeklyMax = useMemo(() => {
//     const counts = weekly?.data?.map((item) => item.count) ?? [];
//     return counts.length ? Math.max(...counts) : 0;
//   }, [weekly]);

//   const hasWeeklyActivity = (weekly?.data?.some((item) => item.count > 0) ?? false);

//   if (authLoading || !user) {
//     return (
//       <div
//         className="flex min-h-screen items-center justify-center"
//         style={{ backgroundColor: "var(--bg-page)" }}
//       >
//         <p style={{ color: "var(--text-muted)" }}>Loading...</p>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen" style={{ backgroundColor: "var(--bg-page)" }}>
//       <nav className="flex items-center justify-between px-8 py-5 lg:px-24">
//         <Link
//           href="/dashboard"
//           className="text-xl font-bold tracking-tight"
//           style={{
//             fontFamily: "var(--font-manrope)",
//             color: "var(--text-primary)",
//           }}
//         >
//           JobTracker
//         </Link>

//         <div className="flex items-center gap-6">
//           <Link
//             href="/applications"
//             className="text-sm font-medium transition"
//             style={{ color: "var(--text-secondary)" }}
//           >
//             Applications
//           </Link>

//           <span className="text-sm" style={{ color: "var(--text-muted)" }}>
//             {user.name}
//           </span>

//           <button
//             type="button"
//             onClick={logout}
//             className="text-sm font-medium transition hover:scale-105"
//             style={{ color: "var(--text-secondary)" }}
//           >
//             Sign out
//           </button>
//         </div>
//       </nav>

//       <div className="mx-auto max-w-6xl px-8 py-8">
//         {error ? (
//           <div
//             className="rounded-2xl border p-10 text-center"
//             style={{
//               backgroundColor: "var(--bg-card)",
//               borderColor: "var(--border-light)",
//             }}
//           >
//             <p className="text-sm" style={{ color: "#991B1B" }}>
//               {error}
//             </p>

//             <button
//               type="button"
//               onClick={() => void fetchDashboardData()}
//               className="mt-4 rounded-full px-5 py-2 text-sm font-medium"
//               style={{ backgroundColor: "var(--accent)", color: "#FFFFFF" }}
//             >
//               Try again
//             </button>
//           </div>
//         ) : loading ? (
//           <div className="space-y-8">
//             <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
//               {Array.from({ length: 3 }).map((_, index) => (
//                 <div
//                   key={index}
//                   className="h-28 animate-pulse rounded-2xl border"
//                   style={{
//                     backgroundColor: "var(--bg-card)",
//                     borderColor: "var(--border-light)",
//                   }}
//                 />
//               ))}
//             </div>

//             <div
//               className="h-64 animate-pulse rounded-2xl border"
//               style={{
//                 backgroundColor: "var(--bg-card)",
//                 borderColor: "var(--border-light)",
//               }}
//             />

//             <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.4fr_0.9fr]">
//               <div
//                 className="h-64 animate-pulse rounded-2xl border"
//                 style={{
//                   backgroundColor: "var(--bg-card)",
//                   borderColor: "var(--border-light)",
//                 }}
//               />
//               <div
//                 className="h-64 animate-pulse rounded-2xl border"
//                 style={{
//                   backgroundColor: "var(--bg-card)",
//                   borderColor: "var(--border-light)",
//                 }}
//               />
//             </div>
//           </div>
//         ) : (
//           <>
//             {/* Hero row */}
//             <section className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
//               <div className="max-w-xl">
                

//                 <h1
//                   className="mt-3 text-3xl font-bold tracking-tight lg:text-4xl"
//                   style={{
//                     fontFamily: "var(--font-manrope)",
//                     color: "var(--text-primary)",
//                   }}
//                 >
//                   Welcome back, {firstName}
//                 </h1>

//                 <p
//                   className="mt-3 text-sm leading-7"
//                   style={{ color: "var(--text-secondary)" }}
//                 >
//                   A quick view of where your search stands right now, what is
//                   moving forward, and what needs attention next.
//                 </p>
//               </div>

//               <div className="flex flex-wrap items-center gap-3">
//                 <Link
//                   href="/applications"
//                   className="inline-flex rounded-full px-5 py-2.5 text-sm font-medium transition"
//                   style={{
//                     backgroundColor: "var(--accent)",
//                     color: "#FFFFFF",
//                   }}
//                 >
//                   View applications
//                 </Link>
//               </div>
//             </section>

//             {/* Primary stats */}
//             <section className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
//               <StatCard label="Total applications" value={totalApplications} />
//               <StatCard label="Active interviews" value={activeInterviews} />
//               <StatCard label="Offers" value={offersCount} tone="accent" />
//             </section>

//             {/* Main pipeline card */}
//             <section
//               className="mb-8 rounded-2xl border p-6 lg:p-7"
//               style={{
//                 backgroundColor: "var(--bg-card)",
//                 borderColor: "var(--border-light)",
//               }}
//             >
//               <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
//                 <div>
//                   <h2
//                     className="text-base font-semibold"
//                     style={{ color: "var(--text-primary)" }}
//                   >
//                     Pipeline overview
//                   </h2>
//                   <p
//                     className="mt-1 text-sm"
//                     style={{ color: "var(--text-secondary)" }}
//                   >
//                     The core path from saved roles to offers.
//                   </p>
//                 </div>

//                 <div
//                   className="rounded-full px-3 py-1 text-xs font-medium"
//                   style={{
//                     backgroundColor: "rgba(16, 185, 129, 0.10)",
//                     color: "#065F46",
//                   }}
//                 >
//                   Most active: {mostActiveStage.label}
//                 </div>
//               </div>

//               <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
//                 {PIPELINE_STAGES.map((stage) => (
//                   <div
//                     key={stage.key}
//                     className="rounded-2xl border px-4 py-4"
//                     style={{
//                       backgroundColor: "var(--bg-card-alt)",
//                       borderColor: "var(--border-light)",
//                     }}
//                   >
//                     <p className="text-xs" style={{ color: "var(--text-muted)" }}>
//                       {stage.label}
//                     </p>
//                     <p
//                       className="mt-3 text-2xl font-bold tracking-tight"
//                       style={{
//                         fontFamily: "var(--font-manrope)",
//                         color: "var(--text-primary)",
//                       }}
//                     >
//                       {byStatus[stage.key] ?? 0}
//                     </p>
//                   </div>
//                 ))}
//               </div>

//               <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-3">
//                 {OUTCOME_STAGES.map((stage) => (
//                   <MiniMetric
//                     key={stage.key}
//                     label={stage.label}
//                     value={byStatus[stage.key] ?? 0}
//                   />
//                 ))}
//               </div>
//             </section>

//             {/* Lower section */}
//             <section className="grid grid-cols-1 gap-6 lg:grid-cols-[1.45fr_0.95fr]">
//               {/* Weekly activity */}
//               <div
//                 className="rounded-2xl border p-6"
//                 style={{
//                   backgroundColor: "var(--bg-card)",
//                   borderColor: "var(--border-light)",
//                 }}
//               >
//                 <div className="flex items-start justify-between gap-4">
//                   <div>
//                     <h2
//                       className="text-base font-semibold"
//                       style={{ color: "var(--text-primary)" }}
//                     >
//                       Weekly activity
//                     </h2>
//                     <p
//                       className="mt-1 text-sm"
//                       style={{ color: "var(--text-secondary)" }}
//                     >
//                       Applications added over the last few weeks.
//                     </p>
//                   </div>

//                   <div
//                     className="rounded-full px-3 py-1 text-xs font-medium"
//                     style={{
//                       backgroundColor: "var(--bg-card-alt)",
//                       color: "var(--text-secondary)",
//                       border: "1px solid var(--border-light)",
//                     }}
//                   >
//                     {weekly?.data?.reduce((sum, item) => sum + item.count, 0) ?? 0} total
//                   </div>
//                 </div>

//                 {hasWeeklyActivity ? (
//                   <div className="mt-8 flex h-56 items-end gap-3">
//                     {weekly?.data.map((item) => {
//                       const height =
//                         weeklyMax > 0 ? (item.count / weeklyMax) * 100 : 0;

//                       return (
//                         <div
//                           key={item.week}
//                           className="flex flex-1 flex-col items-center gap-3"
//                         >
//                           <div className="flex h-40 w-full items-end">
//                             <div
//                               className="w-full rounded-t-xl transition-all"
//                               style={{
//                                 height: `${Math.max(height, 6)}%`,
//                                 background:
//                                   "linear-gradient(to top, var(--accent), rgba(16, 185, 129, 0.55))",
//                               }}
//                               title={`${item.count} applications`}
//                             />
//                           </div>

//                           <span
//                             className="text-xs"
//                             style={{ color: "var(--text-muted)" }}
//                           >
//                             {formatWeekLabel(item.week)}
//                           </span>
//                         </div>
//                       );
//                     })}
//                   </div>
//                 ) : (
//                   <div
//                     className="mt-6 rounded-2xl border px-5 py-6"
//                     style={{
//                       backgroundColor: "var(--bg-card-alt)",
//                       borderColor: "var(--border-light)",
//                     }}
//                   >
//                     <p
//                       className="text-sm font-medium"
//                       style={{ color: "var(--text-primary)" }}
//                     >
//                       No activity yet
//                     </p>
//                     <p
//                       className="mt-1 text-sm"
//                       style={{ color: "var(--text-secondary)" }}
//                     >
//                       Start adding applications and your weekly trend will show up here.
//                     </p>
//                   </div>
//                 )}
//               </div>

//               {/* Side summary */}
//               <div className="space-y-6">
//                 <div
//                   className="rounded-2xl border p-6"
//                   style={{
//                     backgroundColor: "var(--bg-card)",
//                     borderColor: "var(--border-light)",
//                   }}
//                 >
//                   <h2
//                     className="text-base font-semibold"
//                     style={{ color: "var(--text-primary)" }}
//                   >
//                     Search summary
//                   </h2>

//                   <div className="mt-5 space-y-3">
//                     <MiniMetric label="Response rate" value={`${responseRate}%`} />
//                     <MiniMetric label="Onsite to offer" value={`${offerRate}%`} />
//                     <MiniMetric label="Accepted" value={acceptedCount} />
//                   </div>
//                 </div>

//                 <div
//                   className="rounded-2xl border p-6"
//                   style={{
//                     backgroundColor: "var(--bg-card)",
//                     borderColor: "var(--border-light)",
//                   }}
//                 >
//                   <h2
//                     className="text-base font-semibold"
//                     style={{ color: "var(--text-primary)" }}
//                   >
//                     Quick snapshot
//                   </h2>

//                   <div className="mt-4 space-y-3">
//                     <div className="flex items-center justify-between">
//                       <span
//                         className="text-sm"
//                         style={{ color: "var(--text-secondary)" }}
//                       >
//                         Rejected
//                       </span>
//                       <span
//                         className="text-sm font-semibold"
//                         style={{ color: "var(--text-primary)" }}
//                       >
//                         {rejectedCount}
//                       </span>
//                     </div>

//                     <div className="flex items-center justify-between">
//                       <span
//                         className="text-sm"
//                         style={{ color: "var(--text-secondary)" }}
//                       >
//                         Withdrawn
//                       </span>
//                       <span
//                         className="text-sm font-semibold"
//                         style={{ color: "var(--text-primary)" }}
//                       >
//                         {withdrawnCount}
//                       </span>
//                     </div>

//                     <div
//                       className="mt-4 rounded-2xl border px-4 py-4"
//                       style={{
//                         backgroundColor: "var(--bg-card-alt)",
//                         borderColor: "var(--border-light)",
//                       }}
//                     >
//                       <p
//                         className="text-sm font-medium"
//                         style={{ color: "var(--text-primary)" }}
//                       >
//                         Best next step
//                       </p>
//                       <p
//                         className="mt-1 text-sm leading-6"
//                         style={{ color: "var(--text-secondary)" }}
//                       >
//                         Keep your pipeline current and focus on moving applied roles
//                         into screening conversations.
//                       </p>
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             </section>
//           </>
//         )}
//       </div>
//     </div>
//   );
// }


