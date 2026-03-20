import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";
import { requireAuth } from "./auth";
import { internal } from "./_generated/api";

export const send = mutation({
  args: {
    channelId: v.id("channels"),
    body: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);

    const channel = await ctx.db.get(args.channelId);
    if (!channel) throw new Error("Channel not found");
    if (channel.isArchived) throw new Error("Channel is archived");

    const membership = await ctx.db
      .query("channelMembers")
      .withIndex("by_channel_user", (q) =>
        q.eq("channelId", args.channelId).eq("userId", user._id),
      )
      .unique();
    if (!membership) throw new Error("Not a member of this channel");

    const body = args.body.trim();
    if (!body) throw new Error("Message body cannot be empty");

    const mentionMatches = body.match(/@(\w+)/g);
    const mentions = mentionMatches?.map((m) => m.slice(1));

    const messageId = await ctx.db.insert("messages", {
      channelId: args.channelId,
      authorId: user._id,
      body,
      type: "user",
      mentions: mentions && mentions.length > 0 ? mentions : undefined,
      isEdited: false,
    });

    if (mentions?.includes("knowledgebot")) {
      await ctx.scheduler.runAfter(0, internal.bot.respond, {
        channelId: args.channelId,
        query: body,
        triggerMessageId: messageId,
      });
    }

    await ctx.scheduler.runAfter(0, internal.ingest.processMessage, {
      messageId,
    });

    return messageId;
  },
});

export const list = query({
  args: {
    channelId: v.id("channels"),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    await requireAuth(ctx);

    const results = await ctx.db
      .query("messages")
      .withIndex("by_channel", (q) => q.eq("channelId", args.channelId))
      .order("desc")
      .paginate(args.paginationOpts);

    const enrichedPage = await Promise.all(
      results.page.map(async (message) => {
        const [author, integrationObject] = await Promise.all([
          ctx.db.get(message.authorId),
          message.integrationObjectId
            ? ctx.db.get(message.integrationObjectId)
            : null,
        ]);

        return {
          ...message,
          author: author
            ? { name: author.name, avatarUrl: author.avatarUrl }
            : null,
          integrationObject,
        };
      }),
    );

    return { ...results, page: enrichedPage };
  },
});

export const getById = query({
  args: {
    messageId: v.id("messages"),
  },
  handler: async (ctx, args) => {
    await requireAuth(ctx);

    const message = await ctx.db.get(args.messageId);
    if (!message) return null;

    const [author, integrationObject] = await Promise.all([
      ctx.db.get(message.authorId),
      message.integrationObjectId
        ? ctx.db.get(message.integrationObjectId)
        : null,
    ]);

    return {
      ...message,
      author: author
        ? { name: author.name, avatarUrl: author.avatarUrl }
        : null,
      integrationObject,
    };
  },
});

export const search = query({
  args: {
    query: v.string(),
    channelId: v.optional(v.id("channels")),
  },
  handler: async (ctx, args) => {
    await requireAuth(ctx);

    const searchTerm = args.query.trim();
    if (!searchTerm) return [];

    const messages = await ctx.db
      .query("messages")
      .withSearchIndex("search_body", (q) => {
        const sq = q.search("body", searchTerm);
        return args.channelId ? sq.eq("channelId", args.channelId) : sq;
      })
      .take(20);

    const enrichedMessages = await Promise.all(
      messages.map(async (message) => {
        const author = await ctx.db.get(message.authorId);
        return {
          ...message,
          author: author
            ? { name: author.name, avatarUrl: author.avatarUrl }
            : null,
        };
      }),
    );

    return enrichedMessages;
  },
});

export const updateLastRead = mutation({
  args: {
    channelId: v.id("channels"),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);

    const membership = await ctx.db
      .query("channelMembers")
      .withIndex("by_channel_user", (q) =>
        q.eq("channelId", args.channelId).eq("userId", user._id),
      )
      .unique();
    if (!membership) throw new Error("Not a member of this channel");

    await ctx.db.patch(membership._id, { lastReadAt: Date.now() });
  },
});
