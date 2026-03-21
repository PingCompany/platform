import { internalAction, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";

const ALERT_TYPE_TO_DECISION_TYPE = {
  pr_review_nudge: "pr_review",
  blocked_task: "blocked_unblock",
  unanswered_question: "question_answer",
  fact_check: "fact_verify",
  cross_team_sync: "cross_team_ack",
} as const;

export const getPendingAlertsWithoutDecisions = internalQuery({
  args: {},
  handler: async (ctx) => {
    const alerts = await ctx.db
      .query("proactiveAlerts")
      .filter((q) => q.eq(q.field("status"), "pending"))
      .take(100);

    const alertsWithoutDecisions = [];
    for (const alert of alerts) {
      const existingDecision = await ctx.db
        .query("decisions")
        .withIndex("by_source_alert", (q) => q.eq("sourceAlertId", alert._id))
        .first();

      if (!existingDecision) {
        alertsWithoutDecisions.push(alert);
      }
    }

    return alertsWithoutDecisions;
  },
});

export const getUrgentSummariesWithoutDecisions = internalQuery({
  args: {},
  handler: async (ctx) => {
    const summaries = await ctx.db
      .query("inboxSummaries")
      .filter((q) =>
        q.and(
          q.eq(q.field("isArchived"), false),
          q.eq(q.field("eisenhowerQuadrant"), "urgent-important"),
        ),
      )
      .take(100);

    const summariesWithoutDecisions = [];
    for (const summary of summaries) {
      const existingDecision = await ctx.db
        .query("decisions")
        .withIndex("by_source_summary", (q) =>
          q.eq("sourceSummaryId", summary._id),
        )
        .first();

      if (!existingDecision) {
        summariesWithoutDecisions.push(summary);
      }
    }

    return summariesWithoutDecisions;
  },
});

export const generateFromAlerts = internalAction({
  args: {},
  handler: async (ctx) => {
    const alerts = await ctx.runQuery(
      internal.decisionGenerator.getPendingAlertsWithoutDecisions,
    );

    for (const alert of alerts) {
      const alertType = alert.type as keyof typeof ALERT_TYPE_TO_DECISION_TYPE;
      const decisionType = ALERT_TYPE_TO_DECISION_TYPE[alertType];
      if (!decisionType) continue;

      await ctx.runMutation(internal.decisions.createDecision, {
        userId: alert.userId,
        workspaceId: alert.workspaceId,
        type: decisionType,
        title: alert.title,
        summary: alert.body,
        eisenhowerQuadrant:
          alert.priority === "high"
            ? "urgent-important"
            : alert.priority === "medium"
              ? "important"
              : "fyi",
        sourceAlertId: alert._id,
        sourceChannelId: alert.channelId,
        sourceIntegrationObjectId: alert.sourceIntegrationObjectId,
      });
    }
  },
});

export const generateFromSummaries = internalAction({
  args: {},
  handler: async (ctx) => {
    const summaries = await ctx.runQuery(
      internal.decisionGenerator.getUrgentSummariesWithoutDecisions,
    );

    for (const summary of summaries) {
      const workspaceId = await ctx.runQuery(
        internal.decisionGenerator.getChannelWorkspaceId,
        { channelId: summary.channelId },
      );
      if (!workspaceId) continue;

      await ctx.runMutation(internal.decisions.createDecision, {
        userId: summary.userId,
        type: "channel_summary",
        workspaceId,
        title: "Urgent summary for review",
        summary: summary.bullets.map((b) => b.text).join("; "),
        eisenhowerQuadrant: "urgent-important",
        sourceSummaryId: summary._id,
        sourceChannelId: summary.channelId,
      });
    }
  },
});

export const getChannelWorkspaceId = internalQuery({
  args: { channelId: v.id("channels") },
  handler: async (ctx, args) => {
    const channel = await ctx.db.get(args.channelId);
    return channel?.workspaceId ?? null;
  },
});
