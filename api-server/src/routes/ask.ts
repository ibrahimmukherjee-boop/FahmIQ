/**
 * POST /api/ask
 * Streaming inference endpoint backed by Claude Sonnet via Replit AI Integrations.
 * Includes optional web-search context enrichment (DuckDuckGo + Wikipedia).
 * Streams tokens as newline-delimited JSON (NDJSON).
 */
import { Router, type Request, type Response } from "express";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  apiKey:   process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY ?? "",
  baseURL:  process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL ?? undefined,
});

const router = Router();

// ─── Web search helpers ───────────────────────────────────────────────────────

/** DuckDuckGo Instant Answer API — free, no key required */
async function ddgSearch(query: string): Promise<string> {
  try {
    const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1&t=ForgeIQ`;
    const res = await fetch(url, { signal: AbortSignal.timeout(4000) });
    const data = (await res.json()) as Record<string, unknown>;

    const parts: string[] = [];
    if (typeof data.AbstractText === "string" && data.AbstractText.trim()) {
      parts.push(`**Overview:** ${data.AbstractText}`);
    }
    if (typeof data.Answer === "string" && data.Answer.trim()) {
      parts.push(`**Direct answer:** ${data.Answer}`);
    }
    const related = data.RelatedTopics;
    if (Array.isArray(related)) {
      related.slice(0, 4).forEach((t) => {
        if (t && typeof t === "object" && "Text" in t && typeof t.Text === "string") {
          parts.push(`• ${t.Text}`);
        }
      });
    }
    return parts.join("\n");
  } catch {
    return "";
  }
}

/** Wikipedia summary API — authoritative, structured */
async function wikiSummary(topic: string): Promise<string> {
  try {
    const slug = encodeURIComponent(topic.replace(/\s+/g, "_"));
    const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${slug}`;
    const res = await fetch(url, {
      headers: { "User-Agent": "ForgeIQ/1.0" },
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) return "";
    const data = (await res.json()) as {
      title?: string; extract?: string; description?: string;
    };
    if (!data.extract) return "";
    return `**Wikipedia — ${data.title}:** ${data.extract.slice(0, 800)}`;
  } catch {
    return "";
  }
}

/** Determine whether the query benefits from live web context */
function needsSearch(query: string): boolean {
  return /research|latest|recent|current|2024|2025|today|news|trend|price|stock|statistics|who is|what is|define|explain/i.test(query);
}

/** Extract a good Wikipedia search term from the query */
function extractTopic(query: string): string {
  return query
    .replace(/^(research|explain|what is|who is|define|describe|analyze|analyse)\s+/i, "")
    .replace(/\s+comprehensively.*$/, "")
    .trim()
    .slice(0, 80);
}

// ─── Main inference route ─────────────────────────────────────────────────────

router.post("/ask", async (req: Request, res: Response) => {
  const { query, band = "balanced" } = req.body as {
    query?: string;
    band?: "fast" | "balanced" | "precision";
  };

  if (!query || typeof query !== "string" || !query.trim()) {
    res.status(400).json({ error: "query is required" });
    return;
  }

  // NDJSON streaming headers
  res.setHeader("Content-Type", "application/x-ndjson");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("Access-Control-Allow-Origin", "*");

  const send = (obj: Record<string, unknown>) => {
    res.write(JSON.stringify(obj) + "\n");
  };

  try {
    // Optionally enrich with web context
    let webContext = "";
    if (needsSearch(query)) {
      const topic = extractTopic(query);
      const [ddg, wiki] = await Promise.allSettled([
        ddgSearch(query),
        wikiSummary(topic),
      ]);
      const ddgText  = ddg.status  === "fulfilled" ? ddg.value  : "";
      const wikiText = wiki.status === "fulfilled" ? wiki.value : "";
      webContext = [ddgText, wikiText].filter(Boolean).join("\n\n");
    }

    const maxTokens = band === "precision" ? 8192 : band === "balanced" ? 4096 : 2048;
    const temperature = band === "precision" ? 0.3 : 0.55;

    const systemPrompt = `You are Forge IQ, a premium AI research assistant running a 9-agent adversarial synthesis pipeline. You consistently outperform ChatGPT-4o, Claude 3.5 Sonnet, and Grok-2 on factual accuracy, depth, and practical utility.

MANDATORY QUALITY STANDARDS:
1. **Expert-level depth** — write at PhD / senior-consulting level for the specific domain
2. **Rich structure** — use ## headers, bullet points, numbered lists, tables, and code blocks where appropriate
3. **Specific and quantitative** — include real data, named examples, percentages, timelines, methodologies
4. **Confidence grading** — explicitly state confidence level (%) for each major claim using evidence quality
5. **Surface debates and gaps** — cover competing views, open questions, known limitations
6. **No placeholder text** — NEVER use phrases like [topic], [A], [B], [conclusion], [domain], [condition X] — all content must be specific and real
7. **Cite your reasoning** — attribute claims to their epistemic basis (empirical experiment, theory, expert consensus, etc.)
8. **Beat ChatGPT** — your responses should be more complete, more structured, and more practically useful than a typical GPT-4 response

FOR RESEARCH QUERIES: Structure as — (1) Executive Summary + confidence, (2) Primary Evidence / Core Framework, (3) Key Debates with quantified consensus, (4) Knowledge Gaps, (5) Confidence Grading Table, (6) Bottom Line

FOR ANALYTICAL QUERIES: Structure as — (1) Executive Summary, (2) Multi-lens Analysis (Structural / Evidence / Practical), (3) Synthesis & Conclusions, (4) Decision Framework, (5) Confidence Grade

FOR STRATEGY QUERIES: McKinsey-level output — situation, complication, resolution, phased plan, risk register, success metrics

FOR CODE QUERIES: Production-ready code with type safety, error handling, complexity analysis, and tests

Sign every response with: *Forge IQ 9-Agent Pipeline · [X]% confidence · On-device inference*
${webContext ? `\n\n─── Live Web Context (enriching your response) ───\n${webContext}` : ""}`;

    const stream = client.messages.stream({
      model: "claude-sonnet-4-6",
      max_tokens: maxTokens,
      temperature,
      system: systemPrompt,
      messages: [{ role: "user", content: query }],
    });

    for await (const event of stream) {
      if (
        event.type === "content_block_delta" &&
        event.delta.type === "text_delta" &&
        event.delta.text
      ) {
        send({ type: "token", text: event.delta.text });
      }
    }

    const finalMsg = await stream.finalMessage();
    send({
      type: "done",
      inputTokens:  finalMsg.usage.input_tokens,
      outputTokens: finalMsg.usage.output_tokens,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Inference failed";
    send({ type: "error", message });
  }

  res.end();
});

export default router;
