import Link from "next/link";
import { statusBadgeStyle } from "@/lib/ui";
import type { Status } from "@/lib/statusMachine";

const PIPELINE = [
  { label: "Wishlist", count: 18 },
  { label: "Applied", count: 9 },
  { label: "Interview", count: 3 },
  { label: "Offer", count: 1 },
];

const ACTIVITY: {
  company: string;
  role: string;
  status: Status;
  label: string;
  date: string;
}[] = [
  {
    company: "Helcim",
    role: "Software Developer",
    status: "onsite",
    label: "Onsite",
    date: "Apr 8",
  },
  {
    company: "Neo Financial",
    role: "Backend Developer",
    status: "applied",
    label: "Applied",
    date: "Apr 5",
  },
  {
    company: "Clio",
    role: "Full Stack Developer",
    status: "wishlist",
    label: "Wishlist",
    date: "Saved",
  },
];

const CAPABILITIES = [
  {
    title: "A board you can drag",
    body: "Move a job from applied to phone screen by dragging its card. Only the stages that are really possible will accept it, so the board can never show a state your application was never in.",
  },
  {
    title: "Reminders and follow-ups",
    body: "Set a reminder when you promise to get back to someone. Anything sitting quiet for a week shows up on the dashboard as a suggested follow-up.",
  },
  {
    title: "The resume you actually sent",
    body: "Attach the exact resume or cover letter to each job, then read it in the app later. No more guessing which version went where.",
  },
];

const STEPS = [
  {
    title: "Add the role",
    body: "Company, title, link. Ten seconds, right after you apply.",
  },
  {
    title: "Move it as things happen",
    body: "Drag the card when a recruiter replies. Every move is kept with its date and note.",
  },
  {
    title: "Check what needs you",
    body: "The dashboard shows what is due and what has gone quiet.",
  },
];

const BOARD_PREVIEW = [
  { stage: "Applied", jobs: ["Shopify", "Clio"] },
  { stage: "Phone screen", jobs: ["Helcim"] },
  { stage: "Onsite", jobs: ["Neo Financial"] },
];

