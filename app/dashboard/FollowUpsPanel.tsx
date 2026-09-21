"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Bell, Check, Clock } from "lucide-react";
import { api } from "@/lib/api";
import { STATUS_LABELS } from "@/lib/statusMachine";
import type { FollowUpSuggestion, ReminderWithApplication } from "@/lib/types";
import { errorMessage } from "@/lib/ui";

const FOLLOW_UP_AFTER_DAYS = 7;

function formatWhen(value: string) {
  return new Date(value).toLocaleString("en", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function threeDaysFromNowAt9() {
  const date = new Date();
  date.setDate(date.getDate() + 3);
  date.setHours(9, 0, 0, 0);
  return date.toISOString();
}

/*
 * "What needs my attention?"
 *
 * - Reminders the user set (overdue first, then the next 7 days)
 * - Applications with no update for a week that could use a nudge
 *
 * Hidden entirely when there's nothing to do, so the dashboard stays calm.
 */
export default function FollowUpsPanel() {
  const [reminders, setReminders] = useState<ReminderWithApplication[]>([]);
  const [suggestions, setSuggestions] = useState<FollowUpSuggestion[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [reminderRes, followUpRes] = await Promise.all([
        api.get<{ data: ReminderWithApplication[] }>("/api/v1/reminders"),
        api.get<{ data: FollowUpSuggestion[] }>(
          `/api/v1/reminders/follow-ups?days=${FOLLOW_UP_AFTER_DAYS}`,
        ),
      ]);
      const weekAhead = Date.now() + 7 * 24 * 60 * 60 * 1000;
      setReminders(
        reminderRes.data.filter(
          (r) => new Date(r.remind_at).getTime() <= weekAhead,
        ),
      );
      setSuggestions(followUpRes.data);
    } catch {
      // The rest of the dashboard still works without this panel
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function markDone(reminder: ReminderWithApplication) {
    setBusyId(reminder.id);
    setError("");
    try {
      await api.patch(`/api/v1/reminders/${reminder.id}`, { completed: true });
      setReminders((current) => current.filter((r) => r.id !== reminder.id));
    } catch (err) {
      setError(errorMessage(err, "Could not update reminder"));
    } finally {
      setBusyId(null);
    }
  }

  async function remindLater(suggestion: FollowUpSuggestion) {
    setBusyId(suggestion.id);
    setError("");
    try {
      await api.post(`/api/v1/applications/${suggestion.id}/reminders`, {
        remind_at: threeDaysFromNowAt9(),
        note: "Send a follow-up email",
      });
      await load();
    } catch (err) {
      setError(errorMessage(err, "Could not create reminder"));
    } finally {
      setBusyId(null);
    }
  }

  if (!loaded || (reminders.length === 0 && suggestions.length === 0)) {
    return null;
  }

  const now = Date.now();

  return (
    <section
      className="mb-8 rounded-2xl border p-6 lg:p-7"
      style={{
        backgroundColor: "var(--bg-card)",
        borderColor: "var(--border-light)",
      }}
    >
      <h2
        className="text-base font-semibold"
        style={{ color: "var(--text-primary)" }}
      >
        Needs your attention
      </h2>
      <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
        Reminders due this week and applications that have gone quiet.
      </p>

      {error && (
        <p role="alert" className="mt-3 text-sm" style={{ color: "#991B1B" }}>
          {error}
        </p>
      )}

      <ul className="mt-5 space-y-2">
        {reminders.map((reminder) => {
          const overdue = new Date(reminder.remind_at).getTime() < now;
          return (
            <li
              key={`r-${reminder.id}`}
              className="flex items-center justify-between gap-4 rounded-xl px-4 py-3"
              style={{
                backgroundColor: overdue ? "#FFFBEB" : "var(--bg-card-alt)",
              }}
            >
              <div className="flex min-w-0 items-start gap-3">
                <Bell
                  className="mt-0.5 h-4 w-4 shrink-0"
                  style={{ color: overdue ? "#B45309" : "var(--accent)" }}
                />
                <div className="min-w-0 text-sm">
                  <Link
                    href={`/applications/${reminder.application_id}`}
                    className="font-medium hover:underline"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {reminder.note || "Follow up"} · {reminder.company}
                  </Link>
                  <p
                    className="text-xs"
                    style={{ color: overdue ? "#B45309" : "var(--text-muted)" }}
                  >
                    {overdue ? "Overdue · " : ""}
                    {formatWhen(reminder.remind_at)}
                  </p>
                </div>
              </div>
              <button
                type="button"
                disabled={busyId === reminder.id}
                onClick={() => void markDone(reminder)}
                className="inline-flex shrink-0 items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium"
                style={{
                  backgroundColor: "var(--bg-green)",
                  color: "var(--accent)",
                }}
              >
                <Check className="h-3 w-3" />
                Done
              </button>
            </li>
          );
        })}

        {suggestions.map((suggestion) => (
          <li
            key={`s-${suggestion.id}`}
            className="flex items-center justify-between gap-4 rounded-xl px-4 py-3"
            style={{ backgroundColor: "var(--bg-card-alt)" }}
          >
            <div className="flex min-w-0 items-start gap-3">
              <Clock
                className="mt-0.5 h-4 w-4 shrink-0"
                style={{ color: "var(--text-muted)" }}
              />
              <div className="min-w-0 text-sm">
                <Link
                  href={`/applications/${suggestion.id}`}
                  className="font-medium hover:underline"
                  style={{ color: "var(--text-primary)" }}
                >
                  {suggestion.company} · {suggestion.role}
                </Link>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  {STATUS_LABELS[suggestion.status]} · no update in{" "}
                  {suggestion.days_idle} days
                </p>
              </div>
            </div>
            <button
              type="button"
              disabled={busyId === suggestion.id}
              onClick={() => void remindLater(suggestion)}
              className="shrink-0 rounded-full px-3 py-1.5 text-xs font-medium"
              style={{
                backgroundColor: "var(--bg-card)",
                color: "var(--text-secondary)",
                border: "1px solid var(--border-light)",
              }}
            >
              Remind me in 3 days
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
