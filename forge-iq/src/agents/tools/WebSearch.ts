/**
 * WebSearch — FahmIQ v2
 * ─────────────────────────────────────────────────────────────────────────────
 * Proxies search through the FahmIQ API server, which calls DuckDuckGo
 * and Wikipedia with no API key required.
 *
 * The server proxy avoids mobile CORS issues and keeps queries off public
 * search logs (server User-Agent identifies as ForgeIQ, not the user's device).
 */

const REPL_DOMAIN =
  typeof process !== "undefined" && process.env.EXPO_PUBLIC_DOMAIN
    ? process.env.EXPO_PUBLIC_DOMAIN
    : "";

const API_BASE = REPL_DOMAIN
  ? `https://${REPL_DOMAIN}/api`
  : (typeof process !== "undefined" && process.env.EXPO_PUBLIC_API_URL
      ? process.env.EXPO_PUBLIC_API_URL
      : "http://localhost:3000/api");

export interface SearchResult {
  title: string;
  snippet: string;
  url: string;
}

export interface SearchResponse {
  query: string;
  results: SearchResult[];
  summary: string;
  sources: string[];
}

export async function webSearch(query: string): Promise<SearchResponse | null> {
  try {
    const url = `${API_BASE}/search?q=${encodeURIComponent(query)}`;
    const res = await fetch(url, {
      signal: AbortSignal.timeout(8000),
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return null;
    return (await res.json()) as SearchResponse;
  } catch {
    return null;
  }
}

export function formatSearchContext(search: SearchResponse | null): string {
  if (!search || !search.summary) return "";
  return `\n\n─── Live Web Context (retrieved ${new Date().toLocaleDateString("en-GB")}) ───\n${search.summary}\n\nSources: ${search.sources.slice(0, 3).join(" | ") || "DuckDuckGo/Wikipedia"}\n──────────────────────────────────────────────`;
}
