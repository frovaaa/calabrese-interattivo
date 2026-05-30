import { format } from "date-fns";
import type { DaySummary } from "@/lib/types";
import { cn } from "@/lib/utils";

type Props = {
  dateKey: string;
  day: Date;
  inMonth: boolean;
  isSelected?: boolean;
  isRangeStart?: boolean;
  isRangeEnd?: boolean;
  summary?: DaySummary;
  onPointerDown: () => void;
  onPointerEnter: () => void;
  onPointerUp: () => void;
};

export function DayCell(props: Readonly<Props>) {
  const {
    dateKey,
    day,
    inMonth,
    isSelected = false,
    isRangeStart = false,
    isRangeEnd = false,
    summary,
    onPointerDown,
    onPointerEnter,
    onPointerUp,
  } = props;
  return (
    <button
      data-date={dateKey}
      onPointerDown={onPointerDown}
      onPointerEnter={onPointerEnter}
      onPointerUp={onPointerUp}
      className={cn(
        "min-h-20 rounded-lg border p-2 text-left transition select-none touch-none hover:bg-zinc-50 sm:min-h-24 lg:min-h-28 lg:p-3",
        isSelected ? "border-zinc-900 bg-zinc-900 text-white shadow-sm hover:bg-zinc-800" : "border-zinc-200",
        isRangeStart && "rounded-l-xl",
        isRangeEnd && "rounded-r-xl",
        !inMonth && "opacity-45",
      )}
    >
      <div className="text-sm font-medium lg:text-base">{format(day, "d")}</div>
      <div className="mt-2 space-y-1 text-[11px] leading-tight lg:mt-3 lg:text-xs">
        <div className={cn(isSelected ? "text-white/85" : "text-emerald-600")}>A: {summary?.available ?? 0}</div>
        <div className={cn(isSelected ? "text-white/85" : "text-amber-600")}>M: {summary?.maybe ?? 0}</div>
        <div className={cn(isSelected ? "text-white/85" : "text-rose-600")}>U: {summary?.unavailable ?? 0}</div>
      </div>
    </button>
  );
}
