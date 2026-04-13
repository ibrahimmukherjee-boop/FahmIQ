/**
 * InferenceEngine — FahmIQ v2
 * ─────────────────────────────────────────────────────────────────────────────
 * Single abstraction layer for all LLM calls. Tries each provider in priority
 * order until one succeeds. Isolates the rest of the app from the runtime.
 *
 * Priority chain (arch doc §4):
 *   1. LocalMLCProvider  — on-device MLC LLM (post-MVP stub)
 *   2. MockLocalProvider — active MVP, domain-aware simulation
 *   3. CloudBoostProvider — feature-flagged OFF
 *
 * No provider reaches out to any external AI API (Claude, GPT, DeepSeek, etc).
 * All inference is local-first.
 */

import { LocalMLCProvider } from "./providers/LocalMLCProvider";
import { MockLocalProvider, type AgentRole } from "./providers/MockLocalProvider";
import { CloudBoostProvider } from "./providers/CloudBoostProvider";
import type { InferenceRequest, InferenceResponse } from "./types";

export class InferenceEngine {
  private mlc = new LocalMLCProvider();
  private mock = new MockLocalProvider();
  private cloud = new CloudBoostProvider();

  async run(
    req: InferenceRequest,
    role: AgentRole = "worker"
  ): Promise<InferenceResponse & { provider: string }> {
    // Priority 1: Local MLC (post-MVP)
    if (this.mlc.isAvailable()) {
      try {
        const res = await this.mlc.run(req);
        return { ...res, provider: "LocalMLCProvider" };
      } catch (e) {
        console.warn("[InferenceEngine] LocalMLCProvider failed:", e);
      }
    }

    // Priority 2: Mock local (MVP — always succeeds)
    try {
      const res = await this.mock.run(req, role);
      return { ...res, provider: "MockLocalProvider" };
    } catch (e) {
      console.warn("[InferenceEngine] MockLocalProvider failed:", e);
    }

    // Priority 3: CloudBoost (feature-flagged OFF in v1)
    if (this.cloud.isAvailable()) {
      try {
        const res = await this.cloud.run(req);
        return { ...res, provider: "CloudBoostProvider" };
      } catch (e) {
        console.warn("[InferenceEngine] CloudBoostProvider failed:", e);
      }
    }

    throw new Error("InferenceEngine: all providers exhausted");
  }

  getActiveProvider(): string {
    if (this.mlc.isAvailable()) return "LocalMLCProvider";
    return "MockLocalProvider";
  }
}
