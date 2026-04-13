/**
 * RealInferenceProvider — deprecated in FahmIQ v2
 * ─────────────────────────────────────────────────────────────────────────────
 * This module previously called the Anthropic Claude API backend.
 * In v2, all inference is local-first via InferenceEngine → MockLocalProvider
 * (or LocalMLCProvider post-MVP). No external AI API calls are made.
 *
 * This file is kept as a stub to avoid broken imports.
 */

export async function realInfer(): Promise<never> {
  throw new Error("realInfer: removed in v2. Use InferenceEngine instead.");
}
