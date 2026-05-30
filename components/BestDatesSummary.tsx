import type { Availability, Participant } from "@/lib/types";
import { bestRanges, formatDateRange, topSingleDays } from "@/lib/availability";
import { formatFriendlyDate } from "@/lib/calendar";

type Props = {
  rows: Availability[];
  participants: Participant[];
};

export function BestDatesSummary(props: Readonly<Props>) {
  const { rows, participants } = props;
  const bestDays = topSingleDays(rows);
  const ranges = bestRanges(rows, [3, 5, 7]);

  return (
    <div className="rounded-3xl border border-white/70 bg-white/85 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.06)] backdrop-blur">
      <h3 className="mb-4 text-lg font-semibold tracking-tight text-zinc-950">Best dates</h3>
      {bestDays.length ? (
        <div className="mb-4">
          <p className="text-sm font-medium text-zinc-700">Single-day picks</p>
          <ul className="mt-3 space-y-2 text-sm">
            {bestDays.map((d) => (
              <li key={d.date} className="rounded-2xl border border-zinc-200/70 bg-zinc-50/70 p-3">
                <div className="font-medium text-zinc-950">{formatFriendlyDate(d.date)}</div>
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

      <p className="text-sm font-medium text-zinc-700">Suggested ranges</p>
      <ul className="mt-3 space-y-2 text-sm">
        {ranges.map((r) => (
          <li key={r.label} className="rounded-2xl border border-zinc-200/70 bg-zinc-50/70 p-3">
            <div className="font-medium text-zinc-950">{r.label}</div>
            <div className="text-zinc-700">{formatDateRange(r.start, r.end)}</div>
            <div className="text-zinc-600">
              Avg available {r.available} • Avg maybe {r.maybe} • Group size {participants.length}
            </div>
            <p className="text-zinc-500">
              Unavailable participants and notes can be reviewed per day in the calendar modal.
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
