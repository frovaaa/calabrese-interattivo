import { format, parseISO } from "date-fns";
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

  let max = 0;
  for (const counts of summary.values()) {
    max = Math.max(max, counts.available);
  }

  return [...summary.entries()]
    .filter(([, counts]) => counts.available === max)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, counts]) => ({ date, counts }));
}

export function bestRanges(rows: Availability[], lengths: number[]): BestRangeSummary[] {
  if (!rows.length) return [];

  const byDate = buildDailySummary(rows);
  const dates = [...new Set(rows.map((r) => r.date))].sort();
  const results: BestRangeSummary[] = [];

  for (const length of lengths) {
    let best:
      | {
          score: number;
          available: number;
          maybe: number;
          start: string;
          end: string;
        }
      | undefined;

    for (let i = 0; i <= dates.length - length; i++) {
      const slice = dates.slice(i, i + length);
      let totalAvailable = 0;
      let totalMaybe = 0;
      for (const date of slice) {
        const c = byDate.get(date) ?? { available: 0, maybe: 0, unavailable: 0 };
        totalAvailable += c.available;
        totalMaybe += c.maybe;
      }
      // MVP heuristic: "available" is weighted higher than "maybe"
      // using a 2:1 ratio so confirmed availability outranks tentative responses.
      const score = totalAvailable * 2 + totalMaybe;
      if (!best || score > best.score) {
        best = {
          score,
          available: Math.round(totalAvailable / length),
          maybe: Math.round(totalMaybe / length),
          start: slice[0],
          end: slice[slice.length - 1],
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
