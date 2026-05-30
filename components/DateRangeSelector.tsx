"use client";

import { useState } from "react";
import type { SyntheticEvent } from "react";
import type { AvailabilityStatus } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type Props = {
  onApply: (startDate: string, endDate: string, status: AvailabilityStatus, note: string) => Promise<void>;
};

export function DateRangeSelector(props: Readonly<Props>) {
  const { onApply } = props;
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [status, setStatus] = useState<AvailabilityStatus>("available");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!startDate || !endDate) return;
    setLoading(true);
    try {
      await onApply(startDate, endDate, status, note);
      setNote("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form lang="en-GB" onSubmit={submit} className="rounded-xl border border-zinc-200 bg-white p-4">
      <p className="mb-3 font-medium">Mark a date range</p>
      <div className="grid gap-2 sm:grid-cols-3">
        <label className="grid gap-1 text-xs font-medium text-zinc-600">
          Start date <span className="font-normal text-zinc-400">DD/MM/YYYY</span>
          <Input
            type="date"
            lang="en-GB"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
          />
        </label>
        <label className="grid gap-1 text-xs font-medium text-zinc-600">
          End date <span className="font-normal text-zinc-400">DD/MM/YYYY</span>
          <Input
            type="date"
            lang="en-GB"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            required
          />
        </label>
        <select
          className="mt-auto h-11 rounded-2xl border border-zinc-200/80 bg-white/85 px-4 text-sm shadow-sm outline-none backdrop-blur focus-visible:ring-2 focus-visible:ring-zinc-900/20"
          value={status}
          onChange={(e) => setStatus(e.target.value as AvailabilityStatus)}
        >
          <option value="available">Available</option>
          <option value="maybe">Maybe</option>
          <option value="unavailable">Unavailable</option>
        </select>
      </div>
      <label className="mt-3 grid gap-1 text-xs font-medium text-zinc-600">
        Optional note
        <Textarea
          placeholder="Add a note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </label>
      <Button className="mt-3" type="submit" disabled={loading}>
        {loading ? "Applying..." : "Apply to range"}
      </Button>
    </form>
  );
}
