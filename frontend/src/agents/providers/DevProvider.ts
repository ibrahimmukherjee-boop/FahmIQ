import { InferenceProvider, InferenceRequest, InferenceResponse } from '../pipeline/types';

// Development provider - processes queries using rule-based intelligence
// Used during development and as fallback when MLC native module is unavailable
export class DevProvider implements InferenceProvider {
  providerType = 'dev' as const;

  async isAvailable(): Promise<boolean> {
    return true;
  }

  async loadModel(_band: 'fast' | 'balanced' | 'precision'): Promise<void> {
    // Models are built-in for dev provider
  }

  async generate(request: InferenceRequest): Promise<InferenceResponse> {
    const start = Date.now();
    // Simulate realistic inference latency based on model band
    const latencies = { fast: 300, balanced: 800, precision: 1500 };
    const latency = latencies[request.modelBand] + Math.random() * 500;
    await new Promise((r) => setTimeout(r, latency));

    const text = this.processQuery(request.prompt, request.systemPrompt);
    return {
      text,
      tokensUsed: Math.floor(text.length / 4),
      latencyMs: Date.now() - start,
      modelBand: request.modelBand,
      provider: 'dev',
    };
  }

  private processQuery(prompt: string, systemPrompt: string): string {
    const lower = prompt.toLowerCase();

    // Scout analysis
    if (systemPrompt.includes('Scout')) {
      const complexity = lower.length > 200 ? 'complex' : lower.length > 50 ? 'moderate' : 'simple';
      const needsSearch = lower.includes('latest') || lower.includes('current') || lower.includes('news') || lower.includes('who is') || lower.includes('what happened');
      const needsCalc = /\d+\s*[\+\-\*\/\%]\s*\d+/.test(lower) || lower.includes('calculate') || lower.includes('compute');
      return JSON.stringify({
        complexity,
        tools: [
          ...(needsSearch ? ['web_search'] : []),
          ...(needsCalc ? ['calculator'] : []),
        ],
        tokenBudget: complexity === 'complex' ? 2048 : complexity === 'moderate' ? 1024 : 512,
        multiStep: complexity === 'complex',
        entities: prompt.split(' ').filter((w) => w.length > 4 && w[0] === w[0].toUpperCase()).slice(0, 5),
      });
    }

    // Planner
    if (systemPrompt.includes('Planner')) {
      return JSON.stringify({
        steps: [
          { id: '1', agent: 'worker', task: 'Analyze the core question and gather context', priority: 'high' },
          { id: '2', agent: 'worker', task: 'Develop detailed response with reasoning', priority: 'high' },
          { id: '3', agent: 'critic', task: 'Review for accuracy and bias', priority: 'high' },
          { id: '4', agent: 'synthesizer', task: 'Compile final response', priority: 'high' },
        ],
        estimatedTokens: 1500,
        qualityThreshold: 75,
      });
    }

    // Critic
    if (systemPrompt.includes('Critic') || systemPrompt.includes('ADVERSARIAL')) {
      return JSON.stringify({
        logicalErrors: [],
        unsupportedClaims: [],
        sycophancyScore: Math.floor(Math.random() * 15),
        confidence: 70 + Math.floor(Math.random() * 25),
        suggestions: ['Consider adding more nuance', 'Verify key claims with sources'],
        verdict: 'PASS',
      });
    }

    // Validator
    if (systemPrompt.includes('Validator')) {
      return JSON.stringify({
        verified: true,
        factualAccuracy: 80 + Math.floor(Math.random() * 15),
        unverifiedClaims: [],
        hallucinations: [],
        verdict: 'VALID',
      });
    }

    // Judge
    if (systemPrompt.includes('Judge')) {
      return JSON.stringify({
        accuracy: 75 + Math.floor(Math.random() * 20),
        completeness: 70 + Math.floor(Math.random() * 25),
        intellectualHonesty: 85 + Math.floor(Math.random() * 15),
        needsRepair: false,
        overallConfidence: 78 + Math.floor(Math.random() * 15),
      });
    }

    // Synthesizer
    if (systemPrompt.includes('Synthesizer')) {
      return this.generateAnswer(prompt);
    }

    // Worker (default) - generate a thoughtful response
    return this.generateAnswer(prompt);
  }

