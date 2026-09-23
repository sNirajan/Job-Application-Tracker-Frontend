"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { api } from "@/lib/api";
import {
  errorBoxStyle,
  errorMessage,
  getInputStyles,
  inputClassName,
  labelClassName,
  primaryButtonClass,
  secondaryButtonClass,
} from "@/lib/ui";

export interface EditableApplication {
  id: string;
  company: string;
  role: string;
  url: string | null;
  location: string | null;
  salary_min: number | null;
  salary_max: number | null;
  notes: string | null;
  applied_at: string | null;
}

// Empty inputs mean "clear this field", which the API takes as null.
function emptyToNull(value: unknown) {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

const optionalSalary = z.preprocess(
  (value) => {
    const cleaned = emptyToNull(value);
    return cleaned === null
      ? null
      : Number(String(cleaned).replace(/[,$\s]/g, ""));
  },
  z
    .number({ message: "Enter a number" })
    .int("Use whole dollars")
    .positive("Must be more than 0")
    .max(1_000_000_000, "Salary looks too high")
    .nullable(),
);

const editSchema = z
  .object({
    company: z.string().trim().min(1, "Company name is required").max(255),
    role: z.string().trim().min(1, "Role is required").max(255),
    url: z.preprocess(
      emptyToNull,
      z
        .url({ protocol: /^https?$/, message: "Please enter a valid URL" })
        .nullable(),
    ),
    location: z.preprocess(emptyToNull, z.string().max(255).nullable()),
    salary_min: optionalSalary,
    salary_max: optionalSalary,
    applied_at: z.preprocess(emptyToNull, z.string().nullable()),
    notes: z.preprocess(emptyToNull, z.string().nullable()),
  })
  .refine(
    (data) =>
      data.salary_min === null ||
      data.salary_max === null ||
      data.salary_min <= data.salary_max,
    { message: "Maximum must be at least the minimum", path: ["salary_max"] },
  );

type EditFormInput = z.input<typeof editSchema>;
type EditFormValues = z.output<typeof editSchema>;

interface Props {
  application: EditableApplication;
  onSaved: () => void | Promise<void>;
  onCancel: () => void;
}

export default function EditApplicationForm({
  application,
  onSaved,
  onCancel,
}: Props) {
  const [serverError, setServerError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<EditFormInput, unknown, EditFormValues>({
    resolver: zodResolver(editSchema),
    mode: "onBlur",
    defaultValues: {
      company: application.company,
      role: application.role,
      url: application.url ?? "",
      location: application.location ?? "",
      salary_min: application.salary_min?.toString() ?? "",
      salary_max: application.salary_max?.toString() ?? "",
      // The API returns a full timestamp; the date input wants YYYY-MM-DD
      applied_at: application.applied_at?.slice(0, 10) ?? "",
      notes: application.notes ?? "",
    },
  });

  async function onSubmit(values: EditFormValues) {
    setServerError("");
    try {
      await api.patch(`/api/v1/applications/${application.id}`, values);
      await onSaved();
    } catch (err) {
      setServerError(errorMessage(err, "Could not save changes"));
    }
  }

  const field = (
    name: keyof EditFormInput,
    label: string,
    props: React.InputHTMLAttributes<HTMLInputElement> = {},
  ) => {
    const error = errors[name];
    return (
      <div>
        <label
          htmlFor={`edit-${name}`}
          className={labelClassName}
          style={{ color: "var(--text-secondary)" }}
        >
          {label}
        </label>
        <input
          id={`edit-${name}`}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `edit-${name}-error` : undefined}
          className={inputClassName}
          style={getInputStyles(Boolean(error))}
          {...props}
          {...register(name, { onChange: () => setServerError("") })}
        />
        {error && (
          <p
            id={`edit-${name}-error`}
            className="mt-2 text-xs"
            style={{ color: "var(--danger)" }}
          >
            {error.message}
          </p>
        )}
      </div>
    );
  };

  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {serverError && (
        <div
          role="alert"
          className="rounded-lg px-4 py-3 text-sm"
          style={errorBoxStyle}
        >
          {serverError}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {field("company", "Company", { type: "text" })}
        {field("role", "Role", { type: "text" })}
        {field("url", "Job URL", {
          type: "url",
          placeholder: "https://company.com/jobs/123",
        })}
        {field("location", "Location", {
          type: "text",
          placeholder: "Winnipeg, MB",
        })}
        {field("salary_min", "Salary from", {
          inputMode: "numeric",
          placeholder: "60000",
        })}
        {field("salary_max", "Salary to", {
          inputMode: "numeric",
          placeholder: "75000",
        })}
        {field("applied_at", "Date applied", { type: "date" })}
      </div>

      <div>
        <label
          htmlFor="edit-notes"
          className={labelClassName}
          style={{ color: "var(--text-secondary)" }}
        >
          Notes
        </label>
        <textarea
          id="edit-notes"
          rows={4}
          className={inputClassName}
          style={getInputStyles(false)}
          {...register("notes", { onChange: () => setServerError("") })}
        />
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className={primaryButtonClass}
        >
          {isSubmitting ? "Saving..." : "Save changes"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className={secondaryButtonClass}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
