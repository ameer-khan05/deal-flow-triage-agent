import type { RawSignal } from "@/lib/core/types";
import { RawSignalSchema } from "@/lib/core/types";
import { createLogger } from "@/lib/core/logger";
import type { Collector, CollectorCursor } from "./interface";

const log = createLogger("collector:producthunt");

interface PHPost {
  id: number;
  name: string;
  tagline: string;
  url: string;
  votesCount: number;
  commentsCount: number;
  topics: string[];
  thumbnail: string;
  createdAt: string;
  makers: Array<{ name: string }>;
}

interface PHResponse {
  posts: PHPost[];
}

export class ProductHuntCollector implements Collector {
  readonly source = "producthunt";
  private fetchFn: ((url: string, init?: RequestInit) => Promise<Response>) | null;

  constructor(fetchFn?: (url: string, init?: RequestInit) => Promise<Response>) {
    this.fetchFn = fetchFn ?? null;
  }

  async collect(cursor: CollectorCursor | null): Promise<{
    signals: RawSignal[];
    nextCursor: string;
  }> {
    if (!this.fetchFn) {
      log.info("ProductHunt collector: no fetch function, skipping");
      return { signals: [], nextCursor: cursor?.lastCursor ?? "" };
    }

    try {
      const res = await this.fetchFn("https://api.producthunt.com/v2/api/graphql", {});
      if (!res.ok) {
        return { signals: [], nextCursor: cursor?.lastCursor ?? "" };
      }
      const data = (await res.json()) as PHResponse;
      return this.parseResponse(data);
    } catch (err) {
      log.warn(`ProductHunt collector error: ${err}`);
      return { signals: [], nextCursor: cursor?.lastCursor ?? "" };
    }
  }

  parseResponse(data: PHResponse): {
    signals: RawSignal[];
    nextCursor: string;
  } {
    const signals: RawSignal[] = [];
    let latestDate = "";

    for (const post of data.posts) {
      const raw = {
        source: "producthunt" as const,
        externalId: `ph-${post.id}`,
        title: `${post.name}: ${post.tagline}`,
        url: post.url,
        body: `${post.votesCount} upvotes, ${post.commentsCount} comments`,
        metadata: {
          votes: post.votesCount,
          comments: post.commentsCount,
          topics: post.topics,
          makers: post.makers.map((m) => m.name),
        },
        detectedAt: new Date(post.createdAt),
      };

      const parsed = RawSignalSchema.safeParse(raw);
      if (parsed.success) {
        signals.push(parsed.data);
        if (post.createdAt > latestDate) latestDate = post.createdAt;
      }
    }

    return {
      signals,
      nextCursor: latestDate || new Date().toISOString(),
    };
  }
}
