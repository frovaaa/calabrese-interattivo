"use client";

import { useState } from "react";
import type { Board } from "@/lib/types";
import { updateBoardTitle } from "@/lib/board";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ShareLinkButton } from "@/components/ShareLinkButton";

const planningTypeLabel: Record<Board["planning_type"], string> = {
  vacation: "Vacation / Trip",
  dinner: "Dinner / Event",
  study: "Study / Work",
  generic: "Generic Planning",
};

type Props = {
  board: Board;
  onRefresh: () => Promise<void>;
};

export function BoardHeader({ board, onRefresh }: Props) {
  const [title, setTitle] = useState(board.title);
  const [saving, setSaving] = useState(false);

  const saveTitle = async () => {
    setSaving(true);
    try {
      await updateBoardTitle(board.id, title);
      await onRefresh();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">Planning board</h1>
        <ShareLinkButton />
      </div>
      <div className="flex gap-2">
        <Input value={title} onChange={(e) => setTitle(e.target.value)} />
        <Button onClick={saveTitle} disabled={saving}>
          {saving ? "Saving..." : "Save"}
        </Button>
      </div>
      <p className="text-sm text-zinc-600">Type: {planningTypeLabel[board.planning_type]}</p>
    </div>
  );
}
