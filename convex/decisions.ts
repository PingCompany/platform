import { query, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { requireUser } from "./auth";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);

    const pending = await ctx.db
      .query("decisions")
      .withIndex("by_user_status", (q) =>
        q.eq("userId", user._id).eq("status", "pending"),
      )
      .take(50);

    const enriched = await Promise.all(
      pending.map(async (decision) => {
        let channelName: string | null = null;
        if (decision.sourceChannelId) {
          const channel = await ctx.db.get(decision.sourceChannelId);
          channelName = channel?.name ?? null;
        }
        return {
          ...decision,
          channelName,
        };
      }),
    );

    return enriched;
  },
});

export const decide = mutation({
  args: {
    decisionId: v.id("decisions"),
    action: v.string(),
    comment: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const decision = await ctx.db.get(args.decisionId);
    if (!decision || decision.userId !== user._id) {
      throw new Error("Not found");
    }

    await ctx.db.patch(args.decisionId, {
      status: "decided",
      outcome: {
        action: args.action,
        decidedAt: Date.now(),
        comment: args.comment,
      },
    });
  },
});

export const snooze = mutation({
  args: {
    decisionId: v.id("decisions"),
    snoozedUntil: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const decision = await ctx.db.get(args.decisionId);
    if (!decision || decision.userId !== user._id) {
      throw new Error("Not found");
    }

    await ctx.db.patch(args.decisionId, {
      status: "snoozed",
      snoozedUntil: args.snoozedUntil,
    });
  },
});

export const unreadCount = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    const pending = await ctx.db
      .query("decisions")
      .withIndex("by_user_status", (q) =>
        q.eq("userId", user._id).eq("status", "pending"),
      )
      .take(100);
    return pending.length;
  },
});

export const createDecision = internalMutation({
  args: {
    userId: v.id("users"),
    workspaceId: v.id("workspaces"),
    type: v.union(
      v.literal("pr_review"),
      v.literal("ticket_triage"),
      v.literal("question_answer"),
      v.literal("blocked_unblock"),
      v.literal("fact_verify"),
      v.literal("cross_team_ack"),
      v.literal("channel_summary"),
    ),
    title: v.string(),
    summary: v.string(),
    eisenhowerQuadrant: v.union(
      v.literal("urgent-important"),
      v.literal("important"),
      v.literal("urgent"),
      v.literal("fyi"),
    ),
    sourceAlertId: v.optional(v.id("proactiveAlerts")),
    sourceSummaryId: v.optional(v.id("inboxSummaries")),
    sourceChannelId: v.optional(v.id("channels")),
    sourceIntegrationObjectId: v.optional(v.id("integrationObjects")),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("decisions", {
      userId: args.userId,
      workspaceId: args.workspaceId,
      type: args.type,
      title: args.title,
      summary: args.summary,
      eisenhowerQuadrant: args.eisenhowerQuadrant,
      status: "pending",
      sourceAlertId: args.sourceAlertId,
      sourceSummaryId: args.sourceSummaryId,
      sourceChannelId: args.sourceChannelId,
      sourceIntegrationObjectId: args.sourceIntegrationObjectId,
    });
  },
});
