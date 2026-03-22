import { mutation, internalAction, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { requireUser } from "./auth";
import { Id } from "./_generated/dataModel";

// ─── Internal queries for gathering real workspace context ──────────────────

export const getGenerationContext = internalQuery({
  args: {
    userId: v.id("users"),
    workspaceId: v.id("workspaces"),
  },
  handler: async (ctx, args) => {
    // Get all channels the user is a member of
    const memberships = await ctx.db
      .query("channelMembers")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const channelData: Array<{
      channelId: Id<"channels">;
      channelName: string;
      messages: Array<{
        messageId: Id<"messages">;
        body: string;
        authorName: string;
        authorId: Id<"users">;
        type: string;
        createdAt: number;
      }>;
    }> = [];

    for (const membership of memberships) {
      const channel = await ctx.db.get(membership.channelId);
      if (!channel || channel.isArchived) continue;

      // Get recent messages (last 2 hours)
      const since = Date.now() - 2 * 60 * 60 * 1000;
      const messages = await ctx.db
        .query("messages")
        .withIndex("by_channel", (q) => q.eq("channelId", channel._id))
        .filter((q) => q.gte(q.field("_creationTime"), since))
        .take(30);

      if (messages.length === 0) continue;

      const enrichedMessages = await Promise.all(
        messages.map(async (m) => {
          const author = await ctx.db.get(m.authorId);
          return {
            messageId: m._id,
            body: m.body,
            authorName: author?.name ?? "Unknown",
            authorId: m.authorId,
            type: m.type,
            createdAt: m._creationTime,
          };
        }),
      );

      channelData.push({
        channelId: channel._id,
        channelName: channel.name,
        messages: enrichedMessages,
      });
    }

    // Get open integration objects (PRs, tickets)
    const integrations = await ctx.db
      .query("integrationObjects")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .filter((q) => q.eq(q.field("status"), "open"))
      .take(20);

    const enrichedIntegrations = integrations.map((io) => ({
      _id: io._id,
      type: io.type,
      title: io.title,
      author: io.author,
      url: io.url,
      status: io.status,
      externalId: io.externalId,
      metadata: io.metadata,
    }));

    // Get workspace members for orgTrace
    const workspaceMembers = await ctx.db
      .query("workspaceMembers")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .take(50);

    const members = await Promise.all(
      workspaceMembers.map(async (wm) => {
        const user = await ctx.db.get(wm.userId);
        return user
          ? { _id: user._id, name: user.name, title: user.title, department: user.department }
          : null;
      }),
    );

    // Get all recent inbox items (pending + archived) to avoid duplicates
    const pendingItems = await ctx.db
      .query("inboxItems")
      .withIndex("by_user_status", (q) =>
        q.eq("userId", args.userId).eq("status", "pending"),
      )
      .take(30);

    const archivedItems = await ctx.db
      .query("inboxItems")
      .withIndex("by_user_status", (q) =>
        q.eq("userId", args.userId).eq("status", "archived"),
      )
      .order("desc")
      .take(20);

    const allRecentItems = [...pendingItems, ...archivedItems];
    const existingDecisions = allRecentItems.map((item) => ({
      title: item.title,
      summary: item.summary,
    }));

    return {
      channels: channelData,
      integrations: enrichedIntegrations,
      members: members.filter(Boolean) as Array<{
        _id: Id<"users">;
        name: string;
        title?: string;
        department?: string;
      }>,
      existingDecisions,
    };
  },
});

// ─── AI decision generation action ──────────────────────────────────────────

export const generateDecisionAction = internalAction({
  args: {
    userId: v.id("users"),
    workspaceId: v.id("workspaces"),
  },
  handler: async (ctx, args) => {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY environment variable is not set");
    }

    const graphitiUrl = process.env.GRAPHITI_API_URL ?? "http://localhost:8000";

    // 1. Gather real context
    const context = await ctx.runQuery(
      internal.generateDecision.getGenerationContext,
      { userId: args.userId, workspaceId: args.workspaceId },
    );

    // Build channel messages context
    const channelContext = context.channels
      .map((ch) => {
        const msgs = ch.messages
          .filter((m) => m.type === "user")
          .slice(-10)
          .map((m) => `  [${m.authorName}]: ${m.body}`)
          .join("\n");
        return `#${ch.channelName} (${ch.messages.length} recent messages):\n${msgs}`;
      })
      .join("\n\n");

    // Build integrations context
    const integrationsContext = context.integrations
      .map((io) => {
        const meta = io.metadata as Record<string, unknown>;
        return `- [${io.type}] "${io.title}" by ${io.author} (${io.status})${meta?.number ? ` #${meta.number}` : ""}`;
      })
      .join("\n");

    // Build members context
    const membersContext = context.members
      .map((m) => `- ${m.name}${m.title ? ` (${m.title})` : ""}${m.department ? ` — ${m.department}` : ""}`)
      .join("\n");

    // 2. Search knowledge graph for relevant context
    let knowledgeFacts = "";
    try {
      const searchResponse = await fetch(`${graphitiUrl}/search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: "recent decisions, blockers, open questions, pending items",
          max_facts: 15,
        }),
      });
      if (searchResponse.ok) {
        const data = await searchResponse.json();
        const facts = data.facts ?? [];
        if (facts.length > 0) {
          knowledgeFacts = facts
            .map((f: { fact: string; valid_at?: string }) =>
              `- ${f.fact}${f.valid_at ? ` (as of ${f.valid_at})` : ""}`,
            )
            .join("\n");
        }
      }
    } catch {
      // Knowledge graph might not be available — proceed without it
    }

    // 3. Call AI to generate a decision from real data
    const prompt = `You are mrPING, an AI workspace assistant that identifies actionable decisions from team activity.

Analyze the following real workspace data and generate ONE inbox decision item that requires a human decision. This should be based on what's actually happening — open questions, blockers, unreviewed PRs, cross-team dependencies, or ambiguous situations that need a human call.

## Current channel activity
${channelContext || "(No recent channel messages)"}

## Open integrations (PRs / tickets)
${integrationsContext || "(No open integrations)"}

## Team members
${membersContext || "(No members found)"}

## Knowledge graph context
${knowledgeFacts || "(No knowledge graph data available)"}

## Existing decisions (DO NOT repeat these — generate something completely different)
${context.existingDecisions.length > 0 ? context.existingDecisions.map((d) => `- ${d.title}: ${d.summary.slice(0, 80)}`).join("\n") : "(No existing decisions)"}

Generate a decision item as JSON. The decision must be grounded in the real data above — do not fabricate people, PRs, or events that don't exist. If there's limited data, focus on what's actually there (e.g. summarizing channel discussion into an actionable question).

IMPORTANT: The decision MUST be different from the existing decisions listed above. Do NOT repeat the same topic, question, or scenario. Find a new angle, different people, or a different aspect of the workspace activity.

The "type" must be one of: pr_review, ticket_triage, question_answer, blocked_unblock, fact_verify, cross_team_ack, channel_summary
The "category" must be one of: do (urgent+important), decide (important), delegate (urgent but not important), skip (FYI)

CRITICAL RULES FOR recommendedActions:
- Labels MUST be 2-5 words max. Examples: "Approve & merge", "Extend 3 weeks", "Escalate to legal", "Drop as planned", "Create ticket".
- DO NOT write long sentences as labels. Keep them punchy like button text.
- Each needs an actionKey (snake_case identifier) and at least one must be primary.
- Always include one action with actionKey "coordinate" — this triggers mrPING to create a Linear ticket AND spin up a group AI-aided conversation with the relevant people, tagging each with their risk/responsibility.

Each nextStep must reference an actionKey from recommendedActions — these are what mrPING will execute when the user picks that action.
orgTrace should reference REAL people from the team members list above, with roles: author, assignee, mentioned, to_consult.

Respond with ONLY valid JSON, no markdown:
{
  "type": "question_answer",
  "category": "decide",
  "title": "Decision question phrased as a question?",
  "summary": "2-3 sentences of context explaining the situation and why it needs a decision now.",
  "pingWillDo": "What mrPING will do after the user decides (1 sentence)",
  "channelName": "channel-name-if-relevant-or-null",
  "orgTrace": [
    {"name": "Real Person Name", "role": "author"}
  ],
  "recommendedActions": [
    {"label": "Short action", "actionKey": "action_key", "primary": true},
    {"label": "Coordinate & track", "actionKey": "coordinate"},
    {"label": "Alt action", "actionKey": "alt_key", "needsComment": true}
  ],
  "nextSteps": [
    {"actionKey": "action_key", "label": "What mrPING does", "automated": true},
    {"actionKey": "coordinate", "label": "Create Linear ticket for tracking", "automated": true},
    {"actionKey": "coordinate", "label": "Create group conversation with stakeholders", "automated": true},
    {"actionKey": "coordinate", "label": "Tag each person with their risk area", "automated": true},
    {"actionKey": "alt_key", "label": "What mrPING does", "automated": true}
  ]
}`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-5.4-nano",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.4,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const generated = JSON.parse(data.choices[0].message.content);

    // 4. Validate and map types
    const validTypes = [
      "pr_review", "ticket_triage", "question_answer", "blocked_unblock",
      "fact_verify", "cross_team_ack", "channel_summary",
    ];
    const validCategories = ["do", "decide", "delegate", "skip"];
    const validRoles = ["author", "assignee", "mentioned", "to_consult"];

    const type = validTypes.includes(generated.type) ? generated.type : "question_answer";
    const category = validCategories.includes(generated.category) ? generated.category : "decide";

    // Resolve channelId from name
    let channelId: Id<"channels"> | undefined;
    if (generated.channelName) {
      const matchingChannel = context.channels.find(
        (ch) => ch.channelName === generated.channelName,
      );
      if (matchingChannel) {
        channelId = matchingChannel.channelId;
      }
    }

    // Resolve orgTrace userIds from names
    const orgTrace = (generated.orgTrace ?? [])
      .map((person: { name: string; role: string }) => {
        const member = context.members.find(
          (m) => m.name.toLowerCase() === person.name.toLowerCase(),
        );
        return {
          name: person.name,
          role: validRoles.includes(person.role) ? person.role : "mentioned",
          userId: member?._id,
        };
      })
      .filter((p: { name: string }) => p.name);

    // Validate recommendedActions
    const recommendedActions = (generated.recommendedActions ?? []).map(
      (a: { label: string; actionKey: string; primary?: boolean; needsComment?: boolean }) => ({
        label: a.label,
        actionKey: a.actionKey,
        primary: a.primary ?? false,
        needsComment: a.needsComment ?? false,
      }),
    );

    // Validate nextSteps
    const actionKeys = new Set(recommendedActions.map((a: { actionKey: string }) => a.actionKey));
    const nextSteps = (generated.nextSteps ?? [])
      .filter((s: { actionKey: string }) => actionKeys.has(s.actionKey))
      .map((s: { actionKey: string; label: string; automated?: boolean }) => ({
        actionKey: s.actionKey,
        label: s.label,
        automated: s.automated ?? true,
      }));

    // 5. Insert the decision via the standard pipeline
    await ctx.runMutation(internal.inboxItems.insertItem, {
      userId: args.userId,
      workspaceId: args.workspaceId,
      type: type as "pr_review" | "ticket_triage" | "question_answer" | "blocked_unblock" | "fact_verify" | "cross_team_ack" | "channel_summary",
      category: category as "do" | "decide" | "delegate" | "skip",
      title: generated.title ?? "New decision needed",
      summary: generated.summary ?? "",
      pingWillDo: generated.pingWillDo,
      channelId,
      orgTrace: orgTrace.length > 0 ? orgTrace : undefined,
      recommendedActions: recommendedActions.length > 0 ? recommendedActions : undefined,
      nextSteps: nextSteps.length > 0 ? nextSteps : undefined,
    });
  },
});

// ─── Public mutation to trigger decision generation ─────────────────────────

export const generateDecision = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);

    const membership = await ctx.db
      .query("workspaceMembers")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();
    if (!membership) throw new Error("No workspace found for user");

    await ctx.scheduler.runAfter(0, internal.generateDecision.generateDecisionAction, {
      userId: user._id,
      workspaceId: membership.workspaceId,
    });

    return { scheduled: true };
  },
});
