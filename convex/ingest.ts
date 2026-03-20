import { internalAction } from "./_generated/server";
import { v } from "convex/values";

export const processMessage = internalAction({
  args: {
    messageId: v.id("messages"),
  },
  handler: async (_ctx, args) => {
    console.log(
      "[ingest.processMessage stub] Would process message:",
      args.messageId,
    );
    // TODO: Implement actual knowledge engine ingestion
    // 1. Fetch message + author info from DB
    // 2. POST to knowledge-engine REST API (KNOWLEDGE_ENGINE_URL/ingest/message)
    // 3. On success: patch message with graphitiEpisodeId
  },
});
