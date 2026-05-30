"use client";

import { useState } from "react";
import type { ParticipantPreferencesInput } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

type Props = {
  initialValues: ParticipantPreferencesInput;
  onSave: (values: ParticipantPreferencesInput) => Promise<void>;
};

export function ParticipantPreferencesForm({ initialValues, onSave }: Props) {
  const [values, setValues] = useState(initialValues);
  const [saving, setSaving] = useState(false);

  const update = (key: keyof ParticipantPreferencesInput, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value || null }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave(values);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="grid gap-3">
      <Input
        placeholder="Preferred destinations"
        value={values.preferred_destinations ?? ""}
        onChange={(e) => update("preferred_destinations", e.target.value)}
      />
      <Input
        placeholder="Maximum budget"
        value={values.max_budget ?? ""}
        onChange={(e) => update("max_budget", e.target.value)}
      />
      <Input
        placeholder="Preferred duration (e.g. 3-5 days)"
        value={values.preferred_duration ?? ""}
        onChange={(e) => update("preferred_duration", e.target.value)}
      />
      <Input
        placeholder="Transportation preferences"
        value={values.transport_preferences ?? ""}
        onChange={(e) => update("transport_preferences", e.target.value)}
      />
      <Input
        placeholder="Accommodation preferences"
        value={values.accommodation_preferences ?? ""}
        onChange={(e) => update("accommodation_preferences", e.target.value)}
      />
      <Textarea
        placeholder="General notes and constraints"
        value={values.general_notes ?? ""}
        onChange={(e) => update("general_notes", e.target.value)}
      />
      <Button type="submit" disabled={saving}>
        {saving ? "Saving..." : "Save preferences"}
      </Button>
    </form>
  );
}
