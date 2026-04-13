/**
 * SpreadingActivation — FahmIQ v2
 * ─────────────────────────────────────────────────────────────────────────────
 * Expands user query into a broader semantic concept set.
 * Inspired by Collins & Loftus (1975) Semantic Network theory.
 *
 * No LLM calls — uses an embedded local vocabulary map.
 * Output is prepended to Worker context to improve depth and coverage.
 */

type DomainKey =
  | "strategy_business"
  | "technology_engineering"
  | "science_research"
  | "finance_economics"
  | "product_design"
  | "data_analytics"
  | "leadership_management"
  | "creative_writing";

interface ConceptNode {
  related: string[];
  domain: DomainKey;
  weight: number; // 0–1 relevance weight
}

// ── Core semantic vocabulary map ──────────────────────────────────────────────
const CONCEPT_MAP: Record<string, ConceptNode> = {
  // Strategy / Business
  strategy:        { related: ["competitive advantage", "market positioning", "value chain", "SWOT", "OKRs", "execution"], domain: "strategy_business", weight: 0.9 },
  market:          { related: ["market share", "total addressable market", "segmentation", "competition", "demand", "pricing"], domain: "strategy_business", weight: 0.8 },
  revenue:         { related: ["ARR", "MRR", "monetisation", "pricing strategy", "customer lifetime value", "churn"], domain: "finance_economics", weight: 0.85 },
  growth:          { related: ["acquisition", "retention", "viral coefficient", "product-market fit", "scaling", "go-to-market"], domain: "strategy_business", weight: 0.8 },
  customer:        { related: ["user journey", "personas", "NPS", "churn prevention", "engagement", "loyalty"], domain: "product_design", weight: 0.75 },
  product:         { related: ["roadmap", "feature prioritisation", "MVP", "UX", "iteration", "product-market fit"], domain: "product_design", weight: 0.8 },
  startup:         { related: ["funding", "runway", "burn rate", "equity", "traction", "pivot", "founder"], domain: "strategy_business", weight: 0.85 },
  saas:            { related: ["subscription", "churn", "ARR", "customer success", "onboarding", "activation"], domain: "strategy_business", weight: 0.9 },

  // Technology / Engineering
  architecture:    { related: ["scalability", "microservices", "API design", "distributed systems", "fault tolerance", "latency"], domain: "technology_engineering", weight: 0.9 },
  performance:     { related: ["latency", "throughput", "caching", "optimisation", "profiling", "bottleneck"], domain: "technology_engineering", weight: 0.8 },
  security:        { related: ["authentication", "authorisation", "encryption", "vulnerabilities", "zero trust", "OWASP"], domain: "technology_engineering", weight: 0.85 },
  ai:              { related: ["machine learning", "neural networks", "inference", "training", "embeddings", "RAG", "fine-tuning"], domain: "technology_engineering", weight: 0.9 },
  "machine learning": { related: ["supervised learning", "model accuracy", "overfitting", "feature engineering", "deployment", "MLOps"], domain: "technology_engineering", weight: 0.9 },
  database:        { related: ["query optimisation", "indexing", "normalisation", "ACID", "NoSQL", "sharding", "replication"], domain: "technology_engineering", weight: 0.8 },
  api:             { related: ["REST", "GraphQL", "rate limiting", "versioning", "documentation", "webhooks"], domain: "technology_engineering", weight: 0.75 },
  cloud:           { related: ["serverless", "containers", "Kubernetes", "cost optimisation", "multi-region", "SLA"], domain: "technology_engineering", weight: 0.8 },
  agent:           { related: ["orchestration", "tool use", "reasoning", "planning", "memory", "multi-agent", "LLM"], domain: "technology_engineering", weight: 0.9 },

  // Science / Research
  research:        { related: ["methodology", "evidence synthesis", "peer review", "hypothesis", "replication", "citation"], domain: "science_research", weight: 0.9 },
  data:            { related: ["statistical significance", "sample size", "bias", "correlation", "regression", "visualisation"], domain: "data_analytics", weight: 0.85 },
  analysis:        { related: ["decomposition", "root cause", "causal inference", "benchmarking", "framework", "insight"], domain: "data_analytics", weight: 0.8 },
  quantum:         { related: ["superposition", "entanglement", "decoherence", "wave function", "qubits", "measurement"], domain: "science_research", weight: 0.9 },
  climate:         { related: ["carbon emissions", "net zero", "renewable energy", "IPCC", "adaptation", "mitigation"], domain: "science_research", weight: 0.85 },

  // Finance / Economics
  finance:         { related: ["valuation", "DCF", "risk", "portfolio", "liquidity", "capital allocation"], domain: "finance_economics", weight: 0.9 },
  investment:      { related: ["ROI", "IRR", "due diligence", "risk-adjusted return", "diversification", "asset allocation"], domain: "finance_economics", weight: 0.85 },
  economics:       { related: ["supply and demand", "elasticity", "monetary policy", "inflation", "GDP", "fiscal policy"], domain: "finance_economics", weight: 0.85 },

  // Product / Design
  design:          { related: ["user experience", "information architecture", "visual hierarchy", "accessibility", "design system"], domain: "product_design", weight: 0.8 },
  ux:              { related: ["usability", "user testing", "wireframes", "prototyping", "cognitive load", "affordance"], domain: "product_design", weight: 0.85 },

  // Leadership / Management
  leadership:      { related: ["decision-making", "culture", "team dynamics", "delegation", "accountability", "vision"], domain: "leadership_management", weight: 0.85 },
  management:      { related: ["project management", "OKRs", "performance", "hiring", "communication", "prioritisation"], domain: "leadership_management", weight: 0.8 },
};

