export interface InferenceRequest {
  prompt: string;
  systemPrompt: string;
  modelBand: 'fast' | 'balanced' | 'precision';
  maxTokens: number;
  temperature: number;
  stream?: boolean;
}

export interface InferenceResponse {
  text: string;
  tokensUsed: number;
  latencyMs: number;
  modelBand: string;
  provider: 'local' | 'dev';
}

export interface InferenceProvider {
  providerType: 'local' | 'dev';
  isAvailable(): Promise<boolean>;
  loadModel(band: 'fast' | 'balanced' | 'precision'): Promise<void>;
  generate(request: InferenceRequest): Promise<InferenceResponse>;
}

export interface AgentResult {
  agent: string;
  output: string;
  confidence: number;
  reasoning?: string;
  suggestions?: string[];
  tokensUsed: number;
  latencyMs: number;
}

export interface PipelineResult {
  finalAnswer: string;
  confidence: number;
  stages: AgentResult[];
  totalTokens: number;
  totalLatencyMs: number;
  sources?: string[];
  disclaimers?: string[];
}

export type AgentRole =
  | 'scout'
  | 'planner'
  | 'researcher'
  | 'worker'
  | 'critic'
  | 'validator'
  | 'synthesizer'
  | 'judge';
