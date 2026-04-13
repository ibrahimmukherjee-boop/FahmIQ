/**
 * ClarifyingQuestions — FahmIQ v2
 * ─────────────────────────────────────────────────────────────────────────────
 * Detects ambiguous queries and generates targeted clarifying questions BEFORE
 * the expensive agent pipeline runs. Implements the "Autonomous loop" from the
 * architecture specification.
 *
 * No LLM calls — pure heuristic analysis.
 */

export interface ClarifyCheck {
  needsClarification: boolean;
  questions: string[];
  ambiguityReason: string;
}

interface AmbiguityPattern {
  reason: string;
  patterns: RegExp[];
  questions: string[];
}

const AMBIGUITY_RULES: AmbiguityPattern[] = [
  {
    reason: "missing_target_scope",
    patterns: [
      /^(analyse|analyze|research|explain|summarise|summarize|review|assess)\s+\w{1,25}$/i,
      /^(tell me about|what is|what are)\s+\w{1,30}$/i,
    ],
    questions: [
      "What specific aspect or angle interests you most?",
      "Are you looking for a high-level overview or a deep technical analysis?",
      "Is this for a specific context — academic research, business decision, or general curiosity?",
    ],
  },
  {
    reason: "missing_time_horizon",
    patterns: [
      /\b(strategy|plan|roadmap|forecast|predict)\b/i,
    ],
    questions: [
      "What time horizon should this cover — near-term (0–6 months), medium-term (1–2 years), or long-term (3–5 years)?",
      "Are there specific constraints or assumptions you'd like me to apply?",
    ],
  },
  {
    reason: "missing_audience_context",
    patterns: [
      /\b(write|draft|create|generate)\s+(a |an )?(report|summary|proposal|document|brief|memo|presentation)\b/i,
    ],
    questions: [
      "Who is the intended audience — technical experts, executives, general readers?",
      "What length and format would work best — bullet points, narrative prose, structured sections?",
    ],
  },
  {
    reason: "missing_comparison_target",
    patterns: [
      /\b(compare|versus|vs\.?|better than|pros (and|&) cons)\b/i,
    ],
    questions: [
      "What specific criteria matter most for this comparison — cost, performance, scalability, usability?",
      "From whose perspective should I compare — an individual, a startup, or a large enterprise?",
    ],
  },
  {
    reason: "vague_technical_request",
    patterns: [
      /^(build|create|design|architect|implement)\s+(a |an )?system\b/i,
      /\b(best (way|approach|method|practice)) to\b/i,
    ],
    questions: [
      "What are the key constraints — scale, budget, team size, existing tech stack?",
      "What does success look like for this? What's the core outcome you need?",
    ],
  },
];

/**
 * Short query heuristics — queries under 8 words that aren't clear tasks
 * often benefit from clarification.
 */
function isUnderspecified(query: string): boolean {
  const words = query.trim().split(/\s+/);
  if (words.length < 5) {
    const hasVerb = /\b(explain|research|analyse|analyze|build|write|design|create|compare|plan|forecast|summarise|summarize|review|assess|how|why|what|when|where|who)\b/i.test(query);
    return hasVerb; // Very short queries with action verbs but no context
  }
  return false;
}

/**
 * Checks if a query needs clarification.
 * Returns up to 2 targeted questions if ambiguous.
 */
export function checkClarification(query: string): ClarifyCheck {
  const q = query.trim();

  // Skip clarification for queries > 80 chars — user has provided enough context
  if (q.length > 80) {
    return { needsClarification: false, questions: [], ambiguityReason: "" };
  }

  for (const rule of AMBIGUITY_RULES) {
    for (const pattern of rule.patterns) {
      if (pattern.test(q)) {
        return {
          needsClarification: true,
          questions: rule.questions.slice(0, 2),
          ambiguityReason: rule.reason,
        };
      }
    }
  }

  if (isUnderspecified(q)) {
    return {
      needsClarification: true,
      questions: [
        "Could you give me a bit more context about what you're trying to accomplish?",
        "What's the core question or decision this should help answer?",
      ],
      ambiguityReason: "underspecified",
    };
  }

  return { needsClarification: false, questions: [], ambiguityReason: "" };
}

/**
 * Formats a clarification request into a user-facing message.
 */
export function formatClarifyMessage(check: ClarifyCheck): string {
  const intro = "To give you the most precise analysis, I have a quick question:";
  return `${intro}\n\n${check.questions.map((q, i) => `${i + 1}. ${q}`).join("\n")}\n\n*Or just send your query as-is and I'll make reasonable assumptions.*`;
}
