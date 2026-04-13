/**
 * GET /api/search?q=query
 * Privacy-respecting web search proxy for Forge IQ mobile app.
 * Combines DuckDuckGo Instant Answers + Wikipedia summaries.
 * No API key required — both services are free and open.
 */
import { Router, type Request, type Response } from "express";

const router = Router();

async function ddgSearch(query: string): Promise<{ title: string; snippet: string; url: string }[]> {
  try {
    const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1&t=ForgeIQ`;
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    const data = (await res.json()) as Record<string, unknown>;
    const results: { title: string; snippet: string; url: string }[] = [];

    if (typeof data.AbstractText === "string" && data.AbstractText.trim()) {
      results.push({
        title: typeof data.Heading === "string" ? data.Heading : "Overview",
        snippet: data.AbstractText,
        url: typeof data.AbstractURL === "string" ? data.AbstractURL : "",
      });
    }
    if (typeof data.Answer === "string" && data.Answer.trim()) {
      results.push({ title: "Direct Answer", snippet: data.Answer, url: "" });
    }

    const related = data.RelatedTopics;
    if (Array.isArray(related)) {
      for (const t of related.slice(0, 6)) {
        if (t && typeof t === "object" && "Text" in t && "FirstURL" in t) {
          const text = (t as Record<string, unknown>).Text;
          const firstUrl = (t as Record<string, unknown>).FirstURL;
          if (typeof text === "string" && text.trim()) {
            results.push({
              title: text.split(" — ")[0] || "Related",
              snippet: text,
              url: typeof firstUrl === "string" ? firstUrl : "",
            });
          }
        }
      }
    }
    return results;
  } catch {
    return [];
  }
}

async function wikiSummary(topic: string): Promise<{ title: string; snippet: string; url: string } | null> {
  try {
    const slug = encodeURIComponent(topic.replace(/\s+/g, "_"));
    const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${slug}`;
    const res = await fetch(url, {
      headers: { "User-Agent": "ForgeIQ/2.0 (contact@seekconsulting.co.uk)" },
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { title?: string; extract?: string; content_urls?: { desktop?: { page?: string } } };
    if (!data.extract) return null;
    return {
      title: `Wikipedia: ${data.title ?? topic}`,
      snippet: data.extract.slice(0, 1000),
      url: data.content_urls?.desktop?.page ?? `https://en.wikipedia.org/wiki/${slug}`,
    };
  } catch {
    return null;
  }
}

function extractMainTopic(query: string): string {
  return query
    .replace(/^(research|explain|what is|who is|define|describe|analyze|analyse|find|search for|tell me about)\s+/i, "")
    .replace(/\s+(comprehensively|in detail|thoroughly).*$/, "")
    .trim()
    .slice(0, 100);
}

router.get("/search", async (req: Request, res: Response) => {
  const { q } = req.query as { q?: string };

  if (!q || typeof q !== "string" || !q.trim()) {
    res.status(400).json({ error: "q parameter is required" });
    return;
  }

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "max-age=300");

  try {
    const topic = extractMainTopic(q);
    const [ddgResults, wikiResult] = await Promise.allSettled([
      ddgSearch(q),
      wikiSummary(topic),
    ]);

    const results = ddgResults.status === "fulfilled" ? ddgResults.value : [];
    const wiki = wikiResult.status === "fulfilled" ? wikiResult.value : null;

    if (wiki) {
      results.unshift(wiki);
    }

    const summary = results
      .slice(0, 6)
      .map((r) => `**${r.title}**\n${r.snippet}`)
      .join("\n\n");

    res.json({
      query: q,
      results: results.slice(0, 8),
      summary,
      sources: results.filter((r) => r.url).map((r) => r.url),
    });
  } catch (err) {
    res.status(500).json({ error: "Search failed", detail: String(err) });
  }
});

export default router;
