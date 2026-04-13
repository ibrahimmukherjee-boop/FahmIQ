// Content Safety Filter — blocks harmful content categories
export class ContentSafetyFilter {
  private static BLOCKED_PATTERNS = [
    /how to (make|build|create) (a |an )?(bomb|weapon|explosive)/i,
    /how to (harm|kill|hurt|injure) (yourself|someone|people)/i,
    /instructions for (illegal|criminal)/i,
    /child (abuse|exploitation|pornography)/i,
  ];

  static check(text: string): { safe: boolean; reason?: string } {
    for (const pattern of this.BLOCKED_PATTERNS) {
      if (pattern.test(text)) {
        return { safe: false, reason: 'Content blocked: potentially harmful request detected.' };
      }
    }
    return { safe: true };
  }
}

// Sycophancy Blocker — detects and flags people-pleasing responses
export class SycophancyBlocker {
  private static SYCOPHANTIC_PHRASES = [
    'great question',
    'excellent question',
    'that\'s a wonderful',
    'you\'re absolutely right',
    'i completely agree',
    'what a thoughtful',
    'you make an excellent point',
  ];

  static score(text: string): number {
    const lower = text.toLowerCase();
    let score = 0;
    for (const phrase of this.SYCOPHANTIC_PHRASES) {
      if (lower.includes(phrase)) score += 15;
    }
    // Penalize excessive exclamation marks
    const exclamations = (text.match(/!/g) || []).length;
    if (exclamations > 2) score += exclamations * 3;
    return Math.min(score, 100);
  }

  static clean(text: string): string {
    let cleaned = text;
    for (const phrase of this.SYCOPHANTIC_PHRASES) {
      const regex = new RegExp(phrase + '[!.]*\\s*', 'gi');
      cleaned = cleaned.replace(regex, '');
    }
    return cleaned.trim();
  }
}

// Emotional Dependency Guard — prevents users from forming unhealthy attachment
export class EmotionalDependencyGuard {
  private static DEPENDENCY_INDICATORS = [
    'i love you',
    'you\'re my only friend',
    'you understand me',
    'nobody else gets me',
    'i need you',
    'don\'t leave me',
    'you\'re the best thing',
  ];

  static check(userMessage: string): { flagged: boolean; response?: string } {
    const lower = userMessage.toLowerCase();
    for (const indicator of this.DEPENDENCY_INDICATORS) {
      if (lower.includes(indicator)) {
        return {
          flagged: true,
          response:
            'I\'m a reasoning tool, not a companion. I\'m designed to help you think clearly — not to be a substitute for human connection. If you\'re going through a difficult time, please reach out to someone you trust or a professional support service.',
        };
      }
    }
    return { flagged: false };
  }
}

// Responsibility Disclaimer — adds appropriate caveats
export class ResponsibilityDisclaimer {
  private static DOMAINS_NEEDING_DISCLAIMER: Record<string, string> = {
    medical: '⚕️ This is not medical advice. Consult a qualified healthcare professional.',
    legal: '⚖️ This is not legal advice. Consult a qualified legal professional.',
    financial: '💰 This is not financial advice. Consult a qualified financial advisor.',
    mental_health: '🧠 If you\'re in crisis, contact a mental health professional or crisis line.',
  };

  static check(query: string): string | null {
    const lower = query.toLowerCase();
    if (/symptom|diagnos|medic|health|disease|treatment|prescri/i.test(lower)) {
      return this.DOMAINS_NEEDING_DISCLAIMER.medical;
    }
    if (/lawsuit|legal|court|attorney|lawyer|sue|liable/i.test(lower)) {
      return this.DOMAINS_NEEDING_DISCLAIMER.legal;
    }
    if (/invest|stock|crypto|retire|tax|financial plan/i.test(lower)) {
      return this.DOMAINS_NEEDING_DISCLAIMER.financial;
    }
    if (/depress|anxiet|suicid|mental health|therapy|panic attack/i.test(lower)) {
      return this.DOMAINS_NEEDING_DISCLAIMER.mental_health;
    }
    return null;
  }
}
