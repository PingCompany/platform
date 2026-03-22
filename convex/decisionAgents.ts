import { internalAction, internalMutation, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import {
  callCivicNexusTool,
  closeCivicNexusClient,
} from "./civicNexus";

// ─── Execution status updater ────────────────────────────────────────────────

export const updateExecutionStatus = internalMutation({
  args: {
    decisionId: v.id("inboxItems"),
    agentExecutionStatus: v.union(
      v.literal("pending"),
      v.literal("running"),
      v.literal("completed"),
      v.literal("failed"),
    ),
    agentExecutionResult: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.decisionId, {
      agentExecutionStatus: args.agentExecutionStatus,
      agentExecutionResult: args.agentExecutionResult,
    });
  },
});

// ─── Read decision for agent execution ───────────────────────────────────────

export const getDecision = internalQuery({
  args: { decisionId: v.id("inboxItems") },
  handler: async (ctx, args) => {
    const item = await ctx.db.get(args.decisionId);
    if (!item) return null;
    // Adapt to the DecisionDoc interface used by handlers
    return {
      ...item,
      workspaceId: item.workspaceId,
    };
  },
});

// ─── Main dispatcher ─────────────────────────────────────────────────────────

export const executeDecisionAction = internalAction({
  args: { decisionId: v.id("inboxItems") },
  handler: async (ctx, args) => {
    const decision = await ctx.runQuery(
      internal.decisionAgents.getDecision,
      { decisionId: args.decisionId },
    );
    if (!decision || !decision.outcome) {
      console.error(
        `[decisionAgents] Decision ${args.decisionId} not found or has no outcome`,
      );
      return;
    }

    await ctx.runMutation(internal.decisionAgents.updateExecutionStatus, {
      decisionId: args.decisionId,
      agentExecutionStatus: "running",
    });

    try {
      let result: string;

      // Check if the chosen action is "coordinate" — handle specially regardless of type
      const isCoordinate = decision.outcome?.action === "coordinate";

      if (isCoordinate) {
        result = await handleCoordinate(ctx, decision);
      } else {
        switch (decision.type) {
          case "pr_review":
            result = await handlePRReview(ctx, decision);
            break;
          case "ticket_triage":
          case "blocked_unblock":
            result = await handleLinearTicket(ctx, decision);
            break;
          case "question_answer":
            result = await postBotReply(ctx, decision, { alwaysPost: true });
            break;
          case "fact_verify":
          case "cross_team_ack":
          case "channel_summary":
            result = await postBotReply(ctx, decision, { alwaysPost: false });
            break;
          default:
            result = `No handler for decision type: ${decision.type}`;
        }
      }

      await ctx.runMutation(internal.decisionAgents.updateExecutionStatus, {
        decisionId: args.decisionId,
        agentExecutionStatus: "completed",
        agentExecutionResult: result,
      });
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Unknown error";
      console.error(
        `[decisionAgents] Failed to execute decision ${args.decisionId}:`,
        errorMsg,
      );

      await ctx.runMutation(internal.decisionAgents.updateExecutionStatus, {
        decisionId: args.decisionId,
        agentExecutionStatus: "failed",
        agentExecutionResult: errorMsg,
      });
    }
  },
});

// ─── Type-specific handlers ──────────────────────────────────────────────────

type ActionCtx = {
  runQuery: (ref: any, args: any) => Promise<any>;
  runMutation: (ref: any, args: any) => Promise<any>;
};

type DecisionDoc = {
  _id: any;
  userId: any;
  type: string;
  outcome?: {
    action: string;
    comment?: string;
    delegatedTo?: any;
    decidedAt: number;
  };
  sourceIntegrationObjectId?: any;
  sourceMessageId?: any;
  channelId?: any;
  workspaceId: any;
  title: string;
  summary: string;
  orgTrace?: Array<{
    userId?: any;
    name: string;
    role: string;
  }>;
  nextSteps?: Array<{
    actionKey: string;
    label: string;
    automated: boolean;
  }>;
};

