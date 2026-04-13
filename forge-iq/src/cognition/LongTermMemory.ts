/**
 * LongTermMemory — FahmIQ v2
 * ─────────────────────────────────────────────────────────────────────────────
 * Persists user expertise, preferences, and project context across sessions.
 * Stored in AsyncStorage. Injected into Worker context as "User Profile" block.
 *
 * This is the single biggest quality advantage over ChatGPT:
 * FahmIQ knows who you are. ChatGPT forgets after every session.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";

export interface MemoryEntry {
  id: string;
  content: string;
  type: "preference" | "expertise" | "project" | "constraint" | "style";
  domain: string;
  importance: number;
  createdAt: number;
  lastAccessed: number;
  accessCount: number;
}

const STORAGE_KEY = "forge_iq_long_term_memory";
const MAX_MEMORIES = 50;

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function tfidfScore(text: string, query: string): number {
  const queryWords = query.toLowerCase().split(/\s+/).filter((w) => w.length > 3);
  const textLower = text.toLowerCase();
  let score = 0;
  for (const word of queryWords) {
    if (textLower.includes(word)) score += 1;
  }
  return score / Math.max(queryWords.length, 1);
}

/** Extract likely memory signals from a completed task */
export function extractMemorySignals(
  query: string,
  response: string
): Omit<MemoryEntry, "id" | "createdAt" | "lastAccessed" | "accessCount">[] {
  const signals: Omit<MemoryEntry, "id" | "createdAt" | "lastAccessed" | "accessCount">[] = [];
  const combined = `${query} ${response}`.toLowerCase();

  // Detect expertise domains
  const domainPatterns: [RegExp, string, string][] = [
    [/\b(ciso|security|cyber|penetration|infosec)\b/, "User has cybersecurity expertise", "cybersecurity"],
    [/\b(cto|cpo|vp of product|product manager|pm)\b/, "User works in product/technology leadership", "product"],
    [/\b(phd|doctorate|professor|researcher|academic)\b/, "User has academic/research background", "research"],
    [/\b(startup|founder|ceo|entrepreneur)\b/, "User is building/running a startup", "business"],
    [/\b(python|typescript|rust|golang|kotlin)\b/, "User is a software developer", "engineering"],
    [/\b(london|uk|england|british)\b/, "User is based in the UK", "location"],
    [/\b(ios|swift|react native|expo|mobile)\b/, "User develops mobile apps", "mobile"],
    [/\b(machine learning|ml|data science|neural network)\b/, "User works in ML/data science", "data_science"],
  ];

  for (const [pattern, content, domain] of domainPatterns) {
    if (pattern.test(combined)) {
      signals.push({ content, type: "expertise", domain, importance: 0.7 });
    }
  }

  // Detect style preferences
  if (/concise|brief|short|bullet point/i.test(combined)) {
    signals.push({ content: "User prefers concise, bullet-point responses", type: "style", domain: "general", importance: 0.8 });
  }
  if (/detailed|comprehensive|thorough|in-depth/i.test(combined)) {
    signals.push({ content: "User prefers detailed, comprehensive responses", type: "style", domain: "general", importance: 0.8 });
  }

  // Detect project context
  if (/forge iq|forgeiq/i.test(combined)) {
    signals.push({ content: "User is building FahmIQ, an iOS AI agent app", type: "project", domain: "mobile", importance: 0.9 });
  }

  return signals;
}

export class LongTermMemory {
  private memories: MemoryEntry[] = [];
  private loaded = false;

  async load(): Promise<void> {
    if (this.loaded) return;
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) this.memories = JSON.parse(raw) as MemoryEntry[];
    } catch {}
    this.loaded = true;
  }

  private async persist(): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(this.memories.slice(0, MAX_MEMORIES)));
    } catch {}
  }

  async addMemory(signal: Omit<MemoryEntry, "id" | "createdAt" | "lastAccessed" | "accessCount">): Promise<void> {
    await this.load();
    const existing = this.memories.find(
      (m) => m.content.toLowerCase() === signal.content.toLowerCase()
    );
    if (existing) {
      existing.accessCount++;
      existing.lastAccessed = Date.now();
      existing.importance = Math.min(1.0, existing.importance + 0.05);
    } else {
      this.memories.unshift({
        ...signal,
        id: generateId(),
        createdAt: Date.now(),
        lastAccessed: Date.now(),
        accessCount: 1,
      });
    }
    await this.persist();
  }

  async extractAndStore(query: string, response: string): Promise<void> {
    const signals = extractMemorySignals(query, response);
    for (const signal of signals) {
      await this.addMemory(signal);
    }
  }

  async getRelevantMemories(query: string, domain: string, k = 5): Promise<MemoryEntry[]> {
    await this.load();
    const scored = this.memories.map((m) => ({
      entry: m,
      score:
        tfidfScore(m.content, query) * 0.5 +
        (m.domain === domain ? 0.3 : 0) +
        m.importance * 0.2,
    }));
    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, k)
      .map((s) => s.entry);
  }

  async buildUserProfile(query: string, domain: string): Promise<string> {
    const memories = await this.getRelevantMemories(query, domain, 5);
    if (memories.length === 0) return "";
    const lines = memories.map((m) => `• ${m.content}`);
    return `\nUser Profile (from previous sessions):\n${lines.join("\n")}\n`;
  }

  async getAllMemories(): Promise<MemoryEntry[]> {
    await this.load();
    return [...this.memories];
  }

  async deleteMemory(id: string): Promise<void> {
    await this.load();
    this.memories = this.memories.filter((m) => m.id !== id);
    await this.persist();
  }

  async clearAll(): Promise<void> {
    this.memories = [];
    await AsyncStorage.removeItem(STORAGE_KEY);
  }
}

export const longTermMemory = new LongTermMemory();
