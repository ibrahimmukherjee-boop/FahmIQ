/**
 * WorkingMemoryBuffer — FahmIQ v2
 * ─────────────────────────────────────────────────────────────────────────────
 * Manages a sliding context window per session with relevance-based pruning.
 * Based on Baddeley's Working Memory Model (1974).
 *
 * Capacity limits (from arch doc):
 *   Fast:      512 tokens
 *   Balanced: 1024 tokens
 *   Precision: 2048 tokens
 *
 * No LLM calls — pure local logic.
 */

import type { ModelBand } from "../agents/types";

export interface MemoryEntry {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: number;
  relevanceScore: number; // 0–1, assigned by AttentionGating
  tokenCount: number;
}

export interface WorkingMemoryState {
  entries: MemoryEntry[];
  totalTokens: number;
  capacity: number;
  utilizationPct: number;
}

const CAPACITY: Record<ModelBand, number> = {
  fast: 512,
  balanced: 1024,
  precision: 2048,
};

const MAX_ENTRIES = 20; // Hard cap on conversation history entries

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

export class WorkingMemoryBuffer {
  private entries: MemoryEntry[] = [];
  private band: ModelBand;

  constructor(band: ModelBand = "balanced") {
    this.band = band;
  }

  setBand(band: ModelBand): void {
    this.band = band;
    this.prune();
  }

  add(entry: Omit<MemoryEntry, "tokenCount">): void {
    const tokenCount = estimateTokens(entry.content);
    this.entries.push({ ...entry, tokenCount });
    // Keep at most MAX_ENTRIES
    if (this.entries.length > MAX_ENTRIES) {
      this.entries = this.entries.slice(-MAX_ENTRIES);
    }
    this.prune();
  }

  /**
   * Prune to stay within capacity.
   * Priority: remove lowest relevance first, then oldest.
   */
  private prune(): void {
    const capacity = CAPACITY[this.band];
    let total = this.entries.reduce((s, e) => s + e.tokenCount, 0);

    if (total <= capacity) return;

    // Sort by relevance ascending (lowest relevance pruned first)
    // Keep system messages + most recent user message always
    const pinned = new Set<string>();
    const lastUserIdx = [...this.entries].reverse().findIndex((e) => e.role === "user");
    if (lastUserIdx !== -1) {
      pinned.add(this.entries[this.entries.length - 1 - lastUserIdx].id);
    }

    const sorted = [...this.entries]
      .filter((e) => !pinned.has(e.id) && e.role !== "system")
      .sort((a, b) => a.relevanceScore - b.relevanceScore);

    let i = 0;
    while (total > capacity && i < sorted.length) {
      total -= sorted[i].tokenCount;
      const removeId = sorted[i].id;
      this.entries = this.entries.filter((e) => e.id !== removeId);
      i++;
    }
  }

  getState(): WorkingMemoryState {
    const capacity = CAPACITY[this.band];
    const totalTokens = this.entries.reduce((s, e) => s + e.tokenCount, 0);
    return {
      entries: [...this.entries],
      totalTokens,
      capacity,
      utilizationPct: Math.min(100, Math.round((totalTokens / capacity) * 100)),
    };
  }

  /**
   * Returns formatted conversation history for injection into prompts.
   */
  getContextString(): string {
    return this.entries
      .map((e) => `[${e.role.toUpperCase()}]: ${e.content}`)
      .join("\n");
  }

  clear(): void {
    this.entries = [];
  }
}
