import { InferenceProvider, InferenceRequest, InferenceResponse } from './pipeline/types';
import { LocalMLCProvider } from './providers/LocalMLCProvider';
import { DevProvider } from './providers/DevProvider';

class InferenceEngine {
  private provider: InferenceProvider;
  private mlcProvider: LocalMLCProvider;
  private devProvider: DevProvider;
  private initialized = false;

  constructor() {
    this.mlcProvider = new LocalMLCProvider();
    this.devProvider = new DevProvider();
    this.provider = this.devProvider; // default until MLC is checked
  }

  async initialize(): Promise<'local' | 'dev'> {
    if (this.initialized) return this.provider.providerType;
    
    const mlcAvailable = await this.mlcProvider.isAvailable();
    if (mlcAvailable) {
      this.provider = this.mlcProvider;
      console.log('[InferenceEngine] Using LocalMLCProvider — on-device inference');
    } else {
      this.provider = this.devProvider;
      console.log('[InferenceEngine] Using DevProvider — development mode');
    }
    this.initialized = true;
    return this.provider.providerType;
  }

  getProviderType(): 'local' | 'dev' {
    return this.provider.providerType;
  }

  getMLCProvider(): LocalMLCProvider {
    return this.mlcProvider;
  }

  async loadModel(band: 'fast' | 'balanced' | 'precision'): Promise<void> {
    await this.provider.loadModel(band);
  }

  async generate(request: InferenceRequest): Promise<InferenceResponse> {
    if (!this.initialized) await this.initialize();
    return this.provider.generate(request);
  }

  async generateWithFallback(request: InferenceRequest): Promise<InferenceResponse> {
    try {
      return await this.generate(request);
    } catch (error) {
      // If MLC fails, fall back to dev provider
      if (this.provider.providerType === 'local') {
        console.warn('[InferenceEngine] MLC failed, falling back to dev provider');
        return this.devProvider.generate(request);
      }
      throw error;
    }
  }
}

// Singleton
export const inferenceEngine = new InferenceEngine();
export default inferenceEngine;
