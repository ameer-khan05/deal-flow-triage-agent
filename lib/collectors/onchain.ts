import type { RawSignal } from "@/lib/core/types";
import { createLogger } from "@/lib/core/logger";
import type { Collector, CollectorCursor } from "./interface";

const log = createLogger("collector:onchain");

/**
 * On-chain collector — DefiLlama TVL + viem-based contract/token reads.
 * DefiLlama is free and keyless; viem uses ALCHEMY_RPC_URL if available.
 *
 * TODO: Implement
 * - DefiLlama: GET /protocols for TVL data
 * - viem: watch for new contract deploys, token holder counts
 * - Normalize to RawSignal[]
 */
export class OnchainCollector implements Collector {
  readonly source = "onchain";

  async collect(cursor: CollectorCursor | null): Promise<{
    signals: RawSignal[];
    nextCursor: string;
  }> {
    // TODO: implement on-chain collection
    log.info("On-chain collector not yet implemented");
    return { signals: [], nextCursor: cursor?.lastCursor ?? "" };
  }
}
