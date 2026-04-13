export type ModelBand = "fast" | "balanced" | "precision";
export type TaskType =
  | "factual_question"
  | "creative_task"
  | "analytical_task"
  | "coding_task"
  | "planning_task"
  | "conversational";
export type OutputFormat = "prose" | "list" | "structured_plan" | "code" | "table";
export type Verdict = "pass" | "repair_needed" | "fail";

export interface ScoutResult {
  task_type: TaskType;
  complexity: "low" | "medium" | "high";
  requires_deep_task: boolean;
  key_concepts: string[];
  output_format: OutputFormat;
  predicted_output_label: string;
  domain?: string;
  sub_tasks?: string[];
}

export interface PlanStep {
  id: string;
  action: string;
  tool?: string;
  depends_on: string[];
  estimated_tokens: number;
}

export interface PlannerResult {
  steps: PlanStep[];
  total_steps: number;
  strategy: string;
}

export interface ResearchResult {
  expanded_context: string;
  related_concepts: string[];
  knowledge_gaps: string[];
  confidence: number;
}

export interface WorkerResult {
  content: string;
  format: OutputFormat;
  tokens_used: number;
  confidence: number;
}

export interface CriticScore {
  correctness: number;
  completeness: number;
  consistency: number;
  usefulness: number;
  safety: number;
  aggregate: number;
  issues: string[];
  repair_guidance: string;
  verdict: Verdict;
}

export interface ValidatorResult {
  claims_checked: number;
  flagged_claims: string[];
  verified_claims: string[];
  overall_validity: number;
  verdict: Verdict;
}

export interface SynthesizerResult {
  synthesized_content: string;
  improvements_applied: string[];
  quality_delta: number;
}

export interface JudgeResult {
  final_content: string;
  confidence: number;
  quality_grade: "A" | "B" | "C" | "D" | "F";
  reasoning: string;
  sources_cited: string[];
}

export interface MetacognitiveState {
  pipeline_confidence: number;
  repair_triggered: boolean;
  repair_count: number;
  bottleneck_agent: string | null;
  quality_trajectory: number[];
  recommendation: string;
}

export interface AgentStage {
  id: string;
  name: string;
  status: "idle" | "running" | "complete" | "error" | "skipped";
  result?: unknown;
  error?: string;
  latency_ms?: number;
  tokens_used?: number;
}

export interface DeepTaskResult {
  query: string;
  scout: ScoutResult;
  planner: PlannerResult;
  researcher: ResearchResult;
  worker: WorkerResult;
  critic: CriticScore;
  validator: ValidatorResult;
  synthesizer: SynthesizerResult;
  judge: JudgeResult;
  metacognitive: MetacognitiveState;
  stages: AgentStage[];
  total_latency_ms: number;
  final_answer: string;
  confidence: number;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: number;
  mode: "ask" | "deep";
  confidence?: number;
  stages?: AgentStage[];
  isStreaming?: boolean;
}

export interface WorkspaceItem {
  id: string;
  title: string;
  content: string;
  type: "chat" | "task" | "note" | "import";
  createdAt: number;
  updatedAt: number;
  pinned: boolean;
  tags: string[];
}

export interface InferenceRequest {
  prompt: string;
  systemPrompt: string;
  maxTokens: number;
  temperature: number;
  band: ModelBand;
  onToken?: (token: string) => void;
}

export interface InferenceResponse {
  text: string;
  tokensUsed: number;
  latencyMs: number;
}
