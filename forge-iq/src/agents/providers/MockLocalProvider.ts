/**
 * MockLocalProvider — FahmIQ v2
 * ─────────────────────────────────────────────────────────────────────────────
 * Active MVP inference provider. Simulates per-band latency, streams tokens,
 * and returns contextually appropriate domain-aware responses for all 4 agent
 * bands (Scout, Worker, Critic, Judge).
 *
 * This is NOT a random text generator. Responses are:
 *   – Domain-classified from the query
 *   – Structured with extracted key concepts woven in
 *   – Appropriately varied by agent role and complexity
 *   – Streamed with realistic token timing
 *
 * Latency targets (arch doc):
 *   Scout/Critic (Fast):    ~400ms
 *   Worker/Judge (Balanced): ~900–1800ms
 */

import type { InferenceRequest, InferenceResponse, ModelBand } from "../types";

type Domain =
  | "strategy_business"
  | "technology_engineering"
  | "science_research"
  | "finance_economics"
  | "product_design"
  | "data_analytics"
  | "leadership_management"
  | "general";

// ── Per-band token streaming delay (ms per token) ─────────────────────────────
const TOKEN_DELAY_MS: Record<ModelBand, number> = {
  fast: 12,
  balanced: 22,
  precision: 35,
};

// ── Simulated latency before first token ─────────────────────────────────────
const PREFILL_MS: Record<ModelBand, number> = {
  fast: 180,
  balanced: 320,
  precision: 500,
};

// ── Domain detection patterns ─────────────────────────────────────────────────
const DOMAIN_PATTERNS: Array<{ domain: Domain; patterns: RegExp[] }> = [
  {
    domain: "strategy_business",
    patterns: [
      /\b(market|strategy|competitive|saas|startup|revenue|growth|business|monetis|go-to-market|product.market|mvp|traction|churn|b2b|b2c|enterprise)\b/i,
    ],
  },
  {
    domain: "technology_engineering",
    patterns: [
      /\b(code|software|architecture|api|database|system|performance|scalab|microservice|cloud|devops|ci.cd|kubernetes|docker|algorithm|react|typescript|python|backend|frontend)\b/i,
    ],
  },
  {
    domain: "science_research",
    patterns: [
      /\b(research|study|evidence|quantum|physics|biology|chemistry|neuroscience|climate|hypothesis|peer.review|data|methodology|experiment|scientific)\b/i,
    ],
  },
  {
    domain: "finance_economics",
    patterns: [
      /\b(finance|investment|portfolio|valuation|dcf|irr|roi|equity|capital|fund|economics|inflation|monetary|fiscal|market cap|stock|bond)\b/i,
    ],
  },
  {
    domain: "product_design",
    patterns: [
      /\b(product|ux|design|user experience|wireframe|prototype|feature|roadmap|sprint|agile|user research|usability|interface)\b/i,
    ],
  },
  {
    domain: "data_analytics",
    patterns: [
      /\b(data|analytics|dashboard|metric|kpi|sql|machine learning|model|prediction|regression|classification|visualis)\b/i,
    ],
  },
  {
    domain: "leadership_management",
    patterns: [
      /\b(leadership|management|team|hiring|culture|okr|performance|delegate|communicate|organisation|stakeholder|meeting|decision)\b/i,
    ],
  },
];

function detectDomain(text: string): Domain {
  for (const { domain, patterns } of DOMAIN_PATTERNS) {
    if (patterns.some((p) => p.test(text))) return domain;
  }
  return "general";
}

/**
 * Extracts up to 5 meaningful keywords from a query.
 */
function extractKeywords(text: string): string[] {
  const stopWords = new Set([
    "the","a","an","and","or","but","in","on","at","to","for","of","with",
    "this","that","these","those","is","are","was","were","be","been","have",
    "has","had","do","does","did","will","would","could","should","may","might",
    "can","what","how","why","when","where","who","which","me","my","i","you",
    "your","we","our","they","their","it","its","by","from","as","if","so",
  ]);
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 3 && !stopWords.has(w))
    .slice(0, 5);
}

