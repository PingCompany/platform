"use client";

import {
  GitPullRequest,
  GitMerge,
  GitPullRequestClosed,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Loader2,
  Plus,
  Minus,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

export interface GitHubPRReviewer {
  name: string;
  avatarUrl?: string;
}

export type GitHubPRStatus = "open" | "merged" | "closed";
export type CIStatus = "success" | "failure" | "pending" | "neutral";

export interface GitHubPRCardProps {
  repo: string;
  title: string;
  number: number;
  status: GitHubPRStatus;
  additions?: number;
  deletions?: number;
  reviewers?: GitHubPRReviewer[];
  ciStatus?: CIStatus;
  url: string;
}

const statusConfig: Record<
  GitHubPRStatus,
  { icon: React.ElementType; label: string; color: string; bg: string }
> = {
  open: {
    icon: GitPullRequest,
    label: "Open",
    color: "text-green-400",
    bg: "bg-green-400/10 border-green-400/20",
  },
  merged: {
    icon: GitMerge,
    label: "Merged",
    color: "text-purple-400",
    bg: "bg-purple-400/10 border-purple-400/20",
  },
  closed: {
    icon: GitPullRequestClosed,
    label: "Closed",
    color: "text-red-400",
    bg: "bg-red-400/10 border-red-400/20",
  },
};

const ciConfig: Record<
  CIStatus,
  { icon: React.ElementType; color: string; label: string }
> = {
  success: { icon: CheckCircle2, color: "text-green-400", label: "CI passed" },
  failure: { icon: XCircle, color: "text-red-400", label: "CI failed" },
  pending: { icon: Loader2, color: "text-yellow-400", label: "CI running" },
  neutral: { icon: CheckCircle2, color: "text-white/30", label: "CI neutral" },
};

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function GitHubPRCard({
  repo,
  title,
  number,
  status,
  additions,
  deletions,
  reviewers,
  ciStatus,
  url,
}: GitHubPRCardProps) {
  const sc = statusConfig[status];
  const StatusIcon = sc.icon;
  const ci = ciStatus ? ciConfig[ciStatus] : null;
  const CIIcon = ci?.icon;

  return (
    <div className="mt-1.5 max-w-md rounded border border-white/8 bg-white/[0.03] p-3">
      {/* Header: repo + status badge */}
      <div className="flex items-center gap-2">
        <span className="text-2xs font-mono text-muted-foreground">{repo}</span>
        <span
          className={cn(
            "ml-auto inline-flex items-center gap-1 rounded border px-1.5 py-px text-2xs font-medium",
            sc.bg,
            sc.color,
          )}
        >
          <StatusIcon className="h-2.5 w-2.5" />
          {sc.label}
        </span>
      </div>

      {/* Title + PR number */}
      <p className="mt-1 text-sm font-medium text-foreground leading-snug">
        {title}{" "}
        <span className="text-muted-foreground font-normal">#{number}</span>
      </p>

      {/* Stats row */}
      <div className="mt-2 flex items-center gap-3 text-2xs">
        {/* Diff stats */}
        {(additions !== undefined || deletions !== undefined) && (
          <div className="flex items-center gap-2">
            {additions !== undefined && (
              <span className="inline-flex items-center gap-0.5 text-green-400">
                <Plus className="h-2.5 w-2.5" />
                {additions}
              </span>
            )}
            {deletions !== undefined && (
              <span className="inline-flex items-center gap-0.5 text-red-400">
                <Minus className="h-2.5 w-2.5" />
                {deletions}
              </span>
            )}
          </div>
        )}

        {/* CI status */}
        {ci && CIIcon && (
          <span className={cn("inline-flex items-center gap-1", ci.color)}>
            <CIIcon
              className={cn(
                "h-2.5 w-2.5",
                ciStatus === "pending" && "animate-spin",
              )}
            />
            {ci.label}
          </span>
        )}
      </div>

      {/* Reviewers + action */}
      <div className="mt-2 flex items-center gap-2">
        {/* Reviewer avatars */}
        {reviewers && reviewers.length > 0 && (
          <div className="flex -space-x-1.5">
            {reviewers.slice(0, 4).map((r) => (
              <Avatar key={r.name} className="h-5 w-5 border border-surface-1">
                <AvatarFallback className="bg-surface-3 text-[9px] font-medium text-foreground">
                  {getInitials(r.name)}
                </AvatarFallback>
              </Avatar>
            ))}
            {reviewers.length > 4 && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full border border-surface-1 bg-surface-3 text-[9px] text-muted-foreground">
                +{reviewers.length - 4}
              </span>
            )}
          </div>
        )}

        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-auto inline-flex items-center gap-1 rounded px-2 py-1 text-2xs font-medium text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"
        >
          Open in GitHub
          <ExternalLink className="h-2.5 w-2.5" />
        </a>
      </div>
    </div>
  );
}
