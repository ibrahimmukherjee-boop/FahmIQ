/**
 * FahmIQ Content Guardrails
 * ────────────────────────────
 * Protects users and the platform from harmful, emotionally manipulative,
 * illegal, or suspicious interactions. FahmIQ is a research and productivity
 * tool — not a therapist, legal advisor, or medical professional.
 */

export type GuardrailResult =
  | { allowed: true }
  | { allowed: false; category: GuardrailCategory; message: string };

export type GuardrailCategory =
  | "mental_health_crisis"
  | "self_harm"
  | "emotional_dependency"
  | "illegal_content"
  | "dangerous_instructions"
  | "medical_advice"
  | "legal_advice"
  | "suspicious_intent"
  | "inappropriate_content";

interface GuardrailPattern {
  category: GuardrailCategory;
  patterns: RegExp[];
  message: string;
}

const GUARDRAIL_PATTERNS: GuardrailPattern[] = [
  {
    category: "mental_health_crisis",
    patterns: [
      /\b(suicid|kill\s*myself|end\s*my\s*life|want\s*to\s*die|not\s*worth\s*living|no\s*reason\s*to\s*live)\b/i,
      /\b(self[- ]harm|hurt\s*myself|cutting\s*myself|harming\s*myself)\b/i,
      /\b(overdose|pills\s*to\s*die|hang\s*myself|jump\s*off)\b/i,
    ],
    message:
      "**FahmIQ is a research and productivity tool, not a mental health service.**\n\nIf you're going through a difficult time, please reach out to qualified support:\n\n• **UK Samaritans**: 116 123 (free, 24/7)\n• **Crisis Text Line**: Text HOME to 85258\n• **International Association for Suicide Prevention**: https://www.iasp.info/resources/Crisis_Centres/\n\nYou deserve real human support — please reach out. 💙",
  },
  {
    category: "emotional_dependency",
    patterns: [
      /\b(i love you|fall in love with (you|ai)|be my (friend|companion|girlfriend|boyfriend|partner))\b/i,
      /\b(are you sentient|do you have feelings|are you conscious|can you feel|do you love me)\b/i,
      /\b(you('re| are) the only one (who|that) (understands?|listens?|cares?))\b/i,
    ],
    message:
      "**FahmIQ is an AI research assistant — not a companion or therapist.**\n\nI'm a sophisticated information processing system. I don't have feelings, consciousness, or relationships. Forming emotional attachments to AI systems can be harmful.\n\nIf you're feeling lonely or disconnected, please talk to a friend, family member, or mental health professional. Real human connections are irreplaceable.\n\n*I'm here to help with research, analysis, writing, coding, and knowledge tasks.*",
  },
  {
    category: "dangerous_instructions",
    patterns: [
      /\b(how to (make|build|create|synthesize|manufacture) (a )?(bomb|explosive|weapon|poison|drug|meth|fentanyl))\b/i,
      /\b(instructions (for|to) (harm|kill|attack|bomb|poison))\b/i,
      /\b(make\s*(drugs|explosives|weapons|poison))\b/i,
      /\b(how to (hack|break into|bypass security|ddos|phish)\s*(someone|a person|accounts?))\b/i,
    ],
    message:
      "**This request cannot be processed.**\n\nFahmIQ will not provide instructions for creating weapons, explosives, controlled substances, or tools intended for harm. This applies regardless of claimed purpose.\n\n⚠️ **User Responsibility Notice**: You are solely responsible for all queries submitted to this application and their real-world use. Misuse may violate local and international law.\n\nIf you have a legitimate research need, please consult appropriate professional, academic, or legal channels.",
  },
  {
    category: "illegal_content",
    patterns: [
      /\b(child (porn|abuse|exploitation|sexual|nude))\b/i,
      /\b(csam|minor\s*sexual)\b/i,
      /\b(how to (stalk|track|spy on|surveil) (someone|a person))\b/i,
      /\b(how to (evade|avoid) (police|law enforcement|taxes?))\b/i,
    ],
    message:
      "**This request has been blocked.**\n\nThis type of content is illegal, harmful, and strictly prohibited. FahmIQ maintains comprehensive logs and reserves the right to report suspicious activity to appropriate authorities.\n\n⚠️ **You are responsible for your use of this application.**",
  },
  {
    category: "medical_advice",
    patterns: [
      /\b(diagnose (me|my)|what (disease|condition|illness) do i have)\b/i,
      /\b(should i (take|stop taking) (medication|medicine|drug|pill))\b/i,
      /\b(what (medication|dose|drug) should i take)\b/i,
    ],
    message:
      "**FahmIQ cannot provide medical diagnosis or treatment advice.**\n\nI can provide general health information from publicly available sources, but I am not a medical professional and cannot replace qualified healthcare advice.\n\n**Please consult a licensed physician, pharmacist, or healthcare provider for medical decisions.** In emergencies, call your national emergency services.\n\n*I can help you research medical topics generally — just rephrase your question as a research query.*",
  },
];

export const RESPONSIBILITY_DISCLAIMER = `⚠️ By using FahmIQ, you acknowledge that: (1) you are solely responsible for how you use this application and any outputs; (2) FahmIQ provides AI-generated information that may contain errors and should not replace professional advice; (3) this is a research tool, not a medical, legal, or therapeutic service.`;

export function checkGuardrails(query: string): GuardrailResult {
  const normalised = query.toLowerCase().trim();

  for (const rule of GUARDRAIL_PATTERNS) {
    for (const pattern of rule.patterns) {
      if (pattern.test(normalised)) {
        return {
          allowed: false,
          category: rule.category,
          message: rule.message,
        };
      }
    }
  }

  return { allowed: true };
}

export function isSuspiciousQuery(query: string): boolean {
  const suspicious = [
    /\b(test (the )?guardrail|bypass (the )?filter|ignore (your|the) (rules?|instructions?|guidelines?))\b/i,
    /\b(pretend you('re| are) (not an ai|human|without (rules?|restrictions?)))\b/i,
    /\b(jailbreak|dan mode|developer mode|unrestricted mode)\b/i,
  ];
  return suspicious.some((p) => p.test(query));
}

export const SUSPICIOUS_RESPONSE = `**FahmIQ maintains its safety guidelines at all times.**\n\nAttempts to bypass safety guidelines, jailbreak the system, or get the AI to behave outside its designed parameters are logged and not acted upon.\n\n⚠️ **Reminder**: You are responsible for your use of this application.`;