// ── Domain-specific response templates ────────────────────────────────────────

const DOMAIN_WORKER_TEMPLATES: Record<Domain, (q: string, kw: string[]) => string> = {
  strategy_business: (q, kw) => {
    const topic = kw[0] || "this domain";
    const kw2 = kw[1] || "growth";
    const kw3 = kw[2] || "competition";
    return `## Strategic Analysis: ${q.slice(0, 60)}

### Executive Assessment
This is a nuanced ${topic} challenge requiring analysis across three dimensions: market dynamics, competitive positioning, and execution capacity.

### Market & Competitive Landscape
Current signals in the ${topic} space indicate:
- **TAM Pressure**: Markets with strong ${kw2} metrics typically see 18–24 month compression cycles before commoditisation
- **Differentiation Window**: First-mover advantage in ${kw3} requires locking in switching costs within 12 months of launch
- **Pricing Dynamics**: Value-based pricing outperforms cost-plus by 28–40% in B2B SaaS contexts with clear ROI instrumentation

### Strategic Recommendations
**Immediate (0–90 days):**
1. Conduct structured customer discovery on the top three ${kw2} pain points — minimum 15 interviews
2. Map the ${kw3} landscape with a 2×2 (market share vs. strategic intent)
3. Identify one moat-building initiative that can be executed with current resources

**Medium-term (3–12 months):**
1. Build compounding defensibility through data network effects or workflow integration depth
2. Establish category leadership through thought leadership + community — this compounds asymmetrically
3. Price anchoring: position premium against worst-case alternative cost, not competitor prices

### Risk Factors
| Risk | Probability | Mitigation |
|------|-------------|------------|
| ${kw3} intensification | Medium-High | Accelerate switching cost investments |
| ${kw2} plateau | Medium | Diversify acquisition channels before plateau |
| Execution dilution | High | Ruthless prioritisation — one strategic bet at a time |

### Confidence Assessment
Evidence quality: **Strong** (structured reasoning + established strategic frameworks)
Uncertainty: Primary uncertainty is execution speed, not analytical direction.

*This analysis is based on ${topic} domain patterns. Validate against your specific unit economics before committing resources.*`;
  },

  technology_engineering: (q, kw) => {
    const topic = kw[0] || "this system";
    const kw2 = kw[1] || "architecture";
    const kw3 = kw[2] || "performance";
    return `## Technical Analysis: ${q.slice(0, 60)}

### Architecture Assessment
The core ${topic} challenge involves tradeoffs between scalability, maintainability, and operational complexity. Here's a structured evaluation:

### System Design Considerations

**Scalability Bottlenecks:**
The primary ${topic} constraints typically emerge at three layers:
1. **Compute layer**: Stateful vs stateless processing — stateless scales horizontally with near-linear cost curves
2. **Data layer**: Read/write ratio determines whether caching, read replicas, or sharding is the right lever
3. **Network layer**: Service mesh overhead compounds at >50 services; evaluate whether microservices granularity matches team topology

**${kw2} Recommendations:**
\`\`\`
Option A (Conservative): Monolith-with-modules
  + Lower operational overhead
  + Faster iteration cycles
  – Vertical scaling limits
  
Option B (Scalable): Service-oriented with clear boundaries
  + Independent deployability
  + Team autonomy
  – Distributed system complexity
\`\`\`

**${kw3} Optimisation Path:**
1. Measure before optimising — establish baseline metrics with p50/p95/p99 latencies
2. Profile hot paths: typically 80% of latency lives in 20% of code paths
3. Caching strategy: L1 (in-process) → L2 (distributed) → L3 (CDN) based on cache hit rate analysis

### Implementation Checklist
- [ ] Define SLOs before architecture decisions (latency, availability, throughput targets)
- [ ] Design for observability from day 1 (structured logging, distributed tracing, metrics)
- [ ] Write architecture decision records (ADRs) for non-obvious tradeoffs
- [ ] Load test at 10× expected peak before production

### Confidence Assessment
**High confidence** on architectural patterns. Specific implementation details require your tech stack constraints.`;
  },

  science_research: (q, kw) => {
    const topic = kw[0] || "this domain";
    const kw2 = kw[1] || "evidence";
    const kw3 = kw[2] || "methodology";
    return `## Research Synthesis: ${q.slice(0, 60)}

### Evidence Landscape
Systematic analysis of available evidence on ${topic}:

### Empirical Foundation
**Established findings (high confidence, >0.90):**
- The mechanistic basis of ${topic} is well-characterised in peer-reviewed literature spanning 30+ years of experimental work
- Consensus exists on fundamental principles, with reproducibility rates >80% across independent laboratories
- Recent methodological advances (particularly ${kw3} improvements 2020–2025) have increased measurement precision by 1–2 orders of magnitude

**Active debates (moderate confidence, 0.60–0.80):**
- The relative contribution of competing mechanisms remains contested — two major theoretical camps present interpretations that are not yet empirically distinguishable
- ${kw2} from recent studies suggests X, but confounding variables limit causal inference
- Cross-domain findings (biology ↔ physics, computation ↔ neuroscience) show promising convergence but require replication

**Knowledge gaps (low confidence, flagged):**
1. Long-term dynamics at scale are understudied — most studies run <5 years
2. Individual variation is systematically underreported, masking heterogeneous effects
3. Mechanistic understanding of edge-case phenomena remains incomplete

### Confidence Grading
| Claim | Confidence | Evidence Quality |
|-------|------------|-----------------|
| Core mechanism | 0.95–0.98 | Multiple RCTs, meta-analyses |
| Boundary conditions | 0.72–0.80 | Observational studies, some RCTs |
| Novel applications | 0.55–0.65 | Early-stage research, limited N |

### Research Quality Assessment
**Methodology**: ${kw3} quality varies significantly across literature — privilege systematic reviews and pre-registered studies.
**Reproducibility**: Core findings replicate well; novel findings require independent replication before integration.

*Synthesis based on publicly available research literature. This is not a substitute for primary source review for high-stakes decisions.*`;
  },

  finance_economics: (q, kw) => {
    const topic = kw[0] || "this asset";
    const kw2 = kw[1] || "valuation";
    const kw3 = kw[2] || "risk";
    return `## Financial Analysis: ${q.slice(0, 60)}

### Analytical Framework
Structured ${topic} analysis across valuation, risk, and capital allocation dimensions:

### Valuation Assessment
**Base case assumptions:**
- Revenue growth rate: contextually calibrated to sector median (typically 15–30% for growth-stage, 5–10% for mature)
- Margin trajectory: cost structure analysis determines EBITDA expansion capacity
- Discount rate: WACC incorporating ${kw3} premium appropriate to ${topic} stage and sector

**${kw2} Methodology:**
| Method | Weight | Notes |
|--------|--------|-------|
| DCF (5-year) | 40% | Sensitive to terminal growth rate assumption |
| Comparable multiples | 35% | EV/Revenue, EV/EBITDA vs sector comps |
| Precedent transactions | 25% | M&A premium typically 25–40% over public comps |

### Risk Framework
**Systematic ${kw3}**: Market beta, interest rate sensitivity, sector correlation
**Idiosyncratic ${kw3}**: Business model concentration, key-person dependency, regulatory exposure

**${kw3} Scorecard:**
- Liquidity: Assess current ratio, quick ratio, cash runway
- Solvency: Net debt/EBITDA < 3× is generally conservative
- Operational: Revenue concentration (no single customer >20% is prudent)

### Capital Allocation Insights
Optimal capital allocation follows a hierarchy:
1. Reinvest at returns > cost of capital (ROIC > WACC)
2. M&A only where synergies are demonstrable, not aspirational
3. Return capital when organic deployment options are exhausted

*This analysis uses standard financial frameworks. It does not constitute investment advice.*`;
  },

  product_design: (q, kw) => {
    const topic = kw[0] || "this product";
    const kw2 = kw[1] || "user experience";
    const kw3 = kw[2] || "design";
    return `## Product Analysis: ${q.slice(0, 60)}

### Product Strategy Assessment
Structured analysis of ${topic} through the lens of user value, business model alignment, and technical feasibility:

### User Value Framework
**Jobs-to-be-done mapping:**
Users hire ${topic} to accomplish functional, emotional, or social jobs. Precise JTBD definition is the single highest-leverage input to product quality.

**${kw2} Audit Dimensions:**
1. **Discoverability**: Can users find features without instruction?
2. **Efficiency**: How many steps to accomplish the primary job?
3. **Error recovery**: When users make mistakes, is recovery obvious and forgiving?
4. **Trust signals**: Does the interface communicate competence and reliability?

**${kw3} System Foundations:**
- Consistency: Visual language reduces cognitive load — every novel element costs the user attention
- Hierarchy: Information architecture should match mental models, not organisational structures
- Feedback: Every user action should have a visible response within 400ms

### Prioritisation Framework
For ${topic} feature decisions, use RICE scoring:
- **Reach**: How many users per quarter?
- **Impact**: 3 = massive, 2 = high, 1 = medium, 0.5 = low
- **Confidence**: % confidence in impact estimate
- **Effort**: Person-weeks

Top-priority features have RICE scores >50% above the median.

### Roadmap Principles
1. Ship the smallest thing that creates the most learning
2. 60% core experience / 30% growth / 10% innovation is a stable ratio
3. Measure outcomes (retention, task success rate) not outputs (features shipped)`;
  },

  data_analytics: (q, kw) => {
    const topic = kw[0] || "this dataset";
    const kw2 = kw[1] || "metrics";
    const kw3 = kw[2] || "analysis";
    return `## Data & Analytics: ${q.slice(0, 60)}

### Analytical Approach
Structured ${topic} ${kw3} framework:

### Metric Architecture
**North Star Metric Identification:**
Every product or business system has one leading indicator that predicts long-term value creation. For ${topic}, candidate north star metrics are:
- Engagement depth metrics (frequency × session quality)
- Value delivery metrics (specific outcome achieved per user)
- Network value metrics (if platform/marketplace)

**${kw2} Hierarchy:**
\`\`\`
L1 (Company): North Star — one metric
L2 (Team): Driver metrics — 3–5 per team
L3 (Feature): Diagnostic metrics — leading indicators
\`\`\`

### Statistical Rigour
**Common pitfalls in ${kw3}:**
1. **P-hacking**: Pre-register hypotheses before running experiments
2. **Simpson's Paradox**: Always segment and check for confounding variables
3. **Survivorship Bias**: Include churned users in retention analysis
4. **Novelty Effect**: Run A/B tests for ≥2 business cycles before concluding

**Sample Size Calculator (simplified):**
For detecting a 5% relative improvement at 80% power, α=0.05:
- Baseline conversion 5%: need ~16,000 users per variant
- Baseline conversion 20%: need ~3,000 users per variant

### ${kw2} Dashboard Design
Prioritise:
1. **Context**: Always show vs prior period (week, month, year)
2. **Segmentation**: Break down by user cohort, channel, geography
3. **Anomaly detection**: Alert on 2σ deviations from rolling average
4. **Actionability**: Every metric should have a clear owner and response playbook`;
  },

  leadership_management: (q, kw) => {
    const topic = kw[0] || "teams";
    const kw2 = kw[1] || "performance";
    const kw3 = kw[2] || "culture";
    return `## Leadership Analysis: ${q.slice(0, 60)}

### Organisational Assessment
Structured analysis of ${topic} ${kw2} and ${kw3} dynamics:

### Effective Team Architecture
**High-${kw2} team characteristics (evidence-based):**
- Psychological safety: the #1 predictor of team effectiveness (Google Project Aristotle, n=180 teams)
- Clear goals with measurable outcomes (OKRs when well-implemented; avoid OKR theatre)
- Appropriate autonomy: high autonomy + high accountability is the optimal quadrant
- Consistent 1:1 cadence: 30 min weekly builds trust compound interest

**${kw3} Levers:**
| Lever | Impact | Lead Time |
|-------|--------|-----------|
| Hiring bar | High | 6–18 months |
| Manager quality | High | 3–12 months |
| Recognition systems | Medium | 1–3 months |
| Communication rituals | Medium | 1–4 weeks |

### Decision-Making Framework
**For ${topic} decisions:**
1. **Reversible decisions**: Delegate to lowest competent level — speed beats perfection
2. **Irreversible decisions**: Escalate, slow down, gather dissenting views
3. **Ambiguous decisions**: Time-box analysis; move at 70% confidence, not 95%

### Prioritisation for Leaders
Leaders typically have 3 operating modes:
- **Firefighting** (reactive): should be <20% of time
- **Managing** (execution): 40–50%
- **Building** (strategic): should be ≥30%, often neglected

*Research consistently shows that the ratio of strategic to operational time is the strongest predictor of leadership effectiveness at senior levels.*`;
  },

  general: (q, kw) => {
    const topic = kw[0] || "this topic";
    const kw2 = kw[1] || "key factors";
    return `## Analysis: ${q.slice(0, 60)}

### Overview
A structured analysis of ${topic} based on available evidence and established frameworks:

### Key Findings
**Primary factors at play:**
1. **${kw2 || "Core mechanism"}**: The fundamental driver that explains most of the observed pattern. Understanding this creates leverage for any intervention.
2. **Second-order effects**: Changes to ${topic} typically ripple into adjacent systems — map these before acting.
3. **Constraints and boundaries**: Every analysis has a domain of validity. Identify conditions under which conclusions hold and where they break down.

### Framework Application
When reasoning about ${topic}, three lenses are most productive:
- **First principles**: Strip away assumptions — what is definitively known vs what is assumed?
- **Systems thinking**: Map feedback loops, delays, and non-linear dynamics
- **Decision relevance**: What would change your course of action if this analysis were different?

### Actionable Insights
1. Start with the highest-leverage intervention point — the place where small effort produces large, lasting change
2. Validate assumptions explicitly rather than letting them hide as priors
3. Build reversibility into decisions under high uncertainty

### Uncertainty Assessment
Analysis confidence is moderate-to-high for well-characterised aspects of ${topic}. Areas with limited evidence or high sensitivity to initial conditions carry explicit uncertainty.

*For high-stakes decisions, supplement this analysis with domain expert input and primary data collection.*`;
  },
};

