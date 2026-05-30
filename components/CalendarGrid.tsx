import { addMonths, format, subMonths } from "date-fns";
import { getMonthGrid, inCurrentMonth, isDateKeyWithinRange, toDateKey } from "@/lib/calendar";
import type { DaySummary } from "@/lib/types";
import { DayCell } from "@/components/DayCell";
import { Button } from "@/components/ui/button";

type Props = {
  currentMonth: Date;
  setCurrentMonth: (d: Date) => void;
  summary: Map<string, DaySummary>;
  selectedRange: { start: string; end: string } | null;
  dragRange: { start: string; end: string } | null;
  onDayPointerDown: (date: string) => void;
  onDayPointerEnter: (date: string) => void;
  onDayPointerUp: (date: string) => void;
  onDayPointerMove: (clientX: number, clientY: number) => void;
};

export function CalendarGrid(props: Readonly<Props>) {
  const {
    currentMonth,
    setCurrentMonth,
    summary,
    selectedRange,
    dragRange,
    onDayPointerDown,
    onDayPointerEnter,
    onDayPointerUp,
    onDayPointerMove,
  } = props;
  const days = getMonthGrid(currentMonth);
  const activeRange = dragRange ?? selectedRange;

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-5 lg:p-6">
      <div className="mb-5 flex items-center justify-between">
        <Button variant="outline" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
          Prev
        </Button>
        <h2 className="text-lg font-semibold sm:text-xl">{format(currentMonth, "MMMM yyyy")}</h2>
        <Button variant="outline" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
          Next
        </Button>
      </div>

      <div className="mb-2 grid grid-cols-7 text-center text-xs font-medium text-zinc-500 sm:text-sm">
        {"Mon Tue Wed Thu Fri Sat Sun".split(" ").map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2 touch-none lg:gap-3" onPointerMove={(e) => onDayPointerMove(e.clientX, e.clientY)}>
        {days.map((day) => {
          const key = toDateKey(day);
          const inRange = activeRange ? isDateKeyWithinRange(key, activeRange.start, activeRange.end) : false;
          return (
            <DayCell
              key={key}
              dateKey={key}
              day={day}
              inMonth={inCurrentMonth(day, currentMonth)}
              isSelected={inRange}
              isRangeStart={inRange && key === activeRange?.start}
              isRangeEnd={inRange && key === activeRange?.end}
              summary={summary.get(key)}
              onPointerDown={() => onDayPointerDown(key)}
              onPointerEnter={() => onDayPointerEnter(key)}
              onPointerUp={() => onDayPointerUp(key)}
            />
          );
        })}
      </div>
    </div>
  );
}
