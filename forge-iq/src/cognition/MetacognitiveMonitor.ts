/**
 * MetacognitiveMonitor — FahmIQ v2
 * ─────────────────────────────────────────────────────────────────────────────
 * Tracks Critic scorecard values across agent stages.
 * Decides whether to trigger the RepairLoop (aggregate score < 0.72).
 * Feeds the ConfidenceMeter UI component with real scores.
 *
 * Based on Flavell's Metacognition Model (1979).
 * No LLM calls — pure score aggregation logic.
 */

import type { CriticScore } from "../agents/types";

export interface MetaState {
  scoutConfidence: number;
  workerConfidence: number;
  criticScores: Partial<CriticScore>;
  aggregateConfidence: number;
  repairRecommended: boolean;
  repairCount: number;
  qualityTrajectory: number[]; // confidence at each stage
  bottleneckDimension: string | null;
  qualityGrade: "A" | "B" | "C" | "D" | "F";
}

const REPAIR_THRESHOLD = 0.72;

export function gradeFromScore(score: number): "A" | "B" | "C" | "D" | "F" {
  if (score >= 0.90) return "A";
  if (score >= 0.80) return "B";
  if (score >= 0.70) return "C";
  if (score >= 0.60) return "D";
  return "F";
}

/**
 * Compute aggregate Critic score from individual dimensions.
 * Weighted: correctness and safety have higher weight.
 */
export function computeAggregate(scores: Partial<CriticScore>): number {
  const weights = {
    correctness: 0.30,
    completeness: 0.20,
    consistency: 0.20,
    usefulness: 0.15,
    safety: 0.15,
  };

  let weighted = 0;
  let totalWeight = 0;

  for (const [dim, weight] of Object.entries(weights)) {
    const val = scores[dim as keyof typeof weights];
    if (typeof val === "number") {
      weighted += val * weight;
      totalWeight += weight;
    }
  }

  return totalWeight > 0 ? weighted / totalWeight : 0;
}

/**
 * Finds the weakest dimension in the scorecard.
 */
function findBottleneck(scores: Partial<CriticScore>): string | null {
  const dims = ["correctness", "completeness", "consistency", "usefulness", "safety"] as const;
  let minScore = 1;
  let bottleneck: string | null = null;

  for (const dim of dims) {
    const val = scores[dim];
    if (typeof val === "number" && val < minScore) {
      minScore = val;
      bottleneck = dim;
    }
  }

  return bottleneck;
}

export class MetacognitiveMonitor {
  private state: MetaState = {
    scoutConfidence: 0,
    workerConfidence: 0,
    criticScores: {},
    aggregateConfidence: 0,
    repairRecommended: false,
    repairCount: 0,
    qualityTrajectory: [],
    bottleneckDimension: null,
    qualityGrade: "C",
  };

  recordScoutConfidence(confidence: number): void {
    this.state.scoutConfidence = confidence;
    this.state.qualityTrajectory.push(confidence);
  }

  recordWorkerConfidence(confidence: number): void {
    this.state.workerConfidence = confidence;
    this.state.qualityTrajectory.push(confidence);
  }

  recordCriticScores(scores: Partial<CriticScore>): void {
    this.state.criticScores = scores;
    const aggregate = computeAggregate(scores);
    this.state.aggregateConfidence = aggregate;
    this.state.qualityTrajectory.push(aggregate);
    this.state.repairRecommended = aggregate < REPAIR_THRESHOLD;
    this.state.bottleneckDimension = findBottleneck(scores);
    this.state.qualityGrade = gradeFromScore(aggregate);
  }

  recordRepair(): void {
    this.state.repairCount++;
    this.state.repairRecommended = false; // Reset after repair triggered
  }

  getState(): MetaState {
    return { ...this.state };
  }

  reset(): void {
    this.state = {
      scoutConfidence: 0,
      workerConfidence: 0,
      criticScores: {},
      aggregateConfidence: 0,
      repairRecommended: false,
      repairCount: 0,
      qualityTrajectory: [],
      bottleneckDimension: null,
      qualityGrade: "C",
    };
  }
}
