"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { Hash } from "lucide-react";
import { Id } from "@convex/_generated/dataModel";

interface ChannelSelectionStepProps {
  onNext: () => void;
}

export function ChannelSelectionStep({ onNext }: ChannelSelectionStepProps) {
  const channels = useQuery(api.channels.list);
  const joinChannel = useMutation(api.channels.join);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  const availableChannels = channels?.filter(
    (c) => !c.isMember && !c.isArchived,
  );

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
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
      for (const channelId of selected) {
        await joinChannel({
          channelId: channelId as Id<"channels">,
        });
      }
      onNext();
    } finally {
      setSaving(false);
    }
  };

  if (!channels) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-ping-purple border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-semibold text-foreground">
          Join channels
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          You&apos;re already in #general. Pick more channels to follow.
        </p>
      </div>

      {/* Already a member */}
      {channels.filter((c) => c.isMember).map((channel) => (
        <div
          key={channel._id}
          className="flex items-center gap-3 rounded-lg border border-subtle bg-surface-2 px-3 py-2.5 opacity-60"
        >
          <Hash className="h-4 w-4 text-ping-purple" />
          <div className="flex-1">
            <p className="text-xs font-medium text-foreground">
              {channel.name}
            </p>
            {channel.description && (
              <p className="text-2xs text-muted-foreground">
                {channel.description}
              </p>
            )}
          </div>
          <span className="text-2xs text-muted-foreground">Joined</span>
        </div>
      ))}

      {/* Available to join */}
      {availableChannels && availableChannels.length > 0 && (
        <div className="space-y-2">
          {availableChannels.map((channel) => (
            <button
              key={channel._id}
              type="button"
              onClick={() => toggle(channel._id)}
              className={`flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors ${
                selected.has(channel._id)
                  ? "border-ping-purple bg-ping-purple/10"
                  : "border-subtle bg-surface-2 hover:border-white/20"
              }`}
            >
              <Hash
                className={`h-4 w-4 ${selected.has(channel._id) ? "text-ping-purple" : "text-muted-foreground"}`}
              />
              <div className="flex-1">
                <p className="text-xs font-medium text-foreground">
                  {channel.name}
                </p>
                {channel.description && (
                  <p className="text-2xs text-muted-foreground">
                    {channel.description}
                  </p>
                )}
              </div>
              <div
                className={`flex h-4 w-4 items-center justify-center rounded border ${
                  selected.has(channel._id)
                    ? "border-ping-purple bg-ping-purple text-white"
                    : "border-subtle"
                }`}
              >
                {selected.has(channel._id) && (
                  <span className="text-2xs">✓</span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {availableChannels && availableChannels.length === 0 && (
        <p className="py-4 text-center text-xs text-muted-foreground">
          No additional channels available yet.
        </p>
      )}

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
          {saving ? "Joining…" : "Continue"}
        </Button>
      </div>
    </div>
  );
}
