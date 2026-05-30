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
  const featuredDay = bestDays[0] ?? null;
  const secondaryDays = bestDays.slice(1, 4);

  return (
    <div className="rounded-3xl border border-white/70 bg-white/85 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.06)] backdrop-blur">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold tracking-tight text-zinc-950">Best dates</h3>
          <p className="text-sm text-zinc-600">A quick recap of the strongest options.</p>
        </div>
        <div className="rounded-full border border-zinc-200/70 bg-zinc-50 px-3 py-1 text-xs font-medium text-zinc-500">
          {participants.length} people
        </div>
      </div>

      {featuredDay ? (
        <div className="mt-5 grid gap-3 lg:grid-cols-[1.35fr_0.65fr]">
          <div className="rounded-3xl border border-zinc-200/70 bg-zinc-950 p-4 text-white shadow-[0_18px_40px_rgba(15,23,42,0.18)]">
            <p className="text-xs uppercase tracking-[0.2em] text-white/60">Top single day</p>
            <div className="mt-2 text-2xl font-semibold tracking-tight">{formatFriendlyDate(featuredDay.date)}</div>
            <div className="mt-3 flex flex-wrap gap-2 text-sm text-white/85">
              <span className="rounded-full bg-white/10 px-3 py-1">Available {featuredDay.counts.available}</span>
              <span className="rounded-full bg-white/10 px-3 py-1">Maybe {featuredDay.counts.maybe}</span>
              <span className="rounded-full bg-white/10 px-3 py-1">Unavailable {featuredDay.counts.unavailable}</span>
            </div>
          </div>

          <div className="grid gap-2">
            {secondaryDays.length ? (
              secondaryDays.map((day) => (
                <div key={day.date} className="rounded-3xl border border-zinc-200/70 bg-zinc-50/70 p-4">
                  <div className="text-sm font-medium text-zinc-950">{formatFriendlyDate(day.date)}</div>
                  <div className="mt-1 text-sm text-zinc-600">
                    A {day.counts.available} · M {day.counts.maybe} · U {day.counts.unavailable}
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-3xl border border-dashed border-zinc-200/80 bg-zinc-50/50 p-4 text-sm text-zinc-500">
                More responses will build this list.
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="mt-5 rounded-3xl border border-dashed border-zinc-200/80 bg-zinc-50/50 p-5 text-sm text-zinc-500">
          No responses yet. The best-dates recap will appear once people start marking availability.
        </div>
      )}

      <div className="mt-5 grid gap-2 sm:grid-cols-3">
        {ranges.map((range) => (
          <div key={range.label} className="rounded-3xl border border-zinc-200/70 bg-white p-4">
            <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">{range.label}</div>
            <div className="mt-2 font-medium text-zinc-950">{formatDateRange(range.start, range.end)}</div>
            <div className="mt-1 text-sm text-zinc-600">
              Avg available {range.available} · Maybe {range.maybe}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
