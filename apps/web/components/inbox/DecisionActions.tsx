"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

export type DecisionType =
  | "pr_review"
  | "ticket_triage"
  | "question_answer"
  | "blocked_unblock"
  | "fact_verify"
  | "cross_team_ack"
  | "channel_summary"
  | "email_summary";

interface ActionDef {
  label: string;
  actionKey?: string;
  primary?: boolean;
  needsComment?: boolean;
}

interface DecisionActionsProps {
  type: DecisionType;
  recommendedActions?: ActionDef[];
  onAction: (action: string, comment?: string) => void;
}

const fallbackActionsByType: Record<DecisionType, ActionDef[]> = {
  pr_review: [
    { label: "Approve", actionKey: "approve", primary: true },
    { label: "Request Changes", actionKey: "request_changes", needsComment: true },
    { label: "Delegate", actionKey: "delegate", needsComment: true },
  ],
  question_answer: [
    { label: "Reply", actionKey: "reply", primary: true },
    { label: "Delegate", actionKey: "delegate", needsComment: true },
    { label: "Dismiss", actionKey: "dismiss" },
  ],
  blocked_unblock: [
    { label: "Investigate", actionKey: "investigate", primary: true },
    { label: "Reassign", actionKey: "reassign" },
    { label: "Snooze", actionKey: "snooze" },
  ],
  ticket_triage: [
    { label: "Accept", actionKey: "accept", primary: true },
    { label: "Reject", actionKey: "reject", needsComment: true },
    { label: "Delegate", actionKey: "delegate", needsComment: true },
  ],
  fact_verify: [
    { label: "Confirm", actionKey: "confirm", primary: true },
    { label: "Dispute", actionKey: "dispute" },
    { label: "Investigate", actionKey: "investigate" },
  ],
  cross_team_ack: [
    { label: "Acknowledge", actionKey: "acknowledge", primary: true },
    { label: "Follow Up", actionKey: "follow_up" },
  ],
  channel_summary: [
    { label: "Mark Read", actionKey: "mark_read", primary: true },
    { label: "Investigate", actionKey: "investigate" },
  ],
  email_summary: [
    { label: "Mark Read", actionKey: "mark_read", primary: true },
    { label: "Reply", actionKey: "reply" },
  ],
};

export function DecisionActions({ type, recommendedActions, onAction }: DecisionActionsProps) {
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [comment, setComment] = useState("");
  const actions = recommendedActions ?? fallbackActionsByType[type];

  function handleClick(action: ActionDef) {
    const key = action.actionKey ?? action.label;
    if (action.needsComment) {
      setPendingAction(key);
      setComment("");
    } else {
      onAction(key);
    }
  }

  function handleSubmitComment() {
    if (pendingAction) {
      onAction(pendingAction, comment || undefined);
      setPendingAction(null);
      setComment("");
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-1.5">
        {actions.map((action) => (
          <button
            key={action.actionKey ?? action.label}
            onClick={() => handleClick(action)}
            className={cn(
              "flex items-center gap-1 rounded px-2 py-1 text-xs font-medium transition-colors",
              action.primary
                ? "bg-ping-purple text-white hover:bg-ping-purple/90"
                : "bg-white/5 text-foreground hover:bg-white/10"
            )}
          >
            {action.label}
          </button>
        ))}
      </div>

      {pendingAction && (
        <div className="flex flex-col gap-1.5">
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={`Add reasoning...`}
            className="min-h-[60px] w-full resize-none rounded border border-subtle bg-surface-2 px-2 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ping-purple"
          />
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleSubmitComment}
              className="rounded bg-ping-purple px-2 py-1 text-xs font-medium text-white hover:bg-ping-purple/90"
            >
              Submit
            </button>
            <button
              onClick={() => setPendingAction(null)}
              className="rounded bg-white/5 px-2 py-1 text-xs font-medium text-foreground hover:bg-white/10"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
