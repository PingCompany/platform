import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireUser } from "./auth";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);

    const decisions = await ctx.db
      .query("decisions")
      .withIndex("by_user_status", (q) =>
        q.eq("userId", user._id).eq("status", "pending"),
      )
      .take(50);

    const enriched = await Promise.all(
      decisions.map(async (decision) => {
        const channel = decision.channelId
          ? await ctx.db.get(decision.channelId)
          : null;
        return {
          ...decision,
          channelName: channel?.name ?? null,
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
        comment: args.comment,
        decidedAt: Date.now(),
      },
    });
  },
});

export const snooze = mutation({
  args: {
    decisionId: v.id("decisions"),
    snoozeUntil: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const decision = await ctx.db.get(args.decisionId);
    if (!decision || decision.userId !== user._id) {
      throw new Error("Not found");
    }
    await ctx.db.patch(args.decisionId, {
      status: "snoozed",
      expiresAt: args.snoozeUntil,
    });
  },
});
