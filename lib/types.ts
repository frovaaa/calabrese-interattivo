export type AvailabilityStatus = "available" | "maybe" | "unavailable";

export type Board = {
  id: string;
  title: string;
  created_at: string;
};

export type Participant = {
  id: string;
  board_id: string;
  name: string;
  constraints: string | null;
  general_notes: string | null;
  created_at: string;
};

export type Availability = {
  id: string;
  board_id: string;
  participant_id: string;
  date: string;
  status: AvailabilityStatus;
  note: string | null;
  updated_at: string;
};

export type DaySummary = {
  available: number;
  maybe: number;
  unavailable: number;
};

export type BestRangeSummary = {
  label: string;
  start: string;
  end: string;
  available: number;
  maybe: number;
  unavailablePeople: string[];
};

export type ParticipantPreferencesInput = Pick<Participant, "constraints" | "general_notes">;
