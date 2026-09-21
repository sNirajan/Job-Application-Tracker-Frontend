import type { CSSProperties } from "react";

/*
 * Small shared style helpers so new sections match the existing pages.
 * Colours come from the CSS variables in app/globals.css.
 */

export const cardStyle: CSSProperties = {
  backgroundColor: "var(--bg-card)",
  border: "1px solid var(--border-light)",
};

export const errorBoxStyle: CSSProperties = {
  backgroundColor: "#FEF2F2",
  color: "#991B1B",
  border: "1px solid #FECACA",
};

export function getInputStyles(hasError: boolean): CSSProperties {
  return {
    backgroundColor: "var(--bg-card-alt)",
    border: `1px solid ${hasError ? "#FCA5A5" : "var(--border)"}`,
    color: "var(--text-primary)",
    boxShadow: hasError ? "0 0 0 4px rgba(252, 165, 165, 0.16)" : "none",
  };
}

export const primaryButtonStyle: CSSProperties = {
  backgroundColor: "var(--accent)",
  color: "#FFFFFF",
};

export const secondaryButtonStyle: CSSProperties = {
  backgroundColor: "var(--bg-card-alt)",
  color: "var(--text-secondary)",
  border: "1px solid var(--border-light)",
};

export const inputClassName =
  "w-full rounded-lg px-4 py-3 text-sm outline-none transition";

export const labelClassName = "mb-2 block text-xs font-medium";

// Reads the message out of an error thrown by lib/api.ts
export function errorMessage(err: unknown, fallback: string) {
  const error = err as {
    message?: string;
    details?: { field: string; message: string }[];
  };
  return error.details?.[0]?.message || error.message || fallback;
}
