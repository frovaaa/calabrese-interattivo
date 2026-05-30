import {
  addDays,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  parseISO,
  startOfMonth,
  startOfWeek,
} from "date-fns";

export function getMonthGrid(month: Date) {
  const start = startOfWeek(startOfMonth(month), { weekStartsOn: 1 });
  const end = endOfWeek(endOfMonth(month), { weekStartsOn: 1 });
  const days: Date[] = [];
  for (let day = start; day <= end; day = addDays(day, 1)) {
    days.push(day);
  }
  return days;
}

export function toDateKey(date: Date | string) {
  if (typeof date === "string") {
    return format(parseISO(date), "yyyy-MM-dd");
  }
  return format(date, "yyyy-MM-dd");
}

export function inCurrentMonth(day: Date, month: Date) {
  return isSameMonth(day, month);
}

export function formatFriendlyDate(date: Date | string) {
  if (typeof date === "string") {
    return format(parseISO(date), "EEE, MMM d, yyyy");
  }
  return format(date, "EEE, MMM d, yyyy");
}

export function eachDayInRange(start: string, end: string) {
  const s = parseISO(start);
  const e = parseISO(end);
  const [from, to] = s <= e ? [s, e] : [e, s];
  const days: string[] = [];
  for (let d = from; d <= to; d = addDays(d, 1)) {
    days.push(toDateKey(d));
  }
  return days;
}
