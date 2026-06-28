import type { RawSignal } from "@/lib/core/types";
import { RawSignalSchema } from "@/lib/core/types";
import { createLogger } from "@/lib/core/logger";
import type { Collector, CollectorCursor } from "./interface";

const log = createLogger("collector:farcaster");

interface FarcasterCast {
  hash: string;
  author: { fid: number; username: string; displayName: string };
  text: string;
  timestamp: string;
  reactions: { likes: number; recasts: number };
  replies: { count: number };
  embeds: Array<{ url?: string }>;
}

interface FarcasterResponse {
  casts: FarcasterCast[];
}

export class FarcasterCollector implements Collector {
  readonly source = "farcaster";
  private fetchFn: ((url: string, init?: RequestInit) => Promise<Response>) | null;

  constructor(fetchFn?: (url: string, init?: RequestInit) => Promise<Response>) {
    this.fetchFn = fetchFn ?? null;
  }

  async collect(cursor: CollectorCursor | null): Promise<{
    signals: RawSignal[];
    nextCursor: string;
  }> {
    if (!this.fetchFn) {
      log.info("Farcaster collector: no fetch function, skipping");
      return { signals: [], nextCursor: cursor?.lastCursor ?? "" };
    }

    try {
      const res = await this.fetchFn("https://api.neynar.com/v2/farcaster/feed", {});
      if (!res.ok) {
        return { signals: [], nextCursor: cursor?.lastCursor ?? "" };
      }
      const data = (await res.json()) as FarcasterResponse;
      return this.parseResponse(data);
    } catch (err) {
      log.warn(`Farcaster collector error: ${err}`);
      return { signals: [], nextCursor: cursor?.lastCursor ?? "" };
    }
  }

  parseResponse(data: FarcasterResponse): {
    signals: RawSignal[];
    nextCursor: string;
  } {
    const signals: RawSignal[] = [];
    let latestDate = "";

    for (const cast of data.casts) {
      const engagementScore = cast.reactions.likes + cast.reactions.recasts * 2 + cast.replies.count;
      if (engagementScore < 50) continue;

      const embedUrl = cast.embeds.find((e) => e.url)?.url;

      const raw = {
        source: "farcaster" as const,
        externalId: `fc-${cast.hash}`,
        title: `${cast.author.displayName}: ${cast.text.slice(0, 100)}`,
        url: embedUrl,
        body: cast.text,
        metadata: {
          authorUsername: cast.author.username,
          authorFid: cast.author.fid,
          likes: cast.reactions.likes,
          recasts: cast.reactions.recasts,
          replies: cast.replies.count,
          engagementScore,
        },
        detectedAt: new Date(cast.timestamp),
      };

      const parsed = RawSignalSchema.safeParse(raw);
      if (parsed.success) {
        signals.push(parsed.data);
        if (cast.timestamp > latestDate) latestDate = cast.timestamp;
      }
    }

    return {
      signals,
      nextCursor: latestDate || new Date().toISOString(),
    };
  }
}
