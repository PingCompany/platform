"use client";

import { useState, useMemo, useCallback } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { AnimatePresence, motion } from "motion/react";
import { Zap, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DecisionCard,
  type DecisionItem,
  type OrgTracePerson,
  type EisenhowerQuadrant,
  type PriorityLevel,
} from "@/components/inbox/DecisionCard";
import { DecisionModal } from "@/components/inbox/DecisionModal";

const QUADRANT_TO_PRIORITY: Record<EisenhowerQuadrant, PriorityLevel> = {
  "urgent-important": "urgent",
  important: "high",
  urgent: "medium",
  fyi: "low",
};

const QUADRANT_ACCENT: Record<EisenhowerQuadrant, string> = {
  "urgent-important": "bg-priority-urgent",
  important: "bg-priority-important",
  urgent: "bg-blue-500",
  fyi: "bg-white/20",
};

interface ChannelDecisionsBarProps {
  channelId: string;
}

export function ChannelDecisionsBar({ channelId }: ChannelDecisionsBarProps) {
  const [expanded, setExpanded] = useState(false);
  const [openDecisionId, setOpenDecisionId] = useState<string | null>(null);
  const [focusMode, setFocusMode] = useState(false);

  const raw = useQuery(api.decisions.listByChannel, {
    channelId: channelId as Id<"channels">,
  });

  const decideMutation = useMutation(api.decisions.decide);
  const snoozeMutation = useMutation(api.decisions.snooze);

  const items: DecisionItem[] = useMemo(() => {
    if (!raw) return [];
    return raw.map((d) => {
      const quadrant = d.eisenhowerQuadrant as EisenhowerQuadrant;
      return {
        id: d._id,
        type: d.type,
        title: d.title,
        summary: d.summary,
        eisenhowerQuadrant: quadrant,
        priority: QUADRANT_TO_PRIORITY[quadrant],
        status: d.status,
        channelName: d.channelName ?? "unknown",
        createdAt: new Date(d.createdAt),
        agentExecutionStatus: d.agentExecutionStatus ?? undefined,
        agentExecutionResult: d.agentExecutionResult ?? undefined,
        orgTrace: (d.orgTrace ?? []) as OrgTracePerson[],
        nextSteps: (d.nextSteps ?? []) as DecisionItem["nextSteps"],
        recommendedActions: (d.recommendedActions ?? []) as DecisionItem["recommendedActions"],
        links: (d.links ?? []) as DecisionItem["links"],
        relatedDecisionIds: d.relatedDecisionIds as string[] | undefined,
      };
    });
  }, [raw]);

  const handleAction = useCallback(
    (id: string, action: string, comment?: string) => {
      if (action === "Snooze" || action === "snooze") {
        snoozeMutation({
          decisionId: id as Id<"decisions">,
          snoozeUntil: Date.now() + 60 * 60 * 1000,
        });
      } else {
        decideMutation({
          decisionId: id as Id<"decisions">,
          action,
          comment,
        });
      }
    },
    [decideMutation, snoozeMutation],
  );

  if (!raw || items.length === 0) return null;

  const topItem = items[0];
  const accent = QUADRANT_ACCENT[topItem.eisenhowerQuadrant];
  const openDecision = items.find((d) => d.id === openDecisionId) ?? null;

  return (
    <>
      <div className="relative shrink-0 border-b border-subtle bg-surface-1">
        {/* Accent left border */}
        <div className={cn("absolute left-0 top-2 bottom-2 w-[3px] rounded-r", accent)} />

        {/* Collapsed bar — always visible */}
        <button
          onClick={() => setExpanded((v) => !v)}
          className="flex w-full items-center gap-2 px-4 py-1.5 text-left transition-colors hover:bg-surface-2/60"
        >
          <Zap className="h-3.5 w-3.5 shrink-0 text-amber-400" />
          <span className="text-2xs font-medium text-foreground">
            {items.length} {items.length === 1 ? "decision" : "decisions"}
          </span>
          <span className="text-2xs text-foreground/45">·</span>
          <span className="min-w-0 flex-1 truncate text-2xs text-muted-foreground">
            {topItem.title}
          </span>
          <ChevronDown
            className={cn(
              "h-3 w-3 shrink-0 text-muted-foreground transition-transform",
              expanded && "rotate-180",
            )}
          />
        </button>

        {/* Expanded list */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="overflow-hidden"
            >
              <div className="max-h-[40vh] overflow-y-auto scrollbar-thin border-t border-subtle">
                {items.map((item) => (
                  <DecisionCard
                    key={item.id}
                    item={item}
                    onAction={handleAction}
                    onOpen={() => setOpenDecisionId(item.id)}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Decision modal — rendered via portal inside DecisionModal */}
      {openDecision && (
        <DecisionModal
          item={openDecision}
          onAction={handleAction}
          onClose={() => setOpenDecisionId(null)}
          focusMode={focusMode}
          onToggleFocusMode={() => setFocusMode((f) => !f)}
        />
      )}
    </>
  );
}
