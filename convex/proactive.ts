import {
  query,
  mutation,
  internalMutation,
  internalAction,
} from "./_generated/server";
import { v } from "convex/values";
import { requireAuth } from "./auth";

export const getAlerts = query({
  args: {
    status: v.optional(
      v.union(
        v.literal("pending"),
        v.literal("acted"),
        v.literal("dismissed"),
        v.literal("expired"),
      ),
    ),
    type: v.optional(
      v.union(
        v.literal("unanswered_question"),
        v.literal("pr_review_nudge"),
        v.literal("incident_route"),
        v.literal("blocked_task"),
      ),
    ),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);

    if (args.status) {
      return await ctx.db
        .query("proactiveAlerts")
        .withIndex("by_user_status", (q) =>
          q.eq("userId", user._id).eq("status", args.status!),
        )
        .collect();
    }

    if (args.type) {
      return await ctx.db
        .query("proactiveAlerts")
        .withIndex("by_user_type", (q) =>
          q.eq("userId", user._id).eq("type", args.type!),
        )
        .collect();
    }

    return await ctx.db
      .query("proactiveAlerts")
      .withIndex("by_user_status", (q) =>
        q.eq("userId", user._id).eq("status", "pending"),
      )
      .collect();
  },
});

export const createAlert = internalMutation({
  args: {
    userId: v.id("users"),
    workspaceId: v.id("workspaces"),
    type: v.union(
      v.literal("unanswered_question"),
      v.literal("pr_review_nudge"),
      v.literal("incident_route"),
      v.literal("blocked_task"),
    ),
    channelId: v.id("channels"),
    title: v.string(),
    body: v.string(),
    sourceMessageId: v.optional(v.id("messages")),
    sourceIntegrationObjectId: v.optional(v.id("integrationObjects")),
    suggestedAction: v.string(),
    priority: v.union(
      v.literal("high"),
      v.literal("medium"),
      v.literal("low"),
    ),
    expiresAt: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("proactiveAlerts", {
      ...args,
      status: "pending",
      createdAt: Date.now(),
    });
  },
});

export const actOnAlert = mutation({
  args: {
    alertId: v.id("proactiveAlerts"),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);

    const alert = await ctx.db.get(args.alertId);
    if (!alert) throw new Error("Alert not found");
    if (alert.userId !== user._id) throw new Error("Not authorized");

    await ctx.db.patch(args.alertId, { status: "acted" });
  },
});

export const dismissAlert = mutation({
  args: {
    alertId: v.id("proactiveAlerts"),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);

    const alert = await ctx.db.get(args.alertId);
    if (!alert) throw new Error("Alert not found");
    if (alert.userId !== user._id) throw new Error("Not authorized");

    await ctx.db.patch(args.alertId, { status: "dismissed" });
  },
});

export const expireStaleAlerts = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const allAlerts = await ctx.db.query("proactiveAlerts").collect();
    let expiredCount = 0;

    for (const alert of allAlerts) {
      if (alert.status === "pending" && alert.expiresAt < now) {
        await ctx.db.patch(alert._id, { status: "expired" });
        expiredCount++;
      }
    }

    console.log(`[proactive.expireStaleAlerts] Expired ${expiredCount} alerts`);
  },
});

export const scanUnansweredQuestions = internalAction({
  args: {},
  handler: async () => {
    console.log(
      "[proactive.scanUnansweredQuestions stub] Would scan for unanswered questions",
    );
  },
});

export const scanPRReviewNudges = internalAction({
  args: {},
  handler: async () => {
    console.log(
      "[proactive.scanPRReviewNudges stub] Would scan for stale PRs",
    );
  },
});

export const scanBlockedTasks = internalAction({
  args: {},
  handler: async () => {
    console.log(
      "[proactive.scanBlockedTasks stub] Would scan for blocked tasks",
    );
  },
});
