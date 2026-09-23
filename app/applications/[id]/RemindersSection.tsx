"use client";

import { useCallback, useEffect, useState } from "react";
import { Bell, Check, Trash2 } from "lucide-react";
import { api } from "@/lib/api";
import type { Reminder } from "@/lib/types";
import {
  cardStyle,
  errorBoxStyle,
  errorMessage,
  getInputStyles,
  inputClassName,
  labelClassName,
  primaryButtonStyle,
  secondaryButtonStyle,
} from "@/lib/ui";

// Quick picks land at 9am local time on the chosen day
function daysFromNowAt9(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(9, 0, 0, 0);
  return date;
}

const QUICK_PICKS = [
  { label: "Tomorrow", days: 1 },
  { label: "In 3 days", days: 3 },
  { label: "In 1 week", days: 7 },
];

// <input type="datetime-local"> wants local time without a timezone
function toLocalInputValue(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function formatReminderDate(value: string) {
  return new Date(value).toLocaleString("en", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function RemindersSection({
  applicationId,
}: {
  applicationId: string;
}) {
  const base = `/api/v1/applications/${applicationId}/reminders`;
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [remindAt, setRemindAt] = useState(() =>
    toLocalInputValue(daysFromNowAt9(3)),
  );
  const [note, setNote] = useState("Follow up on my application");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await api.get<{ data: Reminder[] }>(base);
      setReminders(res.data);
    } catch {
      setError("Could not load reminders.");
    } finally {
      setLoading(false);
    }
  }, [base]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    setError("");

    const date = new Date(remindAt);
    if (Number.isNaN(date.getTime())) {
      setError("Pick a date and time for the reminder.");
      return;
    }

    setSaving(true);
    try {
      // toISOString() sends UTC, so the server stores the exact moment
      await api.post(base, {
        remind_at: date.toISOString(),
        note: note.trim() || null,
      });
      setShowForm(false);
      await load();
    } catch (err) {
      setError(errorMessage(err, "Could not save reminder"));
    } finally {
      setSaving(false);
    }
  }

  async function toggleDone(reminder: Reminder) {
    setError("");
    try {
      await api.patch(`/api/v1/reminders/${reminder.id}`, {
        completed: reminder.completed_at === null,
      });
      await load();
    } catch (err) {
      setError(errorMessage(err, "Could not update reminder"));
    }
  }

  async function handleDelete(reminder: Reminder) {
    setError("");
    try {
      await api.delete(`/api/v1/reminders/${reminder.id}`);
      setReminders((current) => current.filter((r) => r.id !== reminder.id));
    } catch (err) {
      setError(errorMessage(err, "Could not delete reminder"));
    }
  }

  const now = Date.now();

  return (
    <section className="mb-6 rounded-xl p-6" style={cardStyle}>
      <div className="mb-4 flex items-center justify-between">
        <h2
          className="text-sm font-semibold"
          style={{ color: "var(--text-primary)" }}
        >
          Reminders
        </h2>
        {!showForm && (
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="rounded-full px-4 py-1.5 text-xs font-medium"
            style={secondaryButtonStyle}
          >
            Add reminder
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

      {showForm && (
        <form
          onSubmit={(e) => void handleCreate(e)}
          className="mb-5 space-y-4 rounded-lg p-4"
          style={{
            backgroundColor: "var(--bg-subtle)",
            border: "1px solid var(--border-light)",
          }}
        >
          <div className="flex flex-wrap gap-2">
            {QUICK_PICKS.map((pick) => (
              <button
                key={pick.label}
                type="button"
                onClick={() =>
                  setRemindAt(toLocalInputValue(daysFromNowAt9(pick.days)))
                }
                className="rounded-full px-3 py-1 text-xs font-medium"
                style={secondaryButtonStyle}
              >
                {pick.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-[auto_1fr]">
            <div>
              <label
                htmlFor="reminder-at"
                className={labelClassName}
                style={{ color: "var(--text-secondary)" }}
              >
                When
              </label>
              <input
                id="reminder-at"
                type="datetime-local"
                value={remindAt}
                onChange={(e) => setRemindAt(e.target.value)}
                className={inputClassName}
                style={getInputStyles(false)}
              />
            </div>
            <div>
              <label
                htmlFor="reminder-note"
                className={labelClassName}
                style={{ color: "var(--text-secondary)" }}
              >
                What to do
              </label>
              <input
                id="reminder-note"
                type="text"
                maxLength={500}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className={inputClassName}
                style={getInputStyles(false)}
              />
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded-full px-5 py-2 text-xs font-medium"
              style={primaryButtonStyle}
            >
              {saving ? "Saving..." : "Save reminder"}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-full px-5 py-2 text-xs font-medium"
              style={secondaryButtonStyle}
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
      ) : reminders.length === 0 ? (
        !showForm && (
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            No reminders. Add one so you remember to follow up.
          </p>
        )
      ) : (
        <ul className="space-y-2">
          {reminders.map((reminder) => {
            const done = reminder.completed_at !== null;
            const overdue =
              !done && new Date(reminder.remind_at).getTime() < now;
            return (
              <li
                key={reminder.id}
                className="flex items-center justify-between gap-4 rounded-lg px-4 py-3"
                style={{
                  backgroundColor: "var(--bg-card-alt)",
                  opacity: done ? 0.6 : 1,
                }}
              >
                <div className="flex min-w-0 items-start gap-3">
                  <Bell
                    className="mt-0.5 h-4 w-4 shrink-0"
                    style={{ color: overdue ? "#B45309" : "var(--accent)" }}
                  />
                  <div className="min-w-0 text-sm">
                    <p
                      className={done ? "line-through" : "font-medium"}
                      style={{ color: "var(--text-primary)" }}
                    >
                      {reminder.note || "Follow up"}
                    </p>
                    <p
                      className="mt-0.5 text-xs"
                      style={{
                        color: overdue ? "#B45309" : "var(--text-muted)",
                      }}
                    >
                      {overdue && "Overdue · "}
                      {formatReminderDate(reminder.remind_at)}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 gap-1">
                  <button
                    type="button"
                    onClick={() => void toggleDone(reminder)}
                    aria-label={done ? "Mark as not done" : "Mark as done"}
                    title={done ? "Mark as not done" : "Mark as done"}
                    className="rounded-full p-2 transition hover:bg-white"
                    style={{
                      color: done ? "var(--text-muted)" : "var(--accent)",
                    }}
                  >
                    <Check className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleDelete(reminder)}
                    aria-label="Delete reminder"
                    className="rounded-full p-2 text-red-700 transition hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
