import { query, mutation, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";
import { requireUser } from "./auth";

// ─── Public queries ──────────────────────────────────────────────────────────

export const list = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);

    const pending = await ctx.db
      .query("inboxItems")
      .withIndex("by_user_status", (q) =>
        q.eq("userId", user._id).eq("status", "pending"),
      )
      .take(50);

    const snoozed = await ctx.db
      .query("inboxItems")
      .withIndex("by_user_status", (q) =>
        q.eq("userId", user._id).eq("status", "snoozed"),
      )
      .take(20);

    const all = [...pending, ...snoozed];

    const enriched = await Promise.all(
      all.map(async (item) => {
        const channel = item.channelId
          ? await ctx.db.get(item.channelId)
          : null;
        return {
          ...item,
          channelName: channel?.name ?? null,
        };
      }),
    );

    return enriched;
  },
});

export const listArchived = query({
  args: { paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    return await ctx.db
      .query("inboxItems")
      .withIndex("by_user_status", (q) =>
        q.eq("userId", user._id).eq("status", "archived"),
      )
      .order("desc")
      .paginate(args.paginationOpts);
  },
});

export const unreadCount = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    const pending = await ctx.db
      .query("inboxItems")
      .withIndex("by_user_status", (q) =>
        q.eq("userId", user._id).eq("status", "pending"),
      )
      .take(100);
    return pending.length;
  },
});

export const getContext = query({
  args: { itemId: v.id("inboxItems") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const item = await ctx.db.get(args.itemId);
    if (!item || item.userId !== user._id) {
      throw new Error("Not found");
    }

    const sourceMessage = item.sourceMessageId
      ? await ctx.db.get(item.sourceMessageId)
      : null;

    const sourceIntegrationObject = item.sourceIntegrationObjectId
      ? await ctx.db.get(item.sourceIntegrationObjectId)
      : null;

    let relatedMessages: Array<{
      body: string;
      authorName: string;
      createdAt: number;
    }> = [];
    if (item.channelId) {
      const messages = await ctx.db
        .query("messages")
        .withIndex("by_channel", (q) =>
          q.eq("channelId", item.channelId!),
        )
        .order("desc")
        .take(10);

      relatedMessages = await Promise.all(
        messages.map(async (msg) => {
          const author = await ctx.db.get(msg.authorId);
          return {
            body: msg.body,
            authorName: author?.name ?? "Unknown",
            createdAt: msg._creationTime,
          };
        }),
      );
    }

    // Past items of same type
    const pastItems = await ctx.db
      .query("inboxItems")
      .withIndex("by_user_status", (q) =>
        q.eq("userId", user._id).eq("status", "archived"),
      )
      .order("desc")
      .take(20);

    const relatedPastItems = pastItems
      .filter((d) => d.type === item.type && d._id !== item._id)
      .slice(0, 5)
      .map((d) => ({
        title: d.title,
        outcome: d.outcome,
        createdAt: d.createdAt,
        orgTrace: d.orgTrace ?? [],
      }));

    // Related items
    const relatedItems = (
      await Promise.all(
        (item.relatedItemIds ?? []).map(async (id) => {
          const d = await ctx.db.get(id);
          if (!d) return null;
          return {
            id: d._id,
            title: d.title,
            type: d.type,
            category: d.category,
            summary: d.summary,
            outcome: d.outcome,
            orgTrace: d.orgTrace ?? [],
            createdAt: d.createdAt,
            status: d.status,
          };
        }),
      )
    ).filter((d): d is NonNullable<typeof d> => d !== null);

    return {
      item,
      sourceMessage,
      sourceIntegrationObject,
      relatedMessages,
      relatedPastItems,
      relatedItems,
      links: item.links ?? [],
    };
  },
});

export const getStats = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    const now = Date.now();
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;

    const archived = await ctx.db
      .query("inboxItems")
      .withIndex("by_user_status", (q) =>
        q.eq("userId", user._id).eq("status", "archived"),
      )
      .take(500);

    const allResolved = archived.filter((d) => d.outcome);

    const total7d = allResolved.filter(
      (d) => d.createdAt >= sevenDaysAgo,
    ).length;
    const total30d = allResolved.filter(
      (d) => d.createdAt >= thirtyDaysAgo,
    ).length;

    const withTiming = allResolved.filter((d) => d.outcome?.decidedAt);
    const avgDecisionTimeMs =
      withTiming.length > 0
        ? withTiming.reduce(
            (sum, d) => sum + (d.outcome!.decidedAt - d.createdAt),
            0,
          ) / withTiming.length
        : 0;

    const delegated = allResolved.filter((d) => d.outcome?.delegatedTo);
    const delegationRate =
      allResolved.length > 0 ? delegated.length / allResolved.length : 0;

    const categories = { do: 0, decide: 0, delegate: 0, skip: 0 };
    const pending = await ctx.db
      .query("inboxItems")
      .withIndex("by_user_status", (q) =>
        q.eq("userId", user._id).eq("status", "pending"),
      )
      .take(500);
    for (const d of pending) {
      categories[d.category]++;
    }

    return {
      total7d,
      total30d,
      avgDecisionTimeMs,
      delegationRate,
      categoryDistribution: categories,
      pendingCount: pending.length,
    };
  },
});

