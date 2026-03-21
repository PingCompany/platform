import { query, mutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { requireAuth } from "./auth";

export const send = mutation({
  args: {
    email: v.string(),
    role: v.union(v.literal("admin"), v.literal("member")),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);
    if (user.role !== "admin") {
      throw new Error("Only admins can send invitations");
    }

    // Check if invitation already exists for this email in this workspace
    const existing = await ctx.db
      .query("invitations")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .take(10);

    const alreadyInvited = existing.find(
      (inv) =>
        inv.workspaceId === user.workspaceId && inv.status === "pending",
    );
    if (alreadyInvited) {
      throw new Error("This email has already been invited");
    }

    // Check if user already exists in this workspace
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .unique();
    if (existingUser && existingUser.workspaceId === user.workspaceId) {
      throw new Error("This user is already in your workspace");
    }

    const token = crypto.randomUUID();
    const sevenDays = 7 * 24 * 60 * 60 * 1000;

    await ctx.db.insert("invitations", {
      workspaceId: user.workspaceId,
      email: args.email,
      invitedBy: user._id,
      role: args.role,
      status: "pending",
      token,
      expiresAt: Date.now() + sevenDays,
    });

    return { token };
  },
});

export const list = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireAuth(ctx);

    const invitations = await ctx.db
      .query("invitations")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", user.workspaceId))
      .take(100);

    return invitations.filter((inv) => inv.status === "pending");
  },
});

export const findPendingByEmail = internalQuery({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const invitations = await ctx.db
      .query("invitations")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .take(10);

    return invitations.find(
      (inv) => inv.status === "pending" && inv.expiresAt > Date.now(),
    ) ?? null;
  },
});

export const accept = mutation({
  args: { invitationId: v.id("invitations") },
  handler: async (ctx, args) => {
    const invitation = await ctx.db.get(args.invitationId);
    if (!invitation) throw new Error("Invitation not found");
    if (invitation.status !== "pending") {
      throw new Error("Invitation is no longer pending");
    }
    if (invitation.expiresAt < Date.now()) {
      await ctx.db.patch(args.invitationId, { status: "expired" });
      throw new Error("Invitation has expired");
    }

    await ctx.db.patch(args.invitationId, { status: "accepted" });
    return invitation;
  },
});
