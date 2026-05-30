import { assertSupabaseEnv, getSupabaseClient } from "@/lib/supabase/client";
import type {
  Availability,
  AvailabilityStatus,
  Board,
  Participant,
  ParticipantPreferencesInput,
  PlanningType,
} from "@/lib/types";

export async function createBoard(planningType: PlanningType = "generic") {
  assertSupabaseEnv();
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("boards")
    .insert({ planning_type: planningType })
    .select("*")
    .single<Board>();

  if (error) throw error;
  return data;
}

export async function getBoard(boardId: string) {
  assertSupabaseEnv();
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("boards")
    .select("*")
    .eq("id", boardId)
    .single<Board>();
  if (error) throw error;
  return data;
}

export async function updateBoardTitle(boardId: string, title: string) {
  assertSupabaseEnv();
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from("boards")
    .update({ title: title.trim() || "Untitled Plan" })
    .eq("id", boardId);
  if (error) throw error;
}

export async function createParticipant(boardId: string, name: string) {
  assertSupabaseEnv();
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("participants")
    .insert({ board_id: boardId, name: name.trim() })
    .select("*")
    .single<Participant>();
  if (error) throw error;
  return data;
}

export async function getParticipant(participantId: string) {
  assertSupabaseEnv();
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("participants")
    .select("*")
    .eq("id", participantId)
    .single<Participant>();
  if (error) throw error;
  return data;
}

export async function updateParticipantName(participantId: string, name: string) {
  assertSupabaseEnv();
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from("participants")
    .update({ name: name.trim() })
    .eq("id", participantId);
  if (error) throw error;
}

export async function updateParticipantPreferences(
  participantId: string,
  preferences: ParticipantPreferencesInput,
) {
  assertSupabaseEnv();
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from("participants")
    .update(preferences)
    .eq("id", participantId);
  if (error) throw error;
}

export async function getParticipants(boardId: string) {
  assertSupabaseEnv();
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("participants")
    .select("*")
    .eq("board_id", boardId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data as Participant[];
}

export async function getAvailability(boardId: string) {
  assertSupabaseEnv();
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("availability")
    .select("*")
    .eq("board_id", boardId);
  if (error) throw error;
  return data as Availability[];
}

export async function upsertAvailability(input: {
  boardId: string;
  participantId: string;
  date: string;
  status: AvailabilityStatus;
  note?: string;
}) {
  assertSupabaseEnv();
  const supabase = getSupabaseClient();
  const { error } = await supabase.from("availability").upsert(
    {
      board_id: input.boardId,
      participant_id: input.participantId,
      date: input.date,
      status: input.status,
      note: input.note?.trim() || null,
    },
    {
      onConflict: "board_id,participant_id,date",
    },
  );
  if (error) throw error;
}

export async function deleteAvailability(boardId: string, participantId: string, date: string) {
  assertSupabaseEnv();
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from("availability")
    .delete()
    .eq("board_id", boardId)
    .eq("participant_id", participantId)
    .eq("date", date);
  if (error) throw error;
}
