"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { Brain, Zap, Bell } from "lucide-react";

interface AiPrefsStepProps {
  onNext: () => void;
}

export function AiPrefsStep({ onNext }: AiPrefsStepProps) {
  const [summaryDetail, setSummaryDetail] = useState<"concise" | "detailed">(
    "concise",
  );
  const [proactiveLevel, setProactiveLevel] = useState<
    "minimal" | "balanced" | "aggressive"
  >("balanced");
  const [autoTriage, setAutoTriage] = useState(true);
  const [saving, setSaving] = useState(false);

  const saveAiPrefs = useMutation(api.onboarding.saveAiPrefs);

  const handleNext = async () => {
    setSaving(true);
    try {
      await saveAiPrefs({
        aiPrefs: { summaryDetail, proactiveLevel, autoTriage },
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
          AI preferences
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Customize how PING&apos;s AI assists you. You can change these anytime
          in settings.
        </p>
      </div>

      <div className="space-y-5">
        {/* Summary detail */}
        <div>
          <label className="mb-2 flex items-center gap-2 text-2xs font-medium uppercase tracking-widest text-white/40">
            <Brain className="h-3.5 w-3.5" />
            Inbox summary detail
          </label>
          <div className="grid grid-cols-2 gap-2">
            {(["concise", "detailed"] as const).map((level) => (
              <button
                key={level}
                type="button"
                onClick={() => setSummaryDetail(level)}
                className={`rounded-lg border px-3 py-3 text-left transition-colors ${
                  summaryDetail === level
                    ? "border-ping-purple bg-ping-purple/10"
                    : "border-subtle bg-surface-2 hover:border-white/20"
                }`}
              >
                <p className="text-xs font-medium capitalize text-foreground">
                  {level}
                </p>
                <p className="mt-0.5 text-2xs text-muted-foreground">
                  {level === "concise"
                    ? "Short bullet points, just the essentials"
                    : "Detailed summaries with full context"}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Proactive level */}
        <div>
          <label className="mb-2 flex items-center gap-2 text-2xs font-medium uppercase tracking-widest text-white/40">
            <Bell className="h-3.5 w-3.5" />
            Proactive alert level
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(
              [
                {
                  value: "minimal",
                  label: "Minimal",
                  desc: "Only urgent items",
                },
                {
                  value: "balanced",
                  label: "Balanced",
                  desc: "Smart mix of alerts",
                },
                {
                  value: "aggressive",
                  label: "Aggressive",
                  desc: "Surface everything",
                },
              ] as const
            ).map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setProactiveLevel(option.value)}
                className={`rounded-lg border px-3 py-3 text-left transition-colors ${
                  proactiveLevel === option.value
                    ? "border-ping-purple bg-ping-purple/10"
                    : "border-subtle bg-surface-2 hover:border-white/20"
                }`}
              >
                <p className="text-xs font-medium text-foreground">
                  {option.label}
                </p>
                <p className="mt-0.5 text-2xs text-muted-foreground">
                  {option.desc}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Auto triage */}
        <div className="flex items-center justify-between rounded-lg border border-subtle bg-surface-2 px-3 py-3">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-ping-purple" />
            <div>
              <p className="text-xs font-medium text-foreground">
                Auto-triage inbox
              </p>
              <p className="text-2xs text-muted-foreground">
                Automatically prioritize messages using the Eisenhower Matrix
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setAutoTriage(!autoTriage)}
            className={`relative h-5 w-9 rounded-full transition-colors ${
              autoTriage ? "bg-ping-purple" : "bg-white/10"
            }`}
          >
            <span
              className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${
                autoTriage ? "translate-x-4" : "translate-x-0.5"
              }`}
            />
          </button>
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
