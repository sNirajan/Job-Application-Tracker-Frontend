"use client";

import Link from "next/link";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type Announcements,
  type DragEndEvent,
  type DragStartEvent,
  type KeyboardCoordinateGetter,
} from "@dnd-kit/core";
import { api } from "@/lib/api";
import {
  STATUSES,
  STATUS_LABELS,
  canTransition,
  isTerminal,
  type Status,
} from "@/lib/statusMachine";

interface BoardApplication {
  id: string;
  company: string;
  role: string;
  status: Status;
  location: string | null;
  updated_at: string;
}

interface ApplicationsResponse {
  data: BoardApplication[];
  pagination: { total_pages: number };
}

// The API caps per_page at 100, so the board walks every page
// to show all applications at once.
async function fetchAllApplications(): Promise<BoardApplication[]> {
  const all: BoardApplication[] = [];
  let page = 1;
  let totalPages = 1;

  do {
    const res = await api.get<ApplicationsResponse>(
      `/api/v1/applications?page=${page}&per_page=100&sort=updated_at&order=desc`,
    );
    all.push(...res.data);
    totalPages = res.pagination.total_pages;
    page += 1;
  } while (page <= totalPages);

  return all;
}

// Arrow keys jump straight to the next column that accepts the card,
// instead of nudging it a few pixels at a time.
const columnKeyboardCoordinates: KeyboardCoordinateGetter = (
  event,
  { context: { droppableRects, droppableContainers, collisionRect } },
) => {
  if (event.code !== "ArrowRight" && event.code !== "ArrowLeft") return;
  if (!collisionRect) return;
  event.preventDefault();

  const centerX = collisionRect.left + collisionRect.width / 2;
  const goingRight = event.code === "ArrowRight";

  const columns = droppableContainers
    .getEnabled()
    .map((container) => droppableRects.get(container.id))
    .filter((rect): rect is NonNullable<typeof rect> => Boolean(rect))
    .filter((rect) => {
      const columnCenter = rect.left + rect.width / 2;
      return goingRight
        ? columnCenter > centerX + 1
        : columnCenter < centerX - 1;
    })
    .sort((a, b) => (goingRight ? a.left - b.left : b.left - a.left));

  const next = columns[0];
  if (!next) return;

  return {
    x: next.left + (next.width - collisionRect.width) / 2,
    y: next.top + 48,
  };
};

interface ApplicationsBoardProps {
  // Bump this number to make the board reload (e.g. after adding an application).
  refreshKey: number;
  onTotalChange?: (total: number) => void;
}