export default function Home() {
  return (
    <main className="min-h-screen">
      <nav className="mx-auto flex max-w-[84rem] 2xl:max-w-[92rem] items-center justify-between px-6 py-6 md:px-10 lg:px-16">
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

      <section className="mx-auto grid max-w-[84rem] 2xl:max-w-[92rem] items-center gap-14 px-6 py-16 md:px-10 md:py-20 lg:grid-cols-[minmax(0,1fr)_30rem] lg:gap-20 lg:px-16">
        <div className="max-w-2xl">
          <p className="text-sm font-medium" style={{ color: "var(--accent)" }}>
            Built for a calmer job search
          </p>

          <h1 className="mt-4 text-4xl font-bold leading-[1.05] tracking-[-0.02em] md:text-5xl xl:text-6xl">
            Track every application in one organized place.
          </h1>

          <p
            className="mt-6 max-w-[48ch] text-lg leading-relaxed xl:text-xl"
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
                    style={statusBadgeStyle(item.status)}
                  >
                    {item.label}
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

      {/* What you get. One shared heading with a divided list reads calmer
          than three identical feature cards. */}
      <section
        className="mx-auto max-w-[84rem] 2xl:max-w-[92rem] px-6 py-20 md:px-10 lg:px-16 md:py-24"
        style={{ borderTop: "1px solid var(--border)" }}
      >
        <div className="grid gap-10 lg:grid-cols-[22rem_minmax(0,1fr)] lg:gap-20">
          <h2 className="text-2xl font-bold tracking-[-0.02em] xl:text-3xl">
            What you get
          </h2>

          <dl className="max-w-3xl">
            {CAPABILITIES.map((item, index) => (
              <div
                key={item.title}
                className="py-6 first:pt-0 last:pb-0"
                style={{
                  borderTop:
                    index === 0 ? "none" : "1px solid var(--border-light)",
                }}
              >
                <dt className="text-base font-semibold">{item.title}</dt>
                <dd
                  className="mt-2 max-w-[62ch] leading-relaxed"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {item.body}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* The board, shown rather than described */}
      <section
        className="mx-auto max-w-[84rem] 2xl:max-w-[92rem] px-6 py-20 md:px-10 lg:px-16 md:py-24"
        style={{ borderTop: "1px solid var(--border)" }}
      >
        <h2 className="max-w-[24ch] text-2xl font-bold tracking-[-0.02em] xl:text-3xl">
          Every application, at the stage it is really at
        </h2>
        <p
          className="mt-3 max-w-[58ch] leading-relaxed"
          style={{ color: "var(--text-secondary)" }}
        >
          The board works with a mouse, a touchscreen, or the keyboard alone,
          and every move is written into that job&apos;s history.
        </p>

        <div aria-hidden="true" className="mt-8 grid gap-4 sm:grid-cols-3">
          {BOARD_PREVIEW.map((column) => (
            <div
              key={column.stage}
              className="p-4"
              style={{
                backgroundColor: "var(--bg-card-alt)",
                border: "1px solid var(--border-light)",
                borderRadius: "var(--radius-card)",
              }}
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">{column.stage}</p>
                <span
                  className="rounded-full px-2 py-0.5 text-xs font-medium tabular-nums"
                  style={{
                    backgroundColor: "var(--bg-card)",
                    color: "var(--text-secondary)",
                  }}
                >
                  {column.jobs.length}
                </span>
              </div>

              <ul className="mt-3 space-y-2">
                {column.jobs.map((job) => (
                  <li
                    key={job}
                    className="px-3 py-2.5 text-sm font-medium"
                    style={{
                      backgroundColor: "var(--bg-card)",
                      border: "1px solid var(--border-light)",
                      borderRadius: "var(--radius-control)",
                      boxShadow: "var(--shadow-card)",
                    }}
                  >
                    {job}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Numbers earn their place here because this really is a sequence */}
      <section
        className="mx-auto max-w-[84rem] 2xl:max-w-[92rem] px-6 py-20 md:px-10 lg:px-16 md:py-24"
        style={{ borderTop: "1px solid var(--border)" }}
      >
        <h2 className="text-2xl font-bold tracking-[-0.02em] xl:text-3xl">
          How it works
        </h2>

        <ol className="mt-8 grid gap-8 sm:grid-cols-3 sm:gap-10">
          {STEPS.map((step, index) => (
            <li key={step.title}>
              <span
                className="text-sm font-semibold tabular-nums"
                style={{ color: "var(--accent)" }}
              >
                {index + 1}
              </span>
              <h3 className="mt-2 text-base font-semibold">{step.title}</h3>
              <p
                className="mt-1.5 max-w-[42ch] leading-relaxed"
                style={{ color: "var(--text-secondary)" }}
              >
                {step.body}
              </p>
            </li>
          ))}
        </ol>

        <div className="mt-12 flex flex-wrap items-center gap-4">
          <Link href="/register" className="btn btn-md btn-primary">
            Start tracking for free
          </Link>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Free, and your data stays yours.
          </p>
        </div>
      </section>

      <footer
        className="mx-auto max-w-[84rem] 2xl:max-w-[92rem] px-6 py-10 md:px-10 lg:px-16"
        style={{ borderTop: "1px solid var(--border)" }}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Built with Next.js, Node, PostgreSQL and AWS.
          </p>

          <div className="flex flex-wrap items-center gap-5 text-sm">
            <a
              href="https://github.com/sNirajan/Job-Application-Tracker"
              target="_blank"
              rel="noreferrer noopener"
              className="underline underline-offset-4"
              style={{ color: "var(--text-secondary)" }}
            >
              API source
            </a>
            <a
              href="https://github.com/sNirajan/Job-Application-Tracker-Frontend"
              target="_blank"
              rel="noreferrer noopener"
              className="underline underline-offset-4"
              style={{ color: "var(--text-secondary)" }}
            >
              Frontend source
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}
