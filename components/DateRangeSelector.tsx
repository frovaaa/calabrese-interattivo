"use client";

import { useState } from "react";
import type { SyntheticEvent } from "react";
import { format, isValid, parse } from "date-fns";
import type { AvailabilityStatus } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Props = {
  startDate: string;
  endDate: string;
  status: AvailabilityStatus;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
  onStatusChange: (value: AvailabilityStatus) => void;
  onApply: (startDate: string, endDate: string, status: AvailabilityStatus) => Promise<void>;
};

function toIsoDate(value: string) {
  const parsed = parse(value, "dd/MM/yyyy", new Date());
  return isValid(parsed) ? format(parsed, "yyyy-MM-dd") : null;
}

export function DateRangeSelector(props: Readonly<Props>) {
  const {
    startDate,
    endDate,
    status,
    onStartDateChange,
    onEndDateChange,
    onStatusChange,
    onApply,
  } = props;
  const [loading, setLoading] = useState(false);

  const submit = async (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    const startIso = toIsoDate(startDate);
    const endIso = toIsoDate(endDate);
    if (!startIso || !endIso) return;
    setLoading(true);
    try {
      await onApply(startIso, endIso, status);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="rounded-xl border border-zinc-200 bg-white p-4">
      <p className="mb-3 font-medium">Mark a date range</p>
      <div className="grid gap-2 sm:grid-cols-3">
        <Input
          type="text"
          inputMode="numeric"
          placeholder="DD/MM/YYYY"
          value={startDate}
          onChange={(e) => onStartDateChange(e.target.value)}
          required
        />
        <Input
          type="text"
          inputMode="numeric"
          placeholder="DD/MM/YYYY"
          value={endDate}
          onChange={(e) => onEndDateChange(e.target.value)}
          required
        />
        <select
          className="h-10 rounded-md border border-zinc-300 bg-white px-2 text-sm"
          value={status}
          onChange={(e) => onStatusChange(e.target.value as AvailabilityStatus)}
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
