"use client";

import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, Pencil, Phone, Trash2, UserRound } from "lucide-react";
import { api } from "@/lib/api";
import type { Contact } from "@/lib/types";
import {
  sectionClassName,
  sectionStyle,
  errorBoxStyle,
  errorMessage,
  getInputStyles,
  inputClassName,
  labelClassName,
  primaryButtonClass,
  secondaryButtonClass,
} from "@/lib/ui";

function emptyToNull(value: unknown) {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

const contactSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(255),
  title: z.preprocess(emptyToNull, z.string().max(255).nullable()),
  email: z.preprocess(emptyToNull, z.email("Enter a valid email").nullable()),
  phone: z.preprocess(emptyToNull, z.string().max(50).nullable()),
  linkedin_url: z.preprocess(
    emptyToNull,
    z.url({ protocol: /^https?$/, message: "Enter a valid URL" }).nullable(),
  ),
  notes: z.preprocess(emptyToNull, z.string().nullable()),
});

type ContactFormInput = z.input<typeof contactSchema>;
type ContactFormValues = z.output<typeof contactSchema>;

const EMPTY_FORM: ContactFormInput = {
  name: "",
  title: "",
  email: "",
  phone: "",
  linkedin_url: "",
  notes: "",
};

export default function ContactsSection({
  applicationId,
}: {
  applicationId: string;
}) {
  const base = `/api/v1/applications/${applicationId}/contacts`;
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  // null = form closed, "new" = adding, otherwise the id being edited
  const [editing, setEditing] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactFormInput, unknown, ContactFormValues>({
    resolver: zodResolver(contactSchema),
    mode: "onBlur",
    defaultValues: EMPTY_FORM,
  });

  const load = useCallback(async () => {
    try {
      const res = await api.get<{ data: Contact[] }>(base);
      setContacts(res.data);
    } catch {
      setError("Could not load contacts.");
    } finally {
      setLoading(false);
    }
  }, [base]);

  useEffect(() => {
    void load();
  }, [load]);

  function openForm(contact?: Contact) {
    setError("");
    reset(
      contact
        ? {
            name: contact.name,
            title: contact.title ?? "",
            email: contact.email ?? "",
            phone: contact.phone ?? "",
            linkedin_url: contact.linkedin_url ?? "",
            notes: contact.notes ?? "",
          }
        : EMPTY_FORM,
    );
    setEditing(contact ? contact.id : "new");
  }

  async function onSubmit(values: ContactFormValues) {
    setError("");
    try {
      if (editing === "new") {
        await api.post(base, values);
      } else {
        await api.patch(`${base}/${editing}`, values);
      }
      setEditing(null);
      await load();
    } catch (err) {
      setError(errorMessage(err, "Could not save contact"));
    }
  }

  async function handleDelete(contact: Contact) {
    if (!window.confirm(`Remove ${contact.name} from contacts?`)) return;
    setError("");
    try {
      await api.delete(`${base}/${contact.id}`);
      setContacts((current) => current.filter((c) => c.id !== contact.id));
    } catch (err) {
      setError(errorMessage(err, "Could not remove contact"));
    }
  }

  const field = (
    name: keyof ContactFormInput,
    label: string,
    props: React.InputHTMLAttributes<HTMLInputElement> = {},
  ) => {
    const fieldError = errors[name];
    return (
      <div>
        <label
          htmlFor={`contact-${name}`}
          className={labelClassName}
          style={{ color: "var(--text-secondary)" }}
        >
          {label}
        </label>
        <input
          id={`contact-${name}`}
          aria-invalid={Boolean(fieldError)}
          className={inputClassName}
          style={getInputStyles(Boolean(fieldError))}
          {...props}
          {...register(name)}
        />
        {fieldError && (
          <p className="mt-2 text-xs" style={{ color: "var(--danger)" }}>
            {fieldError.message}
          </p>
        )}
      </div>
    );
  };

  return (
    <section className={sectionClassName} style={sectionStyle}>
      <div className="mb-4 flex items-center justify-between">
        <h2
          className="text-base font-semibold tracking-tight"
          style={{ color: "var(--text-primary)" }}
        >
          Contacts
        </h2>
        {editing === null && (
          <button
            type="button"
            onClick={() => openForm()}
            className={secondaryButtonClass}
          >
            Add contact
          </button>
        )}
      </div>

      {error && (
        <div
          role="alert"
          className="mb-4 rounded-lg px-4 py-3 text-sm"
          style={errorBoxStyle}
        >
          {error}
        </div>
      )}

      {editing !== null && (
        <form
          noValidate
          onSubmit={handleSubmit(onSubmit)}
          className="mb-6 space-y-4 pb-6"
          style={{ borderBottom: "1px solid var(--border-light)" }}
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {field("name", "Name", { type: "text", placeholder: "Jane Smith" })}
            {field("title", "Title", {
              type: "text",
              placeholder: "Technical Recruiter",
            })}
            {field("email", "Email", {
              type: "email",
              placeholder: "jane@company.com",
            })}
            {field("phone", "Phone", {
              type: "tel",
              placeholder: "204-555-0100",
            })}
          </div>
          {field("linkedin_url", "LinkedIn", {
            type: "url",
            placeholder: "https://linkedin.com/in/...",
          })}
          <div>
            <label
              htmlFor="contact-notes"
              className={labelClassName}
              style={{ color: "var(--text-secondary)" }}
            >
              Notes
            </label>
            <textarea
              id="contact-notes"
              rows={2}
              className={inputClassName}
              style={getInputStyles(false)}
              {...register("notes")}
            />
          </div>
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={isSubmitting}
              className={primaryButtonClass}
            >
              {isSubmitting
                ? "Saving..."
                : editing === "new"
                  ? "Add contact"
                  : "Save contact"}
            </button>
            <button
              type="button"
              onClick={() => setEditing(null)}
              className={secondaryButtonClass}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          Loading...
        </p>
      ) : contacts.length === 0 ? (
        editing === null && (
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            No contacts yet. Add the recruiter or hiring manager so their
            details are in one place.
          </p>
        )
      ) : (
        <ul className="space-y-3">
          {contacts.map((contact) => (
            <li
              key={contact.id}
              className="flex items-start justify-between gap-4 rounded-lg p-4"
              style={{ backgroundColor: "var(--bg-card-alt)" }}
            >
              <div className="flex min-w-0 gap-3">
                <UserRound
                  className="mt-0.5 h-4 w-4 shrink-0"
                  style={{ color: "var(--accent)" }}
                />
                <div className="min-w-0 text-sm">
                  <p
                    className="font-medium"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {contact.name}
                    {contact.title && (
                      <span
                        className="font-normal"
                        style={{ color: "var(--text-muted)" }}
                      >
                        {" "}
                        · {contact.title}
                      </span>
                    )}
                  </p>
                  <div
                    className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {contact.email && (
                      <a
                        href={`mailto:${contact.email}`}
                        className="inline-flex items-center gap-1 underline"
                      >
                        <Mail className="h-3 w-3" />
                        {contact.email}
                      </a>
                    )}
                    {contact.phone && (
                      <a
                        href={`tel:${contact.phone}`}
                        className="inline-flex items-center gap-1 underline"
                      >
                        <Phone className="h-3 w-3" />
                        {contact.phone}
                      </a>
                    )}
                    {contact.linkedin_url && (
                      <a
                        href={contact.linkedin_url}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="underline"
                      >
                        LinkedIn
                      </a>
                    )}
                  </div>
                  {contact.notes && (
                    <p
                      className="mt-2 text-xs"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {contact.notes}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex shrink-0 gap-1">
                <button
                  type="button"
                  onClick={() => openForm(contact)}
                  aria-label={`Edit ${contact.name}`}
                  className="btn btn-quiet inline-flex h-10 w-10 items-center justify-center"
                  style={{ color: "var(--text-secondary)" }}
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => void handleDelete(contact)}
                  aria-label={`Remove ${contact.name}`}
                  className="btn btn-danger-quiet inline-flex h-10 w-10 items-center justify-center"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