// ─── Public mutations ────────────────────────────────────────────────────────

export const act = mutation({
  args: {
    itemId: v.id("inboxItems"),
    action: v.string(),
    comment: v.optional(v.string()),
    delegatedTo: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const item = await ctx.db.get(args.itemId);
    if (!item || item.userId !== user._id) {
      throw new Error("Not found");
    }
    if (item.status !== "pending" && item.status !== "snoozed") {
      throw new Error("Item already resolved");
    }

    const now = Date.now();

    await ctx.db.patch(args.itemId, {
      status: "archived",
      outcome: {
        action: args.action,
        comment: args.comment,
        delegatedTo: args.delegatedTo,
        decidedAt: now,
      },
      delegatedTo: args.delegatedTo,
      agentExecutionStatus: "pending",
    });

    await ctx.scheduler.runAfter(
      0,
      internal.decisionAgents.executeDecisionAction,
      { decisionId: args.itemId },
    );

    await ctx.scheduler.runAfter(0, internal.ingest.processInboxItem, {
      itemId: args.itemId,
    });
  },
});

export const archive = mutation({
  args: { itemId: v.id("inboxItems") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const item = await ctx.db.get(args.itemId);
    if (!item || item.userId !== user._id) {
      throw new Error("Not found");
    }
    await ctx.db.patch(args.itemId, { status: "archived" });
  },
});

export const snooze = mutation({
  args: {
    itemId: v.id("inboxItems"),
    snoozeUntil: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const item = await ctx.db.get(args.itemId);
    if (!item || item.userId !== user._id) {
      throw new Error("Not found");
    }
    if (item.status !== "pending") {
      throw new Error("Can only snooze pending items");
    }

    await ctx.db.patch(args.itemId, {
      status: "snoozed",
      snoozedUntil: args.snoozeUntil,
      expiresAt: args.snoozeUntil,
    });
  },
});

// ─── Internal mutations ──────────────────────────────────────────────────────

export const insertItem = internalMutation({
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
      v.literal("email_summary"),
    ),
    category: v.union(
      v.literal("do"),
      v.literal("decide"),
      v.literal("delegate"),
      v.literal("skip"),
    ),
    title: v.string(),
    summary: v.string(),
    context: v.optional(v.string()),
    pingWillDo: v.optional(v.string()),
    channelId: v.optional(v.id("channels")),
    sourceMessageId: v.optional(v.id("messages")),
    sourceIntegrationObjectId: v.optional(v.id("integrationObjects")),
    orgTrace: v.optional(
      v.array(
        v.object({
          userId: v.optional(v.id("users")),
          name: v.string(),
          role: v.union(
            v.literal("author"),
            v.literal("assignee"),
            v.literal("mentioned"),
            v.literal("to_consult"),
          ),
          avatarUrl: v.optional(v.string()),
        }),
      ),
    ),
    recommendedActions: v.optional(
      v.array(
        v.object({
          label: v.string(),
          actionKey: v.string(),
          primary: v.optional(v.boolean()),
          needsComment: v.optional(v.boolean()),
        }),
      ),
    ),
    nextSteps: v.optional(
      v.array(
        v.object({
          actionKey: v.string(),
          label: v.string(),
          automated: v.boolean(),
        }),
      ),
    ),
    links: v.optional(
      v.array(
        v.object({
          title: v.string(),
          url: v.string(),
          type: v.union(
            v.literal("doc"),
            v.literal("sheet"),
            v.literal("video"),
            v.literal("pr"),
            v.literal("other"),
          ),
        }),
      ),
    ),
    relatedItemIds: v.optional(v.array(v.id("inboxItems"))),
  },
  handler: async (ctx, args) => {
    const itemId = await ctx.db.insert("inboxItems", {
      ...args,
      status: "pending",
      createdAt: Date.now(),
    });

    await ctx.scheduler.runAfter(0, internal.ingest.processInboxItem, {
      itemId,
    });

    return itemId;
  },
});
