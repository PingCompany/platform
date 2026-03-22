import {
  query,
  mutation,
  internalMutation,
  internalAction,
} from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { requireUser } from "./auth";
import {
  callCivicNexusTool,
  closeCivicNexusClient,
} from "./civicNexus";

export const getAlerts = query({
  args: {
    status: v.optional(
      v.union(
        v.literal("pending"),
        v.literal("snoozed"),
        v.literal("archived"),
      ),
    ),
    type: v.optional(
      v.union(
        v.literal("pr_review"),
        v.literal("ticket_triage"),
        v.literal("question_answer"),
        v.literal("blocked_unblock"),
      ),
    ),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    if (args.status) {
      return await ctx.db
        .query("inboxItems")
        .withIndex("by_user_status", (q) =>
          q.eq("userId", user._id).eq("status", args.status!),
        )
        .take(100);
    }

    return await ctx.db
      .query("inboxItems")
      .withIndex("by_user_status", (q) =>
        q.eq("userId", user._id).eq("status", "pending"),
      )
      .take(100);
  },
});

export const actOnAlert = mutation({
  args: {
    alertId: v.id("inboxItems"),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const alert = await ctx.db.get(args.alertId);
    if (!alert) throw new Error("Alert not found");
    if (alert.userId !== user._id) throw new Error("Not authorized");

    await ctx.db.patch(args.alertId, { status: "archived" });
  },
});

export const dismissAlert = mutation({
  args: {
    alertId: v.id("inboxItems"),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const alert = await ctx.db.get(args.alertId);
    if (!alert) throw new Error("Alert not found");
    if (alert.userId !== user._id) throw new Error("Not authorized");

    await ctx.db.patch(args.alertId, { status: "archived" });
  },
});

export const expireStaleAlerts = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const pendingItems = await ctx.db
      .query("inboxItems")
      .filter((q) =>
        q.and(
          q.eq(q.field("status"), "pending"),
          q.neq(q.field("expiresAt"), undefined),
        ),
      )
      .take(10000);
    let expiredCount = 0;

    for (const item of pendingItems) {
      if (item.expiresAt && item.expiresAt < now) {
        await ctx.db.patch(item._id, { status: "archived" });
        expiredCount++;
      }
    }

    console.log(`[proactive.expireStaleAlerts] Expired ${expiredCount} items`);
  },
});

export const scanUnansweredQuestions = internalAction({
  args: {},
  handler: async () => {
    console.log(
      "[proactive.scanUnansweredQuestions stub] Would scan for unanswered questions",
    );
  },
});

const PR_STALE_THRESHOLD_MS = 4 * 60 * 60 * 1000;

export const scanPRReviewNudges = internalAction({
  args: {},
  handler: async (ctx) => {
    const workspace = await ctx.runQuery(
      internal.webhooks.getDefaultWorkspace,
    );
    if (!workspace) {
      console.log("[scanPRReviewNudges] No default workspace found");
      return;
    }

    const openPRs = await ctx.runQuery(internal.integrations.listOpenPRs, {
      workspaceId: workspace._id,
    });

    if (openPRs.length === 0) {
      console.log("[scanPRReviewNudges] No open PRs found");
      return;
    }

    const now = Date.now();
    const stalePRs = openPRs.filter(
      (pr: any) => now - pr.lastSyncedAt > PR_STALE_THRESHOLD_MS,
    );

    if (stalePRs.length === 0) {
      console.log("[scanPRReviewNudges] No stale PRs found");
      return;
    }

    const channels = await ctx.runQuery(internal.channels.getByWorkspaceName, {
      workspaceId: workspace._id,
      name: "engineering",
    });
    if (!channels) {
      console.log("[scanPRReviewNudges] No #engineering channel found");
      return;
    }

    const allUsers = await ctx.runQuery(internal.users.listByWorkspace, {
      workspaceId: workspace._id,
    });

    let nudgeCount = 0;

    for (const pr of stalePRs) {
      const meta = pr.metadata as {
        repo?: string;
        owner?: string;
        number?: number;
      };

      let reviewInfo = "";
      let requestedReviewers: string[] = [];
      try {
        if (meta.owner && meta.repo && meta.number) {
          const reviewData = await callCivicNexusTool("list_pull_request_reviews", {
            owner: meta.owner,
            repo: meta.repo,
            pull_number: meta.number,
          });
          reviewInfo = reviewData;

          const prData = await callCivicNexusTool("get_pull_request", {
            owner: meta.owner,
            repo: meta.repo,
            pull_number: meta.number,
          });

          try {
            const parsed = JSON.parse(prData);
            requestedReviewers =
              parsed.requested_reviewers?.map(
                (r: { login: string }) => r.login,
              ) ?? [];
          } catch {
            // prData might not be JSON
          }
        }
      } catch (err) {
        console.warn(
          `[scanPRReviewNudges] Civic Nexus call failed for PR #${meta.number}:`,
          err,
        );
      }

      let hasApproval = false;
      try {
        const parsed = JSON.parse(reviewInfo);
        if (Array.isArray(parsed)) {
          hasApproval = parsed.some(
            (r: { state: string }) => r.state === "APPROVED",
          );
        }
      } catch {
        // reviewInfo might not be JSON
      }

      if (hasApproval) continue;

      const hoursOpen = Math.round(
        (now - pr.lastSyncedAt) / (60 * 60 * 1000),
      );

      const targetUsers =
        requestedReviewers.length > 0
          ? allUsers.filter((u: any) =>
              requestedReviewers.some(
                (reviewer: string) =>
                  u.name.toLowerCase().includes(reviewer.toLowerCase()) ||
                  u.email.toLowerCase().includes(reviewer.toLowerCase()),
              ),
            )
          : allUsers.filter(
              (u: any) => u.status === "active" && u.name !== pr.author,
            );

      for (const user of targetUsers) {
        const isMember = await ctx.runQuery(internal.channels.isMember, {
          channelId: channels._id,
          userId: user._id,
        });
        if (!isMember) continue;

        await ctx.runMutation(internal.inboxItems.insertItem, {
          userId: user._id,
          workspaceId: workspace._id,
          type: "pr_review",
          category: hoursOpen > 24 ? "do" : "decide",
          title: `PR #${meta.number ?? "?"} waiting for review`,
          summary: `"${pr.title}" by ${pr.author} has been open for ${hoursOpen}h without approval.`,
          pingWillDo: `Review PR at ${pr.url}`,
          sourceIntegrationObjectId: pr._id,
          channelId: channels._id,
        });
        nudgeCount++;
      }
    }

    await closeCivicNexusClient();
    console.log(
      `[scanPRReviewNudges] Created ${nudgeCount} nudges for ${stalePRs.length} stale PRs`,
    );
  },
});

