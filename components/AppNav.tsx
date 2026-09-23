"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

/*
 * The signed-in header. It used to be copied into each page, which meant
 * three slightly different versions and three sets of hit areas that were
 * too small to tap. One component keeps them identical, keeps every
 * target at least 24px tall, and lets the row wrap on narrow screens.
 */
export default function AppNav() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const onApplications = pathname?.startsWith("/applications");

  return (
    <nav
      className="mb-2 flex flex-wrap items-center justify-between gap-x-6 gap-y-2 px-6 py-4 lg:px-10"
      style={{ borderBottom: "1px solid var(--border-light)" }}
    >
      <Link
        href="/dashboard"
        className="rounded-md py-1 text-lg font-bold tracking-tight"
        style={{
          fontFamily: "var(--font-manrope)",
          color: "var(--text-primary)",
        }}
      >
        JobTracker
      </Link>

      <div className="flex flex-wrap items-center gap-x-5 gap-y-1">
        <Link
          href="/dashboard"
          aria-current={pathname === "/dashboard" ? "page" : undefined}
          className="rounded-md py-1.5 text-sm transition-colors"
          style={{
            color:
              pathname === "/dashboard"
                ? "var(--text-primary)"
                : "var(--text-secondary)",
            fontWeight: pathname === "/dashboard" ? 600 : 500,
          }}
        >
          Dashboard
        </Link>

        <Link
          href="/applications"
          aria-current={onApplications ? "page" : undefined}
          className="rounded-md py-1.5 text-sm transition-colors"
          style={{
            color: onApplications
              ? "var(--text-primary)"
              : "var(--text-secondary)",
            fontWeight: onApplications ? 600 : 500,
          }}
        >
          Applications
        </Link>

        {user && (
          <span
            className="hidden py-1.5 text-sm sm:inline"
            style={{ color: "var(--text-muted)" }}
          >
            {user.name}
          </span>
        )}

        <button type="button" onClick={logout} className="btn btn-sm btn-quiet">
          Sign out
        </button>
      </div>
    </nav>
  );
}
