"use client";

import { useState } from "react";
import { format, parseISO } from "date-fns";
import type { AvailabilityStatus } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

type RangeSelection = {
  start: string;
  end: string;
};

type Props = {
  open: boolean;
  range: RangeSelection | null;
  onOpenChange: (open: boolean) => void;
  onApply: (status: AvailabilityStatus, note: string) => Promise<void>;
  onClear: () => Promise<void>;
};

function formatSelectedRange(range: RangeSelection) {
  return `${format(parseISO(range.start), "dd/MM/yyyy")} - ${format(parseISO(range.end), "dd/MM/yyyy")}`;
}

export function RangeSelectionModal(props: Readonly<Props>) {
  const { open, range, onOpenChange, onApply, onClear } = props;
  const [note, setNote] = useState("");
  const [savingStatus, setSavingStatus] = useState<AvailabilityStatus | null>(null);
  const [clearing, setClearing] = useState(false);

  const apply = async (status: AvailabilityStatus) => {
    if (!range) return;
    setSavingStatus(status);
    try {
      await onApply(status, note);
      setNote("");
      onOpenChange(false);
    } finally {
      setSavingStatus(null);
    }
  };

  const clear = async () => {
    if (!range) return;
    setClearing(true);
    try {
      await onClear();
      setNote("");
      onOpenChange(false);
    } finally {
      setClearing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Apply availability to range</DialogTitle>
          <DialogDescription>Choose a status and optional note for every date in the selected range.</DialogDescription>
        </DialogHeader>

        <p className="mb-3 text-sm text-zinc-600">{range ? formatSelectedRange(range) : null}</p>

        <div className="mb-4 space-y-3">
          <div className="space-y-2">
            <p className="text-sm font-medium text-zinc-900">Availability</p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <Button
                onClick={() => void apply("available")}
                disabled={savingStatus !== null || clearing}
                className="bg-emerald-600 text-white hover:bg-emerald-700"
              >
                Available
              </Button>
              <Button
                onClick={() => void apply("maybe")}
                disabled={savingStatus !== null || clearing}
                className="bg-amber-500 text-white hover:bg-amber-600"
              >
                Maybe
              </Button>
              <Button
                onClick={() => void apply("unavailable")}
                disabled={savingStatus !== null || clearing}
                className="bg-rose-600 text-white hover:bg-rose-700"
              >
                Unavailable
              </Button>
              <Button
                onClick={() => void clear()}
                disabled={savingStatus !== null || clearing}
                variant="ghost"
                className="sm:col-span-3"
              >
                {clearing ? "Clearing..." : "Clear response"}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-zinc-900">Optional note</p>
            <Textarea
              placeholder="Add a note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
