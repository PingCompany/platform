import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { requireAuth, requireUser } from "./auth";
import { hashToken } from "./agentAuth";

export const generate = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    label: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx, args.workspaceId);

    const rawToken = `ping_u_${crypto.randomUUID()}`;
    const tokenHash = await hashToken(rawToken);
    const tokenPrefix = rawToken.slice(0, 12);

    await ctx.db.insert("userApiTokens", {
      userId: user._id,
      workspaceId: args.workspaceId,
      tokenHash,
      tokenPrefix,
      label: args.label,
      status: "active",
      createdAt: Date.now(),
    });

    return { token: rawToken };
  },
});

export const list = query({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, { workspaceId }) => {
    const user = await requireUser(ctx);

    const tokens = await ctx.db
      .query("userApiTokens")
      .withIndex("by_user_workspace", (q) =>
        q.eq("userId", user._id).eq("workspaceId", workspaceId),
      )
      .collect();

    return tokens
      .filter((t) => t.status === "active")
      .map((t) => ({
        _id: t._id,
        tokenPrefix: t.tokenPrefix,
        label: t.label,
        createdAt: t.createdAt,
        lastUsedAt: t.lastUsedAt,
      }));
  },
});

export const revoke = mutation({
  args: { tokenId: v.id("userApiTokens") },
  handler: async (ctx, { tokenId }) => {
    const user = await requireUser(ctx);

    const token = await ctx.db.get(tokenId);
    if (!token) throw new Error("Token not found");
    if (token.userId !== user._id) throw new Error("Not authorized");

    await ctx.db.patch(tokenId, { status: "revoked" });
  },
});
