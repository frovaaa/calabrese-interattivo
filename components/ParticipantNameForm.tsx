"use client";

import { useState } from "react";
import type { SyntheticEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const MAX_NAME_LENGTH = 80;

type Props = {
  initialName?: string;
  saveOnBlur?: boolean;
  submitLabel: string;
  onSubmit: (name: string) => Promise<void>;
};

export function ParticipantNameForm(props: Readonly<Props>) {
  const { initialName = "", saveOnBlur = false, submitLabel, onSubmit } = props;
  const [name, setName] = useState(initialName);
  const [savedName, setSavedName] = useState(initialName);
  const [loading, setLoading] = useState(false);

  const saveName = async () => {
    const nextName = name.trim();
    if (!nextName) {
      setName(savedName);
      return;
    }
    if (nextName === savedName) return;

    setLoading(true);
    try {
      await onSubmit(nextName);
      setName(nextName);
      setSavedName(nextName);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    await saveName();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <Input
        placeholder="Your name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onBlur={saveOnBlur ? saveName : undefined}
        onKeyDown={(e) => {
          if (saveOnBlur && e.key === "Enter") e.currentTarget.blur();
        }}
        maxLength={MAX_NAME_LENGTH}
        required
      />
      {saveOnBlur ? (
        loading ? <p className="text-xs text-zinc-500">Saving...</p> : null
      ) : (
        <Button type="submit" disabled={!name.trim() || loading} className="w-full">
          {loading ? "Saving..." : submitLabel}
        </Button>
      )}
    </form>
  );
}
