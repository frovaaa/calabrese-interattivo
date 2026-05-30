import { format } from "date-fns";
import type { DaySummary } from "@/lib/types";
import { cn } from "@/lib/utils";

type Props = {
  day: Date;
  inMonth: boolean;
  summary?: DaySummary;
  onClick: () => void;
};

export function DayCell({ day, inMonth, summary, onClick }: Props) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "min-h-20 rounded-lg border border-zinc-200 p-2 text-left transition hover:bg-zinc-50",
        !inMonth && "opacity-45",
      )}
    >
      <div className="text-sm font-medium">{format(day, "d")}</div>
      <div className="mt-2 space-y-1 text-[11px] leading-tight">
        <div className="text-emerald-600">A: {summary?.available ?? 0}</div>
        <div className="text-amber-600">M: {summary?.maybe ?? 0}</div>
        <div className="text-rose-600">U: {summary?.unavailable ?? 0}</div>
      </div>
    </button>
  );
}
