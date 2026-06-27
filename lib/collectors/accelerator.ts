import type { RawSignal } from "@/lib/core/types";
import { createLogger } from "@/lib/core/logger";
import type { Collector, CollectorCursor } from "./interface";

const log = createLogger("collector:accelerator");

/**
 * Accelerator collector — YC, a16z CSX, public batch pages.
 * Scrapes/parses public listings.
 *
 * TODO: Implement (Phase 3)
 */
export class AcceleratorCollector implements Collector {
  readonly source = "accelerator";

  async collect(cursor: CollectorCursor | null): Promise<{
    signals: RawSignal[];
    nextCursor: string;
  }> {
    log.info("Accelerator collector not yet implemented");
    return { signals: [], nextCursor: cursor?.lastCursor ?? "" };
  }
}
