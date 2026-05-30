"use client";

import { useState } from "react";
import type { AvailabilityStatus } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Props = {
  onApply: (startDate: string, endDate: string, status: AvailabilityStatus) => Promise<void>;
};

export function DateRangeSelector({ onApply }: Props) {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [status, setStatus] = useState<AvailabilityStatus>("available");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate) return;
    setLoading(true);
    try {
      await onApply(startDate, endDate, status);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="rounded-xl border border-zinc-200 bg-white p-4">
      <p className="mb-3 font-medium">Mark a date range</p>
      <div className="grid gap-2 sm:grid-cols-3">
        <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
        <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required />
        <select
          className="h-10 rounded-md border border-zinc-300 bg-white px-2 text-sm"
          value={status}
          onChange={(e) => setStatus(e.target.value as AvailabilityStatus)}
        >
          <option value="available">Available</option>
          <option value="maybe">Maybe</option>
          <option value="unavailable">Unavailable</option>
        </select>
      </div>
      <Button className="mt-3" type="submit" disabled={loading}>
        {loading ? "Applying..." : "Apply to range"}
      </Button>
    </form>
  );
}
