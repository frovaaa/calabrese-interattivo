"use client";

import { useMemo, useState } from "react";
import type { Availability, AvailabilityStatus, Participant } from "@/lib/types";
import { formatFriendlyDate } from "@/lib/calendar";
import { participantResponsesForDate } from "@/lib/availability";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  date: string;
  participantId: string;
  participants: Participant[];
  availability: Availability[];
  onSetStatus: (status: AvailabilityStatus, note: string) => Promise<void>;
  onClear: () => Promise<void>;
};

export function DayDetailsModal(props: Readonly<Props>) {
  const {
    open,
    onOpenChange,
    date,
    participantId,
    participants,
    availability,
    onSetStatus,
    onClear,
  } = props;
  const mine = availability.find((a) => a.participant_id === participantId && a.date === date);
  const [note, setNote] = useState(mine?.note ?? "");

  const responses = useMemo(
    () => participantResponsesForDate(availability, participants, date),
    [availability, participants, date],
  );
  const selectedStatus = mine?.status;

  const statusButtonClass = (status: AvailabilityStatus) => {
    const active = selectedStatus === status;
    if (status === "available") {
      return active
        ? "border-emerald-600 bg-emerald-600 text-white hover:bg-emerald-700"
        : "border-emerald-200 bg-white text-emerald-700 hover:bg-emerald-50";
    }
    if (status === "maybe") {
      return active
        ? "border-amber-500 bg-amber-500 text-white hover:bg-amber-600"
        : "border-amber-200 bg-white text-amber-700 hover:bg-amber-50";
    }
    return active
      ? "border-rose-600 bg-rose-600 text-white hover:bg-rose-700"
      : "border-rose-200 bg-white text-rose-700 hover:bg-rose-50";
  };

  const submit = async (status: AvailabilityStatus) => {
    await onSetStatus(status, note);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{formatFriendlyDate(date)}</DialogTitle>
        </DialogHeader>

        <p className="mb-2 text-sm text-zinc-600">Your current status: {selectedStatus ?? "none"}</p>
        <Textarea
          placeholder="Optional note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="mb-3"
        />
        <div className="mb-3 flex flex-wrap gap-2">
          <Button onClick={() => submit("available")} variant="outline" className={statusButtonClass("available")}>
            Available
          </Button>
          <Button onClick={() => submit("maybe")} variant="outline" className={statusButtonClass("maybe")}>
            Maybe
          </Button>
          <Button onClick={() => submit("unavailable")} variant="outline" className={statusButtonClass("unavailable")}>
            Unavailable
          </Button>
          <Button onClick={onClear} variant="ghost">
            Clear response
          </Button>
        </div>

        <div>
          <p className="mb-2 text-sm font-medium">Responses</p>
          <ul className="max-h-48 space-y-2 overflow-auto text-sm">
            {responses.length ? (
              responses.map((r) => (
                <li key={r.id} className="rounded border border-zinc-200 p-2">
                  <div className="font-medium">{r.participantName}</div>
                  <div className="text-zinc-600">{r.status}</div>
                  {r.note ? <div className="text-zinc-500">{r.note}</div> : null}
                </li>
              ))
            ) : (
              <li className="text-zinc-500">No responses yet.</li>
            )}
          </ul>
        </div>
      </DialogContent>
    </Dialog>
  );
}
