"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/contexts/AuthContext";

// Keeping frontend validation aligned with the backend rules.

const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
  password: z
    .string()
    .min(1, "Password is required")
    .min(8, "Password must be at least 8 characters"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

type PreviewRowProps = {
  label: string;
  value: string;
};

function PreviewRow({ label, value }: PreviewRowProps) {
  return (
    <div className="flex items-center justify-between rounded-xl px-3 py-2">
      <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
        {label}
      </span>
      <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
        {value}
      </span>
    </div>
  );
}

function getInputStyles(hasError: boolean) {
  return {
    backgroundColor: "var(--bg-card)",
    color: "var(--text-primary)",
    border: `1px solid ${hasError ? "#FCA5A5" : "var(--border)"}`,
    boxShadow: hasError ? "0 0 0 4px rgba(252, 165, 165, 0.18)" : "none",
  };
}

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [serverError, setServerError] = useState("");

  const {
    register,
    handleSubmit,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    mode: "onBlur",
    reValidateMode: "onChange",
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Clears only the server error when the user edits the form again.
  // Field-level errors are still handled by React Hook Form and Zod.
  const emailField = register("email", {
    onChange: () => setServerError(""),
  });

  const passwordField = register("password", {
    onChange: () => setServerError(""),
  });

  async function onSubmit(values: LoginFormValues) {
    setServerError("");
    clearErrors();

    try {
      const normalizedEmail = values.email.trim().toLowerCase();

      await login(normalizedEmail, values.password);
      router.push("/dashboard");
    } catch (err: unknown) {
      const error = err as { message?: string };
      setServerError(error.message || "Invalid email or password");
    }
  }

  return (
    <main
      className="min-h-screen lg:grid lg:grid-cols-2"
      style={{ backgroundColor: "var(--bg-page)" }}
    >
      {/* Left panel */}
      <section
        className="relative hidden overflow-hidden lg:flex"
        style={{ backgroundColor: "var(--bg-warm)" }}
      >
        {/* Soft background glow so the left side does not feel flat */}
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="absolute left-[-8rem] top-[-6rem] h-72 w-72 rounded-full blur-3xl"
            style={{ backgroundColor: "rgba(255, 255, 255, 0.22)" }}
          />
          <div
            className="absolute bottom-[-5rem] right-[-4rem] h-64 w-64 rounded-full blur-3xl"
            style={{ backgroundColor: "rgba(255, 255, 255, 0.16)" }}
          />
        </div>

        <div className="relative z-10 flex w-full flex-col p-12 xl:p-16">
          {/* Top logo */}
          <div>
            <Link
              href="/"
              className="w-fit text-xl font-bold tracking-tight"
              style={{
                fontFamily: "var(--font-manrope)",
                color: "var(--text-primary)",
              }}
            >
              JobTracker
            </Link>
          </div>

          {/* Centered hero content */}
          <div className="flex flex-1 items-center justify-center">
            <div className="w-full max-w-lg">
              <div className="max-w-md">
                

                <h1
                  className="mt-5 text-4xl font-bold tracking-tight xl:text-5xl text-center"
                  style={{
                    fontFamily: "var(--font-manrope)",
                    color: "var(--text-primary)",
                    lineHeight: "1.08",
                  }}
                >
                     Your job search, 
                  <br />
                  finally in one place.
                </h1>

               
              </div>

              {/* Product preview card */}
              <div
                className="mt-10 max-w-md rounded-[24px] border p-5 backdrop-blur-sm"
                style={{
                  backgroundColor: "rgba(255, 255, 255, 0.62)",
                  borderColor: "rgba(15, 23, 42, 0.08)",
                  boxShadow: "0 10px 30px rgba(15, 23, 42, 0.06)",
                }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p
                      className="text-sm font-semibold"
                      style={{ color: "var(--text-primary)" }}
                    >
                      A simple view of your dashboard
                    </p>
                    <p
                      className="mt-1 text-xs"
                      style={{ color: "var(--text-muted)" }}
                    >
                      Keep your search organized at a glance
                    </p>
                  </div>

                  <span
                    className="rounded-full px-3 py-1 text-xs font-medium"
                    style={{
                      backgroundColor: "rgba(16, 185, 129, 0.10)",
                      color: "#065F46",
                    }}
                  >
                    On track
                  </span>
                </div>

                <div className="mt-5 space-y-2">
                  <PreviewRow label="Wishlist" value="12" />
                  <PreviewRow label="Applied" value="8" />
                  <PreviewRow label="Interview" value="2" />
                </div>
              </div>
            </div>
          </div>

          {/* Bottom footer */}
          <div>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              © 2026 JobTracker
            </p>
          </div>
        </div>
      </section>

      {/* Right panel */}
      <section className="flex min-h-screen items-center justify-center px-6 py-10 sm:px-8">
        <div className="w-full max-w-sm">
          
          {/* Mobile logo */}
          <Link
            href="/"
            className="mb-12 block text-xl font-bold tracking-tight lg:hidden"
            style={{
              fontFamily: "var(--font-manrope)",
              color: "var(--text-primary)",
            }}
          >
            JobTracker
          </Link>

          <div>
            <h2
              className="text-3xl font-bold tracking-tight"
              style={{
                fontFamily: "var(--font-manrope)",
                color: "var(--text-primary)",
              }}
            >
              Welcome back
            </h2>
            <p className="mt-2 text-sm" style={{ color: "var(--text-secondary)" }}>
              Sign in to continue managing your applications
            </p>
          </div>

          {serverError && (
            <div
              role="alert"
              aria-live="polite"
              className="mt-6 rounded-xl px-4 py-3 text-sm"
              style={{
                backgroundColor: "#FEF2F2",
                color: "#991B1B",
                border: "1px solid #FECACA",
              }}
            >
              {serverError}
            </div>
          )}

          <form
            noValidate
            onSubmit={handleSubmit(onSubmit)}
            className="mt-8 space-y-5"
          >
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-xs font-medium"
                style={{ color: "var(--text-secondary)" }}
              >
                Email
              </label>

              <input
                id="email"
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                aria-invalid={Boolean(errors.email)}
                aria-describedby={errors.email ? "email-error" : undefined}
                className="w-full rounded-xl px-4 py-3 text-sm outline-none transition"
                style={getInputStyles(Boolean(errors.email))}
                {...emailField}
              />

              {errors.email && (
                <p
                  id="email-error"
                  className="mt-2 text-xs"
                  style={{ color: "#B91C1C" }}
                >
                  {errors.email.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-xs font-medium"
                style={{ color: "var(--text-secondary)" }}
              >
                Password
              </label>

              <input
                id="password"
                type="password"
                placeholder="Minimum 8 characters"
                autoComplete="current-password"
                aria-invalid={Boolean(errors.password)}
                aria-describedby={errors.password ? "password-error" : undefined}
                className="w-full rounded-xl px-4 py-3 text-sm outline-none transition"
                style={getInputStyles(Boolean(errors.password))}
                {...passwordField}
              />

              {errors.password && (
                <p
                  id="password-error"
                  className="mt-2 text-xs"
                  style={{ color: "#B91C1C" }}
                >
                  {errors.password.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-xl py-3 text-sm font-medium transition"
              style={{
                backgroundColor: isSubmitting ? "var(--border)" : "var(--accent)",
                color: isSubmitting ? "var(--text-muted)" : "#FFFFFF",
                cursor: isSubmitting ? "wait" : "pointer",
              }}
            >
              {isSubmitting ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <p
            className="mt-8 text-center text-sm"
            style={{ color: "var(--text-muted)" }}
          >
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              className="font-medium"
              style={{ color: "var(--accent)" }}
            >
              Create one
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}

