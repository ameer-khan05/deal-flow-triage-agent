import type { RawSignal } from "@/lib/core/types";
import { createLogger } from "@/lib/core/logger";
import type { Collector, CollectorCursor } from "./interface";

const log = createLogger("collector:rss");

/**
 * RSS/News collector — parses feeds from TechCrunch, The Block, Decrypt, etc.
 * Uses rss-parser, free and keyless.
 *
 * TODO: Implement
 * - Parse configured RSS feed URLs
 * - Extract title, url, published date, source
 * - Normalize to RawSignal[]
 */
export class RssCollector implements Collector {
  readonly source = "rss";

  async collect(cursor: CollectorCursor | null): Promise<{
    signals: RawSignal[];
    nextCursor: string;
  }> {
    // TODO: implement RSS collection
    log.info("RSS collector not yet implemented");
    return { signals: [], nextCursor: cursor?.lastCursor ?? "" };
  }
}
