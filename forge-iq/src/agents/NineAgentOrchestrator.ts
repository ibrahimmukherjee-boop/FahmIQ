/**
 * NineAgentOrchestrator — compatibility shim for FahmIQ v2
 * ─────────────────────────────────────────────────────────────────────────────
 * Re-exports the new DeepTaskOrchestrator API so existing screen imports work.
 */
export { runAskPipeline, DeepTaskOrchestrator } from "./DeepTaskOrchestrator";
import { DeepTaskOrchestrator } from "./DeepTaskOrchestrator";
import { runEthicalGuard } from "../cognition/EthicalGuard";
import type { AgentStage, DeepTaskResult, ModelBand } from "./types";

/** Legacy type used by task.tsx */
export interface GuardrailBlock {
  blocked: true;
  category: string;
  message: string;
}

/** Legacy pipeline function used by task.tsx */
export async function runNineAgentPipeline(
  query: string,
  band: ModelBand,
  onProgress: (stages: AgentStage[], activeAgent: string | null) => void,
  _attachedDocs?: unknown[]
): Promise<DeepTaskResult | GuardrailBlock> {
  // Ethical guard first
  const guard = runEthicalGuard(query);
  if (!guard.allowed) {
    return {
      blocked: true,
      category: guard.category || "guardrail",
      message: guard.message || "This query cannot be processed.",
    };
  }

  const orch = new DeepTaskOrchestrator();
  const result = await orch.run(query, {
    band,
    onStageUpdate: (update) => {
      onProgress(
        [{ id: update.stageId, name: update.stageName, status: update.status, result: update.result, latency_ms: update.latencyMs }],
        update.status === "running" ? update.stageName : null
      );
    },
  });
  return result;
}
