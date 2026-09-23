import type { CSSProperties } from "react";
import type { Status } from "./statusMachine";

/*
 * Shared UI primitives.
 *
 * Every value here is a token from app/globals.css, so colour and radius
 * decisions live in one place and meet AA contrast on all surfaces.
 */

/*
 * A page of stacked white cards reads as six competing objects. On a
 * single-column page the sections are one document, so they are divided
 * by rules and space instead of boxes.
 */
export const sectionClassName = "py-8";

export const sectionStyle: CSSProperties = {
  borderTop: "1px solid var(--border)",
};

export const cardStyle: CSSProperties = {
  backgroundColor: "var(--bg-card)",
  border: "1px solid var(--border-light)",
  borderRadius: "var(--radius-card)",
};

export const errorBoxStyle: CSSProperties = {
  backgroundColor: "var(--danger-bg)",
  color: "var(--danger-text)",
  border: "1px solid var(--danger-border)",
};

/*
 * Form controls use --border-strong: a 1px hairline at 1.5:1 is invisible
 * to low-vision users, and WCAG asks for 3:1 on control boundaries.
 */
export function getInputStyles(hasError: boolean): CSSProperties {
  return {
    backgroundColor: "var(--bg-card)",
    border: `1px solid ${hasError ? "var(--danger)" : "var(--border-strong)"}`,
    color: "var(--text-primary)",
    borderRadius: "var(--radius-control)",
  };
}

/*
 * Buttons are classes, not inline styles, so hover, focus, active and
 * disabled states are defined once in globals.css instead of per screen.
 */
export const primaryButtonClass = "btn btn-sm btn-primary";
export const secondaryButtonClass = "btn btn-sm btn-secondary";
export const quietButtonClass = "btn btn-sm btn-quiet";

export const inputClassName =
  "w-full px-3.5 py-2.5 text-sm outline-none transition-colors";

export const labelClassName = "mb-1.5 block text-xs font-medium";

// Icon-only buttons: 40px minimum so they are comfortable on touch screens
export const iconButtonClassName =
  "inline-flex h-10 w-10 items-center justify-center rounded-full transition-colors";

// Reads the message out of an error thrown by lib/api.ts
export function errorMessage(err: unknown, fallback: string) {
  const error = err as {
    message?: string;
    details?: { field: string; message: string }[];
  };
  return error.details?.[0]?.message || error.message || fallback;
}

/*
 * Stage badges. Colour carries meaning here, so it cannot be green for
 * everything: green marks a good outcome, neutral marks a closed one,
 * and everything still in play reads as plain. The stage name is always
 * written out, so colour is never the only signal.
 */
export function statusBadgeStyle(status: Status): CSSProperties {
  if (status === "offer" || status === "accepted") {
    return { backgroundColor: "var(--bg-green)", color: "var(--accent)" };
  }
  if (status === "rejected" || status === "withdrawn") {
    return {
      backgroundColor: "var(--bg-warm)",
      color: "var(--text-secondary)",
    };
  }
  return {
    backgroundColor: "var(--bg-card-alt)",
    color: "var(--text-secondary)",
    border: "1px solid var(--border-light)",
  };
}
