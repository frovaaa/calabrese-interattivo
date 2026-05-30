"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBoard } from "@/lib/board";
import { hasSupabaseEnv } from "@/lib/supabase/client";
import type { PlanningType } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

function parseBoardId(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (trimmed.includes("/board/")) {
    const maybeId = trimmed.split("/board/")[1]?.split(/[?#]/)[0];
    return maybeId ?? "";
  }
  return trimmed;
}

export function HomeClient() {
  const router = useRouter();
  const [planningType, setPlanningType] = useState<PlanningType>("generic");
  const [joinInput, setJoinInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const showSupabaseNotice = hasSupabaseEnv === false;

  const create = async () => {
    setLoading(true);
    setError(null);
    try {
      const board = await createBoard(planningType);
      router.push(`/board/${board.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create board");
    } finally {
      setLoading(false);
    }
  };

  const join = () => {
    const boardId = parseBoardId(joinInput);
    if (!boardId) return;
    router.push(`/board/${boardId}`);
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl items-center px-4 py-8 sm:px-6 lg:px-8">
      <Card className="w-full">
        <CardHeader className="space-y-3">
          <div className="inline-flex w-fit items-center rounded-full border border-zinc-200/70 bg-zinc-50 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-zinc-500">
            Simple collaborative planning
          </div>
          <CardTitle className="text-3xl sm:text-4xl">Calabrese Interattivo</CardTitle>
          <p className="max-w-2xl text-sm leading-6 text-zinc-600 sm:text-base">
            Create a clean planning board, drag across dates to mark ranges, and keep the whole group in sync.
          </p>
        </CardHeader>
        <CardContent className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-4 rounded-3xl border border-zinc-200/70 bg-zinc-50/70 p-5">
            <div className="space-y-2">
              <label htmlFor="planning-type" className="text-sm font-medium text-zinc-700">
                Planning type
              </label>
              <select
                id="planning-type"
                className="h-11 w-full rounded-2xl border border-zinc-200/80 bg-white/90 px-4 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20"
                value={planningType}
                onChange={(e) => setPlanningType(e.target.value as PlanningType)}
              >
                <option value="vacation">Vacation / Trip</option>
                <option value="dinner">Dinner / Event</option>
                <option value="study">Study / Work</option>
                <option value="generic">Generic Planning</option>
              </select>
            </div>

            <Button onClick={create} disabled={loading || !hasSupabaseEnv} className="w-full">
              {loading ? "Creating board..." : "Create board"}
            </Button>
            <p className="text-xs text-zinc-500">No account required. You can share the board link after creating it.</p>
          </div>

          <div className="space-y-4 rounded-3xl border border-zinc-200/70 bg-white/70 p-5">
            <div className="space-y-2">
              <label htmlFor="join-board" className="text-sm font-medium text-zinc-700">
                Join a board
              </label>
              <Input
                id="join-board"
                value={joinInput}
                onChange={(e) => setJoinInput(e.target.value)}
                placeholder="Paste board ID or full link"
              />
            </div>
            <Button variant="outline" onClick={join} disabled={!hasSupabaseEnv} className="w-full">
              Join board
            </Button>
            <p className="text-xs text-zinc-500">If you already have a link, paste it here and jump straight in.</p>
          </div>

          {showSupabaseNotice ? (
            <p className="lg:col-span-2 text-sm text-rose-700">
              Configure Supabase env vars in <code>.env.local</code> before using the app.
            </p>
          ) : null}
          {error ? <p className="lg:col-span-2 text-sm text-rose-700">{error}</p> : null}
        </CardContent>
      </Card>
    </main>
  );
}
