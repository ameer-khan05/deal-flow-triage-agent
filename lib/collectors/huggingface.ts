import type { RawSignal } from "@/lib/core/types";
import { createLogger } from "@/lib/core/logger";
import type { Collector, CollectorCursor } from "./interface";

const log = createLogger("collector:huggingface");

/**
 * HuggingFace collector — trending/new models with download counts.
 * Free public API, no key required.
 *
 * TODO: Implement
 * - Fetch trending models from HF API
 * - Track download velocity
 * - Normalize to RawSignal[]
 */
export class HuggingFaceCollector implements Collector {
  readonly source = "huggingface";

  async collect(cursor: CollectorCursor | null): Promise<{
    signals: RawSignal[];
    nextCursor: string;
  }> {
    // TODO: implement HuggingFace collection
    log.info("HuggingFace collector not yet implemented");
    return { signals: [], nextCursor: cursor?.lastCursor ?? "" };
  }
}
