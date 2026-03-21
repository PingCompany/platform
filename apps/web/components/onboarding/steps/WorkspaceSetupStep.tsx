"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { Hash } from "lucide-react";

const SUGGESTED_CHANNELS = [
  { name: "engineering", description: "Engineering discussions and updates" },
  { name: "design", description: "Design reviews and feedback" },
  { name: "product", description: "Product roadmap and feature discussions" },
  { name: "random", description: "Water cooler chat and off-topic fun" },
  { name: "announcements", description: "Company-wide announcements" },
  { name: "help", description: "Ask questions and get help" },
];

interface WorkspaceSetupStepProps {
  onNext: () => void;
}

export function WorkspaceSetupStep({ onNext }: WorkspaceSetupStepProps) {
  const [selected, setSelected] = useState<Set<string>>(
    new Set(["engineering", "random", "announcements"]),
  );
  const [saving, setSaving] = useState(false);

  const createDefaultChannels = useMutation(
    api.onboarding.createDefaultChannels,
  );

  const toggle = (name: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(name)) {
        next.delete(name);
      } else {
        next.add(name);
      }
      return next;
    });
  };

  const handleNext = async () => {
    if (selected.size === 0) {
      onNext();
      return;
    }
    setSaving(true);
    try {
      await createDefaultChannels({ channelNames: Array.from(selected) });
      onNext();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-semibold text-foreground">
          Set up your channels
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Channels organize conversations by topic. #general is already created.
          Pick a few more to get started.
        </p>
      </div>

      <div className="space-y-2">
        {/* Show general as always-on */}
        <div className="flex items-center gap-3 rounded-lg border border-subtle bg-surface-2 px-3 py-2.5 opacity-60">
          <Hash className="h-4 w-4 text-ping-purple" />
          <div className="flex-1">
            <p className="text-xs font-medium text-foreground">general</p>
            <p className="text-2xs text-muted-foreground">
              General discussion
            </p>
          </div>
          <span className="text-2xs text-muted-foreground">Default</span>
        </div>

        {SUGGESTED_CHANNELS.map((channel) => (
          <button
            key={channel.name}
            type="button"
            onClick={() => toggle(channel.name)}
            className={`flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors ${
              selected.has(channel.name)
                ? "border-ping-purple bg-ping-purple/10"
                : "border-subtle bg-surface-2 hover:border-white/20"
            }`}
          >
            <Hash
              className={`h-4 w-4 ${selected.has(channel.name) ? "text-ping-purple" : "text-muted-foreground"}`}
            />
            <div className="flex-1">
              <p className="text-xs font-medium text-foreground">
                {channel.name}
              </p>
              <p className="text-2xs text-muted-foreground">
                {channel.description}
              </p>
            </div>
            <div
              className={`flex h-4 w-4 items-center justify-center rounded border ${
                selected.has(channel.name)
                  ? "border-ping-purple bg-ping-purple text-white"
                  : "border-subtle"
              }`}
            >
              {selected.has(channel.name) && (
                <span className="text-2xs">✓</span>
              )}
            </div>
          </button>
        ))}
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
