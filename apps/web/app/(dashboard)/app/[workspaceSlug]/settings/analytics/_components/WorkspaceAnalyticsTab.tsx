"use client";

import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import {
  CheckCircle,
  Timer,
  AlertCircle,
  Clock,
  BarChart2,
  Bot,
  Users,
  Brain,
  GitPullRequest,
} from "lucide-react";
import { KpiCard } from "./KpiCard";
import { StackedBar } from "./StackedBar";
import { RankedList } from "./RankedList";
import type { Period } from "./PeriodSelector";

interface WorkspaceAnalyticsTabProps {
  period: Period;
  workspaceId: Id<"workspaces">;
}

function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded bg-surface-3 ${className}`} />
  );
}

function CardSkeleton() {
  return (
    <div className="rounded border border-subtle bg-surface-1 p-4 space-y-3">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="h-6 w-16" />
      <Skeleton className="h-2 w-32" />
    </div>
  );
}

export function WorkspaceAnalyticsTab({
  period,
  workspaceId,
}: WorkspaceAnalyticsTabProps) {
  const data = useQuery(api.analytics.getWorkspaceAnalytics, {
    period,
    workspaceId,
  });
  const leaderboard = useQuery(api.analytics.getAgentLeaderboard, {
    period,
    workspaceId,
  });

  if (!data) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded border border-subtle bg-surface-1 p-4">
            <Skeleton className="h-48" />
          </div>
          <div className="rounded border border-subtle bg-surface-1 p-4">
            <Skeleton className="h-48" />
          </div>
        </div>
      </div>
    );
  }

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  };

  const AGENT_COLORS = ["#5E6AD2", "#22C55E", "#F59E0B", "#F4423C", "#8B5CF6"];

  return (
    <div className="space-y-6">
      {/* KPI row */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
        <KpiCard
          icon={CheckCircle}
          label="Decisions Resolved"
          value={data.totalDecisions.toLocaleString()}
          sub={`across ${data.activeUsers} active users`}
        />
        <KpiCard
          icon={Timer}
          label="Avg Decision Time"
          value={formatTime(data.avgDecisionTimeMinutes)}
          sub="workspace average"
        />
        <KpiCard
          icon={AlertCircle}
          label="Pending Decisions"
          value={data.totalPending.toLocaleString()}
          sub="awaiting action"
        />
        <KpiCard
          icon={Clock}
          label="Hours Saved"
          value={`~${data.totalHoursSaved}`}
          sub={`${data.totalBotAssists} bot assists + ${data.totalSummaries} summaries`}
        />
      </div>

      {/* Row 2: Decision Velocity + Agent Leaderboard */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Decision Velocity */}
        <div className="rounded border border-subtle bg-surface-1 p-4">
          <div className="mb-4 flex items-center gap-2">
            <BarChart2 className="h-3.5 w-3.5 text-foreground/30" />
            <span className="text-xs font-medium text-foreground">
              Decision Velocity
            </span>
          </div>

          {data.decisionsByQuadrant.length > 0 ? (
            <StackedBar
              segments={data.decisionsByQuadrant.map((q) => ({
                label: q.label,
                count: q.count,
                quadrant: q.quadrant,
              }))}
            />
          ) : (
            <p className="py-4 text-center text-xs text-muted-foreground">
              No decisions in this period
            </p>
          )}

          {/* Team size */}
          <div className="mt-4 border-t border-subtle pt-3 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Active / Total members</span>
              <span className="font-mono tabular-nums text-foreground">
                {data.activeUsers} / {data.totalMembers}
              </span>
            </div>
            {data.newMembers > 0 && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">New this period</span>
                <span className="font-mono tabular-nums text-status-online">
                  +{data.newMembers}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Agent Leaderboard */}
        <div className="rounded border border-subtle bg-surface-1 p-4">
          <div className="mb-4 flex items-center gap-2">
            <Bot className="h-3.5 w-3.5 text-foreground/30" />
            <span className="text-xs font-medium text-foreground">
              Agent Leaderboard
            </span>
          </div>

          {leaderboard && leaderboard.length > 0 ? (
            <div className="space-y-3">
              {leaderboard.map((agent, i) => (
                <div key={agent.name}>
                  <div className="mb-1.5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-4 text-right text-2xs text-foreground/25">
                        #{i + 1}
                      </span>
                      <span className="text-xs text-foreground">{agent.name}</span>
                    </div>
                    <span className="font-mono text-xs tabular-nums text-muted-foreground">
                      {agent.queries.toLocaleString()} queries
                    </span>
                  </div>
                  <div className="ml-6 h-1 overflow-hidden rounded-full bg-surface-3">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${agent.pct}%`,
                        backgroundColor: AGENT_COLORS[i % AGENT_COLORS.length],
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="py-4 text-center text-xs text-muted-foreground">
              No agent activity this period
            </p>
          )}
        </div>
      </div>

      {/* Row 3: Top Deciders + Bottlenecks */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Top Decision Makers */}
        <div className="rounded border border-subtle bg-surface-1 p-4">
          <div className="mb-4 flex items-center gap-2">
            <Users className="h-3.5 w-3.5 text-foreground/30" />
            <span className="text-xs font-medium text-foreground">
              Top Decision Makers
            </span>
          </div>
          <RankedList
            items={data.topDeciders.map((d) => ({
              label: d.name,
              value: d.count,
              pct: d.pct,
            }))}
            unit="decisions"
            color="#22C55E"
          />
        </div>

        {/* Bottlenecks */}
        <div className="rounded border border-subtle bg-surface-1 p-4">
          <div className="mb-4 flex items-center gap-2">
            <AlertCircle className="h-3.5 w-3.5 text-foreground/30" />
            <span className="text-xs font-medium text-foreground">
              Decision Bottlenecks
            </span>
          </div>
          {data.bottlenecks.length > 0 ? (
            <RankedList
              items={data.bottlenecks.map((b) => {
                const max = data.bottlenecks[0]?.pending ?? 1;
                return {
                  label: b.name,
                  value: b.pending,
                  pct: Math.round((b.pending / max) * 100),
                };
              })}
              unit="pending"
              color="#F59E0B"
            />
          ) : (
            <p className="py-4 text-center text-xs text-muted-foreground">
              No bottlenecks detected
            </p>
          )}
        </div>
      </div>

      {/* Row 4: AI Platform Health */}
      <div className="rounded border border-subtle bg-surface-1 p-4">
        <div className="mb-4 flex items-center gap-2">
          <Brain className="h-3.5 w-3.5 text-foreground/30" />
          <span className="text-xs font-medium text-foreground">
            AI Platform Health
          </span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Bot assists</span>
              <span className="font-mono text-xs tabular-nums text-foreground">
                {data.totalBotAssists.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Summaries generated</span>
              <span className="font-mono text-xs tabular-nums text-foreground">
                {data.totalSummaries.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Alerts surfaced</span>
              <span className="font-mono text-xs tabular-nums text-foreground">
                {data.totalAlerts.toLocaleString()}
              </span>
            </div>

            {/* Integrations */}
            <div className="border-t border-subtle pt-3 space-y-2">
              <div className="flex items-center gap-2 text-2xs font-medium uppercase tracking-widest text-foreground/30">
                <GitPullRequest className="h-3 w-3" />
                Context Inputs
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">PRs synced</span>
                <span className="font-mono text-xs tabular-nums text-foreground">
                  {data.prsSynced}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Tickets synced</span>
                <span className="font-mono text-xs tabular-nums text-foreground">
                  {data.ticketsSynced}
                </span>
              </div>
            </div>
          </div>

          {/* Alert type breakdown */}
          <div>
            {data.totalAlertsByType.length > 0 ? (
              <>
                <span className="mb-2 block text-2xs font-medium uppercase tracking-widest text-foreground/30">
                  Alert Breakdown
                </span>
                <StackedBar
                  segments={data.totalAlertsByType.map((a, i) => ({
                    label: a.label,
                    count: a.count,
                    color: ["#5E6AD2", "#22C55E", "#F59E0B", "#F4423C", "#6B7280", "#8B5CF6"][
                      i % 6
                    ],
                  }))}
                />
              </>
            ) : (
              <p className="py-4 text-center text-xs text-muted-foreground">
                No alerts this period
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
