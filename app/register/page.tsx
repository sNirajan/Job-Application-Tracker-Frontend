"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/contexts/AuthContext";



const registerSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Please enter your full name")
      .max(80, "Name is too long"),
    email: z
      .string()
      .trim()
      .min(1, "Email is required")
      .email("Please enter a valid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters"),
    confirmPassword: z
      .string()
      .min(1, "Please confirm your password"),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

function getInputStyles(hasError: boolean) {
  return {
    backgroundColor: "var(--bg-card)",
    color: "var(--text-primary)",
    border: `1px solid ${hasError ? "#FCA5A5" : "var(--border)"}`,
    boxShadow: hasError ? "0 0 0 4px rgba(252, 165, 165, 0.16)" : "none",
  };
}

function FeatureRow({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl px-4 py-3">
      <p
        className="text-sm font-semibold"
        style={{ color: "var(--text-primary)" }}
      >
        {title}
      </p>
      <p
        className="mt-1 text-xs leading-6"
        style={{ color: "var(--text-secondary)" }}
      >
        {description}
      </p>
    </div>
  );
}

export default function RegisterPage() {
  const { register: registerUser } = useAuth();
  const router = useRouter();
  const [serverError, setServerError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    mode: "onBlur",
    reValidateMode: "onChange",
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  // Clears only the server-side message when the user starts typing again.
  // Field validation is already handled by React Hook Form + Zod.
  const nameField = register("name", {
    onChange: () => setServerError(""),
  });

  const emailField = register("email", {
    onChange: () => setServerError(""),
  });

  const passwordField = register("password", {
    onChange: () => setServerError(""),
  });

  const confirmPasswordField = register("confirmPassword", {
    onChange: () => setServerError(""),
  });

  async function onSubmit(values: RegisterFormValues) {
    setServerError("");

    try {
      const normalizedName = values.name.replace(/\s+/g, " ").trim();
      const normalizedEmail = values.email.trim().toLowerCase();

      await registerUser(normalizedEmail, values.password, normalizedName);
      router.push("/login");
    } catch (err: unknown) {
      const error = err as { message?: string };
      setServerError(error.message || "Registration failed");
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
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="absolute left-[-9rem] top-[-7rem] h-80 w-80 rounded-full blur-3xl"
            style={{ backgroundColor: "rgba(255, 255, 255, 0.22)" }}
          />
          <div
            className="absolute bottom-[-5rem] right-[-4rem] h-64 w-64 rounded-full blur-3xl"
            style={{ backgroundColor: "rgba(255, 255, 255, 0.14)" }}
          />
        </div>

        <div className="relative z-10 flex w-full flex-col p-12 xl:p-16">
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
                  Start tracking
                  <br />
                  your applications.
                </h1>

              </div>

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
                      Built for a focused job search
                    </p>
                    <p
                      className="mt-1 text-xs"
                      style={{ color: "var(--text-muted)" }}
                    >
                      Clean, simple, and easy to keep updated
                    </p>
                  </div>

                  <span
                    className="rounded-full px-3 py-1 text-xs font-medium"
                    style={{
                      backgroundColor: "rgba(16, 185, 129, 0.10)",
                      color: "#065F46",
                    }}
                  >
                    Free
                  </span>
                </div>

                <div className="mt-5 space-y-2">
                  <FeatureRow
                    title="Track every role"
                    description="Save companies, positions, and key details in one place."
                  />
                  <FeatureRow
                    title="Move through stages"
                    description="Keep your pipeline updated from wishlist to offer."
                  />
                  <FeatureRow
                    title="Stay on top of notes"
                    description="Capture interviews, follow-ups, and reminders as you go."
                  />
                </div>
              </div>
            </div>
          </div>

          <div>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              © 2026 JobTracker
            </p>
          </div>
        </div>
      </section>

      {/* Right panel */}
      <section
        className="flex min-h-screen items-center justify-center px-6 py-10 sm:px-8"
        style={{ backgroundColor: "var(--bg-page)" }}
      >
        <div className="w-full max-w-md">
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

          <div
            className="rounded-[28px] border px-6 py-7 shadow-sm sm:px-8 sm:py-8"
            style={{
              backgroundColor: "rgba(255, 255, 255, 0.55)",
              borderColor: "rgba(15, 23, 42, 0.08)",
              boxShadow: "0 12px 32px rgba(15, 23, 42, 0.05)",
            }}
          >
            <div>

              <h2
                className="mt-3 text-3xl font-bold tracking-tight"
                style={{
                  fontFamily: "var(--font-manrope)",
                  color: "var(--text-primary)",
                }}
              >
                Create your account
              </h2>

              <p
                className="mt-2 text-sm leading-6"
                style={{ color: "var(--text-secondary)" }}
              >
                Start organizing your job search today
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
                  htmlFor="name"
                  className="mb-2 block text-xs font-medium"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Full name
                </label>

                <input
                  id="name"
                  type="text"
                  placeholder="Jane Smith"
                  autoComplete="name"
                  aria-invalid={Boolean(errors.name)}
                  aria-describedby={errors.name ? "name-error" : undefined}
                  className="w-full rounded-xl px-4 py-3 text-sm outline-none transition"
                  style={getInputStyles(Boolean(errors.name))}
                  {...nameField}
                />

                {errors.name && (
                  <p
                    id="name-error"
                    className="mt-2 text-xs"
                    style={{ color: "#B91C1C" }}
                  >
                    {errors.name.message}
                  </p>
                )}
              </div>

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
                  autoComplete="new-password"
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

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="mb-2 block text-xs font-medium"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Confirm password
                </label>

                <input
                  id="confirmPassword"
                  type="password"
                  placeholder="Re-enter your password"
                  autoComplete="new-password"
                  aria-invalid={Boolean(errors.confirmPassword)}
                  aria-describedby={
                    errors.confirmPassword ? "confirm-password-error" : undefined
                  }
                  className="w-full rounded-xl px-4 py-3 text-sm outline-none transition"
                  style={getInputStyles(Boolean(errors.confirmPassword))}
                  {...confirmPasswordField}
                />

                {errors.confirmPassword && (
                  <p
                    id="confirm-password-error"
                    className="mt-2 text-xs"
                    style={{ color: "#B91C1C" }}
                  >
                    {errors.confirmPassword.message}
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
                {isSubmitting ? "Creating account..." : "Create account"}
              </button>
            </form>

            <p
              className="mt-7 text-center text-sm"
              style={{ color: "var(--text-muted)" }}
            >
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-medium"
                style={{ color: "var(--accent)" }}
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