async function handlePRReview(
  ctx: ActionCtx,
  decision: DecisionDoc,
): Promise<string> {
  if (!decision.sourceIntegrationObjectId) {
    return "No integration object linked; skipped PR action.";
  }

  const integrationObj = await ctx.runQuery(
    internal.decisionAgents.getIntegrationObject,
    { id: decision.sourceIntegrationObjectId },
  );
  if (!integrationObj) {
    return "Integration object not found.";
  }

  const meta = integrationObj.metadata as {
    repo?: string;
    owner?: string;
    number?: number;
  };
  if (!meta.owner || !meta.repo || !meta.number) {
    return "PR metadata incomplete; cannot execute GitHub action.";
  }

  const action = decision.outcome!.action;
  const comment = decision.outcome!.comment;

  try {
    if (action === "approve" || action === "request_changes") {
      // Review body carries the comment, so no separate issue comment needed
      await callCivicNexusTool("create_pull_request_review", {
        owner: meta.owner,
        repo: meta.repo,
        pull_number: meta.number,
        event: action === "approve" ? "APPROVE" : "REQUEST_CHANGES",
        body: comment ?? "",
      });
    } else if (comment) {
      await callCivicNexusTool("create_issue_comment", {
        owner: meta.owner,
        repo: meta.repo,
        issue_number: meta.number,
        body: comment,
      });
    }

    await closeCivicNexusClient();
    return `PR #${meta.number} action "${action}" executed successfully.`;
  } catch (err) {
    await closeCivicNexusClient();
    throw err;
  }
}

async function handleLinearTicket(
  ctx: ActionCtx,
  decision: DecisionDoc,
): Promise<string> {
  if (!decision.sourceIntegrationObjectId) {
    return "No integration object linked; skipped Linear action.";
  }

  const integrationObj = await ctx.runQuery(
    internal.decisionAgents.getIntegrationObject,
    { id: decision.sourceIntegrationObjectId },
  );
  if (!integrationObj) {
    return "Integration object not found.";
  }

  const action = decision.outcome!.action;
  const comment = decision.outcome!.comment;
  const issueId = integrationObj.externalId.replace("linear_", "");

  try {
    if (comment) {
      await callCivicNexusTool("create_comment", {
        issue_id: issueId,
        body: comment,
      });
    }

    if (action === "close" || action === "cancel") {
      await callCivicNexusTool("update_issue", {
        issue_id: issueId,
        state_name: action === "close" ? "Done" : "Cancelled",
      });
    }

    await closeCivicNexusClient();
    return `Linear issue ${issueId} action "${action}" executed successfully.`;
  } catch (err) {
    await closeCivicNexusClient();
    throw err;
  }
}

/**
 * Posts a bot message in the decision's channel. Used by question_answer,
 * fact_verify, cross_team_ack, and channel_summary decision types.
 *
 * For question_answer, always posts (falls back to action text).
 * For other types, only posts when the user provided a comment.
 */
async function postBotReply(
  ctx: ActionCtx,
  decision: DecisionDoc,
  options: { alwaysPost: boolean },
): Promise<string> {
  if (!decision.channelId) {
    return "No channel linked; skipped message post.";
  }

  const botUser = await ctx.runQuery(internal.bot.getBotUser, {
    workspaceId: decision.workspaceId,
  });
  if (!botUser) {
    return "No bot user found for workspace.";
  }

  const action = decision.outcome!.action;
  const comment = decision.outcome!.comment;
  const body = comment ?? (options.alwaysPost ? action : null);

  if (body) {
    await ctx.runMutation(internal.bot.insertBotMessage, {
      channelId: decision.channelId,
      authorId: botUser._id,
      body,
    });
    return `Posted "${action}" response in channel.`;
  }

  return `Decision "${action}" recorded (no channel message needed).`;
}

// ─── Coordinate handler: ticket + group conversation ────────────────────────

