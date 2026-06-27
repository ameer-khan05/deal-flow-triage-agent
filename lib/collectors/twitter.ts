import type { RawSignal } from "@/lib/core/types";
import { createLogger } from "@/lib/core/logger";
import type { Collector, CollectorCursor } from "./interface";

const log = createLogger("collector:twitter");

/**
 * Twitter collector — stub / opt-in only.
 * Requires TWITTER_BEARER_TOKEN and ENABLE_TWITTER_COLLECTOR=1.
 * Phase 4 deliverable.
 */
export class TwitterCollector implements Collector {
  readonly source = "twitter";

  async collect(cursor: CollectorCursor | null): Promise<{
    signals: RawSignal[];
    nextCursor: string;
  }> {
    const token = process.env.TWITTER_BEARER_TOKEN;
    if (!token) {
      log.info("Twitter collector: no TWITTER_BEARER_TOKEN, skipping");
      return { signals: [], nextCursor: cursor?.lastCursor ?? "" };
    }

    log.warn("Twitter collector: not yet implemented (Phase 4 stub)");
    return { signals: [], nextCursor: cursor?.lastCursor ?? "" };
  }
}
