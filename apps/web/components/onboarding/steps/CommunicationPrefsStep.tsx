"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useMutation } from "convex/react";
import { api } from "@convex/_generated/api";

const RESPONSE_TIME_OPTIONS = [
  "Within 1 hour",
  "Within 4 hours",
  "Same day",
  "No preference",
];

interface CommunicationPrefsStepProps {
  onNext: () => void;
}

export function CommunicationPrefsStep({
  onNext,
}: CommunicationPrefsStepProps) {
  const [timezone, setTimezone] = useState("");
  const [preferredHours, setPreferredHours] = useState("9am-5pm");
  const [responseTimeGoal, setResponseTimeGoal] = useState("Within 4 hours");
  const [saving, setSaving] = useState(false);

  const saveCommunicationPrefs = useMutation(
    api.onboarding.saveCommunicationPrefs,
  );

  useEffect(() => {
    try {
      setTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone);
    } catch {
      setTimezone("UTC");
    }
  }, []);

  const handleNext = async () => {
    setSaving(true);
    try {
      await saveCommunicationPrefs({
        communicationPrefs: {
          timezone: timezone || undefined,
          preferredHours: preferredHours || undefined,
          responseTimeGoal: responseTimeGoal || undefined,
        },
      });
      onNext();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-semibold text-foreground">
          Communication preferences
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Help PING time alerts and batch non-urgent items around your schedule.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="mb-1.5 block text-2xs font-medium uppercase tracking-widest text-white/40">
            Timezone
          </label>
          <Input
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            placeholder="e.g. America/New_York"
            className="border-subtle bg-surface-2"
          />
          <p className="mt-1 text-2xs text-muted-foreground">
            Auto-detected from your browser
          </p>
        </div>

        <div>
          <label className="mb-1.5 block text-2xs font-medium uppercase tracking-widest text-white/40">
            Preferred working hours
          </label>
          <Input
            value={preferredHours}
            onChange={(e) => setPreferredHours(e.target.value)}
            placeholder="e.g. 9am-5pm"
            className="border-subtle bg-surface-2"
          />
        </div>

        <div>
          <label className="mb-2 block text-2xs font-medium uppercase tracking-widest text-white/40">
            Response time goal
          </label>
          <div className="flex flex-wrap gap-2">
            {RESPONSE_TIME_OPTIONS.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setResponseTimeGoal(option)}
                className={`rounded-md border px-3 py-1.5 text-xs transition-colors ${
                  responseTimeGoal === option
                    ? "border-ping-purple bg-ping-purple/15 text-ping-purple"
                    : "border-subtle bg-surface-2 text-muted-foreground hover:border-white/20"
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={onNext}
          className="text-xs text-muted-foreground"
        >
          Skip
        </Button>
        <Button
          size="sm"
          onClick={handleNext}
          disabled={saving}
          className="bg-ping-purple px-6 text-xs text-white hover:bg-ping-purple/90"
        >
          {saving ? "Saving…" : "Continue"}
        </Button>
      </div>
    </div>
  );
}
