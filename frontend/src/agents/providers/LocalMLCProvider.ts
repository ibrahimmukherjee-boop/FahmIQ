import { InferenceProvider, InferenceRequest, InferenceResponse } from '../pipeline/types';

// Real on-device MLC LLM provider
// Uses @react-native-ai/mlc for local model execution on iOS
// Models: Qwen2.5 series optimised for mobile inference
const MODEL_IDS: Record<string, string> = {
  fast: 'Qwen2.5-0.5B-Instruct-q4f16_1-MLC',
  balanced: 'Qwen2.5-1.5B-Instruct-q8_0-MLC',
  precision: 'Qwen2.5-3B-Instruct-q4f16_1-MLC',
};

const MODEL_URLS: Record<string, string> = {
  fast: 'https://huggingface.co/mlc-ai/Qwen2.5-0.5B-Instruct-q4f16_1-MLC',
  balanced: 'https://huggingface.co/mlc-ai/Qwen2.5-1.5B-Instruct-q8_0-MLC',
  precision: 'https://huggingface.co/mlc-ai/Qwen2.5-3B-Instruct-q4f16_1-MLC',
};

const MODEL_SIZES: Record<string, string> = {
  fast: '~350 MB',
  balanced: '~1.8 GB',
  precision: '~2.0 GB',
};

let createMLCEngine: any = null;

// Dynamically import MLC - only available in native builds
async function loadMLCModule() {
  if (createMLCEngine) return true;
  try {
    const mlc = await import('@react-native-ai/mlc');
    createMLCEngine = mlc.createMLCEngine || mlc.default?.createMLCEngine;
    return !!createMLCEngine;
  } catch {
    console.log('[LocalMLCProvider] MLC native module not available — requires iOS build');
    return false;
  }
}

export class LocalMLCProvider implements InferenceProvider {
  providerType = 'local' as const;
  private engines: Record<string, any> = {};
  private downloadProgress: Record<string, number> = {};
  private onProgress?: (band: string, progress: number) => void;

  setProgressCallback(cb: (band: string, progress: number) => void) {
    this.onProgress = cb;
  }

  async isAvailable(): Promise<boolean> {
    return loadMLCModule();
  }

  async loadModel(band: 'fast' | 'balanced' | 'precision'): Promise<void> {
    if (this.engines[band]) return;

    const available = await this.isAvailable();
    if (!available) {
      throw new Error('MLC native module not available. Requires iOS EAS build.');
    }

    this.engines[band] = await createMLCEngine({
      modelId: MODEL_URLS[band],
      initProgressCallback: (progress: any) => {
        const pct = typeof progress === 'number' ? progress : progress?.progress ?? 0;
        this.downloadProgress[band] = pct;
        this.onProgress?.(band, pct);
      },
    });
  }

  getDownloadProgress(band: string): number {
    return this.downloadProgress[band] ?? 0;
  }

  async generate(request: InferenceRequest): Promise<InferenceResponse> {
    const engine = this.engines[request.modelBand];
    if (!engine) throw new Error(`Model not loaded: ${request.modelBand}`);

    const start = Date.now();
    const reply = await engine.chat.completions.create({
      messages: [
        { role: 'system', content: request.systemPrompt },
        { role: 'user', content: request.prompt },
      ],
      max_tokens: request.maxTokens,
      temperature: request.temperature,
      stream: false,
    });

    const text = reply.choices?.[0]?.message?.content ?? '';
    const tokensUsed = reply.usage?.total_tokens ?? Math.floor(text.length / 4);

    return {
      text,
      tokensUsed,
      latencyMs: Date.now() - start,
      modelBand: request.modelBand,
      provider: 'local',
    };
  }

  async unloadModel(band: string): Promise<void> {
    if (this.engines[band]) {
      try {
        await this.engines[band]?.dispose?.();
      } catch { /* ignore */ }
      delete this.engines[band];
    }
  }

  async unloadAll(): Promise<void> {
    for (const band of Object.keys(this.engines)) {
      await this.unloadModel(band);
    }
  }
}

export { MODEL_IDS, MODEL_URLS, MODEL_SIZES };
