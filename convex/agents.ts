import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireAuth } from "./auth";

export const list = query({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, args) => {
    await requireAuth(ctx, args.workspaceId);
    return await ctx.db
      .query("agents")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .take(50);
  },
});

export const create = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    name: v.string(),
    description: v.optional(v.string()),
    systemPrompt: v.optional(v.string()),
    color: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx, args.workspaceId);
    return await ctx.db.insert("agents", {
      workspaceId: args.workspaceId,
      userId: user._id,
      name: args.name,
      description: args.description,
      systemPrompt: args.systemPrompt,
      color: args.color,
      status: "active",
      createdBy: user._id,
    });
  },
});

export const update = mutation({
  args: {
    agentId: v.id("agents"),
    workspaceId: v.id("workspaces"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    systemPrompt: v.optional(v.string()),
    color: v.optional(v.string()),
    status: v.optional(
      v.union(v.literal("active"), v.literal("inactive"), v.literal("revoked")),
    ),
  },
  handler: async (ctx, args) => {
    await requireAuth(ctx, args.workspaceId);
    const agent = await ctx.db.get(args.agentId);
    if (!agent || agent.workspaceId !== args.workspaceId)
      throw new Error("Agent not found");
    const { agentId, workspaceId, ...updates } = args;
    const filtered = Object.fromEntries(
      Object.entries(updates).filter(([, v]) => v !== undefined),
    );
    await ctx.db.patch(agentId, filtered);
  },
});

export const generateToken = mutation({
  args: {
    agentId: v.id("agents"),
    workspaceId: v.id("workspaces"),
    label: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAuth(ctx, args.workspaceId);
    const agent = await ctx.db.get(args.agentId);
    if (!agent || agent.workspaceId !== args.workspaceId)
      throw new Error("Agent not found");
    const token = crypto.randomUUID();
    const encoder = new TextEncoder();
    const data = encoder.encode(token);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const tokenHash = Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    await ctx.db.insert("agentApiTokens", {
      agentId: args.agentId,
      tokenHash,
      label: args.label,
      status: "active",
      createdAt: Date.now(),
    });
    return token;
  },
});
