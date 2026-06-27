import type { RawSignal } from "@/lib/core/types";
import { RawSignalSchema } from "@/lib/core/types";
import { createLogger } from "@/lib/core/logger";
import type { Collector, CollectorCursor } from "./interface";

const log = createLogger("collector:onchain");

interface DefiLlamaProtocol {
  id: string;
  name: string;
  slug: string;
  tvl: number;
  chainTvls: Record<string, number>;
  change_1d: number | null;
  change_7d: number | null;
  change_1m: number | null;
  chains: string[];
  category: string;
  url: string;
}

interface DefiLlamaResponse {
  protocols: DefiLlamaProtocol[];
}

export class OnchainCollector implements Collector {
  readonly source = "onchain";
  private fetchFn: (url: string, init?: RequestInit) => Promise<Response>;

  constructor(fetchFn?: (url: string, init?: RequestInit) => Promise<Response>) {
    this.fetchFn = fetchFn ?? globalThis.fetch.bind(globalThis);
  }

  async collect(cursor: CollectorCursor | null): Promise<{
    signals: RawSignal[];
    nextCursor: string;
  }> {
    try {
      const res = await this.fetchFn("https://api.llama.fi/protocols", {
        headers: { Accept: "application/json" },
      });

      if (!res.ok) {
        log.warn(`DefiLlama API error: ${res.status}`);
        return { signals: [], nextCursor: cursor?.lastCursor ?? "" };
      }

      const protocols = (await res.json()) as DefiLlamaProtocol[];
      return this.parseResponse({ protocols });
    } catch (err) {
      log.warn(`On-chain collector error: ${err}`);
      return { signals: [], nextCursor: cursor?.lastCursor ?? "" };
    }
  }

  parseResponse(data: DefiLlamaResponse): {
    signals: RawSignal[];
    nextCursor: string;
  } {
    const signals: RawSignal[] = [];

    // Filter to protocols with significant TVL growth
    const interesting = data.protocols.filter(
      (p) => p.tvl > 1000000 && (p.change_1m ?? 0) > 10
    );

    for (const protocol of interesting) {
      const raw = {
        source: "onchain" as const,
        externalId: `onchain-${protocol.slug}`,
        title: `${protocol.name} TVL Growth`,
        url: protocol.url || undefined,
        body: `TVL: $${(protocol.tvl / 1e6).toFixed(1)}M, 30d change: ${protocol.change_1m?.toFixed(1)}%`,
        metadata: {
          tvl: protocol.tvl,
          change1d: protocol.change_1d,
          change7d: protocol.change_7d,
          change1m: protocol.change_1m,
          chains: protocol.chains,
          category: protocol.category,
        },
        detectedAt: new Date(),
      };

      const parsed = RawSignalSchema.safeParse(raw);
      if (parsed.success) {
        signals.push(parsed.data);
      }
    }

    return {
      signals,
      nextCursor: new Date().toISOString(),
    };
  }
}
