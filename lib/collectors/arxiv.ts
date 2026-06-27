import type { RawSignal } from "@/lib/core/types";
import { RawSignalSchema } from "@/lib/core/types";
import { createLogger } from "@/lib/core/logger";
import type { Collector, CollectorCursor } from "./interface";

const log = createLogger("collector:arxiv");

interface ArxivEntry {
  id: string;
  title: string;
  authors: string[];
  summary: string;
  published: string;
  updated: string;
  categories: string[];
  link: string;
}

interface ArxivResponse {
  entries: ArxivEntry[];
}

export class ArxivCollector implements Collector {
  readonly source = "arxiv";
  private fetchFn: ((url: string, init?: RequestInit) => Promise<Response>) | null;

  constructor(fetchFn?: (url: string, init?: RequestInit) => Promise<Response>) {
    this.fetchFn = fetchFn ?? null;
  }

  async collect(cursor: CollectorCursor | null): Promise<{
    signals: RawSignal[];
    nextCursor: string;
  }> {
    if (!this.fetchFn) {
      log.info("arXiv collector: no fetch function provided, skipping");
      return { signals: [], nextCursor: cursor?.lastCursor ?? "" };
    }

    try {
      const res = await this.fetchFn("https://export.arxiv.org/api/query", {});
      if (!res.ok) {
        return { signals: [], nextCursor: cursor?.lastCursor ?? "" };
      }
      const data = (await res.json()) as ArxivResponse;
      return this.parseResponse(data);
    } catch (err) {
      log.warn(`arXiv collector error: ${err}`);
      return { signals: [], nextCursor: cursor?.lastCursor ?? "" };
    }
  }

  parseResponse(data: ArxivResponse): {
    signals: RawSignal[];
    nextCursor: string;
  } {
    const signals: RawSignal[] = [];
    let latestDate = "";

    for (const entry of data.entries) {
      const raw = {
        source: "arxiv" as const,
        externalId: `arxiv-${entry.id}`,
        title: entry.title,
        url: entry.link,
        body: entry.summary,
        metadata: {
          authors: entry.authors,
          categories: entry.categories,
          publishedDate: entry.published,
        },
        detectedAt: new Date(entry.published),
      };

      const parsed = RawSignalSchema.safeParse(raw);
      if (parsed.success) {
        signals.push(parsed.data);
        if (entry.published > latestDate) latestDate = entry.published;
      }
    }

    return {
      signals,
      nextCursor: latestDate || new Date().toISOString(),
    };
  }
}
