/**
 * LocalMLCProvider — FahmIQ v2
 * ─────────────────────────────────────────────────────────────────────────────
 * On-device MLC LLM inference for iOS via Apple Neural Engine + Metal GPU.
 *
 * Models (downloaded once on first launch, ~350–900MB):
 *   Fast band:      Qwen2.5-0.5B-Instruct-q4f16_1-MLC  (~350MB)
 *   Balanced band:  Qwen2.5-1.5B-Instruct-q4f16_1-MLC  (~900MB)
 *   Precision band: Qwen2.5-1.5B-Instruct-q8_0-MLC     (~1.8GB)
 *
 * In EAS-built iOS app: loads via native bridge (expo-modules-core).
 * In Expo Go / web preview: isAvailable() returns false → MockLocalProvider.
 *
 * EAS Build setup:
 *   1. Run: pnpm add @mlc-ai/mlc-llm-react-native
 *   2. Add to app.json plugins: ["@mlc-ai/mlc-llm-react-native"]
 *   3. eas build --platform ios --profile production
 */

import type { InferenceRequest, InferenceResponse } from "../types";
import { Platform } from "react-native";

const MLC_MODEL_IDS: Record<string, string> = {
  fast:      "Qwen2.5-0.5B-Instruct-q4f16_1-MLC",
  balanced:  "Qwen2.5-1.5B-Instruct-q4f16_1-MLC",
  precision: "Qwen2.5-1.5B-Instruct-q8_0-MLC",
};

interface MLCEngine {
  chat: {
    completions: {
      create: (opts: {
        messages: { role: string; content: string }[];
        max_tokens?: number;
        temperature?: number;
        stream?: boolean;
      }) => Promise<{
        choices: { message: { content: string } }[];
        usage: { total_tokens: number };
      }>;
    };
  };
  unload: () => Promise<void>;
}

interface MLCModule {
  CreateMLCEngine: (modelId: string, opts?: { initProgressCallback?: (progress: number) => void }) => Promise<MLCEngine>;
}

let _mlcModule: MLCModule | null = null;
let _engine: MLCEngine | null = null;
let _loadedModelId: string | null = null;

function tryLoadMLC(): MLCModule | null {
  if (_mlcModule) return _mlcModule;
  if (Platform.OS !== "ios") return null;
  try {
    // Dynamically required so web/Expo Go don't crash at import time
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require("@mlc-ai/mlc-llm-react-native") as MLCModule;
    _mlcModule = mod;
    return mod;
  } catch {
    return null;
  }
}

export class LocalMLCProvider {
  private mlc: MLCModule | null;
  private progressCallback?: (progress: number, modelId: string) => void;

  constructor(opts?: { onProgress?: (progress: number, modelId: string) => void }) {
    this.mlc = tryLoadMLC();
    this.progressCallback = opts?.onProgress;
  }

  isAvailable(): boolean {
    return this.mlc !== null;
  }

  getModelId(band: string): string {
    return MLC_MODEL_IDS[band] ?? MLC_MODEL_IDS.balanced;
  }

  async ensureLoaded(band: string): Promise<MLCEngine> {
    const modelId = this.getModelId(band);
    if (_engine && _loadedModelId === modelId) return _engine;

    if (_engine && _loadedModelId !== modelId) {
      await _engine.unload();
      _engine = null;
      _loadedModelId = null;
    }

    if (!this.mlc) throw new Error("MLC module not available");

    _engine = await this.mlc.CreateMLCEngine(modelId, {
      initProgressCallback: (progress) => {
        this.progressCallback?.(progress, modelId);
      },
    });
    _loadedModelId = modelId;
    return _engine;
  }

  async run(req: InferenceRequest): Promise<InferenceResponse> {
    const start = Date.now();
    const engine = await this.ensureLoaded(req.band);

    const messages: { role: string; content: string }[] = [];
    if (req.systemPrompt) {
      messages.push({ role: "system", content: req.systemPrompt });
    }
    messages.push({ role: "user", content: req.prompt });

    const completion = await engine.chat.completions.create({
      messages,
      max_tokens: req.maxTokens,
      temperature: req.temperature,
    });

    const text = completion.choices[0]?.message?.content ?? "";
    const tokensUsed = completion.usage?.total_tokens ?? 0;

    if (req.onToken) {
      for (const char of text) req.onToken(char);
    }

    return { text, tokensUsed, latencyMs: Date.now() - start };
  }
}
