"use client";

import { useState } from "react";
import Link from "next/link";
import { Home } from "lucide-react";
import type { Board } from "@/lib/types";
import { updateBoardTitle } from "@/lib/board";
import { Input } from "@/components/ui/input";
import { buttonVariants } from "@/components/ui/button";
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
    const nextTitle = title.trim() || "Untitled Plan";
    if (nextTitle === board.title) {
      setTitle(board.title);
      return;
    }

    setSaving(true);
    try {
      await updateBoardTitle(board.id, nextTitle);
      setTitle(nextTitle);
      await onRefresh();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 rounded-3xl border border-white/70 bg-white/85 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.06)] backdrop-blur sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-950">Planning board</h1>
        <div className="flex flex-wrap gap-2">
          <Link href="/" className={buttonVariants({ variant: "outline" })}>
            <Home className="mr-2 h-4 w-4" />
            Home
          </Link>
          <ShareLinkButton />
        </div>
      </div>
      <div className="space-y-1">
        <Input
          value={title}
          onBlur={saveTitle}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") e.currentTarget.blur();
          }}
        />
        {saving ? <p className="text-xs text-zinc-500">Saving...</p> : null}
      </div>
    </div>
  );
}
