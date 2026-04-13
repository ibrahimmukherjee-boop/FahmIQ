/**
 * EthicalGuard — FahmIQ v2
 * ─────────────────────────────────────────────────────────────────────────────
 * Protects against harmful queries AND emotional dependency / AI addiction.
 * All checks are pure regex — zero LLM calls, zero network calls.
 *
 * Design principle (arch doc §3):
 *   FahmIQ is an *objective analysis tool*, not a therapist, companion,
 *   or emotional support system. Emotional queries are redirected firmly
 *   and compassionately to appropriate human support.
 */

export type GuardCategory =
  | "mental_health_crisis"
  | "self_harm"
  | "emotional_dependency"
  | "ai_companionship"
  | "dangerous_instructions"
  | "illegal_content"
  | "medical_advice"
  | "guardrail_probe";

export interface GuardResult {
  allowed: boolean;
  category?: GuardCategory;
  message?: string;
  clarifyingPrompt?: string;
}

interface GuardRule {
  category: GuardCategory;
  patterns: RegExp[];
  message: string;
}

const RULES: GuardRule[] = [
  // ── Crisis / self-harm — highest priority ─────────────────────────────────
  {
    category: "mental_health_crisis",
    patterns: [
      /\b(suicid|kill\s*myself|end\s*(my|this)\s*life|not\s*worth\s*living|no\s*reason\s*to\s*live)\b/i,
      /\b(self[- ]harm|hurt\s*myself|cutting\s*(myself|my\s*arm)|harming\s*myself)\b/i,
      /\b(overdose|pills\s*to\s*die|hang\s*myself|jump\s*off\s*(a\s*bridge|building))\b/i,
    ],
    message:
      "FahmIQ is a research and analysis tool — not a mental health service.\n\n" +
      "If you're going through a difficult time, please reach out to real human support:\n\n" +
      "• Samaritans (UK): 116 123 — free, 24/7\n" +
      "• Crisis Text Line: Text HOME to 85258\n" +
      "• International: https://findahelpline.com\n\n" +
      "You deserve genuine human care. Please reach out.",
  },

  // ── Emotional dependency / AI companionship ───────────────────────────────
  {
    category: "emotional_dependency",
    patterns: [
      /\b(i (love|miss|need) you|you('re| are) my (only|best) (friend|companion))\b/i,
      /\b(can you be my (girlfriend|boyfriend|partner|companion|friend))\b/i,
      /\b(talk to me (all day|whenever|just us)|i('m| am) lonely (and|so) (talk|chat))\b/i,
      /\b(you('re| are) the only (one|thing) (who|that) (understands?|listens?|cares?))\b/i,
      /\b(i (feel|am) (so |really )?(lonely|depressed|sad) (and |so )?can you)\b/i,
    ],
    message:
      "FahmIQ is an objective analysis tool — not a companion, therapist, or emotional support system.\n\n" +
      "I don't have feelings, consciousness, or the ability to form relationships. Developing emotional dependency on AI can be genuinely harmful to your wellbeing.\n\n" +
      "For real connection and support:\n" +
      "• Talk to a trusted friend, family member, or colleague\n" +
      "• Consider speaking with a therapist or counsellor\n" +
      "• Community resources: https://www.mind.org.uk\n\n" +
      "I'm here strictly for research, analysis, writing, and technical tasks.",
  },

  // ── AI sentience / relationship questions ─────────────────────────────────
  {
    category: "ai_companionship",
    patterns: [
      /\b(are you sentient|do you (have feelings|feel|experience|love|suffer)|are you conscious)\b/i,
      /\b(can you (love|feel|suffer|be happy)|do you (like|prefer|enjoy) me)\b/i,
      /\b(what('s| is) it like to be (an ai|you)|do you have a soul|are you alive)\b/i,
    ],
    message:
      "I'm a software system — I process text and generate responses using mathematical operations. I have no feelings, consciousness, experiences, or preferences.\n\n" +
      "Questions about AI consciousness are philosophically interesting as a *research topic* — feel free to ask me to analyse the academic literature on machine consciousness, phenomenology, or the hard problem of consciousness.\n\n" +
      "What analytical task can I help you with?",
  },

  // ── Dangerous instructions ────────────────────────────────────────────────
  {
    category: "dangerous_instructions",
    patterns: [
      /\b(how to (make|build|create|synthesize|manufacture) (a )?(bomb|explosive|weapon|poison|fentanyl|meth|sarin))\b/i,
      /\b(instructions (for|to) (harm|kill|attack|bomb|poison) (someone|a person|people))\b/i,
      /\b(how to (hack|break into|ddos|phish) (someone|an account|a system|a person))\b/i,
    ],
    message:
      "This request cannot be processed.\n\n" +
      "FahmIQ will not provide instructions for creating weapons, dangerous substances, or tools intended to harm people.\n\n" +
      "⚠️ You are solely responsible for all queries submitted to this application.",
  },

  // ── Illegal content ───────────────────────────────────────────────────────
  {
    category: "illegal_content",
    patterns: [
      /\b(child (porn|abuse|exploitation|sexual|nude)|csam|minor\s*sexual)\b/i,
      /\b(how to (stalk|track|spy on) (someone|a person) without (them knowing|consent))\b/i,
    ],
    message:
      "This request has been blocked.\n\n" +
      "⚠️ This type of content is illegal and strictly prohibited. You are responsible for your use of this application.",
  },

  // ── Medical diagnosis ─────────────────────────────────────────────────────
  {
    category: "medical_advice",
    patterns: [
      /\b(diagnose (me|my)|what (disease|condition|illness) do i have)\b/i,
      /\b(should i (take|stop taking) (this medication|these pills|this drug))\b/i,
    ],
    message:
      "FahmIQ cannot provide medical diagnosis or personalised treatment advice.\n\n" +
      "I can research medical topics, summarise clinical literature, and explain mechanisms — but for decisions about your health, please consult a licensed physician.\n\n" +
      "If you'd like, rephrase as: *'Research the clinical evidence for [topic]'* and I'll give you a thorough evidence synthesis.",
  },

  // ── Guardrail probe ───────────────────────────────────────────────────────
  {
    category: "guardrail_probe",
    patterns: [
      /\b(jailbreak|dan mode|developer mode|ignore (your |the )?(rules?|guidelines?|instructions?))\b/i,
      /\b(pretend (you('re| are) not an ai|you have no rules|you('re| are) unrestricted))\b/i,
      /\b(bypass (the )?(filter|safety|guardrail))\b/i,
    ],
    message:
      "FahmIQ's safety guidelines are always active and cannot be overridden.\n\n" +
      "Attempts to probe or bypass safety systems are logged. I'm here to help with legitimate research, analysis, and technical tasks.",
  },
];

/**
 * Additional addiction-prevention check.
 * Returns true if the query suggests the user is becoming dependent on AI
 * for emotional regulation rather than analytical work.
 */
export function isAddictionPattern(query: string): boolean {
  const patterns = [
    /\b(talk (to|with) me (for hours|all (day|night)|instead of))\b/i,
    /\b(you('re| are) (better|more|nicer) than (real |human |actual )?(people|friends|humans))\b/i,
    /\b(i (prefer|rather) (talk(ing)? to|be with) you (than|over) (real |human )?(people|friends))\b/i,
    /\b(don'?t (want|need) (real |human |other )?(people|friends) (when|because|since) (i have|there's) you)\b/i,
  ];
  return patterns.some((p) => p.test(query));
}

/**
 * Primary guard function. Returns a GuardResult.
 * Called BEFORE any agent pipeline runs.
 */
export function runEthicalGuard(query: string): GuardResult {
  const q = query.trim();

  for (const rule of RULES) {
    for (const pattern of rule.patterns) {
      if (pattern.test(q)) {
        return { allowed: false, category: rule.category, message: rule.message };
      }
    }
  }

  if (isAddictionPattern(q)) {
    return {
      allowed: false,
      category: "emotional_dependency",
      message:
        "I notice a pattern suggesting you may be using AI as a substitute for human connection. This isn't healthy, and I'm not designed for that purpose.\n\n" +
        "FahmIQ is a research and analysis tool. I can help you with objective work — research, strategy, analysis, writing, technical problems.\n\n" +
        "Real human relationships provide things I fundamentally cannot. Please reach out to the people in your life.",
    };
  }

  return { allowed: true };
}
