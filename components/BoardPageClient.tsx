"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { buildDailySummary } from "@/lib/availability";
import { eachDayInRange, formatEuropeanDate } from "@/lib/calendar";
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
import type {
  Availability,
  AvailabilityStatus,
  Board,
  Participant,
  ParticipantPreferencesInput,
  PlanningType,
} from "@/lib/types";
import { BoardHeader } from "@/components/BoardHeader";
import { BestDatesSummary } from "@/components/BestDatesSummary";
import { CalendarGrid } from "@/components/CalendarGrid";
import { DateRangeSelector } from "@/components/DateRangeSelector";
import { DayDetailsModal } from "@/components/DayDetailsModal";
import { ParticipantNameForm } from "@/components/ParticipantNameForm";
import { ParticipantPreferencesForm } from "@/components/ParticipantPreferencesForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const participantStorageKey = (boardId: string) => `planner:participant:${boardId}`;
const POLLING_INTERVAL_MS = 15000;

const helperTextByType: Record<PlanningType, string> = {
  vacation: "Share trip constraints, destination ideas, and available ranges.",
  dinner: "Find the best day everyone can attend and add notes.",
  study: "Coordinate sessions by marking when you can join.",
  generic: "Use this flexible board for any collaborative planning.",
};

type Props = Readonly<{ boardId: string }>;

type DateRange = {
  start: string;
  end: string;
};

type RangeStatus = AvailabilityStatus;

export function BoardPageClient(props: Props) {
  const { boardId } = props;
  const [board, setBoard] = useState<Board | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [availability, setAvailability] = useState<Availability[]>([]);
  const [participant, setParticipant] = useState<Participant | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedRange, setSelectedRange] = useState<DateRange | null>(null);
  const [dragAnchor, setDragAnchor] = useState<string | null>(null);
  const [dragCurrent, setDragCurrent] = useState<string | null>(null);
  const [rangeStartInput, setRangeStartInput] = useState("");
  const [rangeEndInput, setRangeEndInput] = useState("");
  const [rangeStatus, setRangeStatus] = useState<RangeStatus>("available");
  const [bulkApplying, setBulkApplying] = useState(false);
  const dragFinalizedRef = useRef(false);
  const [month, setMonth] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const activeDragRange = useMemo(() => {
    if (!dragAnchor || !dragCurrent) return null;
    const [start, end] = [dragAnchor, dragCurrent].sort((left, right) => left.localeCompare(right));
    return { start, end };
  }, [dragAnchor, dragCurrent]);

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

  const setStatusForDate = async (status: AvailabilityStatus, note: string) => {
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

  const clearDragSelection = useCallback(() => {
    setDragAnchor(null);
    setDragCurrent(null);
  }, []);

  const finalizeDragSelection = useCallback(
    (endDate?: string) => {
      if (!dragAnchor) return;
      const current = endDate ?? dragCurrent ?? dragAnchor;
      const [start, end] = [dragAnchor, current].sort((left, right) => left.localeCompare(right));
      const nextRange = { start, end };

      dragFinalizedRef.current = true;
      clearDragSelection();

      if (nextRange.start === nextRange.end) {
        setSelectedDate(nextRange.start);
        return;
      }

      setSelectedDate(null);
      setSelectedRange(nextRange);
      setRangeStartInput(formatEuropeanDate(nextRange.start));
      setRangeEndInput(formatEuropeanDate(nextRange.end));
    },
    [clearDragSelection, dragAnchor, dragCurrent],
  );

  const handleDayPointerDown = useCallback((date: string) => {
    dragFinalizedRef.current = false;
    setSelectedRange(null);
    setSelectedDate(null);
    setDragAnchor(date);
    setDragCurrent(date);
  }, []);

  const handleDayPointerEnter = useCallback(
    (date: string) => {
      if (!dragAnchor) return;
      setDragCurrent(date);
    },
    [dragAnchor],
  );

  const handleDayPointerUp = useCallback(
    (date: string) => {
      if (!dragAnchor) return;
      if (dragFinalizedRef.current) return;
      finalizeDragSelection(date);
    },
    [dragAnchor, finalizeDragSelection],
  );

  useEffect(() => {
    const handleWindowPointerUp = () => {
      if (!dragAnchor || dragFinalizedRef.current) return;
      finalizeDragSelection();
    };

    globalThis.addEventListener("pointerup", handleWindowPointerUp);
    return () => globalThis.removeEventListener("pointerup", handleWindowPointerUp);
  }, [dragAnchor, finalizeDragSelection]);

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

  const applySelectedRange = async (status: "available" | "maybe" | "unavailable") => {
    if (!selectedRange) return;

    setBulkApplying(true);
    try {
      await applyRange(selectedRange.start, selectedRange.end, status);
      setSelectedRange(null);
    } finally {
      setBulkApplying(false);
    }
  };

  if (!hasSupabaseEnv) {
    return (
      <main className="p-6 text-rose-700">
        Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and either
        NEXT_PUBLIC_SUPABASE_ANON_KEY or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.
      </main>
    );
  }
  if (loading) return <main className="p-6">Loading board...</main>;
  if (error) return <main className="p-6 text-rose-700">Error: {error}</main>;
  if (!board) return <main className="p-6">Board not found.</main>;

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <BoardHeader board={board} onRefresh={refreshAll} />
      <p className="max-w-2xl text-sm leading-6 text-zinc-600">{helperTextByType[board.planning_type]}</p>

      {selectedRange ? (
        <Card className="border-zinc-200/70 bg-white/80">
          <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-zinc-900">Selected range</p>
              <p className="text-sm text-zinc-600">
                {formatEuropeanDate(selectedRange.start)} - {formatEuropeanDate(selectedRange.end)}
                {" "}
                ({eachDayInRange(selectedRange.start, selectedRange.end).length} days)
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={() => void applySelectedRange("available")}
                disabled={bulkApplying}
                className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
              >
                Mark available
              </Button>
              <Button
                variant="outline"
                onClick={() => void applySelectedRange("maybe")}
                disabled={bulkApplying}
                className="border-amber-200 text-amber-700 hover:bg-amber-50"
              >
                Mark maybe
              </Button>
              <Button
                variant="outline"
                onClick={() => void applySelectedRange("unavailable")}
                disabled={bulkApplying}
                className="border-rose-200 text-rose-700 hover:bg-rose-50"
              >
                Mark unavailable
              </Button>
              <Button variant="ghost" onClick={() => setSelectedRange(null)} disabled={bulkApplying}>
                Clear selection
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {participant === null ? (
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle>Join this board</CardTitle>
          </CardHeader>
          <CardContent>
            <ParticipantNameForm submitLabel="Join board" onSubmit={handleJoin} />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.65fr)_minmax(320px,0.95fr)]">
          <div className="space-y-5">
            <DateRangeSelector
              startDate={rangeStartInput}
              endDate={rangeEndInput}
              status={rangeStatus}
              onStartDateChange={setRangeStartInput}
              onEndDateChange={setRangeEndInput}
              onStatusChange={setRangeStatus}
              onApply={applyRange}
            />
            <CalendarGrid
              currentMonth={month}
              setCurrentMonth={setMonth}
              summary={summary}
              selectedRange={selectedRange}
              dragRange={activeDragRange}
              onDayPointerDown={handleDayPointerDown}
              onDayPointerEnter={handleDayPointerEnter}
              onDayPointerUp={handleDayPointerUp}
            />
          </div>
          <div className="space-y-5">
            <Card className="overflow-hidden">
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
