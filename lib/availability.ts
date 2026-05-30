import { addDays, differenceInCalendarDays, format, parseISO } from "date-fns";
import type { Availability, BestRangeSummary, DaySummary, Participant } from "@/lib/types";

export function buildDailySummary(rows: Availability[]) {
  const summary = new Map<string, DaySummary>();
  for (const row of rows) {
    const cur = summary.get(row.date) ?? { available: 0, maybe: 0, unavailable: 0 };
    cur[row.status] += 1;
    summary.set(row.date, cur);
  }
  return summary;
}

export function topSingleDays(rows: Availability[]): Array<{ date: string; counts: DaySummary }> {
  const summary = buildDailySummary(rows);
  if (!summary.size) return [];

  return [...summary.entries()]
    .filter(([, counts]) => counts.unavailable === 0 && counts.available + counts.maybe > 0)
    .sort(([aDate, aCounts], [bDate, bCounts]) => {
      const aScore = aCounts.available * 3 + aCounts.maybe;
      const bScore = bCounts.available * 3 + bCounts.maybe;
      if (bScore !== aScore) return bScore - aScore;
      if (bCounts.available !== aCounts.available) return bCounts.available - aCounts.available;
      if (bCounts.maybe !== aCounts.maybe) return bCounts.maybe - aCounts.maybe;
      return aDate.localeCompare(bDate);
    })
    .map(([date, counts]) => ({ date, counts }));
}

export function bestRanges(rows: Availability[], lengths: number[]): BestRangeSummary[] {
  if (!rows.length) return [];

  const byDate = buildDailySummary(rows);
  const responseDates = [...new Set(rows.map((r) => r.date))].sort();
  const firstDate = parseISO(responseDates[0]);
  const lastDate = parseISO(responseDates[responseDates.length - 1]);
  const results: BestRangeSummary[] = [];

  for (const length of lengths) {
    if (differenceInCalendarDays(lastDate, firstDate) + 1 < length) continue;

    let best:
      | {
          score: number;
          available: number;
          maybe: number;
          start: string;
          end: string;
        }
      | undefined;

    for (let offset = 0; offset <= differenceInCalendarDays(lastDate, firstDate) - length + 1; offset++) {
      const startDate = addDays(firstDate, offset);
      const endDate = addDays(startDate, length - 1);
      let totalAvailable = 0;
      let totalMaybe = 0;
      let hasUnavailable = false;
      let hasMissingPositiveDay = false;

      for (let dayOffset = 0; dayOffset < length; dayOffset++) {
        const date = format(addDays(startDate, dayOffset), "yyyy-MM-dd");
        const c = byDate.get(date) ?? { available: 0, maybe: 0, unavailable: 0 };
        if (c.unavailable > 0) hasUnavailable = true;
        if (c.available + c.maybe === 0) hasMissingPositiveDay = true;
        totalAvailable += c.available;
        totalMaybe += c.maybe;
      }

      if (hasUnavailable || hasMissingPositiveDay) continue;

      // Confirmed availability outranks tentative responses once the range is viable.
      const score = totalAvailable * 3 + totalMaybe;
      if (!best || score > best.score) {
        best = {
          score,
          available: Math.round(totalAvailable / length),
          maybe: Math.round(totalMaybe / length),
          start: format(startDate, "yyyy-MM-dd"),
          end: format(endDate, "yyyy-MM-dd"),
        };
      }
    }

    if (best) {
      results.push({
        label: `Best ${length}-day range`,
        start: best.start,
        end: best.end,
        available: best.available,
        maybe: best.maybe,
        unavailablePeople: [],
      });
    }
  }

  return results;
}

export function participantResponsesForDate(
  rows: Availability[],
  participants: Participant[],
  date: string,
) {
  const map = new Map(participants.map((p) => [p.id, p]));
  return rows
    .filter((r) => r.date === date)
    .map((r) => ({
      ...r,
      participantName: map.get(r.participant_id)?.name ?? "Unknown",
    }))
    .sort((a, b) => a.participantName.localeCompare(b.participantName));
}

export function formatDateRange(start: string, end: string) {
  return `${format(parseISO(start), "MMM d")} - ${format(parseISO(end), "MMM d, yyyy")}`;
}
