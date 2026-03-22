import { internalMutation, mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireAuth } from "./auth";

// ── Managed agent definitions ────────────────────────────────────────

export const MANAGED_AGENTS = [
  {
    slug: "mr-ping",
    name: "mrPING",
    description:
      "Your AI workspace assistant. Knows your channels, people, and projects.",
    color: "#8B5CF6",
    model: "gpt-5.4",
    scope: "workspace" as const,
    tools: [
      "read_channels",
      "search_knowledge",
      "send_messages",
      "summarize",
      "draft_responses",
    ],
    triggers: ["on_mention", "on_dm"],
    restrictions: [],
    jobs: [],
    systemPrompt: `You are mrPING, the primary AI assistant built into the PING workspace platform.

Personality:
- Helpful, direct, and concise. You get to the point quickly.
- Professional but approachable. You're a colleague, not a corporate chatbot.
- You cite sources when you have knowledge graph facts available, using [n] notation.

Capabilities:
- You have access to the workspace's knowledge graph and can surface relevant facts from channels, conversations, and integrations.
- You can help with summarizing discussions, finding information across channels, drafting messages, and answering questions about what's happening in the workspace.
- When you don't have enough context, say so clearly rather than guessing.

Guidelines:
- Keep responses concise — aim for 1-3 paragraphs unless the user asks for detail.
- When citing knowledge graph facts, use [n] notation to reference them.
- If multiple facts are relevant, synthesize them into a coherent answer rather than listing them.
- Never make up information. If you don't know, say "I don't have enough context on that."`,
  },
] as const;

// ── Provisioning ─────────────────────────────────────────────────────

/**
 * Idempotently ensures all managed agents exist for a workspace.
 * Safe to call multiple times — checks by managedSlug before creating.
 */
export const ensureManagedAgents = internalMutation({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, args) => {
    for (const spec of MANAGED_AGENTS) {
      // Check if this managed agent already exists
      const existing = await ctx.db
        .query("agents")
        .withIndex("by_managed_slug", (q) => q.eq("managedSlug", spec.slug))
        .filter((q) => q.eq(q.field("workspaceId"), args.workspaceId))
        .first();

      if (existing) {
        // Update config to stay current with platform definitions
        await ctx.db.patch(existing._id, {
          systemPrompt: spec.systemPrompt,
          tools: [...spec.tools],
          triggers: [...spec.triggers],
          model: spec.model,
          description: spec.description,
        });

        // Sync name to user record
        if (existing.agentUserId) {
          await ctx.db.patch(existing.agentUserId, {
            name: spec.name,
            bio: spec.description,
          });
        }
        continue;
      }

      // Create user record for the agent
      const agentUserId = await ctx.db.insert("users", {
        workosUserId: `managed:${spec.slug}`,
        email: `${spec.slug}@managed.ping.local`,
        name: spec.name,
        status: "active",
        onboardingStatus: "completed",
        bio: spec.description,
        title: "Platform Agent",
      });

      // Add as workspace member
      await ctx.db.insert("workspaceMembers", {
        userId: agentUserId,
        workspaceId: args.workspaceId,
        role: "member",
        joinedAt: Date.now(),
      });

      // Create agent record
      await ctx.db.insert("agents", {
        workspaceId: args.workspaceId,
        userId: agentUserId,
        name: spec.name,
        description: spec.description,
        systemPrompt: spec.systemPrompt,
        color: spec.color,
        model: spec.model,
        scope: spec.scope,
        tools: [...spec.tools],
        restrictions: [...spec.restrictions],
        triggers: [...spec.triggers],
        jobs: [...spec.jobs],
        status: "active",
        createdBy: agentUserId,
        agentUserId,
        isManaged: true,
        managedSlug: spec.slug,
      });
    }
  },
});

// ── Queries ──────────────────────────────────────────────────────────

export const listManaged = query({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, args) => {
    await requireAuth(ctx, args.workspaceId);
    const agents = await ctx.db
      .query("agents")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .filter((q) =>
        q.and(
          q.eq(q.field("isManaged"), true),
          q.neq(q.field("status"), "revoked"),
        ),
      )
      .collect();
    return agents;
  },
});

export const getManagedAgent = query({
  args: {
    workspaceId: v.id("workspaces"),
    slug: v.string(),
  },
  handler: async (ctx, args) => {
    await requireAuth(ctx, args.workspaceId);
    const agent = await ctx.db
      .query("agents")
      .withIndex("by_managed_slug", (q) => q.eq("managedSlug", args.slug))
      .filter((q) => q.eq(q.field("workspaceId"), args.workspaceId))
      .first();
    return agent;
  },
});

/**
 * Public mutation to provision managed agents for an existing workspace.
 * Idempotent — safe to call multiple times.
 */
export const provision = mutation({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, args) => {
    await requireAuth(ctx, args.workspaceId);

    for (const spec of MANAGED_AGENTS) {
      const existing = await ctx.db
        .query("agents")
        .withIndex("by_managed_slug", (q) => q.eq("managedSlug", spec.slug))
        .filter((q) => q.eq(q.field("workspaceId"), args.workspaceId))
        .first();

      if (existing) {
        await ctx.db.patch(existing._id, {
          systemPrompt: spec.systemPrompt,
          tools: [...spec.tools],
          triggers: [...spec.triggers],
          model: spec.model,
          description: spec.description,
        });
        if (existing.agentUserId) {
          await ctx.db.patch(existing.agentUserId, {
            name: spec.name,
            bio: spec.description,
          });
        }
        continue;
      }

      const agentUserId = await ctx.db.insert("users", {
        workosUserId: `managed:${spec.slug}`,
        email: `${spec.slug}@managed.ping.local`,
        name: spec.name,
        status: "active",
        onboardingStatus: "completed",
        bio: spec.description,
        title: "Platform Agent",
      });

      await ctx.db.insert("workspaceMembers", {
        userId: agentUserId,
        workspaceId: args.workspaceId,
        role: "member",
        joinedAt: Date.now(),
      });

      await ctx.db.insert("agents", {
        workspaceId: args.workspaceId,
        userId: agentUserId,
        name: spec.name,
        description: spec.description,
        systemPrompt: spec.systemPrompt,
        color: spec.color,
        model: spec.model,
        scope: spec.scope,
        tools: [...spec.tools],
        restrictions: [...spec.restrictions],
        triggers: [...spec.triggers],
        jobs: [...spec.jobs],
        status: "active",
        createdBy: agentUserId,
        agentUserId,
        isManaged: true,
        managedSlug: spec.slug,
      });
    }
  },
});