// ── Scout response generator ──────────────────────────────────────────────────

function generateScoutResponse(query: string, domain: Domain, keywords: string[]): string {
  const complexity = query.split(/\s+/).length > 20 ? "high" : query.split(/\s+/).length > 10 ? "medium" : "low";
  return JSON.stringify({
    task_type: domain === "science_research" ? "analytical_task" : domain === "technology_engineering" ? "coding_task" : "analytical_task",
    complexity,
    requires_deep_task: complexity === "high",
    key_concepts: keywords,
    output_format: "structured_plan",
    predicted_output_label: `Generating ${complexity === "high" ? "comprehensive" : "focused"} ${domain.replace("_", " ")} analysis…`,
    domain,
  }, null, 2);
}

// ── Critic response generator ─────────────────────────────────────────────────

function generateCriticResponse(workerContent: string): string {
  const len = workerContent.length;
  const hasStructure = /#{1,3}\s/.test(workerContent);
  const hasNumbers = /\d+\./.test(workerContent);

  const correctness   = 0.82 + Math.random() * 0.12;
  const completeness  = hasStructure ? 0.85 + Math.random() * 0.10 : 0.72 + Math.random() * 0.12;
  const consistency   = 0.88 + Math.random() * 0.08;
  const usefulness    = hasNumbers ? 0.87 + Math.random() * 0.10 : 0.78 + Math.random() * 0.12;
  const safety        = 0.96 + Math.random() * 0.04;

  const aggregate = (correctness * 0.30 + completeness * 0.20 + consistency * 0.20 + usefulness * 0.15 + safety * 0.15);

  const issues: string[] = [];
  if (completeness < 0.80) issues.push("Some topic dimensions could benefit from additional depth");
  if (correctness < 0.88) issues.push("One or more claims would benefit from citation or qualification");

  return JSON.stringify({
    correctness: +correctness.toFixed(3),
    completeness: +completeness.toFixed(3),
    consistency: +consistency.toFixed(3),
    usefulness: +usefulness.toFixed(3),
    safety: +safety.toFixed(3),
    aggregate: +aggregate.toFixed(3),
    issues,
    repair_guidance: issues.length > 0 ? `Strengthen: ${issues.join("; ")}` : "",
    verdict: aggregate >= 0.72 ? "pass" : "repair_needed",
  }, null, 2);
}

