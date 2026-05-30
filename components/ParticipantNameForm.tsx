"use client";

import { useState } from "react";
import type { SyntheticEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const MAX_NAME_LENGTH = 80;

type Props = {
  initialName?: string;
  submitLabel: string;
  onSubmit: (name: string) => Promise<void>;
};

export function ParticipantNameForm(props: Readonly<Props>) {
  const { initialName = "", submitLabel, onSubmit } = props;
  const [name, setName] = useState(initialName);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    try {
      await onSubmit(name.trim());
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <Input
        placeholder="Your name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        maxLength={MAX_NAME_LENGTH}
        required
      />
      <Button type="submit" disabled={!name.trim() || loading} className="w-full">
        {loading ? "Saving..." : submitLabel}
      </Button>
    </form>
  );
}
