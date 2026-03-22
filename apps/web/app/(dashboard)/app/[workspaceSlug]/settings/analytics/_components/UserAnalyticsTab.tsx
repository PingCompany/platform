"use client";

import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import { CheckCircle, Timer, Clock, Brain, Target } from "lucide-react";
import { KpiCard } from "./KpiCard";
import { StackedBar } from "./StackedBar";
import { RankedList } from "./RankedList";
import type { Period } from "./PeriodSelector";

interface UserAnalyticsTabProps {
  period: Period;
  workspaceId: Id<"workspaces">;
}

function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded bg-surface-3 ${className}`}
    />
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

export function UserAnalyticsTab({ period, workspaceId }: UserAnalyticsTabProps) {
  const data = useQuery(api.analytics.getUserAnalytics, { period, workspaceId });

  if (!data) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded border border-subtle bg-surface-1 p-4">
            <Skeleton className="h-40" />
          </div>
          <div className="rounded border border-subtle bg-surface-1 p-4">
            <Skeleton className="h-40" />
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

  return (
    <div className="space-y-6">
      {/* KPI row */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <KpiCard
          icon={CheckCircle}
          label="Decisions Resolved"
          value={data.decisionsResolved.toLocaleString()}
          sub={`${data.decisionsPending} pending`}
        />
        <KpiCard
          icon={Timer}
          label="Avg Decision Time"
          value={formatTime(data.avgDecisionTimeMinutes)}
          sub="from surfaced to decided"
        />
        <KpiCard
          icon={Clock}
          label="Hours Saved"
          value={`~${data.hoursSaved}`}
          delta={String(data.hoursDelta)}
          sub={`vs previous ${period}`}
        />
      </div>

      {/* Two column */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Decision Flow */}
        <div className="rounded border border-subtle bg-surface-1 p-4">
          <div className="mb-4 flex items-center gap-2">
            <Target className="h-3.5 w-3.5 text-foreground/30" />
            <span className="text-xs font-medium text-foreground">
              Decision Flow
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

          {/* Resolved vs Pending */}
          <div className="mt-4 border-t border-subtle pt-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Resolved vs Pending</span>
              <span className="font-mono tabular-nums text-foreground">
                {data.decisionsResolved} / {data.decisionsResolved + data.decisionsPending}
              </span>
            </div>
            <div className="mt-2 flex h-2 overflow-hidden rounded-full bg-surface-3">
              {(data.decisionsResolved + data.decisionsPending) > 0 && (
                <>
                  <div
                    className="h-full rounded-l-full bg-status-online"
                    style={{
                      width: `${Math.round((data.decisionsResolved / (data.decisionsResolved + data.decisionsPending)) * 100)}%`,
                    }}
                  />
                </>
              )}
            </div>
          </div>
        </div>

        {/* AI Context Prep */}
        <div className="rounded border border-subtle bg-surface-1 p-4">
          <div className="mb-4 flex items-center gap-2">
            <Brain className="h-3.5 w-3.5 text-foreground/30" />
            <span className="text-xs font-medium text-foreground">
              AI Context Prep
            </span>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Summaries received</span>
              <span className="font-mono text-xs tabular-nums text-foreground">
                {data.summariesReceived}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Alerts surfaced</span>
              <span className="font-mono text-xs tabular-nums text-foreground">
                {data.alertsSurfaced}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Alerts acted on</span>
              <span className="font-mono text-xs tabular-nums text-foreground">
                {data.alertsActedOn}
                {data.alertsSurfaced > 0 && (
                  <span className="ml-1 text-foreground/30">
                    ({Math.round((data.alertsActedOn / data.alertsSurfaced) * 100)}%)
                  </span>
                )}
              </span>
            </div>
            {data.alertsSurfaced > 0 && (
              <div className="flex h-1.5 overflow-hidden rounded-full bg-surface-3">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.round((data.alertsActedOn / data.alertsSurfaced) * 100)}%`,
                    backgroundColor: "#5E6AD2",
                  }}
                />
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Bot assists</span>
              <span className="font-mono text-xs tabular-nums text-foreground">
                {data.botAssists}
              </span>
            </div>
          </div>

          {data.alertsByType.length > 0 && (
            <div className="mt-4 border-t border-subtle pt-3">
              <span className="mb-2 block text-2xs font-medium uppercase tracking-widest text-foreground/30">
                Alert Breakdown
              </span>
              <StackedBar
                segments={data.alertsByType.map((a, i) => ({
                  label: a.label,
                  count: a.count,
                  color: ["#5E6AD2", "#22C55E", "#F59E0B", "#F4423C", "#6B7280", "#8B5CF6"][i % 6],
                }))}
              />
            </div>
          )}
        </div>
      </div>

      {/* Decision Categories */}
      {data.decisionsByType.length > 0 && (
        <div className="rounded border border-subtle bg-surface-1 p-4">
          <div className="mb-4 flex items-center gap-2">
            <CheckCircle className="h-3.5 w-3.5 text-foreground/30" />
            <span className="text-xs font-medium text-foreground">
              Decision Categories
            </span>
          </div>
          <RankedList
            items={data.decisionsByType.map((d) => {
              const max = data.decisionsByType[0]?.count ?? 1;
              return {
                label: d.label,
                value: d.count,
                pct: Math.round((d.count / max) * 100),
              };
            })}
          />
        </div>
      )}
    </div>
  );
}
