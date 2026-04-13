const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
}

export class WebSearchTool {
  static async search(query: string, maxResults = 5): Promise<SearchResult[]> {
    try {
      const response = await fetch(`${BACKEND_URL}/api/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, max_results: maxResults }),
      });
      if (!response.ok) throw new Error(`Search failed: ${response.status}`);
      const data = await response.json();
      return data.results || [];
    } catch (error) {
      console.warn('[WebSearchTool] Search failed:', error);
      return [];
    }
  }

  static async fetchPage(url: string): Promise<string> {
    try {
      const response = await fetch(`${BACKEND_URL}/api/fetch-page`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      if (!response.ok) throw new Error(`Fetch failed: ${response.status}`);
      const data = await response.json();
      return data.content || '';
    } catch (error) {
      console.warn('[WebSearchTool] Fetch failed:', error);
      return '';
    }
  }
}

export class CalculatorTool {
  static calculate(expression: string): string {
    try {
      // Safe math evaluation without eval
      const sanitized = expression.replace(/[^0-9+\-*/().%\s]/g, '');
      if (!sanitized.trim()) return 'Invalid expression';
      const fn = new Function('return ' + sanitized);
      const result = fn();
      if (typeof result !== 'number' || isNaN(result)) return 'Invalid result';
      return result.toString();
    } catch {
      return 'Calculation error';
    }
  }
}

export class DateTimeTool {
  static now(): string {
    return new Date().toISOString();
  }

  static format(dateStr: string, locale = 'en-US'): string {
    try {
      return new Date(dateStr).toLocaleDateString(locale, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'Invalid date';
    }
  }

  static diff(date1: string, date2: string): string {
    try {
      const d1 = new Date(date1).getTime();
      const d2 = new Date(date2).getTime();
      const diffMs = Math.abs(d2 - d1);
      const days = Math.floor(diffMs / 86400000);
      const hours = Math.floor((diffMs % 86400000) / 3600000);
      return `${days} days, ${hours} hours`;
    } catch {
      return 'Invalid dates';
    }
  }
}