  private generateAnswer(prompt: string): string {
    const lower = prompt.toLowerCase();

    if (lower.includes('what is') || lower.includes('define') || lower.includes('explain')) {
      const topic = prompt.replace(/what is|define|explain|please|can you|tell me about/gi, '').trim();
      return `**${topic}**\n\nThis is a multi-faceted concept that requires careful analysis. Here are the key dimensions:\n\n1. **Core Definition**: ${topic} refers to a specific domain of knowledge that intersects multiple disciplines.\n\n2. **Key Considerations**: When examining ${topic}, it's important to distinguish between established consensus and emerging perspectives. The current understanding has evolved significantly.\n\n3. **Critical Nuance**: A common misconception is to oversimplify ${topic}. The reality involves trade-offs and context-dependent factors that resist easy generalisation.\n\n4. **Practical Implications**: Understanding ${topic} has direct relevance to decision-making in related fields.\n\n⚠️ **Confidence Note**: This analysis is generated on-device. For the most current information, a web search is recommended.\n\n*Confidence: 74% — Based on general knowledge patterns. Specific claims should be independently verified.*`;
    }

    if (lower.includes('how') || lower.includes('steps') || lower.includes('guide')) {
      return `**Analysis & Approach**\n\nLet me break this down systematically:\n\n**Step 1: Foundation**\nFirst, establish the core requirements and constraints. This prevents wasted effort on approaches that won't satisfy the actual need.\n\n**Step 2: Research**\nGather relevant information from reliable sources. Cross-reference multiple perspectives to reduce bias.\n\n**Step 3: Execution**\nImplement the approach iteratively, testing assumptions at each stage.\n\n**Step 4: Validation**\nVerify the outcome against the original requirements. Be honest about gaps.\n\n⚠️ **Intellectual Honesty Note**: This is a general framework. Your specific situation may require adaptation. I'd rather give you a honest general framework than a confidently wrong specific answer.\n\n*Confidence: 71% — General methodology applies broadly but specific context matters.*`;
    }

    if (lower.includes('compare') || lower.includes('versus') || lower.includes('vs')) {
      return `**Comparative Analysis**\n\nRather than declaring a winner, let me present the trade-offs honestly:\n\n| Dimension | Option A | Option B |\n|-----------|----------|----------|\n| Strengths | Proven, stable | Innovative, flexible |\n| Weaknesses | Less adaptive | Less battle-tested |\n| Best for | Established workflows | New approaches |\n\n**The Honest Answer**: The "better" option depends entirely on your specific context, constraints, and priorities. Anyone giving you a definitive answer without knowing your situation is being sycophantic, not helpful.\n\n*Confidence: 68% — Comparative analyses are inherently context-dependent.*`;
    }

    return `**Response**\n\nI've analyzed your query through multiple reasoning passes.\n\n${prompt.length > 100 ? 'This is a complex question that deserves a thorough response.' : 'Let me address this directly.'}\n\n**Key Points:**\n\n1. The core of your question touches on important considerations that require careful reasoning.\n\n2. Rather than giving you a simple answer that might be wrong, I want to highlight the key factors that matter for your specific situation.\n\n3. There are aspects of this that have clear, well-established answers, and other aspects where honest uncertainty is more valuable than false confidence.\n\n**What I'm Confident About:** The fundamental principles involved are well-understood and reliable.\n\n**Where I'm Less Certain:** Specific applications and edge cases may vary. If precision matters, I recommend verifying with domain-specific sources.\n\n*Confidence: 73% — This reflects genuine assessment, not hedging. I'd rather be honestly uncertain than falsely confident.*`;
  }
}
