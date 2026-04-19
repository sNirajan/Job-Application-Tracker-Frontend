import Link from "next/link";

export default function Home() {
  return (
    <main
      className="min-h-screen relative"
      style={{ backgroundColor: "var(--bg-page)" }}
    >
      {/* Background atmosphere */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div
          className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full opacity-60"
          style={{ backgroundColor: "var(--bg-warm)", filter: "blur(100px)" }}
        />
        <div
          className="absolute top-1/3 -right-20 w-[400px] h-[400px] rounded-full opacity-40"
          style={{ backgroundColor: "var(--bg-green)", filter: "blur(100px)" }}
        />
        <div
          className="absolute bottom-0 left-1/3 w-[350px] h-[350px] rounded-full opacity-30"
          style={{ backgroundColor: "var(--bg-warm)", filter: "blur(100px)" }}
        />
      </div>

      {/* Navbar */}
      <nav className="relative z-10 flex items-center justify-between px-8 md:px-16 lg:px-24 py-6">
        <span
          className="text-xl font-bold tracking-tight"
          style={{
            fontFamily: "var(--font-manrope)",
            color: "var(--text-primary)",
          }}
        >
          JobTracker
        </span>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="px-5 py-2 text-sm font-medium rounded-full transition hover:scale-105"
            style={{
              color: "var(--text-secondary)",
              border: "1px solid var(--border)",
            }}
          >
            Sign in
          </Link>
          <Link
            href="/register"
            className="px-5 py-2 text-sm font-medium rounded-full transition hover:scale-105"
            style={{
              backgroundColor: "var(--accent)",
              color: "#FFFFFF",
            }}
          >
            Get started
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 flex flex-col lg:flex-row items-center justify-between px-8 md:px-16 py-16 md:py-24 gap-12 max-w-7xl mx-auto">
        {/* Left side */}

        {/* Left side */}

        <div className="max-w-xl">
          <div
            className="inline-block px-4 py-2 text-sm rounded-full mb-8"
            style={{
              backgroundColor: "var(--bg-card)",
              color: "var(--text-secondary)",
              border: "1px solid var(--border-light)",
            }}
          >
            Built for a calmer job search
          </div>

          <h1
            className="text-4xl md:text-6xl font-bold leading-tight tracking-tight"
            style={{ fontFamily: "var(--font-manrope)", color: "#161616" }}
          >
            Track every application in one organized place.

          </h1>

          <p
            className="mt-6 text-lg leading-relaxed"
            style={{ color: "var(--text-secondary)" }}
          >
            Keep your search organized from wishlist to offer with one simple
            workspace for roles, notes, and next steps. 
          </p>

          <div className="mt-10 flex items-center gap-4">
            <Link
              href="/register"
              className="px-7 py-3 text-sm font-medium rounded-full transition hover:scale-105"
              style={{ backgroundColor: "var(--accent)", color: "#FFFFFF" }}
            >
              Start tracking for free
            </Link>
            <Link
              href="/login"
              className="px-7 py-3 text-sm font-medium rounded-full transition hover:scale-105"
              style={{
                color: "var(--text-primary)",
                border: "1px solid var(--border)",
              }}
            >
              Sign in
            </Link>
          </div>

          
        </div>

        {/* Right side - dashboard preview with depth */}
        {/* <div
          className="w-full max-w-md rounded-2xl p-6 lg:rotate-1 hover:rotate-0 transition-transform duration-500" */}
        <div
          className="w-full max-w-md rounded-2xl p-6   hover:rotate-0 transition-transform duration-500 lg:-ml-8"
          style={{
            backgroundColor: "var(--bg-card)",
            border: "1px solid var(--border-light)",
            boxShadow:
              "0 20px 60px rgba(0, 0, 0, 0.08), 0 8px 20px rgba(0, 0, 0, 0.04)",
          }}
        >
          {/* Pipeline header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <p
                className="text-sm font-medium"
                style={{ color: "var(--text-muted)" }}
              >
                Job Tracker
              </p>
              <p
                className="text-lg font-bold"
                style={{ fontFamily: "var(--font-manrope)" }}
              >
                April overview
              </p>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-4 gap-2 mb-6">
            {[
              { label: "Wishlist", count: 18 },
              { label: "Applied", count: 9 },
              { label: "Interview", count: 3 },
              { label: "Offer", count: 1 },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-xl p-3"
                style={{ backgroundColor: "var(--bg-card-alt)" }}
              >
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  {stat.label}
                </p>
                <p
                  className="text-xl font-bold mt-1"
                  style={{ fontFamily: "var(--font-manrope)" }}
                >
                  {stat.count}
                </p>
              </div>
            ))}
          </div>

          {/* Recent activity */}
          <div
            className="rounded-xl p-4 mb-4"
            style={{ backgroundColor: "var(--bg-card-alt)" }}
          >
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-semibold">Recent activity</p>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                This week
              </p>
            </div>

            {[
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
            ].map((item, i, arr) => (
              <div
                key={item.company}
                className="flex items-center justify-between py-3"
                style={{
                  borderBottom:
                    i < arr.length - 1
                      ? "1px solid var(--border-light)"
                      : "none",
                }}
              >
                <div>
                  <p className="text-sm font-medium">{item.company}</p>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                    {item.role}
                  </p>
                </div>

                <div className="text-right">
                  <span
                    className="text-xs font-medium rounded-full"
                    style={{
                      backgroundColor: "var(--bg-green)",
                      color: "var(--accent)",
                    }}
                  >
                    {item.status}
                  </span>
                  <p
                    className="text-xs mt-1"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {item.date}
                  </p>
                </div>

                

              </div>
            ))}
          </div>

          {/* Bottom stats */}
          <div className="grid grid-cols-2 gap-3">
            <div
              className="rounded-xl p-4"
              style={{ backgroundColor: "var(--bg-card-alt)" }}
            >
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                Response rate
              </p>
              <p
                className="text-xl font-bold mt-1"
                style={{ fontFamily: "var(--font-manrope)" }}
              >
                33%
              </p>
            </div>
            <div
              className="rounded-xl p-4"
              style={{ backgroundColor: "var(--bg-card-alt)" }}
            >
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                Next follow-up
              </p>
              <p
                className="text-xl font-bold mt-1"
                style={{ fontFamily: "var(--font-manrope)" }}
              >
                Tomorrow
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
