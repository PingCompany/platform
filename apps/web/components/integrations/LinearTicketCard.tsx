"use client";

import { ExternalLink } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

export type LinearStatus =
  | "backlog"
  | "todo"
  | "in_progress"
  | "done"
  | "cancelled";

export type LinearPriority = "urgent" | "high" | "medium" | "low" | "none";

export interface LinearTicketCardProps {
  ticketId: string;
  title: string;
  status: LinearStatus;
  priority: LinearPriority;
  assignee?: { name: string; avatarUrl?: string };
  url: string;
}

const statusConfig: Record<
  LinearStatus,
  { color: string; borderColor: string; label: string }
> = {
  backlog: {
    color: "bg-white/20",
    borderColor: "border-white/20",
    label: "Backlog",
  },
  todo: {
    color: "bg-white/40",
    borderColor: "border-white/40",
    label: "Todo",
  },
  in_progress: {
    color: "bg-yellow-400",
    borderColor: "border-yellow-400",
    label: "In Progress",
  },
  done: {
    color: "bg-green-400",
    borderColor: "border-green-400",
    label: "Done",
  },
  cancelled: {
    color: "bg-red-400",
    borderColor: "border-red-400",
    label: "Cancelled",
  },
};

const priorityConfig: Record<
  LinearPriority,
  { icon: string; color: string; label: string }
> = {
  urgent: { icon: "!!!", color: "text-red-400", label: "Urgent" },
  high: { icon: "!!", color: "text-orange-400", label: "High" },
  medium: { icon: "!", color: "text-yellow-400", label: "Medium" },
  low: { icon: "-", color: "text-blue-400", label: "Low" },
  none: { icon: "...", color: "text-white/30", label: "No priority" },
};

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function LinearTicketCard({
  ticketId,
  title,
  status,
  priority,
  assignee,
  url,
}: LinearTicketCardProps) {
  const sc = statusConfig[status];
  const pc = priorityConfig[priority];

  return (
    <div className="mt-1.5 max-w-md rounded border border-white/8 bg-white/[0.03] p-3">
      {/* Header: ticket ID + priority */}
      <div className="flex items-center gap-2">
        {/* Status circle */}
        <span
          className={cn(
            "h-2.5 w-2.5 shrink-0 rounded-full border",
            sc.borderColor,
            status === "in_progress" || status === "done" || status === "cancelled"
              ? sc.color
              : "bg-transparent",
          )}
        />
        <span className="text-2xs font-mono text-muted-foreground">
          {ticketId}
        </span>
        <span className="text-2xs text-muted-foreground">{sc.label}</span>

        {/* Priority badge */}
        <span
          className={cn(
            "ml-auto inline-flex items-center gap-1 rounded px-1.5 py-px text-2xs font-mono font-medium",
            pc.color,
          )}
        >
          <span>{pc.icon}</span>
          {pc.label}
        </span>
      </div>

      {/* Title */}
      <p className="mt-1 text-sm font-medium text-foreground leading-snug">
        {title}
      </p>

      {/* Footer: assignee + link */}
      <div className="mt-2 flex items-center gap-2">
        {assignee && (
          <div className="flex items-center gap-1.5">
            <Avatar className="h-5 w-5">
              <AvatarFallback className="bg-surface-3 text-[9px] font-medium text-foreground">
                {getInitials(assignee.name)}
              </AvatarFallback>
            </Avatar>
            <span className="text-2xs text-muted-foreground">
              {assignee.name}
            </span>
          </div>
        )}

        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-auto inline-flex items-center gap-1 rounded px-2 py-1 text-2xs font-medium text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"
        >
          Open in Linear
          <ExternalLink className="h-2.5 w-2.5" />
        </a>
      </div>
    </div>
  );
}
