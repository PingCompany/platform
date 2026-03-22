/**
 * Types for the Knowledge Engine service.
 */

// ---------------------------------------------------------------------------
// Integration ingestion (8LI-73 + 8LI-74)
// ---------------------------------------------------------------------------

export type IntegrationType = "github_pr" | "linear_ticket" | "message";

/** Metadata attached to a GitHub PR. */
export interface GitHubPRMetadata {
  repo: string;
  prNumber: number;
  baseBranch: string;
  headBranch: string;
  reviewers?: string[];
  labels?: string[];
  additions?: number;
  deletions?: number;
  filesChanged?: number;
  comments?: Array<{ author: string; body: string; createdAt: string }>;
}

/** Metadata attached to a Linear ticket. */
export interface LinearTicketMetadata {
  teamKey: string;
  identifier: string;
  priority: number;
  assignee?: string;
  labels?: string[];
  estimate?: number;
  project?: string;
  cycle?: string;
  comments?: Array<{ author: string; body: string; createdAt: string }>;
}

/** Payload for POST /ingest/integration */
export interface IngestIntegrationPayload {
  workspaceId: string;
  type: IntegrationType;
  externalId: string;
  title: string;
  status: string;
  url: string;
  author: string;
  body?: string;
  metadata?: Record<string, unknown>;
}

/** Payload for POST /ingest/batch — a burst of messages / items. */
export interface IngestBatchPayload {
  workspaceId: string;
  groupId: string; // e.g. channelId or conversationId
  items: IngestBatchItem[];
}

export interface IngestBatchItem {
  type: IntegrationType;
  externalId: string;
  title: string;
  body: string;
  author: string;
  timestamp: string; // ISO-8601
  metadata?: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Entity extraction (8LI-74)
// ---------------------------------------------------------------------------

export type EntityType = "Person" | "Topic" | "Decision" | "Technology";

export interface ExtractedEntity {
  name: string;
  type: EntityType;
  confidence: number;
}

// ---------------------------------------------------------------------------
// Query & citations (8LI-73 + 8LI-74)
// ---------------------------------------------------------------------------

/** Payload for POST /query */
export interface QueryPayload {
  query: string;
  workspaceId?: string;
  groupId?: string;
  limit?: number;
  entityTypes?: EntityType[];
}

/** A single search result with citation info. */
export interface SearchResult {
  /** Content snippet. */
  content: string;
  /** Relevance score 0-1. */
  score: number;
  /** Source info for citations. */
  source: {
    type: IntegrationType;
    externalId: string;
    title: string;
    url?: string;
    author?: string;
    timestamp?: string;
  };
  /** Entities extracted from this result. */
  entities: ExtractedEntity[];
}

/** Response from POST /query */
export interface QueryResponse {
  results: SearchResult[];
  /** Entities aggregated across all results. */
  entities: ExtractedEntity[];
  /** Time taken in ms. */
  durationMs: number;
}

// ---------------------------------------------------------------------------
// Graphiti upstream API shapes (the zepai/graphiti service)
// ---------------------------------------------------------------------------

export interface GraphitiEpisode {
  uuid: string;
  name: string;
  content: string;
  source: string;
  source_description: string;
  created_at: string;
}

export interface GraphitiSearchResult {
  uuid: string;
  content: string;
  fact: string;
  name?: string;
  created_at: string;
  source_description?: string;
  score?: number;
  episodes?: string[];
}

// ---------------------------------------------------------------------------
// Bulk ingestion types (Memory Magic)
// ---------------------------------------------------------------------------

export interface BulkIngestItem {
  content: string;
  role_type: string;
  role: string;
  timestamp: string;
  source_description: string;
  uuid?: string;
  name?: string;
  group_id?: string;
}

export interface BulkIngestRequest {
  items: BulkIngestItem[];
  group_id?: string;
}

export interface BulkJobProgress {
  job_id: string;
  status: "pending" | "processing" | "completed" | "failed";
  total: number;
  processed: number;
  failed: number;
  errors: Array<{ index: number; error: string }>;
  started_at: string;
  completed_at?: string;
}

// ---------------------------------------------------------------------------
// Citation & Fact types
// ---------------------------------------------------------------------------

export interface Fact {
  uuid?: string;
  name: string;
  fact: string;
  valid_at?: string;
  invalid_at?: string;
  created_at?: string;
  source_description?: string;
  relevance_score?: number;
  episodes?: string[];
}

export interface Citation {
  text: string;
  source_title: string;
  relevance_score?: number;
}

// ---------------------------------------------------------------------------
// Conversation context types
// ---------------------------------------------------------------------------

export interface ConversationTurn {
  query: string;
  response?: string;
  timestamp?: string;
}

export interface ConversationContext {
  id: string;
  turns: ConversationTurn[];
  created_at: string;
  last_activity: string;
}

// ---------------------------------------------------------------------------
// Entity mapping types
// ---------------------------------------------------------------------------

export interface PersonEntity {
  name: string;
  emails: string[];
  source: string;
  external_id?: string;
}

export interface EntityMapping {
  canonical_name: string;
  aliases: string[];
  emails: string[];
  sources: Array<{ source: string; external_id?: string }>;
  confidence: number;
}

// ---------------------------------------------------------------------------
// GitHub history ingestion types
// ---------------------------------------------------------------------------

export interface GitHubCommit {
  sha: string;
  message: string;
  author_name: string;
  author_email?: string;
  timestamp: string;
  repo: string;
}

export interface GitHubPR {
  number: number;
  title: string;
  body?: string;
  author: string;
  author_email?: string;
  state: string;
  created_at: string;
  merged_at?: string;
  closed_at?: string;
  repo: string;
  labels?: string[];
}

export interface GitHubIssue {
  number: number;
  title: string;
  body?: string;
  author: string;
  author_email?: string;
  state: string;
  created_at: string;
  repo: string;
  labels?: string[];
}

export interface GitHubReviewComment {
  id: string;
  body: string;
  author: string;
  author_email?: string;
  pr_number: number;
  created_at: string;
  repo: string;
  path?: string;
}

export interface GitHubHistoryRequest {
  group_id?: string;
  commits?: GitHubCommit[];
  pull_requests?: GitHubPR[];
  issues?: GitHubIssue[];
  review_comments?: GitHubReviewComment[];
}

// ---------------------------------------------------------------------------
// Linear history ingestion types
// ---------------------------------------------------------------------------

export interface LinearIssue {
  id: string;
  identifier: string;
  title: string;
  description?: string;
  state: string;
  priority: number;
  team: string;
  assignee_name?: string;
  assignee_email?: string;
  creator_name?: string;
  creator_email?: string;
  created_at: string;
  labels?: string[];
  cycle?: string;
}

export interface LinearComment {
  id: string;
  body: string;
  author_name: string;
  author_email?: string;
  issue_identifier: string;
  created_at: string;
}

export interface LinearHistoryRequest {
  group_id?: string;
  issues?: LinearIssue[];
  comments?: LinearComment[];
}

// ---------------------------------------------------------------------------
// Performance test types
// ---------------------------------------------------------------------------

export interface PerformanceResult {
  query: string;
  latency_ms: number;
  episode_count: number;
  fact_count: number;
}
