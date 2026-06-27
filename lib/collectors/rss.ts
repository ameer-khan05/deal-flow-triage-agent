import type { RawSignal } from "@/lib/core/types";
import { RawSignalSchema } from "@/lib/core/types";
import { createLogger } from "@/lib/core/logger";
import type { Collector, CollectorCursor } from "./interface";

const log = createLogger("collector:rss");

interface RssItem {
  title: string;
  link: string;
  pubDate: string;
  contentSnippet?: string;
  creator?: string;
  categories?: string[];
}

interface RssResponse {
  items: RssItem[];
}

const DEFAULT_FEEDS = [
  "https://techcrunch.com/feed/",
  "https://www.theblock.co/rss.xml",
  "https://feeds.feedburner.com/venturebeat/SZYF",
];

export class RssCollector implements Collector {
  readonly source = "rss";
  private fetchFn: ((url: string, init?: RequestInit) => Promise<Response>) | null;

  constructor(fetchFn?: (url: string, init?: RequestInit) => Promise<Response>) {
    this.fetchFn = fetchFn ?? null;
  }

  async collect(cursor: CollectorCursor | null): Promise<{
    signals: RawSignal[];
    nextCursor: string;
  }> {
    if (!this.fetchFn) {
      // In production, use rss-parser. For now, use fetchFn injection for testing
      log.info("RSS collector: no fetch function provided, skipping live feeds");
      return { signals: [], nextCursor: cursor?.lastCursor ?? "" };
    }

    try {
      const res = await this.fetchFn("rss://feeds", {});
      if (!res.ok) {
        return { signals: [], nextCursor: cursor?.lastCursor ?? "" };
      }
      const data = (await res.json()) as RssResponse;
      return this.parseResponse(data);
    } catch (err) {
      log.warn(`RSS collector error: ${err}`);
      return { signals: [], nextCursor: cursor?.lastCursor ?? "" };
    }
  }

  parseResponse(data: RssResponse): {
    signals: RawSignal[];
    nextCursor: string;
  } {
    const signals: RawSignal[] = [];
    let latestDate = "";

    for (const item of data.items) {
      const raw = {
        source: "rss" as const,
        externalId: `rss-${Buffer.from(item.link).toString("base64").slice(0, 100)}`,
        title: item.title,
        url: item.link,
        body: item.contentSnippet,
        metadata: {
          feedSource: item.creator,
          categories: item.categories,
          publishedDate: item.pubDate,
        },
        detectedAt: new Date(item.pubDate),
      };

      const parsed = RawSignalSchema.safeParse(raw);
      if (parsed.success) {
        signals.push(parsed.data);
        if (item.pubDate > latestDate) latestDate = item.pubDate;
      }
    }

    return {
      signals,
      nextCursor: latestDate || new Date().toISOString(),
    };
  }
}