export default function ApplicationsBoard({
  refreshKey,
  onTotalChange,
}: ApplicationsBoardProps) {
  const dndId = useId();
  const [applications, setApplications] = useState<BoardApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [moveError, setMoveError] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  // A dropped card waiting for the user to confirm (and maybe add a note)
  const [pendingMove, setPendingMove] = useState<{
    app: BoardApplication;
    target: Status;
  } | null>(null);

  // When a card is dropped back where it started, the browser still fires
  // a click on its link. Remember when the last drag ended so that click
  // can be ignored instead of opening the application.
  const dragEndedAt = useRef(0);
  const wasJustDragged = useCallback(
    () => Date.now() - dragEndedAt.current < 250,
    [],
  );

  // Small movement threshold so a plain click still opens the application.
  // Touch uses a short press delay so the page can still scroll normally.
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 6 },
    }),
    // Space picks up and drops, left/right arrows change column, Escape cancels.
    // Enter is left out so it keeps opening the focused link.
    useSensor(KeyboardSensor, {
      coordinateGetter: columnKeyboardCoordinates,
      keyboardCodes: {
        start: ["Space"],
        cancel: ["Escape"],
        end: ["Space"],
      },
    }),
  );

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError("");

    try {
      const all = await fetchAllApplications();
      setApplications(all);
      onTotalChange?.(all.length);
    } catch {
      setLoadError("Could not load applications. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [onTotalChange]);

  useEffect(() => {
    void load();
  }, [load, refreshKey]);

  const activeApp = activeId
    ? (applications.find((app) => app.id === activeId) ?? null)
    : null;

  function handleDragStart(event: DragStartEvent) {
    setMoveError("");
    setActiveId(String(event.active.id));
  }

  async function handleDragEnd(event: DragEndEvent) {
    dragEndedAt.current = Date.now();
    setActiveId(null);

    const app = applications.find((a) => a.id === event.active.id);
    const target = event.over?.id as Status | undefined;

    if (!app || !target || target === app.status) return;

    if (!canTransition(app.status, target)) {
      setMoveError(
        `Can't move ${app.company} from ${STATUS_LABELS[app.status]} to ${STATUS_LABELS[target]}.`,
      );
      return;
    }

    // Show the card in its new column straight away, then ask for an
    // optional note. Nothing is saved until the user confirms.
    setApplications((current) => [
      { ...app, status: target, updated_at: new Date().toISOString() },
      ...current.filter((a) => a.id !== app.id),
    ]);
    setPendingMove({ app, target });
  }

  function cancelMove() {
    if (!pendingMove) return;
    const { app } = pendingMove;
    setApplications((current) =>
      current.map((a) => (a.id === app.id ? app : a)),
    );
    setPendingMove(null);
  }

  async function confirmMove(note: string) {
    if (!pendingMove) return;
    const { app, target } = pendingMove;
    setPendingMove(null);
    setSavingId(app.id);

    try {
      await api.patch(`/api/v1/applications/${app.id}/status`, {
        status: target,
        ...(note.trim() && { notes: note.trim() }),
      });
    } catch (err: unknown) {
      const error = err as { message?: string };
      // Put back only this card, so other moves made meanwhile are kept.
      setApplications((current) =>
        current.map((a) => (a.id === app.id ? app : a)),
      );
      setMoveError(
        error.message || `Could not move ${app.company}. Please try again.`,
      );
    } finally {
      setSavingId(null);
    }
  }

  // Screen reader messages while dragging with the keyboard.
  const announcements: Announcements = {
    onDragStart({ active }) {
      const app = applications.find((a) => a.id === active.id);
      return app
        ? `Picked up ${app.company}, currently in ${STATUS_LABELS[app.status]}.`
        : "";
    },
    onDragOver({ active, over }) {
      const app = applications.find((a) => a.id === active.id);
      if (!app || !over)
        return app ? `${app.company} is not over a column.` : "";
      return `${app.company} is over ${STATUS_LABELS[over.id as Status]}.`;
    },
    onDragEnd({ active, over }) {
      const app = applications.find((a) => a.id === active.id);
      if (!app) return "";
      return over
        ? `${app.company} dropped in ${STATUS_LABELS[over.id as Status]}.`
        : `${app.company} dropped. It stays in ${STATUS_LABELS[app.status]}.`;
    },
    onDragCancel({ active }) {
      const app = applications.find((a) => a.id === active.id);
      return app ? `Move cancelled. ${app.company} stays where it was.` : "";
    },
  };

  if (loadError) {
    return (
      <div
        className="rounded-xl p-12 text-center"
        style={{
          backgroundColor: "var(--bg-card)",
          border: "1px solid var(--border-light)",
        }}
      >
        <p className="text-sm" style={{ color: "#991B1B" }}>
          {loadError}
        </p>
        <button
          type="button"
          onClick={() => void load()}
          className="mt-3 rounded-full px-5 py-2 text-xs font-medium"
          style={{ backgroundColor: "var(--accent)", color: "#FFFFFF" }}
        >
          Try again
        </button>
      </div>
    );
  }

  if (loading && applications.length === 0) {
    return <p style={{ color: "var(--text-muted)" }}>Loading...</p>;
  }

  return (
    <div>
      <p className="mb-4 text-xs" style={{ color: "var(--text-muted)" }}>
        Drag a card to move it to its next stage. Only valid stages light up.
        Keyboard: focus a card, press Space, use the left and right arrow keys,
        then Space again to drop.
      </p>

      {moveError && (
        <div
          role="alert"
          className="mb-4 flex items-center justify-between gap-4 rounded-lg px-4 py-3 text-sm"
          style={{
            backgroundColor: "#FEF2F2",
            color: "#991B1B",
            border: "1px solid #FECACA",
          }}
        >
          <span>{moveError}</span>
          <button
            type="button"
            onClick={() => setMoveError("")}
            className="text-xs font-medium underline"
          >
            Dismiss
          </button>
        </div>
      )}

      <DndContext
        id={dndId}
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={(event) => void handleDragEnd(event)}
        onDragCancel={() => {
          dragEndedAt.current = Date.now();
          setActiveId(null);
        }}
        accessibility={{ announcements }}
      >
        <div className="-mx-8 overflow-x-auto px-8 pb-4">
          <div className="flex gap-3" style={{ minWidth: "max-content" }}>
            {STATUSES.map((status) => (
              <BoardColumn
                key={status}
                status={status}
                applications={applications.filter((a) => a.status === status)}
                activeApp={activeApp}
                savingId={savingId}
                wasJustDragged={wasJustDragged}
              />
            ))}
          </div>
        </div>

        {pendingMove && (
          <MoveDialog
            app={pendingMove.app}
            target={pendingMove.target}
            onConfirm={(note) => void confirmMove(note)}
            onCancel={cancelMove}
          />
        )}

        <DragOverlay dropAnimation={null}>
          {activeApp ? <CardBody app={activeApp} lifted /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}

interface BoardColumnProps {
  status: Status;
  applications: BoardApplication[];
  activeApp: BoardApplication | null;
  savingId: string | null;
  wasJustDragged: () => boolean;
}

function BoardColumn({
  status,
  applications,
  activeApp,
  savingId,
  wasJustDragged,
}: BoardColumnProps) {
  const isDragging = activeApp !== null;
  const isHome = activeApp?.status === status;
  const isValidTarget =
    activeApp !== null && canTransition(activeApp.status, status);

  // Disabled columns are skipped when working out where a card is hovering,
  // so a card can only ever be dropped on a stage the rules allow.
  const { setNodeRef, isOver } = useDroppable({
    id: status,
    disabled: isDragging && !isValidTarget,
  });

  let borderColor = "var(--border-light)";
  let backgroundColor = "var(--bg-card-alt)";
  if (isValidTarget) {
    borderColor = "var(--accent)";
    backgroundColor = isOver ? "var(--bg-green)" : "var(--bg-subtle)";
  }

  return (
    <section
      ref={setNodeRef}
      aria-label={`${STATUS_LABELS[status]} column`}
      className="flex w-60 shrink-0 flex-col rounded-xl p-3 transition"
      style={{
        backgroundColor,
        border: `${isValidTarget ? "2px dashed" : "1px solid"} ${borderColor}`,
        opacity: isDragging && !isValidTarget && !isHome ? 0.45 : 1,
        minHeight: "24rem",
      }}
    >
      <header className="mb-3 flex items-center justify-between px-1">
        <h2
          className="text-xs font-semibold uppercase tracking-wide"
          style={{
            color: isTerminal(status)
              ? "var(--text-muted)"
              : "var(--text-primary)",
          }}
        >
          {STATUS_LABELS[status]}
        </h2>
        <span
          className="rounded-full px-2 py-0.5 text-xs font-medium"
          style={{
            backgroundColor: "var(--bg-card)",
            color: "var(--text-secondary)",
          }}
        >
          {applications.length}
        </span>
      </header>

      <div className="flex flex-1 flex-col gap-2">
        {applications.map((app) => (
          <DraggableCard
            key={app.id}
            app={app}
            saving={savingId === app.id}
            wasJustDragged={wasJustDragged}
          />
        ))}

        {applications.length === 0 && (
          <p
            className="px-1 pt-2 text-xs"
            style={{ color: "var(--text-muted)" }}
          >
            {isValidTarget ? "Drop here" : "Nothing here yet"}
          </p>
        )}
      </div>
    </section>
  );
}

function DraggableCard({
  app,
  saving,
  wasJustDragged,
}: {
  app: BoardApplication;
  saving: boolean;
  wasJustDragged: () => boolean;
}) {
  // Final stages can't move anywhere, so their cards aren't draggable.
  const locked = isTerminal(app.status);
  const { setNodeRef, listeners, attributes, isDragging } = useDraggable({
    id: app.id,
    disabled: locked || saving,
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      aria-label={`${app.company}, ${app.role}. ${locked ? "Final stage." : "Press Space to move."}`}
      className="relative rounded-lg outline-none focus-visible:ring-2"
      style={{
        opacity: isDragging ? 0.4 : saving ? 0.7 : 1,
        cursor: locked ? "default" : "grab",
        touchAction: "manipulation",
      }}
    >
      <CardBody app={app} saving={saving} />
      {/* Stretched link: a plain click anywhere on the card opens it. */}
      <Link
        href={`/applications/${app.id}`}
        draggable={false}
        onClick={(event) => {
          if (wasJustDragged()) event.preventDefault();
        }}
        className="absolute inset-0 rounded-lg"
        aria-label={`Open ${app.company} application`}
      />
    </div>
  );
}

function CardBody({
  app,
  lifted = false,
  saving = false,
}: {
  app: BoardApplication;
  lifted?: boolean;
  saving?: boolean;
}) {
  return (
    <div
      className="rounded-lg p-3"
      style={{
        backgroundColor: "var(--bg-card)",
        border: "1px solid var(--border-light)",
        boxShadow: lifted
          ? "0 12px 28px rgba(23, 23, 23, 0.16)"
          : "0 1px 2px rgba(23, 23, 23, 0.04)",
        transform: lifted ? "rotate(2deg)" : undefined,
        cursor: lifted ? "grabbing" : undefined,
      }}
    >
      <p
        className="truncate text-sm font-semibold"
        style={{ color: "var(--text-primary)" }}
      >
        {app.company}
      </p>
      <p
        className="mt-1 truncate text-xs"
        style={{ color: "var(--text-secondary)" }}
      >
        {app.role}
      </p>
      {app.location && (
        <p
          className="mt-1 truncate text-xs"
          style={{ color: "var(--text-muted)" }}
        >
          {app.location}
        </p>
      )}
      {saving && (
        <p className="mt-2 text-xs" style={{ color: "var(--accent)" }}>
          Saving...
        </p>
      )}
    </div>
  );
}

function MoveDialog({
  app,
  target,
  onConfirm,
  onCancel,
}: {
  app: BoardApplication;
  target: Status;
  onConfirm: (note: string) => void;
  onCancel: () => void;
}) {
  const [note, setNote] = useState("");
  const titleId = useId();
  const inputRef = useRef<HTMLInputElement>(null);

  // After a keyboard drop the drag library hands focus back to the card
  // on the next frame. Focus the note box after that so typing goes here.
  useEffect(() => {
    const frame = requestAnimationFrame(() =>
      requestAnimationFrame(() => inputRef.current?.focus()),
    );
    return () => cancelAnimationFrame(frame);
  }, []);

  // Escape closes the dialog from anywhere, like a native modal
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onCancel();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ backgroundColor: "rgba(23, 23, 23, 0.35)" }}
      onClick={onCancel}
    >
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
        onSubmit={(e) => {
          e.preventDefault();
          onConfirm(note);
        }}
        className="w-full max-w-md rounded-xl p-6"
        style={{
          backgroundColor: "var(--bg-card)",
          border: "1px solid var(--border-light)",
          boxShadow: "0 24px 48px rgba(23, 23, 23, 0.18)",
        }}
      >
        <h2
          id={titleId}
          className="text-base font-semibold"
          style={{ color: "var(--text-primary)" }}
        >
          Move {app.company} to {STATUS_LABELS[target]}
        </h2>
        <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
          {STATUS_LABELS[app.status]} → {STATUS_LABELS[target]}. The note is
          saved in the application&apos;s timeline.
        </p>

        <label
          htmlFor="move-note"
          className="mb-2 mt-4 block text-xs font-medium"
          style={{ color: "var(--text-secondary)" }}
        >
          Note (optional)
        </label>
        <input
          id="move-note"
          ref={inputRef}
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="e.g. Recruiter call went well"
          className="w-full rounded-lg px-4 py-3 text-sm outline-none"
          style={{
            backgroundColor: "var(--bg-card-alt)",
            border: "1px solid var(--border)",
            color: "var(--text-primary)",
          }}
        />

        <div className="mt-5 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full px-5 py-2 text-sm font-medium"
            style={{
              backgroundColor: "var(--bg-card-alt)",
              color: "var(--text-secondary)",
              border: "1px solid var(--border-light)",
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="rounded-full px-5 py-2 text-sm font-medium"
            style={{ backgroundColor: "var(--accent)", color: "#FFFFFF" }}
          >
            Move
          </button>
        </div>
      </form>
    </div>
  );
}
