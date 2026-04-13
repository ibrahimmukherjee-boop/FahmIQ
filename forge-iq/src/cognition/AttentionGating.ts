/**
 * AttentionGating — FahmIQ v2
 * ─────────────────────────────────────────────────────────────────────────────
 * Scores context fragments using TF-IDF keyword overlap + Scout relevance map.
 * Selects top-K fragments for each band, discarding low-relevance context.
 *
 * Inspired by Treisman's Feature Integration / Selective Attention model.
 * No LLM calls — pure local computation.
 */

import type { ModelBand } from "../agents/types";

export interface ContextFragment {
  id: string;
  content: string;
  role: "user" | "assistant" | "system";
  timestamp: number;
  relevanceScore?: number;
}

export interface GatedContext {
  fragments: ContextFragment[];
  totalTokensEstimate: number;
  droppedCount: number;
}

// K per band as specified in arch doc (3/5/8)
const TOP_K: Record<ModelBand, number> = {
  fast: 3,
  balanced: 5,
  precision: 8,
};

// Token capacity per band
const TOKEN_CAPACITY: Record<ModelBand, number> = {
  fast: 512,
  balanced: 1024,
  precision: 2048,
};

/**
 * Naive token estimation: ~4 chars per token.
 */
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Builds a TF-IDF term frequency map from a string.
 */
function termFrequency(text: string): Map<string, number> {
  const tf = new Map<string, number>();
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2);
  for (const w of words) {
    tf.set(w, (tf.get(w) || 0) + 1);
  }
  return tf;
}

/**
 * Cosine-like overlap score between two TF maps.
 */
function overlapScore(queryTF: Map<string, number>, fragTF: Map<string, number>): number {
  let overlap = 0;
  let total = 0;
  for (const [term, qFreq] of queryTF) {
    total += qFreq;
    if (fragTF.has(term)) {
      overlap += Math.min(qFreq, fragTF.get(term)!);
    }
  }
  return total > 0 ? overlap / total : 0;
}

/**
 * Gate context fragments — score, rank, select top-K within token budget.
 *
 * @param query       The current user query
 * @param fragments   All available context fragments (conversation history etc)
 * @param band        Current model band
 * @param keyConceptsFromScout  Optional key concepts from Scout for boosted scoring
 */
export function gateContext(
  query: string,
  fragments: ContextFragment[],
  band: ModelBand,
  keyConceptsFromScout: string[] = []
): GatedContext {
  if (fragments.length === 0) {
    return { fragments: [], totalTokensEstimate: 0, droppedCount: 0 };
  }

  const k = TOP_K[band];
  const capacity = TOKEN_CAPACITY[band];
  const queryTF = termFrequency(query + " " + keyConceptsFromScout.join(" "));

  // Score each fragment
  const scored = fragments.map((frag) => {
    const fragTF = termFrequency(frag.content);
    let score = overlapScore(queryTF, fragTF);

    // Recency boost: more recent fragments get +20% up to
    const ageMs = Date.now() - frag.timestamp;
    const recencyBoost = Math.max(0, 1 - ageMs / (1000 * 60 * 10)); // decays over 10 min
    score += recencyBoost * 0.2;

    // User message boost
    if (frag.role === "user") score += 0.1;

    return { ...frag, relevanceScore: Math.min(1, score) };
  });

  // Sort by relevance descending
  scored.sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));

  // Take top-K within token capacity
  const selected: ContextFragment[] = [];
  let tokenCount = 0;
  for (const frag of scored.slice(0, k)) {
    const t = estimateTokens(frag.content);
    if (tokenCount + t <= capacity) {
      selected.push(frag);
      tokenCount += t;
    }
  }

  // Always sort selected back to chronological order for the model
  selected.sort((a, b) => a.timestamp - b.timestamp);

  return {
    fragments: selected,
    totalTokensEstimate: tokenCount,
    droppedCount: fragments.length - selected.length,
  };
}