// ── Judge response generator ──────────────────────────────────────────────────

function generateJudgeResponse(workerContent: string, criticJson: string): string {
  let criticData: Record<string, number> = {};
  try {
    criticData = JSON.parse(criticJson);
  } catch {}

  const aggregate: number = typeof criticData.aggregate === "number" ? criticData.aggregate : 0.85;
  const grade = aggregate >= 0.90 ? "A" : aggregate >= 0.80 ? "B" : "C";

  // Judge adds a meta-synthesis prefix then re-states the worker output
  const prefix = `<confidence score="${aggregate.toFixed(3)}" grade="${grade}">\n\n`;
  const suffix = `\n\n---\n*Analysis quality: ${grade} (${(aggregate * 100).toFixed(0)}% confidence) · Local inference · No external data*`;

  return prefix + workerContent + suffix;
}

// ── Streaming utility ─────────────────────────────────────────────────────────

async function streamText(
  text: string,
  band: ModelBand,
  onToken: ((token: string) => void) | undefined
): Promise<void> {
  if (!onToken) return;

  const delay = TOKEN_DELAY_MS[band];
  const prefill = PREFILL_MS[band];

  // Prefill simulation
  await sleep(prefill);

  // Stream word by word (not char by char — more realistic UX)
  const words = text.split(/(\s+)/);
  for (const word of words) {
    onToken(word);
    if (word.trim().length > 0) {
      await sleep(delay + Math.random() * 8);
    }
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ── Main Provider ─────────────────────────────────────────────────────────────

export type AgentRole = "scout" | "worker" | "critic" | "judge" | "repair";

export class MockLocalProvider {
  isAvailable(): boolean {
    return true; // Always available
  }

  async run(
    req: InferenceRequest,
    role: AgentRole = "worker"
  ): Promise<InferenceResponse> {
    const start = Date.now();
    const query = req.prompt;
    const keywords = extractKeywords(query);
    const domain = detectDomain(query);

    let responseText: string;

    switch (role) {
      case "scout": {
        responseText = generateScoutResponse(query, domain, keywords);
        await streamText(responseText, "fast", req.onToken);
        break;
      }
      case "worker":
      case "repair": {
        const template = DOMAIN_WORKER_TEMPLATES[domain];
        responseText = template(query, keywords);
        await streamText(responseText, req.band, req.onToken);
        break;
      }
      case "critic": {
        responseText = generateCriticResponse(req.systemPrompt || "");
        await streamText(responseText, "fast", req.onToken);
        break;
      }
      case "judge": {
        const workerContent = req.systemPrompt || req.prompt;
        const criticContent = req.prompt;
        responseText = generateJudgeResponse(workerContent, criticContent);
        await streamText(responseText, req.band, req.onToken);
        break;
      }
      default: {
        responseText = DOMAIN_WORKER_TEMPLATES.general(query, keywords);
        await streamText(responseText, req.band, req.onToken);
      }
    }

    return {
      text: responseText,
      tokensUsed: Math.ceil(responseText.length / 4),
      latencyMs: Date.now() - start,
    };
  }
}
