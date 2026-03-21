import { query, mutation, MutationCtx } from "./_generated/server";
import { v } from "convex/values";
import { requireAuth } from "./auth";

async function provisionNewUser(
  ctx: MutationCtx,
  args: {
    workosUserId: string;
    email: string;
    name: string;
    avatarUrl?: string;
  },
) {
  const slug = args.email.split("@")[0] + "-" + Date.now();

  const workspaceId = await ctx.db.insert("workspaces", {
    name: `${args.name}'s Workspace`,
    slug,
    integrations: {},
  });

  const userId = await ctx.db.insert("users", {
    workosUserId: args.workosUserId,
    email: args.email,
    name: args.name,
    avatarUrl: args.avatarUrl,
    role: "admin",
    workspaceId,
    status: "active",
    lastSeenAt: Date.now(),
  });

  await ctx.db.patch(workspaceId, { createdBy: userId });

  // Create a default #general channel
  const channelId = await ctx.db.insert("channels", {
    name: "general",
    description: "General discussion",
    workspaceId,
    createdBy: userId,
    isDefault: true,
    isArchived: false,
  });

  await ctx.db.insert("channelMembers", {
    channelId,
    userId,
  });

  return userId;
}

export const getMe = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    return await ctx.db
      .query("users")
      .withIndex("by_workos_id", (q) =>
        q.eq("workosUserId", identity.subject),
      )
      .unique();
  },
});

export const listAll = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireAuth(ctx);
    const users = await ctx.db
      .query("users")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", user.workspaceId))
      .take(200);
    return users
      .filter((u) => u.status === "active")
      .map((u) => ({
        _id: u._id,
        name: u.name,
        email: u.email,
        avatarUrl: u.avatarUrl,
        role: u.role,
      }));
  },
});

export const getByWorkosId = query({
  args: { workosUserId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_workos_id", (q) =>
        q.eq("workosUserId", args.workosUserId),
      )
      .unique();
  },
});

export const updateProfile = mutation({
  args: {
    name: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_workos_id", (q) =>
        q.eq("workosUserId", identity.subject),
      )
      .unique();

    if (!user) throw new Error("User not found");

    const updates: Record<string, unknown> = { lastSeenAt: Date.now() };
    if (args.name !== undefined) updates.name = args.name;

    await ctx.db.patch(user._id, updates);
    return user._id;
  },
});

export const createOrUpdate = mutation({
  args: {
    workosUserId: v.string(),
    email: v.string(),
    name: v.string(),
    avatarUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_workos_id", (q) =>
        q.eq("workosUserId", args.workosUserId),
      )
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        email: args.email,
        name: args.name,
        avatarUrl: args.avatarUrl,
        lastSeenAt: Date.now(),
      });
      return existing._id;
    }

    return await provisionNewUser(ctx, args);
  },
});
