"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { buildDailySummary } from "@/lib/availability";
import { eachDayInRange } from "@/lib/calendar";
import {
  createParticipant,
  deleteAvailability,
  getAvailability,
  getBoard,
  getParticipant,
  getParticipants,
  updateParticipantName,
  updateParticipantPreferences,
  upsertAvailability,
} from "@/lib/board";
import { getSupabaseClient, hasSupabaseEnv } from "@/lib/supabase/client";
import type { Availability, Board, Participant, ParticipantPreferencesInput, PlanningType } from "@/lib/types";
import { BoardHeader } from "@/components/BoardHeader";
import { BestDatesSummary } from "@/components/BestDatesSummary";
import { CalendarGrid } from "@/components/CalendarGrid";
import { DateRangeSelector } from "@/components/DateRangeSelector";
import { DayDetailsModal } from "@/components/DayDetailsModal";
import { ParticipantNameForm } from "@/components/ParticipantNameForm";
import { ParticipantPreferencesForm } from "@/components/ParticipantPreferencesForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const participantStorageKey = (boardId: string) => `planner:participant:${boardId}`;
const POLLING_INTERVAL_MS = 15000;

const helperTextByType: Record<PlanningType, string> = {
  vacation: "Share trip constraints, destination ideas, and available ranges.",
  dinner: "Find the best day everyone can attend and add notes.",
  study: "Coordinate sessions by marking when you can join.",
  generic: "Use this flexible board for any collaborative planning.",
};

type Props = { boardId: string };

export function BoardPageClient({ boardId }: Props) {
  const [board, setBoard] = useState<Board | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [availability, setAvailability] = useState<Availability[]>([]);
  const [participant, setParticipant] = useState<Participant | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [month, setMonth] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshAll = useCallback(async () => {
    const [boardData, participantsData, availabilityData] = await Promise.all([
      getBoard(boardId),
      getParticipants(boardId),
      getAvailability(boardId),
    ]);

    setBoard(boardData);
    setParticipants(participantsData);
    setAvailability(availabilityData);
  }, [boardId]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        await refreshAll();

        const savedParticipantId = localStorage.getItem(participantStorageKey(boardId));
        if (savedParticipantId) {
          const p = await getParticipant(savedParticipantId);
          if (p.board_id === boardId) {
            setParticipant(p);
          }
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load board");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [boardId, refreshAll]);

  useEffect(() => {
    if (!hasSupabaseEnv) return;
    const supabase = getSupabaseClient();
    let poll: ReturnType<typeof setInterval> | null = null;

    const startPolling = () => {
      if (poll) return;
      poll = setInterval(() => {
        void refreshAll();
      }, POLLING_INTERVAL_MS);
    };

    const stopPolling = () => {
      if (!poll) return;
      clearInterval(poll);
      poll = null;
    };

    const channel = supabase
      .channel(`board:${boardId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "participants", filter: `board_id=eq.${boardId}` },
        () => void refreshAll(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "availability", filter: `board_id=eq.${boardId}` },
        () => void refreshAll(),
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "boards", filter: `id=eq.${boardId}` },
        () => void refreshAll(),
      )
      .subscribe();

    const onVisibilityChange = () => {
      if (document.hidden) {
        stopPolling();
        return;
      }
      startPolling();
      void refreshAll();
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    if (!document.hidden) startPolling();

    return () => {
      stopPolling();
      document.removeEventListener("visibilitychange", onVisibilityChange);
      void supabase.removeChannel(channel);
    };
  }, [boardId, refreshAll]);

  const summary = useMemo(() => buildDailySummary(availability), [availability]);

  const handleJoin = async (name: string) => {
    const newParticipant = await createParticipant(boardId, name);
    localStorage.setItem(participantStorageKey(boardId), newParticipant.id);
    setParticipant(newParticipant);
    await refreshAll();
  };

  const handleNameUpdate = async (name: string) => {
    if (!participant) return;
    await updateParticipantName(participant.id, name);
    const updated = await getParticipant(participant.id);
    setParticipant(updated);
    await refreshAll();
  };

  const handlePreferencesSave = async (prefs: ParticipantPreferencesInput) => {
    if (!participant) return;
    await updateParticipantPreferences(participant.id, prefs);
    const updated = await getParticipant(participant.id);
    setParticipant(updated);
    await refreshAll();
  };

  const setStatusForDate = async (status: "available" | "maybe" | "unavailable", note: string) => {
    if (!participant || !selectedDate) return;
    await upsertAvailability({
      boardId,
      participantId: participant.id,
      date: selectedDate,
      status,
      note,
    });
    await refreshAll();
  };

  const clearStatusForDate = async () => {
    if (!participant || !selectedDate) return;
    await deleteAvailability(boardId, participant.id, selectedDate);
    await refreshAll();
  };

  const applyRange = async (
    startDate: string,
    endDate: string,
    status: "available" | "maybe" | "unavailable",
  ) => {
    if (!participant) return;

    const dates = eachDayInRange(startDate, endDate);
    await Promise.all(
      dates.map((date) =>
        upsertAvailability({
          boardId,
          participantId: participant.id,
          date,
          status,
        }),
      ),
    );
    await refreshAll();
  };

  if (!hasSupabaseEnv) {
    return (
      <main className="p-6 text-rose-700">
        Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.
      </main>
    );
  }
  if (loading) return <main className="p-6">Loading board...</main>;
  if (error) return <main className="p-6 text-rose-700">Error: {error}</main>;
  if (!board) return <main className="p-6">Board not found.</main>;

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-4 p-4 pb-10 sm:p-6">
      <BoardHeader board={board} onRefresh={refreshAll} />
      <p className="text-sm text-zinc-600">{helperTextByType[board.planning_type]}</p>

      {!participant ? (
        <Card>
          <CardHeader>
            <CardTitle>Join this board</CardTitle>
          </CardHeader>
          <CardContent>
            <ParticipantNameForm submitLabel="Join board" onSubmit={handleJoin} />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            <DateRangeSelector onApply={applyRange} />
            <CalendarGrid
              currentMonth={month}
              setCurrentMonth={setMonth}
              summary={summary}
              onDayClick={setSelectedDate}
            />
          </div>
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Your profile</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <ParticipantNameForm
                  initialName={participant.name}
                  submitLabel="Update name"
                  onSubmit={handleNameUpdate}
                />
                <ParticipantPreferencesForm
                  initialValues={{
                    preferred_destinations: participant.preferred_destinations,
                    max_budget: participant.max_budget,
                    preferred_duration: participant.preferred_duration,
                    transport_preferences: participant.transport_preferences,
                    accommodation_preferences: participant.accommodation_preferences,
                    general_notes: participant.general_notes,
                  }}
                  onSave={handlePreferencesSave}
                />
              </CardContent>
            </Card>
            <BestDatesSummary rows={availability} participants={participants} />
          </div>
        </div>
      )}

      {participant && selectedDate ? (
        <DayDetailsModal
          open={!!selectedDate}
          onOpenChange={(open) => {
            if (!open) setSelectedDate(null);
          }}
          date={selectedDate}
          participantId={participant.id}
          participants={participants}
          availability={availability}
          onSetStatus={setStatusForDate}
          onClear={clearStatusForDate}
        />
      ) : null}
    </main>
  );
}
