"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { PenLine, X, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/lib/utils";

interface DraftReminderCardProps {
  draftId: string;
  channelId: string;
  channelName: string;
  body: string;
  suggestedCompletion?: string;
  updatedAt: Date;
  onDismiss?: (draftId: string) => void;
}

export function DraftReminderCard({
  draftId,
  channelId,
  channelName,
  body,
  suggestedCompletion,
  updatedAt,
  onDismiss,
}: DraftReminderCardProps) {
  const [hovered, setHovered] = useState(false);
  const router = useRouter();

  return (
    <div
      className={cn(
        "group relative flex gap-3 border-b border-subtle px-4 py-4",
        "cursor-default transition-colors duration-75",
        hovered ? "bg-surface-2" : "bg-transparent"
      )}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Amber left border = "Important" quadrant */}
      <div className="absolute left-0 top-4 bottom-4 w-0.5 rounded-r bg-priority-important" />

      {/* Icon */}
      <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-priority-important/10">
        <PenLine className="h-3 w-3 text-priority-important" />
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        {/* Header */}
        <div className="flex items-center gap-2 pb-1">
          <span className="text-xs font-medium text-foreground">Draft reminder</span>
          <span className="text-2xs text-foreground/45">·</span>
          <span className="text-2xs text-muted-foreground">#{channelName}</span>
          <span className="text-2xs text-foreground/45">·</span>
          <span className="text-2xs text-muted-foreground">
            {formatRelativeTime(updatedAt)}
          </span>
        </div>

        {/* Draft body preview */}
        <p className="line-clamp-2 text-sm text-foreground/70 italic">
          &ldquo;{body}&rdquo;
        </p>

        {/* AI suggestion */}
        {suggestedCompletion && (
          <div className="mt-1.5 flex items-start gap-1.5 rounded border border-ping-purple/20 bg-ping-purple/5 px-2 py-1.5">
            <Sparkles className="mt-0.5 h-3 w-3 shrink-0 text-ping-purple" />
            <p className="text-2xs text-muted-foreground">
              <span className="font-medium text-ping-purple">AI suggestion: </span>
              {suggestedCompletion}
            </p>
          </div>
        )}

        {/* Actions */}
        <div
          className={cn(
            "mt-2 flex items-center gap-1.5"
          )}
        >
          <button
            onClick={() => router.push(`/channel/${channelId}`)}
            className="flex items-center gap-1 rounded bg-ping-purple px-2 py-1 text-xs font-medium text-white transition-colors hover:bg-ping-purple-hover"
          >
            Restore draft →
          </button>
          {suggestedCompletion && (
            <button
              onClick={() => router.push(`/channel/${channelId}`)}
              className="flex items-center gap-1 rounded bg-surface-3 px-2 py-1 text-xs font-medium text-foreground transition-colors hover:bg-foreground/10"
            >
              <Sparkles className="h-3 w-3" />
              Use AI suggestion
            </button>
          )}
          <div className="ml-auto">
            <button
              onClick={() => onDismiss?.(draftId)}
              className="rounded p-1 text-foreground/50 transition-colors hover:bg-surface-3 hover:text-foreground"
              title="Dismiss"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
