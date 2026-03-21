/**
 * Knowledge Engine — Express.js API wrapping Graphiti with advanced features.
 *
 * Adds: follow-up questions, temporal filters, channel-scoped queries,
 * citation formatting, bulk ingestion, GitHub/Linear history ingestion,
 * cross-source entity mapping, and performance testing.
 */

import express, { type Request, type Response } from "express";
import { healthcheck, searchFacts } from "./graphiti-client.js";
import {
  addTurn,
  buildContextualQuery,
  deleteConversation,
  getConversation,
  getOrCreateConversation,
} from "./conversations.js";
import { parseDateRange, filterByDateRange } from "./temporal.js";
import { formatCitations, scoreFacts } from "./citations.js";
import {
  getJobProgress,
  listJobs,
  startBulkIngest,
} from "./bulk-ingest.js";
import { ingestGitHubHistory } from "./github-ingest.js";
import { ingestLinearHistory } from "./linear-ingest.js";
import {
  clearEntityRegistry,
  findEntity,
  getEntityMappings,
  registerEntities,
} from "./entity-mapping.js";
import { runPerformanceTest } from "./performance.js";
import type {
  BulkIngestRequest,
  GitHubHistoryRequest,
  LinearHistoryRequest,
  PersonEntity,
  QueryRequest,
} from "./types.js";

const app = express();
app.use(express.json({ limit: "10mb" }));

const PORT = parseInt(process.env.PORT ?? "3100", 10);

// ---- Health ----

app.get("/healthcheck", async (_req: Request, res: Response) => {
  const graphitiOk = await healthcheck();
  res.json({
    status: "ok",
    graphiti: graphitiOk ? "connected" : "unreachable",
    timestamp: new Date().toISOString(),
  });
});

// ---- Advanced Query ----

app.post("/query", async (req: Request, res: Response) => {
  const body = req.body as QueryRequest;

  if (!body.query || typeof body.query !== "string") {
    res.status(400).json({ error: "Missing required field: query" });
    return;
  }

  const conversation = getOrCreateConversation(body.conversation_id);
  const effectiveQuery = body.conversation_id
    ? buildContextualQuery(conversation.id, body.query)
    : body.query;

  const groupIds: string[] = [];
  if (body.channel_id) {
    groupIds.push(body.channel_id);
  }
  if (body.group_ids) {
    groupIds.push(...body.group_ids);
  }

  const { facts: rawFacts, error } = await searchFacts({
    query: effectiveQuery,
    group_ids: groupIds.length > 0 ? groupIds : undefined,
    max_facts: body.max_facts ?? 10,
  });

  if (error) {
    res.status(502).json({ error: `Graphiti search failed: ${error}` });
    return;
  }

  const dateRange = parseDateRange(body.date_from, body.date_to);
  const filteredFacts = filterByDateRange(rawFacts, dateRange);

  const includeScores = body.include_scores ?? false;
  const scoredFacts = scoreFacts(filteredFacts, body.query);
  const citations = formatCitations(filteredFacts, body.query, includeScores);

  addTurn(conversation.id, {
    query: body.query,
    fact_ids: scoredFacts.map((f) => f.uuid),
    timestamp: new Date().toISOString(),
  });

  res.json({
    facts: includeScores ? scoredFacts : filteredFacts,
    citations,
    conversation_id: conversation.id,
  });
});

// ---- Conversation management ----

app.get("/conversations/:id", (req: Request<{ id: string }>, res: Response) => {
  const ctx = getConversation(req.params.id);
  if (!ctx) {
    res.status(404).json({ error: "Conversation not found" });
    return;
  }
  res.json(ctx);
});

app.delete("/conversations/:id", (req: Request<{ id: string }>, res: Response) => {
  const deleted = deleteConversation(req.params.id);
  if (!deleted) {
    res.status(404).json({ error: "Conversation not found" });
    return;
  }
  res.json({ success: true });
});

// ---- Bulk Ingestion ("Memory Magic") ----

