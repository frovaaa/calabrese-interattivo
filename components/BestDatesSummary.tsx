"use client";

import { useCallback, useMemo, useState } from "react";
import { Copy, Printer, ScanSearch } from "lucide-react";
import type { Availability, Participant } from "@/lib/types";
import { bestRanges, buildDailySummary, formatDateRange, topSingleDays } from "@/lib/availability";
import { formatFriendlyDate } from "@/lib/calendar";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type Props = {
  rows: Availability[];
  participants: Participant[];
  boardTitle: string;
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function BestDatesSummary(props: Readonly<Props>) {
  const { rows, participants, boardTitle } = props;
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const bestDays = topSingleDays(rows);
  const ranges = bestRanges(rows, [3, 5, 7]);
  const featuredDay = bestDays[0] ?? null;
  const secondaryDays = bestDays.slice(1, 4);
  const dailySummary = useMemo(() => buildDailySummary(rows), [rows]);
  const dates = useMemo(() => [...new Set(rows.map((row) => row.date))].sort(), [rows]);
  const topChoice = useMemo(() => {
    return dates
      .map((date) => {
        const counts = dailySummary.get(date) ?? { available: 0, maybe: 0, unavailable: 0 };
        return {
          date,
          counts,
          score: counts.available * 3 + counts.maybe - counts.unavailable,
        };
      })
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        if (b.counts.available !== a.counts.available) return b.counts.available - a.counts.available;
        if (b.counts.maybe !== a.counts.maybe) return b.counts.maybe - a.counts.maybe;
        return a.date.localeCompare(b.date);
      })[0];
  }, [dailySummary, dates]);
  const participantNameById = useMemo(
    () => new Map(participants.map((participant) => [participant.id, participant.name])),
    [participants],
  );

  const rowsForDate = useCallback(
    (date: string) =>
      rows
        .filter((row) => row.date === date)
        .sort((a, b) => {
          const left = participantNameById.get(a.participant_id) ?? "";
          const right = participantNameById.get(b.participant_id) ?? "";
          return left.localeCompare(right);
        }),
    [participantNameById, rows],
  );

  const namesForDate = useCallback(
    (date: string, status: Availability["status"]) => {
      const names = rowsForDate(date)
        .filter((row) => row.status === status)
        .map((row) => participantNameById.get(row.participant_id) ?? "Unknown");
      return names.length ? names.join(", ") : "None";
    },
    [participantNameById, rowsForDate],
  );

  const exportText = useMemo(() => {
    const lines = [`${boardTitle} availability`, ""];
    if (!dates.length) {
      lines.push("No availability responses yet.");
      return lines.join("\n");
    }

    if (topChoice) {
      lines.push(`Top choice: ${formatFriendlyDate(topChoice.date)}`);
      lines.push(
        `Available ${topChoice.counts.available} | Maybe ${topChoice.counts.maybe} | Unavailable ${topChoice.counts.unavailable}`,
      );
      lines.push("");
    }

    for (const date of dates) {
      const counts = dailySummary.get(date) ?? { available: 0, maybe: 0, unavailable: 0 };
      lines.push(formatFriendlyDate(date));
      lines.push(`Available (${counts.available}): ${namesForDate(date, "available")}`);
      lines.push(`Maybe (${counts.maybe}): ${namesForDate(date, "maybe")}`);
      lines.push(`Unavailable (${counts.unavailable}): ${namesForDate(date, "unavailable")}`);

      const notes = rowsForDate(date)
        .filter((row) => row.note)
        .map((row) => `${participantNameById.get(row.participant_id) ?? "Unknown"}: ${row.note}`);
      if (notes.length) lines.push(`Notes: ${notes.join(" | ")}`);
      lines.push("");
    }

    return lines.join("\n").trim();
  }, [boardTitle, dailySummary, dates, namesForDate, participantNameById, rowsForDate, topChoice]);

  const copySummary = async () => {
    await navigator.clipboard.writeText(exportText);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  const printSummary = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const tableRows = dates
      .map((date) => {
        const counts = dailySummary.get(date) ?? { available: 0, maybe: 0, unavailable: 0 };
        const notes = rowsForDate(date)
          .filter((row) => row.note)
          .map(
            (row) =>
              `<div><strong>${escapeHtml(participantNameById.get(row.participant_id) ?? "Unknown")}:</strong> ${escapeHtml(row.note ?? "")}</div>`,
          )
          .join("");

        return `
          <tr>
            <td class="date">${escapeHtml(formatFriendlyDate(date))}</td>
            <td><span class="pill available">${counts.available}</span><div>${escapeHtml(namesForDate(date, "available"))}</div></td>
            <td><span class="pill maybe">${counts.maybe}</span><div>${escapeHtml(namesForDate(date, "maybe"))}</div></td>
            <td><span class="pill unavailable">${counts.unavailable}</span><div>${escapeHtml(namesForDate(date, "unavailable"))}</div></td>
            <td>${notes || '<span class="muted">None</span>'}</td>
          </tr>
        `;
      })
      .join("");
    const topChoiceMarkup = topChoice
      ? `
        <section class="recommendation">
          <div>
            <div class="label">Top choice</div>
            <h2>${escapeHtml(formatFriendlyDate(topChoice.date))}</h2>
            <p>Best score from availability responses.</p>
          </div>
          <div class="recommendationCounts">
            <span class="pill available">Available ${topChoice.counts.available}</span>
            <span class="pill maybe">Maybe ${topChoice.counts.maybe}</span>
            <span class="pill unavailable">Unavailable ${topChoice.counts.unavailable}</span>
          </div>
        </section>
      `
      : "";

    printWindow.document.open();
    printWindow.document.write(`
      <!doctype html>
      <html>
        <head>
          <title>${escapeHtml(boardTitle)} availability</title>
          <style>
            * { box-sizing: border-box; }
            body {
              margin: 32px;
              color: #18181b;
              font-family: Arial, Helvetica, sans-serif;
              font-size: 13px;
              line-height: 1.45;
            }
            h1 {
              margin: 0;
              font-size: 26px;
              line-height: 1.15;
            }
            .subtitle {
              margin: 8px 0 24px;
              color: #52525b;
            }
            .stats {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 12px;
              margin-bottom: 24px;
            }
            .recommendation {
              display: flex;
              align-items: flex-start;
              justify-content: space-between;
              gap: 20px;
              margin-bottom: 24px;
              border: 2px solid #18181b;
              border-radius: 14px;
              padding: 16px;
              background: #fafafa;
            }
            .recommendation h2 {
              margin: 6px 0 4px;
              font-size: 22px;
            }
            .recommendation p {
              margin: 0;
              color: #52525b;
            }
            .recommendationCounts {
              display: flex;
              flex-wrap: wrap;
              gap: 8px;
              justify-content: flex-end;
              min-width: 220px;
            }
            .stat {
              border: 1px solid #e4e4e7;
              border-radius: 12px;
              padding: 14px;
              background: #fafafa;
            }
            .label {
              color: #71717a;
              font-size: 11px;
              font-weight: 700;
              letter-spacing: 0.08em;
              text-transform: uppercase;
            }
            .value {
              margin-top: 4px;
              font-size: 24px;
              font-weight: 700;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              table-layout: fixed;
            }
            th, td {
              border: 1px solid #e4e4e7;
              padding: 10px;
              text-align: left;
              vertical-align: top;
              overflow-wrap: anywhere;
            }
            th {
              background: #f4f4f5;
              color: #52525b;
              font-size: 11px;
              letter-spacing: 0.08em;
              text-transform: uppercase;
            }
            .date {
              width: 18%;
              font-weight: 700;
            }
            .pill {
              display: inline-block;
              min-width: 28px;
              margin-bottom: 6px;
              border-radius: 999px;
              padding: 2px 8px;
              font-size: 11px;
              font-weight: 700;
            }
            .available { background: #dcfce7; color: #166534; }
            .maybe { background: #fef3c7; color: #92400e; }
            .unavailable { background: #ffe4e6; color: #9f1239; }
            .muted { color: #a1a1aa; }
            @page { margin: 18mm; }
            @media print {
              body { margin: 0; }
              .stat, table, tr { break-inside: avoid; }
            }
          </style>
        </head>
        <body>
          <h1>${escapeHtml(boardTitle)} availability</h1>
          <p class="subtitle">${participants.length} people &middot; ${dates.length} dates with responses &middot; ${rows.length} responses</p>
          ${topChoiceMarkup}
          <section class="stats">
            <div class="stat"><div class="label">People</div><div class="value">${participants.length}</div></div>
            <div class="stat"><div class="label">Dates</div><div class="value">${dates.length}</div></div>
            <div class="stat"><div class="label">Responses</div><div class="value">${rows.length}</div></div>
          </section>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Available</th>
                <th>Maybe</th>
                <th>Unavailable</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>${tableRows}</tbody>
          </table>
          <script>
            window.addEventListener("load", () => {
              window.focus();
              window.print();
            });
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="rounded-3xl border border-white/70 bg-white/85 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.06)] backdrop-blur">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold tracking-tight text-zinc-950">Best dates</h3>
          <p className="text-sm text-zinc-600">A quick recap of the strongest options.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => setOpen(true)} disabled={!rows.length}>
            <ScanSearch className="mr-2 h-4 w-4" />
            Open export
          </Button>
          <div className="rounded-full border border-zinc-200/70 bg-zinc-50 px-3 py-1 text-xs font-medium text-zinc-500">
            {participants.length} people
          </div>
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

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[88dvh] max-w-5xl overflow-hidden p-0">
          <div data-print-area className="max-h-[88dvh] overflow-auto bg-white p-5 sm:p-6">
            <DialogHeader data-print-hidden className="mb-5">
              <div className="flex flex-wrap items-start justify-between gap-3 pr-8">
                <div>
                  <DialogTitle>{boardTitle} availability</DialogTitle>
                  <DialogDescription className="mt-1">
                    Full view for sharing, printing, or saving as PDF.
                  </DialogDescription>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={copySummary}>
                    <Copy className="mr-2 h-4 w-4" />
                    {copied ? "Copied" : "Copy"}
                  </Button>
                  <Button size="sm" onClick={printSummary}>
                    <Printer className="mr-2 h-4 w-4" />
                    Print / PDF
                  </Button>
                </div>
              </div>
            </DialogHeader>

            <div className="mb-5 hidden print:block">
              <h1 className="text-2xl font-semibold text-zinc-950">{boardTitle} availability</h1>
              <p className="mt-1 text-sm text-zinc-600">
                {participants.length} people · {dates.length} dates with responses
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">People</div>
                <div className="mt-2 text-2xl font-semibold text-zinc-950">{participants.length}</div>
              </div>
              <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">Dates</div>
                <div className="mt-2 text-2xl font-semibold text-zinc-950">{dates.length}</div>
              </div>
              <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">Responses</div>
                <div className="mt-2 text-2xl font-semibold text-zinc-950">{rows.length}</div>
              </div>
            </div>

            {topChoice ? (
              <div className="mt-5 rounded-2xl border-2 border-zinc-950 bg-zinc-50 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">Top choice</div>
                    <div className="mt-2 text-xl font-semibold text-zinc-950">
                      {formatFriendlyDate(topChoice.date)}
                    </div>
                    <p className="mt-1 text-sm text-zinc-600">Best score from availability responses.</p>
                  </div>
                  <div className="flex flex-wrap gap-2 text-sm">
                    <span className="rounded-full bg-emerald-50 px-3 py-1 font-medium text-emerald-700">
                      Available {topChoice.counts.available}
                    </span>
                    <span className="rounded-full bg-amber-50 px-3 py-1 font-medium text-amber-700">
                      Maybe {topChoice.counts.maybe}
                    </span>
                    <span className="rounded-full bg-rose-50 px-3 py-1 font-medium text-rose-700">
                      Unavailable {topChoice.counts.unavailable}
                    </span>
                  </div>
                </div>
              </div>
            ) : null}

            <div className="mt-5 overflow-x-auto rounded-2xl border border-zinc-200">
              <table className="w-full min-w-[760px] border-collapse text-left text-sm">
                <thead className="bg-zinc-50 text-xs uppercase tracking-[0.14em] text-zinc-500">
                  <tr>
                    <th className="w-48 px-4 py-3 font-semibold">Date</th>
                    <th className="px-4 py-3 font-semibold">Available</th>
                    <th className="px-4 py-3 font-semibold">Maybe</th>
                    <th className="px-4 py-3 font-semibold">Unavailable</th>
                    <th className="px-4 py-3 font-semibold">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200">
                  {dates.map((date) => {
                    const counts = dailySummary.get(date) ?? { available: 0, maybe: 0, unavailable: 0 };
                    const notes = rowsForDate(date).filter((row) => row.note);

                    return (
                      <tr key={date} className="align-top">
                        <td className="px-4 py-4 font-medium text-zinc-950">{formatFriendlyDate(date)}</td>
                        <td className="px-4 py-4 text-zinc-700">
                          <span className="mb-2 inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                            {counts.available}
                          </span>
                          <div>{namesForDate(date, "available")}</div>
                        </td>
                        <td className="px-4 py-4 text-zinc-700">
                          <span className="mb-2 inline-flex rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                            {counts.maybe}
                          </span>
                          <div>{namesForDate(date, "maybe")}</div>
                        </td>
                        <td className="px-4 py-4 text-zinc-700">
                          <span className="mb-2 inline-flex rounded-full bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700">
                            {counts.unavailable}
                          </span>
                          <div>{namesForDate(date, "unavailable")}</div>
                        </td>
                        <td className="px-4 py-4 text-zinc-600">
                          {notes.length ? (
                            <div className="space-y-2">
                              {notes.map((row) => (
                                <div key={row.id}>
                                  <span className="font-medium text-zinc-800">
                                    {participantNameById.get(row.participant_id) ?? "Unknown"}:
                                  </span>{" "}
                                  {row.note}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-zinc-400">None</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
