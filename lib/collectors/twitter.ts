import type { RawSignal } from "@/lib/core/types";
import { createLogger } from "@/lib/core/logger";
import type { Collector, CollectorCursor } from "./interface";

const log = createLogger("collector:twitter");

// WARNING: Twitter/X collector is disabled by default.
// ToS concerns and API brittleness make this an unreliable source.
// Enable only via explicit config flag ENABLE_TWITTER_COLLECTOR=1.

const ENABLED = process.env.ENABLE_TWITTER_COLLECTOR === "1";

export class TwitterCollector implements Collector {
  readonly source = "twitter";

  async collect(cursor: CollectorCursor | null): Promise<{
    signals: RawSignal[];
    nextCursor: string;
  }> {
    if (!ENABLED) {
      log.info("Twitter collector disabled (set ENABLE_TWITTER_COLLECTOR=1 to enable)");
      return { signals: [], nextCursor: cursor?.lastCursor ?? "" };
    }

    // TODO: Implement (Phase 4, scaffold only)
    log.info("Twitter collector not yet implemented");
    return { signals: [], nextCursor: cursor?.lastCursor ?? "" };
  }
}
