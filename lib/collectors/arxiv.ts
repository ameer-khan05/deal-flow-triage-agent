import type { RawSignal } from "@/lib/core/types";
import { createLogger } from "@/lib/core/logger";
import type { Collector, CollectorCursor } from "./interface";

const log = createLogger("collector:arxiv");

/**
 * arXiv collector — new cs.AI/cs.LG papers with author tracking.
 * Free API, no key required.
 *
 * TODO: Implement (Phase 3)
 */
export class ArxivCollector implements Collector {
  readonly source = "arxiv";

  async collect(cursor: CollectorCursor | null): Promise<{
    signals: RawSignal[];
    nextCursor: string;
  }> {
    log.info("arXiv collector not yet implemented");
    return { signals: [], nextCursor: cursor?.lastCursor ?? "" };
  }
}
