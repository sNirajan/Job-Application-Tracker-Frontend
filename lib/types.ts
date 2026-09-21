import type { Status } from "./statusMachine";

export interface Contact {
  id: string;
  application_id: string;
  name: string;
  title: string | null;
  email: string | null;
  phone: string | null;
  linkedin_url: string | null;
  notes: string | null;
  created_at: string;
}

export interface Reminder {
  id: string;
  application_id: string;
  remind_at: string;
  note: string | null;
  completed_at: string | null;
  created_at: string;
}

// A reminder from GET /reminders, with its application's details attached
export interface ReminderWithApplication extends Reminder {
  company: string;
  role: string;
  application_status: Status;
}

export interface FollowUpSuggestion {
  id: string;
  company: string;
  role: string;
  status: Status;
  updated_at: string;
  days_idle: number;
}

export type DocumentKind = "resume" | "cover_letter" | "other";

export interface ApplicationDocument {
  id: string;
  application_id: string;
  kind: DocumentKind;
  original_name: string;
  mime_type: string;
  size_bytes: number;
  created_at: string;
}
