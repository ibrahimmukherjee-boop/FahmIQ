import inferenceEngine from '../InferenceEngine';
import { AgentResult, PipelineResult } from '../pipeline/types';
import {
  SCOUT_PROMPT,
  PLANNER_PROMPT,
  WORKER_PROMPT,
  CRITIC_PROMPT,
  SYNTHESIZER_PROMPT,
  JUDGE_PROMPT,
} from '../prompts/systemPrompts';
import { WebSearchTool } from '../tools/WebSearchTool';

export type StageCallback = (stage: string, status: 'running' | 'complete' | 'error', result?: AgentResult) => void;

export class AskOrchestrator {
  private onStageUpdate?: StageCallback;

  setStageCallback(cb: StageCallback) {
    this.onStageUpdate = cb;
  }

  async process(userQuery: string): Promise<PipelineResult> {
    const stages: AgentResult[] = [];
    let totalTokens = 0;
    const startTime = Date.now();

    // Stage 1: Scout
    this.onStageUpdate?.('scout', 'running');
    const scoutResult = await inferenceEngine.generateWithFallback({
      prompt: `Analyze this query: "${userQuery}"`,
      systemPrompt: SCOUT_PROMPT,
      modelBand: 'fast',
      maxTokens: 512,
      temperature: 0.3,
    });
    const scoutAgent: AgentResult = {
      agent: 'Scout',
      output: scoutResult.text,
      confidence: 85,
      tokensUsed: scoutResult.tokensUsed,
      latencyMs: scoutResult.latencyMs,
    };
    stages.push(scoutAgent);
    totalTokens += scoutResult.tokensUsed;
    this.onStageUpdate?.('scout', 'complete', scoutAgent);

    // Check if web search is needed
    let searchContext = '';
    try {
      const assessment = JSON.parse(scoutResult.text);
      if (assessment.tools?.includes('web_search')) {
        this.onStageUpdate?.('researcher', 'running');
        const results = await WebSearchTool.search(userQuery, 3);
        searchContext = results.map((r) => `[${r.title}](${r.url}): ${r.snippet}`).join('\n\n');
        const researchAgent: AgentResult = {
          agent: 'Researcher',
          output: searchContext || 'No web results found',
          confidence: results.length > 0 ? 80 : 30,
          tokensUsed: 0,
          latencyMs: 0,
        };
        stages.push(researchAgent);
        this.onStageUpdate?.('researcher', 'complete', researchAgent);
      }
    } catch { /* Scout output wasn't JSON, skip search */ }

    // Stage 2: Planner
    this.onStageUpdate?.('planner', 'running');
    const plannerResult = await inferenceEngine.generateWithFallback({
      prompt: `Scout assessment: ${scoutResult.text}\nOriginal query: "${userQuery}"`,
      systemPrompt: PLANNER_PROMPT,
      modelBand: 'fast',
      maxTokens: 512,
      temperature: 0.3,
    });
    const plannerAgent: AgentResult = {
      agent: 'Planner',
      output: plannerResult.text,
      confidence: 82,
      tokensUsed: plannerResult.tokensUsed,
      latencyMs: plannerResult.latencyMs,
    };
    stages.push(plannerAgent);
    totalTokens += plannerResult.tokensUsed;
    this.onStageUpdate?.('planner', 'complete', plannerAgent);

    // Stage 3: Worker
    this.onStageUpdate?.('worker', 'running');
    const workerPrompt = searchContext
      ? `Query: "${userQuery}"\n\nWeb research context:\n${searchContext}\n\nProvide a thorough, accurate answer.`
      : `Query: "${userQuery}"\n\nProvide a thorough, accurate answer based on your knowledge.`;
    const workerResult = await inferenceEngine.generateWithFallback({
      prompt: workerPrompt,
      systemPrompt: WORKER_PROMPT,
      modelBand: 'balanced',
      maxTokens: 1024,
      temperature: 0.5,
    });
    const workerAgent: AgentResult = {
      agent: 'Worker',
      output: workerResult.text,
      confidence: 75,
      tokensUsed: workerResult.tokensUsed,
      latencyMs: workerResult.latencyMs,
    };
    stages.push(workerAgent);
    totalTokens += workerResult.tokensUsed;
    this.onStageUpdate?.('worker', 'complete', workerAgent);

    // Stage 4: Critic
    this.onStageUpdate?.('critic', 'running');
    const criticResult = await inferenceEngine.generateWithFallback({
      prompt: `Review this response for accuracy and honesty:\n\nQuery: "${userQuery}"\nResponse: ${workerResult.text}`,
      systemPrompt: CRITIC_PROMPT,
      modelBand: 'fast',
      maxTokens: 512,
      temperature: 0.3,
    });
    const criticAgent: AgentResult = {
      agent: 'Critic',
      output: criticResult.text,
      confidence: 80,
      tokensUsed: criticResult.tokensUsed,
      latencyMs: criticResult.latencyMs,
    };
    stages.push(criticAgent);
    totalTokens += criticResult.tokensUsed;
    this.onStageUpdate?.('critic', 'complete', criticAgent);

    // Stage 5: Synthesizer
    this.onStageUpdate?.('synthesizer', 'running');
    const synthResult = await inferenceEngine.generateWithFallback({
      prompt: `Original query: "${userQuery}"\n\nWorker output:\n${workerResult.text}\n\nCritic feedback:\n${criticResult.text}\n\nSynthesize the final answer.`,
      systemPrompt: SYNTHESIZER_PROMPT,
      modelBand: 'balanced',
      maxTokens: 1024,
      temperature: 0.4,
    });
    const synthAgent: AgentResult = {
      agent: 'Synthesizer',
      output: synthResult.text,
      confidence: 78,
      tokensUsed: synthResult.tokensUsed,
      latencyMs: synthResult.latencyMs,
    };
    stages.push(synthAgent);
    totalTokens += synthResult.tokensUsed;
    this.onStageUpdate?.('synthesizer', 'complete', synthAgent);

    // Stage 6: Judge
    this.onStageUpdate?.('judge', 'running');
    const judgeResult = await inferenceEngine.generateWithFallback({
      prompt: `Rate this final response:\n${synthResult.text}`,
      systemPrompt: JUDGE_PROMPT,
      modelBand: 'fast',
      maxTokens: 256,
      temperature: 0.2,
    });
    const judgeAgent: AgentResult = {
      agent: 'Judge',
      output: judgeResult.text,
      confidence: 90,
      tokensUsed: judgeResult.tokensUsed,
      latencyMs: judgeResult.latencyMs,
    };
    stages.push(judgeAgent);
    totalTokens += judgeResult.tokensUsed;
    this.onStageUpdate?.('judge', 'complete', judgeAgent);

    // Parse judge confidence
    let confidence = 75;
    try {
      const judgeData = JSON.parse(judgeResult.text);
      confidence = judgeData.overallConfidence ?? 75;
    } catch { /* use default */ }

    return {
      finalAnswer: synthResult.text,
      confidence,
      stages,
      totalTokens,
      totalLatencyMs: Date.now() - startTime,
      sources: searchContext ? ['Web Search'] : undefined,
    };
  }
}

export const askOrchestrator = new AskOrchestrator();
