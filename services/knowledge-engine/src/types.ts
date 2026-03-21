/** Core types for the Knowledge Engine service. */

// ---- Query types ----

export interface QueryRequest {
  /** The search query text. */
  query: string;
  /** Optional group/channel IDs to scope the search. */
  group_ids?: string[];
  /** Maximum number of facts to return. */
  max_facts?: number;
  /** Conversation ID for follow-up question context. */
  conversation_id?: string;
  /** ISO date string — only return facts valid after this date. */
  date_from?: string;
  /** ISO date string — only return facts valid before this date. */
  date_to?: string;
  /** Filter results by specific channel ID. */
  channel_id?: string;
  /** Whether to include relevance scores in the response. */
  include_scores?: boolean;
}

export interface Citation {
  text: string;
  source_title?: string;
  source_url?: string;
  relevance_score?: number;
}

export interface Fact {
  uuid: string;
  name: string;
  fact: string;
  valid_at: string | null;
  invalid_at: string | null;
  relevance_score?: number;
}

export interface QueryResponse {
  facts: Fact[];
  citations: Citation[];
  conversation_id: string;
}

// ---- Conversation context ----

export interface ConversationTurn {
  query: string;
  fact_ids: string[];
  timestamp: string;
}

export interface ConversationContext {
  id: string;
  turns: ConversationTurn[];
  created_at: string;
  last_activity: string;
}

// ---- Bulk ingestion ----

export interface BulkIngestItem {
  content: string;
  role_type: "user" | "assistant" | "system";
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

export type BulkJobStatus = "pending" | "processing" | "completed" | "failed";

export interface BulkJobProgress {
  job_id: string;
  status: BulkJobStatus;
  total: number;
  processed: number;
  failed: number;
  errors: Array<{ index: number; error: string }>;
  started_at: string;
  completed_at?: string;
}

// ---- GitHub history ingestion ----

export interface GitHubCommit {
  sha: string;
  message: string;
  author_name: string;
  author_email: string;
  timestamp: string;
  url: string;
  repo: string;
}

export interface GitHubPR {
  number: number;
  title: string;
  body: string;
  author: string;
  author_email?: string;
  state: string;
  created_at: string;
  merged_at?: string;
  closed_at?: string;
  url: string;
  repo: string;
  labels?: string[];
}

export interface GitHubIssue {
  number: number;
  title: string;
  body: string;
  author: string;
  author_email?: string;
  state: string;
  created_at: string;
  closed_at?: string;
  url: string;
  repo: string;
  labels?: string[];
}

export interface GitHubReviewComment {
  id: number;
  body: string;
  author: string;
  author_email?: string;
  pr_number: number;
  created_at: string;
  url: string;
  repo: string;
  path?: string;
}

export interface GitHubHistoryRequest {
  commits?: GitHubCommit[];
  pull_requests?: GitHubPR[];
  issues?: GitHubIssue[];
  review_comments?: GitHubReviewComment[];
  group_id?: string;
}

// ---- Linear history ingestion ----

export interface LinearIssue {
  id: string;
  identifier: string;
  title: string;
  description?: string;
  assignee_name?: string;
  assignee_email?: string;
  creator_name?: string;
  creator_email?: string;
  state: string;
  priority: number;
  created_at: string;
  completed_at?: string;
  cancelled_at?: string;
  url: string;
  team: string;
  labels?: string[];
  cycle?: string;
}

export interface LinearComment {
  id: string;
  body: string;
  author_name: string;
  author_email?: string;
  issue_id: string;
  issue_identifier: string;
  created_at: string;
}

export interface LinearHistoryRequest {
  issues?: LinearIssue[];
  comments?: LinearComment[];
  group_id?: string;
}

// ---- Entity mapping ----

export interface PersonEntity {
  name: string;
  emails: string[];
  source: "github" | "linear" | "ping";
  external_id?: string;
}

export interface EntityMapping {
  canonical_name: string;
  aliases: string[];
  emails: string[];
  sources: Array<{ source: string; external_id?: string }>;
  confidence: number;
}

// ---- Performance ----

export interface PerformanceResult {
  query: string;
  latency_ms: number;
  episode_count: number;
  fact_count: number;
}
