import { addMonths, format, subMonths } from "date-fns";
import { getMonthGrid, inCurrentMonth, toDateKey } from "@/lib/calendar";
import type { DaySummary } from "@/lib/types";
import { DayCell } from "@/components/DayCell";
import { Button } from "@/components/ui/button";

type Props = {
  currentMonth: Date;
  setCurrentMonth: (d: Date) => void;
  summary: Map<string, DaySummary>;
  onDayClick: (date: string) => void;
};

export function CalendarGrid({ currentMonth, setCurrentMonth, summary, onDayClick }: Props) {
  const days = getMonthGrid(currentMonth);

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4">
      <div className="mb-4 flex items-center justify-between">
        <Button variant="outline" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
          Prev
        </Button>
        <h2 className="text-lg font-semibold">{format(currentMonth, "MMMM yyyy")}</h2>
        <Button variant="outline" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
          Next
        </Button>
      </div>

      <div className="mb-2 grid grid-cols-7 text-center text-xs font-medium text-zinc-500">
        {"Mon Tue Wed Thu Fri Sat Sun".split(" ").map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2">
        {days.map((day) => {
          const key = toDateKey(day);
          return (
            <DayCell
              key={key}
              day={day}
              inMonth={inCurrentMonth(day, currentMonth)}
              summary={summary.get(key)}
              onClick={() => onDayClick(key)}
            />
          );
        })}
      </div>
    </div>
  );
}
