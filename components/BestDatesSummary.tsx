import type { Availability, Participant } from "@/lib/types";
import { bestRanges, formatDateRange, topSingleDays } from "@/lib/availability";
import { formatFriendlyDate } from "@/lib/calendar";

type Props = {
  rows: Availability[];
  participants: Participant[];
};

export function BestDatesSummary({ rows, participants }: Props) {
  const bestDays = topSingleDays(rows);
  const ranges = bestRanges(rows, [3, 5, 7]);

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4">
      <h3 className="mb-3 text-lg font-semibold">Best dates summary</h3>
      {bestDays.length ? (
        <div className="mb-4">
          <p className="text-sm font-medium">Best single day option(s)</p>
          <ul className="mt-2 space-y-2 text-sm">
            {bestDays.map((d) => (
              <li key={d.date} className="rounded border border-zinc-200 p-2">
                <div>{formatFriendlyDate(d.date)}</div>
                <div className="text-zinc-600">
                  Available {d.counts.available} • Maybe {d.counts.maybe} • Unavailable {d.counts.unavailable}
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="mb-4 text-sm text-zinc-500">No responses yet.</p>
      )}

      <p className="text-sm font-medium">Suggested multi-day ranges</p>
      <ul className="mt-2 space-y-2 text-sm">
        {ranges.map((r) => (
          <li key={r.label} className="rounded border border-zinc-200 p-2">
            <div className="font-medium">{r.label}</div>
            <div>{formatDateRange(r.start, r.end)}</div>
            <div className="text-zinc-600">
              Avg available {r.available} • Avg maybe {r.maybe} • Group size {participants.length}
            </div>
            <div className="text-zinc-500">Unavailable participants and notes can be reviewed per day in the calendar modal.</div>
          </li>
        ))}
      </ul>
    </div>
  );
}
