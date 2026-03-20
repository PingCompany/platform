import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireAuth } from "./auth";

export const save = mutation({
  args: {
    channelId: v.id("channels"),
    body: v.string(),
    replyToMessageId: v.optional(v.id("messages")),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);

    const existing = await ctx.db
      .query("drafts")
      .withIndex("by_user_channel", (q) =>
        q.eq("userId", user._id).eq("channelId", args.channelId),
      )
      .unique();

    if (existing && existing.status === "active") {
      await ctx.db.patch(existing._id, {
        body: args.body,
        replyToMessageId: args.replyToMessageId,
        updatedAt: Date.now(),
      });
      return existing._id;
    }

    return await ctx.db.insert("drafts", {
      userId: user._id,
      channelId: args.channelId,
      body: args.body,
      replyToMessageId: args.replyToMessageId,
      contextSnapshot: "",
      suggestedCompletion: "",
      status: "active",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

export const getForChannel = query({
  args: { channelId: v.id("channels") },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);

    const draft = await ctx.db
      .query("drafts")
      .withIndex("by_user_channel", (q) =>
        q.eq("userId", user._id).eq("channelId", args.channelId),
      )
      .unique();

    if (!draft || draft.status !== "active") return null;
    return draft;
  },
});

export const getAll = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireAuth(ctx);

    return await ctx.db
      .query("drafts")
      .withIndex("by_user_status", (q) =>
        q.eq("userId", user._id).eq("status", "active"),
      )
      .collect();
  },
});

export const dismiss = mutation({
  args: { draftId: v.id("drafts") },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);

    const draft = await ctx.db.get(args.draftId);
    if (!draft) throw new Error("Draft not found");
    if (draft.userId !== user._id) throw new Error("Not authorized");

    await ctx.db.patch(args.draftId, {
      status: "dismissed",
      updatedAt: Date.now(),
    });
  },
});
