/**
 * Client wrapper for the upstream Graphiti API (zepai/graphiti).
 * All calls to the underlying Graphiti service go through this module.
 */

import type { Fact } from "./types.js";

const GRAPHITI_URL =
  process.env.GRAPHITI_UPSTREAM_URL ?? "http://localhost:8000";

interface GraphitiMessagePayload {
  group_id: string;
  messages: Array<{
    content: string;
    role_type: string;
    role: string;
    timestamp: string;
    source_description: string;
    uuid?: string;
    name?: string;
  }>;
}

interface GraphitiSearchPayload {
  group_ids?: string[];
  query: string;
  max_facts?: number;
}

interface GraphitiSearchResponse {
  facts: Fact[];
}

export async function ingestMessage(
  payload: GraphitiMessagePayload,
): Promise<{ success: boolean; error?: string }> {
  const response = await fetch(`${GRAPHITI_URL}/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const text = await response.text();
    return { success: false, error: `${response.status}: ${text}` };
  }

  return { success: true };
}

export async function searchFacts(
  payload: GraphitiSearchPayload,
): Promise<{ facts: Fact[]; error?: string }> {
  const response = await fetch(`${GRAPHITI_URL}/search`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const text = await response.text();
    return { facts: [], error: `${response.status}: ${text}` };
  }

  const data = (await response.json()) as GraphitiSearchResponse;
  return { facts: data.facts ?? [] };
}

export async function healthcheck(): Promise<boolean> {
  try {
    const response = await fetch(`${GRAPHITI_URL}/healthcheck`, {
      signal: AbortSignal.timeout(5000),
    });
    return response.ok;
  } catch {
    return false;
  }
}
