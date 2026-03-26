import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { requireAuth } from "./auth";

export const submit = mutation({
  args: {
    slug: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
    message: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const workspace = await ctx.db
      .query("workspaces")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();
    if (!workspace) throw new Error("Workspace not found");

    // Check for duplicate pending request
    const existingRequests = await ctx.db
      .query("accessRequests")
      .withIndex("by_email_workspace", (q) =>
        q.eq("email", args.email).eq("workspaceId", workspace._id),
      )
      .collect();
    const pendingRequest = existingRequests.find((r) => r.status === "pending");
    if (pendingRequest) throw new Error("Request already pending");

    // Optionally resolve userId if caller is authenticated
    let userId: Id<"users"> | undefined;
    const identity = await ctx.auth.getUserIdentity();
    if (identity) {
      const user = await ctx.db
        .query("users")
        .withIndex("by_workos_id", (q) => q.eq("workosUserId", identity.subject))
        .unique();
      if (user) {
        // Check if already a member
        const membership = await ctx.db
          .query("workspaceMembers")
          .withIndex("by_user_workspace", (q) =>
            q.eq("userId", user._id).eq("workspaceId", workspace._id),
          )
          .unique();
        if (membership) throw new Error("Already a member");
        userId = user._id;
      }
    }

    await ctx.db.insert("accessRequests", {
      workspaceId: workspace._id,
      email: args.email,
      name: args.name,
      message: args.message,
      userId,
      status: "pending",
      createdAt: Date.now(),
    });
  },
});

export const list = query({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx, args.workspaceId);
    if (user.role !== "admin") {
      throw new Error("Only admins can view access requests");
    }

    return await ctx.db
      .query("accessRequests")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .order("desc")
      .collect();
  },
});

export const review = mutation({
  args: {
    requestId: v.id("accessRequests"),
    decision: v.union(v.literal("approved"), v.literal("rejected")),
  },
  handler: async (ctx, args) => {
    const request = await ctx.db.get(args.requestId);
    if (!request) throw new Error("Access request not found");
    if (request.status !== "pending") {
      throw new Error("Access request is no longer pending");
    }

    const user = await requireAuth(ctx, request.workspaceId);
    if (user.role !== "admin") {
      throw new Error("Only admins can review access requests");
    }

    if (args.decision === "approved") {
      if (request.userId) {
        // Check not already a member
        const existingMembership = await ctx.db
          .query("workspaceMembers")
          .withIndex("by_user_workspace", (q) =>
            q.eq("userId", request.userId!).eq("workspaceId", request.workspaceId),
          )
          .unique();

        if (!existingMembership) {
          await ctx.db.insert("workspaceMembers", {
            userId: request.userId,
            workspaceId: request.workspaceId,
            role: "member",
            joinedAt: Date.now(),
          });

          // Auto-join #general
          const generalChannel = await ctx.db
            .query("channels")
            .withIndex("by_workspace_name", (q) =>
              q.eq("workspaceId", request.workspaceId).eq("name", "general"),
            )
            .unique();
          if (generalChannel) {
            await ctx.db.insert("channelMembers", {
              channelId: generalChannel._id,
              userId: request.userId,
            });
          }
        }
      } else {
        // No userId — create an invitation so they can join later
        await ctx.db.insert("invitations", {
          workspaceId: request.workspaceId,
          email: request.email,
          invitedBy: user._id,
          role: "member",
          status: "pending",
          token: crypto.randomUUID(),
          expiresAt: Date.now() + 90 * 24 * 60 * 60 * 1000,
        });
      }
    }

    await ctx.db.patch(args.requestId, {
      status: args.decision,
      reviewedBy: user._id,
      reviewedAt: Date.now(),
    });
  },
});

export const countPending = query({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx, args.workspaceId);
    if (user.role !== "admin") {
      throw new Error("Only admins can view access request counts");
    }

    const pending = await ctx.db
      .query("accessRequests")
      .withIndex("by_workspace_status", (q) =>
        q.eq("workspaceId", args.workspaceId).eq("status", "pending"),
      )
      .collect();
    return pending.length;
  },
});
