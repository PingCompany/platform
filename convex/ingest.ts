import { internalAction, internalQuery, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";

export const getMessage = internalQuery({
  args: { messageId: v.id("messages") },
  handler: async (ctx, args) => {
    const message = await ctx.db.get(args.messageId);
    if (!message) return null;
    const author = await ctx.db.get(message.authorId);
    const channel = await ctx.db.get(message.channelId);
    return {
      _id: message._id,
      body: message.body,
      channelId: message.channelId,
      channelName: channel?.name ?? "",
      authorId: message.authorId,
      authorName: author?.name ?? "Unknown",
      createdAt: message._creationTime,
    };
  },
});

export const patchEpisodeId = internalMutation({
  args: {
    messageId: v.id("messages"),
    graphitiEpisodeId: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.messageId, {
      graphitiEpisodeId: args.graphitiEpisodeId,
    });
  },
});

export const processMessage = internalAction({
  args: {
    messageId: v.id("messages"),
  },
  handler: async (ctx, args) => {
    const graphitiUrl =
      process.env.GRAPHITI_API_URL ?? "http://localhost:8000";

    const message = await ctx.runQuery(internal.ingest.getMessage, {
      messageId: args.messageId,
    });
    if (!message) {
      console.warn("[ingest] Message not found:", args.messageId);
      return;
    }

    // POST to Graphiti /messages endpoint
    const response = await fetch(`${graphitiUrl}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        group_id: message.channelId,
        messages: [
          {
            content: message.body,
            role_type: "user",
            role: message.authorName,
            timestamp: new Date(message.createdAt).toISOString(),
            source_description: `channel:${message.channelName}`,
            uuid: message._id,
            name: `${message.authorName} in #${message.channelName}`,
          },
        ],
      }),
    });

    if (!response.ok) {
      console.error(
        `[ingest] Graphiti /messages failed: ${response.status} ${await response.text()}`,
      );
      return;
    }

    // Graphiti returns 202 with {message, success} — use the message UUID as episode ID
    await ctx.runMutation(internal.ingest.patchEpisodeId, {
      messageId: args.messageId,
      graphitiEpisodeId: message._id,
    });

    console.log("[ingest] Ingested message:", args.messageId);
  },
});
