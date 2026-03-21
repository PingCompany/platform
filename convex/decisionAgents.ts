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
    decisionId: v.id("decisions"),
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
  args: { decisionId: v.id("decisions") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.decisionId);
  },
});

// ─── Main dispatcher ─────────────────────────────────────────────────────────

export const executeDecisionAction = internalAction({
  args: { decisionId: v.id("decisions") },
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

// ─── Internal queries for agent use ──────────────────────────────────────────

export const getIntegrationObject = internalQuery({
  args: { id: v.id("integrationObjects") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});
