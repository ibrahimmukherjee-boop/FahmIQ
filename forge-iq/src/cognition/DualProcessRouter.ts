/**
 * DualProcessRouter — FahmIQ v2
 * ─────────────────────────────────────────────────────────────────────────────
 * Routes queries to System 1 (fast, heuristic) or System 2 (deliberate, full
 * 4-band pipeline) based on Scout complexity signal.
 *
 * Based on Kahneman's Dual Process Theory:
 *   System 1 — fast, automatic, heuristic (Ask tab default)
 *   System 2 — slow, deliberate, analytical (Deep Task, complex queries)
 *
 * No LLM calls — pure signal analysis.
 */

import type { ScoutResult } from "../agents/types";

export type ProcessSystem = "system1" | "system2";

export interface RoutingDecision {
  system: ProcessSystem;
  reason: string;
  estimatedLatencyMs: number;
  stagesToRun: string[];
}

/** Heuristics for System 2 (full pipeline) triggers */
const SYSTEM2_TRIGGERS = [
  // Complexity markers
  /\b(comprehensively|thoroughly|in (full|depth|detail)|exhaustively|rigorously)\b/i,
  /\b(synthesise|synthesize|analyse|analyze|evaluate|assess|critique|compare)\b/i,
  /\b(research (paper|report|brief)|literature review|systematic review)\b/i,
  /\b(multi[- ]?agent|pipeline|architecture|framework|strategy|roadmap)\b/i,
  // Multi-part questions
  /[?]{2,}|(\band\b.{0,40}\band\b.{0,40}\band\b)/i,
  // Long queries suggest complexity
];

function isLongQuery(query: string): boolean {
  return query.trim().split(/\s+/).length > 25;
}

function hasMultipleParts(query: string): boolean {
  return (query.match(/[,;]|\band\b.*\band\b/g) || []).length >= 2;
}

/**
 * Primary routing function.
 * Call AFTER Scout has run — uses Scout's complexity signal if available.
 * Also applies independent heuristics for initial routing decisions.
 */
export function routeQuery(
  query: string,
  scout?: ScoutResult | null,
  isDeepTaskTab = false
): RoutingDecision {
  // Deep Task tab always uses System 2
  if (isDeepTaskTab) {
    return {
      system: "system2",
      reason: "deep_task_tab",
      estimatedLatencyMs: 3500,
      stagesToRun: ["scout", "attention_gating", "working_memory", "worker", "critic", "judge"],
    };
  }

  // Scout explicitly flagged high complexity
  if (scout?.complexity === "high" || scout?.requires_deep_task) {
    return {
      system: "system2",
      reason: "scout_complexity_high",
      estimatedLatencyMs: 3200,
      stagesToRun: ["scout", "attention_gating", "working_memory", "worker", "critic", "judge"],
    };
  }

  // Scout says low complexity → System 1
  if (scout?.complexity === "low") {
    return {
      system: "system1",
      reason: "scout_complexity_low",
      estimatedLatencyMs: 900,
      stagesToRun: ["scout", "worker"],
    };
  }

  // Heuristic analysis (no Scout result yet)
  const triggersSystem2 =
    SYSTEM2_TRIGGERS.some((p) => p.test(query)) ||
    isLongQuery(query) ||
    hasMultipleParts(query);

  if (triggersSystem2) {
    return {
      system: "system2",
      reason: "heuristic_complexity",
      estimatedLatencyMs: 3000,
      stagesToRun: ["scout", "attention_gating", "working_memory", "worker", "critic", "judge"],
    };
  }

  return {
    system: "system1",
    reason: "heuristic_simple",
    estimatedLatencyMs: 900,
    stagesToRun: ["scout", "worker"],
  };
}
