import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireAuth } from "./auth";

export const listPending = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireAuth(ctx);

    const alerts = await ctx.db
      .query("proactiveAlerts")
      .withIndex("by_user_status", (q) =>
        q.eq("userId", user._id).eq("status", "pending"),
      )
      .take(10);

    return alerts.filter((alert) => alert.expiresAt > Date.now());
  },
});

export const dismiss = mutation({
  args: { alertId: v.id("proactiveAlerts") },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);
    const alert = await ctx.db.get(args.alertId);
    if (!alert || alert.userId !== user._id) {
      throw new Error("Not found");
    }
    await ctx.db.patch(args.alertId, { status: "dismissed" });
  },
});
