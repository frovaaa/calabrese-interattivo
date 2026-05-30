"use client";

import { useState } from "react";
import type { SyntheticEvent } from "react";
import type { ParticipantPreferencesInput } from "@/lib/types";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

type Props = {
  initialValues: ParticipantPreferencesInput;
  onSave: (values: ParticipantPreferencesInput) => Promise<void>;
};

export function ParticipantPreferencesForm(props: Readonly<Props>) {
  const { initialValues, onSave } = props;
  const [values, setValues] = useState(initialValues);
  const [saving, setSaving] = useState(false);

  const update = (key: keyof ParticipantPreferencesInput, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value || null }));
  };

  const submit = async (e: SyntheticEvent<HTMLFormElement>) => {
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
      <Textarea
        placeholder="Constraints"
        value={values.constraints ?? ""}
        onChange={(e) => update("constraints", e.target.value)}
      />
      <Textarea
        placeholder="General notes"
        value={values.general_notes ?? ""}
        onChange={(e) => update("general_notes", e.target.value)}
      />
      <Button type="submit" disabled={saving} className="w-full">
        {saving ? "Saving..." : "Save preferences"}
      </Button>
    </form>
  );
}