const BLOCKED_TASK_THRESHOLD_MS = 2 * 24 * 60 * 60 * 1000;

export const scanBlockedTasks = internalAction({
  args: {},
  handler: async (ctx) => {
    const workspace = await ctx.runQuery(
      internal.webhooks.getDefaultWorkspace,
    );
    if (!workspace) {
      console.log("[scanBlockedTasks] No default workspace found");
      return;
    }

    const inProgressTickets = await ctx.runQuery(
      internal.integrations.listInProgressTickets,
      { workspaceId: workspace._id },
    );

    if (inProgressTickets.length === 0) {
      console.log("[scanBlockedTasks] No in-progress tickets found");
      return;
    }

    const now = Date.now();
    const staleTickets = inProgressTickets.filter(
      (t: any) => now - t.lastSyncedAt > BLOCKED_TASK_THRESHOLD_MS,
    );

    if (staleTickets.length === 0) {
      console.log("[scanBlockedTasks] No stale in-progress tickets found");
      return;
    }

    const channels = await ctx.runQuery(internal.channels.getByWorkspaceName, {
      workspaceId: workspace._id,
      name: "engineering",
    });
    if (!channels) return;

    const allUsers = await ctx.runQuery(internal.users.listByWorkspace, {
      workspaceId: workspace._id,
    });

    let alertCount = 0;

    for (const ticket of staleTickets) {
      const meta = ticket.metadata as {
        identifier?: string;
        priority?: number;
      };

      let ticketDetails = "";
      try {
        ticketDetails = await callCivicNexusTool("get_issue", {
          issue_id: ticket.externalId.replace("linear_", ""),
        });
      } catch (err) {
        console.warn(
          `[scanBlockedTasks] Civic Nexus call failed for ${meta.identifier}:`,
          err,
        );
      }

      const daysStuck = Math.round(
        (now - ticket.lastSyncedAt) / (24 * 60 * 60 * 1000),
      );

      const assigneeUser = allUsers.find(
        (u: any) =>
          u.status === "active" &&
          (u.name.toLowerCase().includes(ticket.author.toLowerCase()) ||
            u.email.toLowerCase().includes(ticket.author.toLowerCase())),
      );

      const targetUser = assigneeUser ?? allUsers.find((u: any) => u.status === "active");
      if (!targetUser) continue;

      const isMember = await ctx.runQuery(internal.channels.isMember, {
        channelId: channels._id,
        userId: targetUser._id,
      });
      if (!isMember) continue;

      let pingWillDo = `Check on ${meta.identifier ?? ticket.title} — in progress for ${daysStuck} days.`;

      try {
        const parsed = JSON.parse(ticketDetails);
        if (parsed.comments?.length > 0) {
          const lastComment = parsed.comments[parsed.comments.length - 1];
          pingWillDo += ` Last comment: "${lastComment.body?.slice(0, 100)}"`;
        }
      } catch {
        // ticketDetails might not be JSON
      }

      await ctx.runMutation(internal.inboxItems.insertItem, {
        userId: targetUser._id,
        workspaceId: workspace._id,
        type: "blocked_unblock",
        category: daysStuck > 5 ? "do" : "decide",
        title: `${meta.identifier ?? "Ticket"} may be blocked`,
        summary: `"${ticket.title}" has been in progress for ${daysStuck} days without updates.`,
        pingWillDo,
        sourceIntegrationObjectId: ticket._id,
        channelId: channels._id,
      });
      alertCount++;
    }

    await closeCivicNexusClient();
    console.log(
      `[scanBlockedTasks] Created ${alertCount} alerts for ${staleTickets.length} stale tickets`,
    );
  },
});