async function handleCoordinate(
  ctx: ActionCtx,
  decision: DecisionDoc,
): Promise<string> {
  const results: string[] = [];

  // 1. Create a Linear ticket for tracking
  try {
    const ticketResult = await callCivicNexusTool("create_issue", {
      title: decision.title,
      description: [
        `**Decision:** ${decision.title}`,
        "",
        `**Context:** ${decision.summary}`,
        "",
        decision.outcome?.comment ? `**Decision comment:** ${decision.outcome.comment}` : "",
        "",
        `**People involved:**`,
        ...(decision.orgTrace ?? []).map(
          (p) => `- ${p.name} (${p.role})`,
        ),
        "",
        `*Created by mrPING from inbox decision.*`,
      ]
        .filter(Boolean)
        .join("\n"),
      priority: decision.type === "blocked_unblock" ? 1 : 2,
    });
    results.push(`Linear ticket created: ${ticketResult}`);
    await closeCivicNexusClient();
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    results.push(`Linear ticket creation failed: ${msg}`);
    try { await closeCivicNexusClient(); } catch { /* ignore */ }
  }

  // 2. Collect participant userIds from orgTrace
  const participantIds: string[] = [];
  const riskDescriptions: Map<string, string> = new Map();

  for (const person of decision.orgTrace ?? []) {
    if (person.userId) {
      participantIds.push(person.userId);
      // Map role to risk description
      const roleDesc =
        person.role === "author"
          ? "Raised this issue — owns the context"
          : person.role === "assignee"
            ? "Responsible for execution — delivery risk"
            : person.role === "mentioned"
              ? "Referenced in discussion — may be impacted"
              : "Subject matter expert — consult for risk assessment";
      riskDescriptions.set(person.name, roleDesc);
    }
  }

  // Add decision owner if not already included
  const ownerIncluded = participantIds.includes(decision.userId as string);
  if (!ownerIncluded) {
    participantIds.push(decision.userId as string);
  }

  if (participantIds.length === 0) {
    results.push("No participants with user IDs found; skipped conversation creation.");
    return results.join("\n");
  }

  // 3. Get the mrPING bot user to add as agent member
  const botUser = await ctx.runQuery(internal.bot.getBotUser, {
    workspaceId: decision.workspaceId,
  });

  // 4. Create group AI-aided conversation
  const agentMemberIds = botUser ? [botUser._id] : [];

  const conversationId = await ctx.runMutation(
    internal.decisionAgents.createGroupConversation,
    {
      workspaceId: decision.workspaceId,
      createdBy: decision.userId,
      name: decision.title,
      memberIds: participantIds,
      agentMemberIds,
    },
  );

  // 5. Post initial bot message tagging each person with their risk
  const tagLines = (decision.orgTrace ?? [])
    .filter((p) => p.userId)
    .map((p) => `• **${p.name}** — ${riskDescriptions.get(p.name) ?? p.role}`);

  // Add owner tracking line
  const ownerUser = await ctx.runQuery(internal.decisionAgents.getUser, {
    userId: decision.userId,
  });
  if (ownerUser && !ownerIncluded) {
    tagLines.push(`• **${ownerUser.name}** — Decision owner (tracking)`);
  }

  const introMessage = [
    `📋 **${decision.title}**`,
    "",
    decision.summary,
    "",
    decision.outcome?.comment ? `**Decision:** ${decision.outcome.comment}` : "",
    "",
    "**Stakeholders & risk areas:**",
    ...tagLines,
    "",
    "I'll help coordinate next steps. What should we tackle first?",
  ]
    .filter(Boolean)
    .join("\n");

  if (botUser) {
    await ctx.runMutation(internal.decisionAgents.sendGroupMessage, {
      conversationId,
      authorId: botUser._id,
      body: introMessage,
    });
  }

  results.push(`Group conversation created with ${participantIds.length} stakeholders.`);
  return results.join("\n");
}

// ─── Internal mutations for coordinate handler ──────────────────────────────

export const createGroupConversation = internalMutation({
  args: {
    workspaceId: v.id("workspaces"),
    createdBy: v.id("users"),
    name: v.string(),
    memberIds: v.array(v.string()),
    agentMemberIds: v.array(v.id("users")),
  },
  handler: async (ctx, args) => {
    const conversationId = await ctx.db.insert("directConversations", {
      workspaceId: args.workspaceId,
      kind: "agent_group",
      name: args.name,
      createdBy: args.createdBy,
      isArchived: false,
    });

    const addedUserIds = new Set<string>();

    // Add agent members
    for (const agentId of args.agentMemberIds) {
      if (addedUserIds.has(agentId)) continue;
      await ctx.db.insert("directConversationMembers", {
        conversationId,
        userId: agentId,
        isAgent: true,
      });
      addedUserIds.add(agentId);
    }

    // Add human members
    for (const memberId of args.memberIds) {
      if (addedUserIds.has(memberId)) continue;
      await ctx.db.insert("directConversationMembers", {
        conversationId,
        userId: memberId as any,
        isAgent: false,
      });
      addedUserIds.add(memberId);
    }

    return conversationId;
  },
});

export const sendGroupMessage = internalMutation({
  args: {
    conversationId: v.id("directConversations"),
    authorId: v.id("users"),
    body: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("directMessages", {
      conversationId: args.conversationId,
      authorId: args.authorId,
      body: args.body,
      type: "bot",
      isEdited: false,
    });
  },
});

export const getUser = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.userId);
  },
});

// ─── Internal queries for agent use ──────────────────────────────────────────

export const getIntegrationObject = internalQuery({
  args: { id: v.id("integrationObjects") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});