export interface ActivationResult {
  activatedConcepts: string[];
  detectedDomain: DomainKey | "general";
  expansionTokens: number;
  contextFragment: string;
}

/**
 * Extracts tokens from a query, normalised to lowercase.
 */
function extractTokens(query: string): string[] {
  return query.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 2);
}

/**
 * Scores each token against the concept map and spreads activation
 * to related concepts (one hop).
 */
export function spreadActivation(query: string): ActivationResult {
  const tokens = extractTokens(query);
  const activated = new Map<string, number>(); // concept → cumulative weight
  let dominantDomain: DomainKey | "general" = "general";
  let maxDomainScore = 0;
  const domainScores: Partial<Record<DomainKey | "general", number>> = {};

  for (const token of tokens) {
    // Direct hit
    const node = CONCEPT_MAP[token];
    if (node) {
      activated.set(token, (activated.get(token) || 0) + node.weight);
      // Spread to related (one hop, halved weight)
      for (const rel of node.related) {
        activated.set(rel, (activated.get(rel) || 0) + node.weight * 0.5);
      }
      domainScores[node.domain] = (domainScores[node.domain] || 0) + node.weight;
    }

    // Partial match
    for (const [concept, node2] of Object.entries(CONCEPT_MAP)) {
      if (concept.includes(token) || token.includes(concept.split(" ")[0])) {
        activated.set(concept, (activated.get(concept) || 0) + node2.weight * 0.4);
        domainScores[node2.domain] = (domainScores[node2.domain] || 0) + node2.weight * 0.3;
      }
    }
  }

  // Determine dominant domain
  for (const [domain, score] of Object.entries(domainScores)) {
    if ((score || 0) > maxDomainScore) {
      maxDomainScore = score || 0;
      dominantDomain = domain as DomainKey;
    }
  }

  // Sort by weight, take top-8
  const sorted = Array.from(activated.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([c]) => c);

  const contextFragment = sorted.length > 0
    ? `[Related concepts: ${sorted.join(", ")}]`
    : "";

  return {
    activatedConcepts: sorted,
    detectedDomain: dominantDomain,
    expansionTokens: sorted.join(" ").split(" ").length,
    contextFragment,
  };
}
