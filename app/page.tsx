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

export default function HomePage() {
  const router = useRouter();
  const [planningType, setPlanningType] = useState<PlanningType>("generic");
  const [joinInput, setJoinInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    <main className="mx-auto flex min-h-screen w-full max-w-3xl items-center p-4 sm:p-6">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-2xl">Calabrese Interattivo</CardTitle>
          <p className="text-sm text-zinc-600">
            A lightweight collaborative planner to find the best dates for trips, vacations, dinners,
            study sessions, meetings, and events.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">Planning type</label>
            <select
              className="h-10 w-full rounded-md border border-zinc-300 bg-white px-3 text-sm"
              value={planningType}
              onChange={(e) => setPlanningType(e.target.value as PlanningType)}
            >
              <option value="vacation">Vacation / Trip</option>
              <option value="dinner">Dinner / Event</option>
              <option value="study">Study / Work</option>
              <option value="generic">Generic Planning</option>
            </select>
            <Button onClick={create} disabled={loading || !hasSupabaseEnv} className="w-full sm:w-auto">
              {loading ? "Creating board..." : "Create new planning board"}
            </Button>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Join an existing board (ID or link)</label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                value={joinInput}
                onChange={(e) => setJoinInput(e.target.value)}
                placeholder="Paste board ID or full link"
              />
              <Button variant="outline" onClick={join} disabled={!hasSupabaseEnv}>
                Join
              </Button>
            </div>
          </div>

          {!hasSupabaseEnv ? (
            <p className="text-sm text-rose-700">
              Configure Supabase env vars in <code>.env.local</code> before using the app.
            </p>
          ) : null}
          {error ? <p className="text-sm text-rose-700">{error}</p> : null}
        </CardContent>
      </Card>
    </main>
  );
}
