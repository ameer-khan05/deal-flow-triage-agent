import type { RawSignal } from "@/lib/core/types";
import { createLogger } from "@/lib/core/logger";
import type { Collector, CollectorCursor } from "./interface";

const log = createLogger("collector:farcaster");

/**
 * Farcaster collector — builder casts, follower velocity via Neynar API.
 * Key-gated: returns [] when NEYNAR_API_KEY is absent.
 *
 * TODO: Implement (Phase 3)
 */
export class FarcasterCollector implements Collector {
  readonly source = "farcaster";

  async collect(cursor: CollectorCursor | null): Promise<{
    signals: RawSignal[];
    nextCursor: string;
  }> {
    if (!process.env.NEYNAR_API_KEY) {
      log.warn("No NEYNAR_API_KEY — returning empty results");
      return { signals: [], nextCursor: cursor?.lastCursor ?? "" };
    }
    log.info("Farcaster collector not yet implemented");
    return { signals: [], nextCursor: cursor?.lastCursor ?? "" };
  }
}
