"use client";

import { useEffect, useState } from "react";
import type { SyntheticEvent } from "react";
import { format, isValid, parse } from "date-fns";
import type { AvailabilityStatus } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Props = {
  onApply: (startDate: string, endDate: string, status: AvailabilityStatus) => Promise<void>;
};

function toIsoDate(value: string) {
  const parsed = parse(value, "dd/MM/yyyy", new Date());
  return isValid(parsed) ? format(parsed, "yyyy-MM-dd") : null;
}

function isCoarsePointerDevice() {
  if (globalThis.window === undefined) return false;
  return globalThis.window.matchMedia("(pointer: coarse)").matches;
}

export function DateRangeSelector(props: Readonly<Props>) {
  const { onApply } = props;
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [status, setStatus] = useState<AvailabilityStatus>("available");
  const [nativePicker, setNativePicker] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const update = () => setNativePicker(isCoarsePointerDevice());
    update();

    const media = globalThis.window.matchMedia("(pointer: coarse)");
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  const submit = async (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    const startIso = nativePicker ? startDate : toIsoDate(startDate);
    const endIso = nativePicker ? endDate : toIsoDate(endDate);
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
          type={nativePicker ? "date" : "text"}
          inputMode={nativePicker ? undefined : "numeric"}
          placeholder={nativePicker ? undefined : "DD/MM/YYYY"}
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          required
        />
        <Input
          type={nativePicker ? "date" : "text"}
          inputMode={nativePicker ? undefined : "numeric"}
          placeholder={nativePicker ? undefined : "DD/MM/YYYY"}
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          required
        />
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
