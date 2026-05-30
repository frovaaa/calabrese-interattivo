export type PlanningType = "vacation" | "dinner" | "study" | "generic";

export type AvailabilityStatus = "available" | "maybe" | "unavailable";

export type Board = {
  id: string;
  title: string;
  planning_type: PlanningType;
  created_at: string;
};

export type Participant = {
  id: string;
  board_id: string;
  name: string;
  preferred_destinations: string | null;
  max_budget: string | null;
  preferred_duration: string | null;
  transport_preferences: string | null;
  accommodation_preferences: string | null;
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

export type ParticipantPreferencesInput = Pick<
  Participant,
  | "preferred_destinations"
  | "max_budget"
  | "preferred_duration"
  | "transport_preferences"
  | "accommodation_preferences"
  | "general_notes"
>;