app.post("/ingest/bulk", (req: Request, res: Response) => {
  const body = req.body as BulkIngestRequest;

  if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
    res.status(400).json({ error: "Missing required field: items (non-empty array)" });
    return;
  }

  for (let i = 0; i < body.items.length; i++) {
    const item = body.items[i];
    if (!item.content || !item.role || !item.timestamp) {
      res.status(400).json({
        error: `Item at index ${i} missing required fields (content, role, timestamp)`,
      });
      return;
    }
  }

  const jobId = startBulkIngest(body);

  res.status(202).json({
    job_id: jobId,
    status: "pending",
    total: body.items.length,
    message: "Bulk ingestion started. Poll /ingest/bulk/:jobId for progress.",
  });
});

app.get("/ingest/bulk/:jobId", (req: Request<{ jobId: string }>, res: Response) => {
  const progress = getJobProgress(req.params.jobId);
  if (!progress) {
    res.status(404).json({ error: "Job not found" });
    return;
  }
  res.json(progress);
});

app.get("/ingest/bulk", (_req: Request, res: Response) => {
  res.json({ jobs: listJobs() });
});

// ---- GitHub History Ingestion ----

app.post("/ingest/github", (req: Request, res: Response) => {
  const body = req.body as GitHubHistoryRequest;

  const totalItems =
    (body.commits?.length ?? 0) +
    (body.pull_requests?.length ?? 0) +
    (body.issues?.length ?? 0) +
    (body.review_comments?.length ?? 0);

  if (totalItems === 0) {
    res.status(400).json({
      error: "At least one of commits, pull_requests, issues, or review_comments must be provided",
    });
    return;
  }

  const jobId = ingestGitHubHistory(body);

  res.status(202).json({
    job_id: jobId,
    status: "pending",
    total: totalItems,
    message: "GitHub history ingestion started. Poll /ingest/bulk/:jobId for progress.",
  });
});

// ---- Linear History Ingestion ----

app.post("/ingest/linear", (req: Request, res: Response) => {
  const body = req.body as LinearHistoryRequest;

  const totalItems =
    (body.issues?.length ?? 0) + (body.comments?.length ?? 0);

  if (totalItems === 0) {
    res.status(400).json({
      error: "At least one of issues or comments must be provided",
    });
    return;
  }

  const jobId = ingestLinearHistory(body);

  res.status(202).json({
    job_id: jobId,
    status: "pending",
    total: totalItems,
    message: "Linear history ingestion started. Poll /ingest/bulk/:jobId for progress.",
  });
});

// ---- Entity Mapping ----

app.get("/entities", (_req: Request, res: Response) => {
  res.json({ mappings: getEntityMappings() });
});

app.get("/entities/search", (req: Request, res: Response) => {
  const q = req.query.q as string | undefined;
  if (!q) {
    res.status(400).json({ error: "Missing query parameter: q" });
    return;
  }

  const entity = findEntity(q);
  if (!entity) {
    res.status(404).json({ error: "Entity not found" });
    return;
  }

  res.json(entity);
});

app.post("/entities", (req: Request, res: Response) => {
  const body = req.body as { entities: PersonEntity[] };
  if (!body.entities || !Array.isArray(body.entities)) {
    res.status(400).json({ error: "Missing required field: entities" });
    return;
  }

  registerEntities(body.entities);
  res.json({
    registered: body.entities.length,
    total_mappings: getEntityMappings().length,
  });
});

app.delete("/entities", (_req: Request, res: Response) => {
  clearEntityRegistry();
  res.json({ success: true });
});

// ---- Performance Testing ----

app.post("/performance/test", async (req: Request, res: Response) => {
  const body = req.body as {
    queries?: string[];
    group_ids?: string[];
    max_facts?: number;
    iterations?: number;
  };

  const result = await runPerformanceTest(body);
  res.json(result);
});

// ---- Start server ----

app.listen(PORT, () => {
  console.log(`Knowledge Engine listening on port ${PORT}`);
  console.log(
    `Graphiti upstream: ${process.env.GRAPHITI_UPSTREAM_URL ?? "http://localhost:8000"}`,
  );
});

export default app;
