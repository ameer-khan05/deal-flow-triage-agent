import type { RawSignal } from "@/lib/core/types";
import { createLogger } from "@/lib/core/logger";
import type { Collector, CollectorCursor } from "./interface";

const log = createLogger("collector:producthunt");

/**
 * Product Hunt collector — new AI launches from GraphQL API.
 *
 * TODO: Implement (Phase 3)
 */
export class ProductHuntCollector implements Collector {
  readonly source = "producthunt";

  async collect(cursor: CollectorCursor | null): Promise<{
    signals: RawSignal[];
    nextCursor: string;
  }> {
    log.info("Product Hunt collector not yet implemented");
    return { signals: [], nextCursor: cursor?.lastCursor ?? "" };
  }
}
