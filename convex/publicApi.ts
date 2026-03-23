import { v } from "convex/values";
import { internalQuery, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";

// ── DM Conversation Operations ──────────────────────────────────────

export const listConversations = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const memberships = await ctx.db
      .query("directConversationMembers")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const conversations = await Promise.all(
      memberships.map(async (m) => {
        const conv = await ctx.db.get(m.conversationId);
        if (!conv || conv.isArchived || conv.deletedAt) return null;

        const members = await ctx.db
          .query("directConversationMembers")
          .withIndex("by_conversation", (q) =>
            q.eq("conversationId", conv._id),
          )
          .collect();

        const memberDetails = await Promise.all(
          members.map(async (mem) => {
            const user = await ctx.db.get(mem.userId);
            return {
              userId: mem.userId,
              name: user?.name ?? "Unknown",
              email: user?.email,
              isAgent: mem.isAgent,
            };
          }),
        );

        return {
          _id: conv._id,
          kind: conv.kind,
          name: conv.name,
          members: memberDetails,
          _creationTime: conv._creationTime,
        };
      }),
    );

    return conversations.filter(Boolean);
  },
});

export const createConversation = internalMutation({
  args: {
    workspaceId: v.id("workspaces"),
    userId: v.id("users"),
    kind: v.union(v.literal("1to1"), v.literal("group")),
    memberIds: v.array(v.id("users")),
    name: v.optional(v.string()),
  },
  handler: async (ctx, { workspaceId, userId, kind, memberIds, name }) => {
    const creatorMembership = await ctx.db
      .query("workspaceMembers")
      .withIndex("by_user_workspace", (q) =>
        q.eq("userId", userId).eq("workspaceId", workspaceId),
      )
      .unique();
    if (!creatorMembership) throw new Error("Not a workspace member");

    if (kind === "1to1") {
      if (memberIds.length !== 1) {
        throw new Error("1to1 conversations require exactly one other member");
      }
      const otherUserId = memberIds[0];

      const myMemberships = await ctx.db
        .query("directConversationMembers")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .collect();

      for (const m of myMemberships) {
        const conv = await ctx.db.get(m.conversationId);
        if (!conv || conv.kind !== "1to1" || conv.deletedAt) continue;

        const otherMember = await ctx.db
          .query("directConversationMembers")
          .withIndex("by_conversation_user", (q) =>
            q.eq("conversationId", conv._id).eq("userId", otherUserId),
          )
          .first();
        if (otherMember) {
          return { conversationId: conv._id, existing: true };
        }
      }
    }

    const conversationId = await ctx.db.insert("directConversations", {
      workspaceId,
      kind,
      name: kind === "group" ? name : undefined,
      createdBy: userId,
      isArchived: false,
    });

    await ctx.db.insert("directConversationMembers", {
      conversationId,
      userId,
      isAgent: false,
      lastReadAt: Date.now(),
    });

    for (const memberId of memberIds) {
      if (memberId === userId) continue; // Skip if creator included themselves
      await ctx.db.insert("directConversationMembers", {
        conversationId,
        userId: memberId,
        isAgent: false,
      });
    }

    return { conversationId, existing: false };
  },
});

export const listConversationMembers = internalQuery({
  args: {
    conversationId: v.id("directConversations"),
    userId: v.id("users"),
  },
  handler: async (ctx, { conversationId, userId }) => {
    const callerMembership = await ctx.db
      .query("directConversationMembers")
      .withIndex("by_conversation_user", (q) =>
        q.eq("conversationId", conversationId).eq("userId", userId),
      )
      .first();
    if (!callerMembership)
      throw new Error("Not a member of this conversation");

    const members = await ctx.db
      .query("directConversationMembers")
      .withIndex("by_conversation", (q) =>
        q.eq("conversationId", conversationId),
      )
      .collect();

    const enriched = await Promise.all(
      members.map(async (m) => {
        const user = await ctx.db.get(m.userId);
        return {
          userId: m.userId,
          name: user?.name ?? "Unknown",
          email: user?.email,
          avatarUrl: user?.avatarUrl,
          isAgent: m.isAgent,
          presenceStatus: user?.presenceStatus,
        };
      }),
    );

    return enriched;
  },
});

// ── DM Message Operations ───────────────────────────────────────────

