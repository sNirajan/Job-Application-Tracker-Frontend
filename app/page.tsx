import Link from "next/link";

const PIPELINE = [
  { label: "Wishlist", count: 18 },
  { label: "Applied", count: 9 },
  { label: "Interview", count: 3 },
  { label: "Offer", count: 1 },
];

const ACTIVITY = [
  {
    company: "Helcim",
    role: "Software Developer",
    status: "Interview",
    date: "Apr 8",
  },
  {
    company: "Neo Financial",
    role: "Backend Developer",
    status: "Applied",
    date: "Apr 5",
  },
  {
    company: "Clio",
    role: "Full Stack Developer",
    status: "Wishlist",
    date: "Saved",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6 md:px-10">
        <span
          className="text-lg font-bold tracking-tight"
          style={{ fontFamily: "var(--font-manrope)" }}
        >
          JobTracker
        </span>

        <div className="flex items-center gap-2">
          <Link href="/login" className="btn btn-sm btn-quiet">
            Sign in
          </Link>
          <Link href="/register" className="btn btn-sm btn-primary">
            Get started
          </Link>
        </div>
      </nav>

      <section className="mx-auto grid max-w-6xl items-center gap-14 px-6 py-16 md:px-10 md:py-24 lg:grid-cols-[minmax(0,1fr)_26rem]">
        <div className="max-w-xl">
          <p className="text-sm font-medium" style={{ color: "var(--accent)" }}>
            Built for a calmer job search
          </p>

          <h1 className="mt-4 text-4xl font-bold leading-[1.08] tracking-[-0.02em] md:text-5xl">
            Track every application in one organized place.
          </h1>

          <p
            className="mt-5 max-w-[46ch] text-lg leading-relaxed"
            style={{ color: "var(--text-secondary)" }}
          >
            Keep your search organized from wishlist to offer, with one place
            for roles, notes, reminders and the resume you actually sent.
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-3">
            <Link href="/register" className="btn btn-md btn-primary">
              Start tracking for free
            </Link>
            <Link href="/login" className="btn btn-md btn-secondary">
              Sign in
            </Link>
          </div>
        </div>

        {/* A sample of the dashboard. Flat inside: sections are separated by
            rules and space rather than boxes within a box. */}
        <div
          aria-hidden="true"
          className="w-full p-6"
          style={{
            backgroundColor: "var(--bg-card)",
            border: "1px solid var(--border-light)",
            borderRadius: "var(--radius-card)",
            boxShadow: "var(--shadow-card)",
          }}
        >
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            Overview
          </p>
          <p
            className="mt-0.5 text-lg font-bold"
            style={{ fontFamily: "var(--font-manrope)" }}
          >
            April
          </p>

          <dl className="mt-6 grid grid-cols-4 gap-4">
            {PIPELINE.map((stage) => (
              <div key={stage.label}>
                <dt className="text-xs" style={{ color: "var(--text-muted)" }}>
                  {stage.label}
                </dt>
                <dd
                  className="mt-1 text-2xl font-bold tabular-nums"
                  style={{ fontFamily: "var(--font-manrope)" }}
                >
                  {stage.count}
                </dd>
              </div>
            ))}
          </dl>

          <p
            className="mt-8 text-xs font-medium"
            style={{ color: "var(--text-muted)" }}
          >
            Recent activity
          </p>

          <ul className="mt-2">
            {ACTIVITY.map((item, index) => (
              <li
                key={item.company}
                className="flex items-center justify-between gap-4 py-3"
                style={{
                  borderTop:
                    index === 0 ? "none" : "1px solid var(--border-light)",
                }}
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{item.company}</p>
                  <p
                    className="truncate text-xs"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {item.role}
                  </p>
                </div>

                <div className="shrink-0 text-right">
                  <span
                    className="rounded-full px-2.5 py-1 text-xs font-medium"
                    style={{
                      backgroundColor: "var(--bg-green)",
                      color: "var(--accent)",
                    }}
                  >
                    {item.status}
                  </span>
                  <p
                    className="mt-1 text-xs"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {item.date}
                  </p>
                </div>
              </li>
            ))}
          </ul>

          <dl
            className="mt-6 flex gap-10 pt-5"
            style={{ borderTop: "1px solid var(--border-light)" }}
          >
            <div>
              <dt className="text-xs" style={{ color: "var(--text-muted)" }}>
                Response rate
              </dt>
              <dd
                className="mt-1 text-xl font-bold tabular-nums"
                style={{ fontFamily: "var(--font-manrope)" }}
              >
                33%
              </dd>
            </div>
            <div>
              <dt className="text-xs" style={{ color: "var(--text-muted)" }}>
                Next follow-up
              </dt>
              <dd
                className="mt-1 text-xl font-bold"
                style={{ fontFamily: "var(--font-manrope)" }}
              >
                Tomorrow
              </dd>
            </div>
          </dl>
        </div>
      </section>
    </main>
  );
}
