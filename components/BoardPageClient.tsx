"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { buildDailySummary } from "@/lib/availability";
import { eachDayInRange } from "@/lib/calendar";
import {
  createParticipant,
  deleteAvailability,
  getAvailability,
  getBoard,
  getParticipant,
  getParticipants,
  isBoardId,
  updateParticipantName,
  upsertAvailability,
} from "@/lib/board";
import { getSupabaseClient, hasSupabaseEnv } from "@/lib/supabase/client";
import type {
  Availability,
  AvailabilityStatus,
  Board,
  Participant,
} from "@/lib/types";
import { BoardHeader } from "@/components/BoardHeader";
import { BestDatesSummary } from "@/components/BestDatesSummary";
import { CalendarGrid } from "@/components/CalendarGrid";
import { DateRangeSelector } from "@/components/DateRangeSelector";
import { DayDetailsModal } from "@/components/DayDetailsModal";
import { ParticipantNameForm } from "@/components/ParticipantNameForm";
import { RangeSelectionModal } from "@/components/RangeSelectionModal";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const participantStorageKey = (boardId: string) => `planner:participant:${boardId}`;
const POLLING_INTERVAL_MS = 15000;

const boardHelperText = "Drag across dates to mark a range, or pick a single day to open its details.";

type Props = Readonly<{ boardId: string }>;

type DateRange = {
  start: string;
  end: string;
};

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
    if (!isBoardId(boardId)) {
      setBoard(null);
      setParticipants([]);
      setAvailability([]);
      return null;
    }

    const boardData = await getBoard(boardId);
    if (!boardData) {
      setBoard(null);
      setParticipants([]);
      setAvailability([]);
      return null;
    }

    const [participantsData, availabilityData] = await Promise.all([
      getParticipants(boardId),
      getAvailability(boardId),
    ]);

    setBoard(boardData);
    setParticipants(participantsData);
    setAvailability(availabilityData);
    return boardData;
  }, [boardId]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const boardData = await refreshAll();
        if (!boardData) return;

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
    if (!hasSupabaseEnv || !isBoardId(boardId)) return;
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

  const setStatusForDate = async (date: string, status: AvailabilityStatus, note: string) => {
    if (!participant) return;
    await upsertAvailability({
      boardId,
      participantId: participant.id,
      date,
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
        setSelectedRange(null);
        return;
      }

      setSelectedDate(null);
      setSelectedRange(nextRange);
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

  const handleDayPointerMove = useCallback(
    (clientX: number, clientY: number) => {
      if (!dragAnchor) return;
      const target = document.elementFromPoint(clientX, clientY);
      const dayButton = target instanceof HTMLElement ? target.closest<HTMLButtonElement>("button[data-date]") : null;
      const date = dayButton?.dataset.date;
      if (date) {
        setDragCurrent(date);
      }
    },
    [dragAnchor],
  );

  const handleDayPointerUp = useCallback(
    (clientX: number, clientY: number) => {
      if (!dragAnchor) return;
      if (dragFinalizedRef.current) return;
      const target = document.elementFromPoint(clientX, clientY);
      const dayButton = target instanceof HTMLElement ? target.closest<HTMLButtonElement>("button[data-date]") : null;
      finalizeDragSelection(dayButton?.dataset.date);
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
    note: string,
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
          note: note.trim() || undefined,
        }),
      ),
    );
    await refreshAll();
  };

  const applySelectedRange = async (status: AvailabilityStatus, note: string) => {
    if (!selectedRange || !participant) return;

    const dates = eachDayInRange(selectedRange.start, selectedRange.end);
    await Promise.all(
      dates.map((date) =>
        upsertAvailability({
          boardId,
          participantId: participant.id,
          date,
          status,
          note: note.trim() || undefined,
        }),
      ),
    );

    setSelectedRange(null);
    await refreshAll();
  };

  const clearSelectedRange = async () => {
    if (!selectedRange || !participant) return;

    const dates = eachDayInRange(selectedRange.start, selectedRange.end);
    await Promise.all(
      dates.map((date) =>
        deleteAvailability(boardId, participant.id, date),
      ),
    );

    setSelectedRange(null);
    await refreshAll();
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
  if (!board) {
    return (
      <main className="mx-auto flex min-h-[70dvh] w-full max-w-xl items-center px-4 py-8 sm:px-6 lg:px-8">
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Board not found</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm leading-6 text-zinc-600">
              This board link is invalid, deleted, or does not exist. Check the link or create a new planning board.
            </p>
            <Link href="/" className={buttonVariants({ variant: "default" })}>
              Go to home
            </Link>
          </CardContent>
        </Card>
      </main>
    );
  }

  const selectedDateResponse =
    participant && selectedDate
      ? availability.find((row) => row.participant_id === participant.id && row.date === selectedDate)
      : undefined;

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <BoardHeader
        board={board}
        onRefresh={async () => {
          await refreshAll();
        }}
      />
      <p className="max-w-2xl text-sm leading-6 text-zinc-600">{boardHelperText}</p>

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
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-5">
            <CalendarGrid
              currentMonth={month}
              setCurrentMonth={setMonth}
              summary={summary}
              selectedRange={selectedRange}
              dragRange={activeDragRange}
              onDayPointerDown={handleDayPointerDown}
              onDayPointerEnter={handleDayPointerEnter}
              onDayPointerUp={handleDayPointerUp}
              onDayPointerMove={handleDayPointerMove}
            />
            <DateRangeSelector
              onApply={applyRange}
            />
          </div>
          <div className="space-y-5 xl:sticky xl:top-6 xl:self-start">
            <Card className="overflow-hidden">
              <CardHeader>
                <CardTitle>Your profile</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <ParticipantNameForm
                  initialName={participant.name}
                  saveOnBlur
                  submitLabel="Update name"
                  onSubmit={handleNameUpdate}
                />
              </CardContent>
            </Card>
            <BestDatesSummary rows={availability} participants={participants} boardTitle={board.title} />
          </div>
        </div>
      )}

      {participant && selectedDate ? (
        <DayDetailsModal
          key={`${selectedDate}:${selectedDateResponse?.updated_at ?? "new"}`}
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

      <RangeSelectionModal
        open={!!selectedRange}
        range={selectedRange}
        onOpenChange={(open) => {
          if (!open) setSelectedRange(null);
        }}
        onApply={applySelectedRange}
        onClear={clearSelectedRange}
      />
    </main>
  );
}