export const readDMMessages = internalQuery({
  args: {
    conversationId: v.id("directConversations"),
    userId: v.id("users"),
    limit: v.number(),
    startTime: v.optional(v.number()),
    endTime: v.optional(v.number()),
  },
  handler: async (
    ctx,
    { conversationId, userId, limit, startTime, endTime },
  ) => {
    const membership = await ctx.db
      .query("directConversationMembers")
      .withIndex("by_conversation_user", (q) =>
        q.eq("conversationId", conversationId).eq("userId", userId),
      )
      .first();
    if (!membership)
      throw new Error("Not a member of this conversation");

    const fetchLimit = Math.min(limit * 2, 200);
    let messages = await ctx.db
      .query("directMessages")
      .withIndex("by_conversation", (q) =>
        q.eq("conversationId", conversationId),
      )
      .order("desc")
      .take(fetchLimit);

    if (startTime)
      messages = messages.filter((m) => m._creationTime >= startTime);
    if (endTime)
      messages = messages.filter((m) => m._creationTime <= endTime);

    messages = messages.filter(
      (m) => !m.threadId || m.alsoSentToConversation,
    );

    messages = messages.slice(0, limit);

    const enriched = await Promise.all(
      messages.map(async (msg) => {
        const author = await ctx.db.get(msg.authorId);
        return {
          _id: msg._id,
          body: msg.body,
          type: msg.type,
          authorId: msg.authorId,
          authorName: author?.name ?? "Unknown",
          _creationTime: msg._creationTime,
          isEdited: msg.isEdited,
          threadId: msg.threadId,
          threadReplyCount: msg.threadReplyCount,
          threadLastReplyAt: msg.threadLastReplyAt,
        };
      }),
    );

    return enriched.reverse();
  },
});

export const sendDMApi = internalMutation({
  args: {
    conversationId: v.id("directConversations"),
    userId: v.id("users"),
    body: v.string(),
    messageType: v.union(v.literal("user"), v.literal("bot")),
    threadId: v.optional(v.id("directMessages")),
  },
  handler: async (
    ctx,
    { conversationId, userId, body, messageType, threadId },
  ) => {
    const membership = await ctx.db
      .query("directConversationMembers")
      .withIndex("by_conversation_user", (q) =>
        q.eq("conversationId", conversationId).eq("userId", userId),
      )
      .first();
    if (!membership)
      throw new Error("Not a member of this conversation");

    // Validate parent if this is a thread reply
    let parent = threadId ? await ctx.db.get(threadId) : null;
    if (threadId) {
      if (!parent) throw new Error("Parent message not found");
      if (parent.conversationId !== conversationId)
        throw new Error("Parent not in this conversation");
      if (parent.threadId)
        throw new Error("Cannot create nested threads");
    }

    const messageId = await ctx.db.insert("directMessages", {
      conversationId,
      authorId: userId,
      body,
      type: messageType,
      isEdited: false,
      ...(threadId
        ? { threadId, alsoSentToConversation: false }
        : {}),
    });

    // Update parent thread denormalized fields
    if (threadId && parent) {
      const currentParticipants = parent.threadParticipantIds ?? [];
      const newParticipants = currentParticipants.includes(userId)
        ? currentParticipants
        : [...currentParticipants, userId].slice(0, 20);

      await ctx.db.patch(threadId, {
        threadReplyCount: (parent.threadReplyCount ?? 0) + 1,
        threadLastReplyAt: Date.now(),
        threadLastReplyAuthorId: userId,
        threadParticipantIds: newParticipants,
      });
    }

    await ctx.db.patch(membership._id, { lastReadAt: Date.now() });

    await ctx.scheduler.runAfter(
      0,
      internal.ingest.processDirectMessage,
      {
        messageId,
        ...(threadId ? { threadId } : {}),
      },
    );

    return { messageId };
  },
});

export const listDMThreadReplies = internalQuery({
  args: {
    threadId: v.id("directMessages"),
    userId: v.id("users"),
  },
  handler: async (ctx, { threadId, userId }) => {
    const parent = await ctx.db.get(threadId);
    if (!parent) throw new Error("Parent message not found");

    const membership = await ctx.db
      .query("directConversationMembers")
      .withIndex("by_conversation_user", (q) =>
        q
          .eq("conversationId", parent.conversationId)
          .eq("userId", userId),
      )
      .first();
    if (!membership)
      throw new Error("Not a member of this conversation");

    if (parent.threadId)
      throw new Error("Message is a reply, not a thread parent");

    const replies = await ctx.db
      .query("directMessages")
      .withIndex("by_thread", (q) => q.eq("threadId", threadId))
      .order("asc")
      .take(200);

    const parentAuthor = await ctx.db.get(parent.authorId);
    const enrichedParent = {
      _id: parent._id,
      body: parent.body,
      type: parent.type,
      authorId: parent.authorId,
      authorName: parentAuthor?.name ?? "Unknown",
      _creationTime: parent._creationTime,
      threadReplyCount: parent.threadReplyCount,
    };

    const enrichedReplies = await Promise.all(
      replies.map(async (reply) => {
        const author = await ctx.db.get(reply.authorId);
        return {
          _id: reply._id,
          body: reply.body,
          type: reply.type,
          authorId: reply.authorId,
          authorName: author?.name ?? "Unknown",
          _creationTime: reply._creationTime,
        };
      }),
    );

    return { parent: enrichedParent, replies: enrichedReplies };
  },
});
