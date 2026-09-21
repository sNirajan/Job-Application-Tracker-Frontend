/*
 * Mirror of the backend state machine (src/utils/statusMachine.js).
 *
 * The backend is the source of truth and rejects invalid moves.
 * This copy only lets the board show which columns a card can be
 * dropped on while it is being dragged. Keep the two in sync.
 */

export const STATUSES = [
  "wishlist",
  "applied",
  "phone_screen",
  "technical",
  "onsite",
  "offer",
  "accepted",
  "rejected",
  "withdrawn",
] as const;

export type Status = (typeof STATUSES)[number];

export const STATUS_LABELS: Record<Status, string> = {
  wishlist: "Wishlist",
  applied: "Applied",
  phone_screen: "Phone Screen",
  technical: "Technical",
  onsite: "Onsite",
  offer: "Offer",
  accepted: "Accepted",
  rejected: "Rejected",
  withdrawn: "Withdrawn",
};

const VALID_TRANSITIONS: Record<Status, Status[]> = {
  wishlist: ["applied", "withdrawn"],
  applied: ["phone_screen", "rejected", "withdrawn"],
  phone_screen: ["technical", "rejected", "withdrawn"],
  technical: ["onsite", "rejected", "withdrawn"],
  onsite: ["offer", "rejected", "withdrawn"],
  offer: ["accepted", "rejected", "withdrawn"],
  accepted: [],
  rejected: [],
  withdrawn: [],
};

export function canTransition(from: Status, to: Status): boolean {
  return VALID_TRANSITIONS[from].includes(to);
}

export function isTerminal(status: Status): boolean {
  return VALID_TRANSITIONS[status].length === 0;
}
