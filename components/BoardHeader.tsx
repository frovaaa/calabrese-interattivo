"use client";

import { useState } from "react";
import type { Board } from "@/lib/types";
import { updateBoardTitle } from "@/lib/board";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ShareLinkButton } from "@/components/ShareLinkButton";

type Props = {
  board: Board;
  onRefresh: () => Promise<void>;
};

export function BoardHeader(props: Readonly<Props>) {
  const { board, onRefresh } = props;
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
    <div className="flex flex-col gap-4 rounded-3xl border border-white/70 bg-white/85 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.06)] backdrop-blur sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-950">Planning board</h1>
        <ShareLinkButton />
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input value={title} onChange={(e) => setTitle(e.target.value)} />
        <Button onClick={saveTitle} disabled={saving}>
          {saving ? "Saving..." : "Save"}
        </Button>
      </div>
    </div>
  );
}
