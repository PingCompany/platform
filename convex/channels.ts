import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireAuth } from "./auth";

export const create = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);

    const existing = await ctx.db
      .query("channels")
      .withIndex("by_workspace_name", (q) =>
        q.eq("workspaceId", user.workspaceId).eq("name", args.name),
      )
      .unique();
    if (existing) throw new Error("Channel name already taken");

    const channelId = await ctx.db.insert("channels", {
      name: args.name,
      description: args.description,
      workspaceId: user.workspaceId,
      createdBy: user._id,
      isDefault: false,
      isArchived: false,
    });

    // Creator auto-joins
    await ctx.db.insert("channelMembers", {
      channelId,
      userId: user._id,
    });

    return channelId;
  },
});

export const list = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireAuth(ctx);

    const channels = await ctx.db
      .query("channels")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", user.workspaceId))
      .collect();

    // Get unread counts for each channel
    const channelsWithUnread = await Promise.all(
      channels
        .filter((c) => !c.isArchived)
        .map(async (channel) => {
          const membership = await ctx.db
            .query("channelMembers")
            .withIndex("by_channel_user", (q) =>
              q.eq("channelId", channel._id).eq("userId", user._id),
            )
            .unique();

          let unreadCount = 0;
          if (membership) {
            const lastReadAt = membership.lastReadAt ?? 0;
            const unreadMessages = await ctx.db
              .query("messages")
              .withIndex("by_channel_time", (q) =>
                q
                  .eq("channelId", channel._id)
                  .gt("_creationTime", lastReadAt),
              )
              .collect();
            unreadCount = unreadMessages.length;
          }

          return {
            ...channel,
            isMember: !!membership,
            unreadCount,
          };
        }),
    );

    return channelsWithUnread;
  },
});

export const get = query({
  args: { channelId: v.id("channels") },
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    return await ctx.db.get(args.channelId);
  },
});

export const join = mutation({
  args: { channelId: v.id("channels") },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);

    const existing = await ctx.db
      .query("channelMembers")
      .withIndex("by_channel_user", (q) =>
        q.eq("channelId", args.channelId).eq("userId", user._id),
      )
      .unique();

    if (existing) return existing._id;

    return await ctx.db.insert("channelMembers", {
      channelId: args.channelId,
      userId: user._id,
    });
  },
});
