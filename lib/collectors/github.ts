import type { RawSignal } from "@/lib/core/types";
import { RawSignalSchema } from "@/lib/core/types";
import { createLogger } from "@/lib/core/logger";
import type { Collector, CollectorCursor } from "./interface";

const log = createLogger("collector:github");

/**
 * GitHub collector — fetches trending/new repos under watched topics and orgs.
 * Uses octokit (5k req/hr with token, lower without).
 *
 * Signals captured: repo name, owner, stars, star velocity, watched-topic/org match.
 *
 * TODO: Implement using octokit search API
 * - Search repos by topic/language with sort=stars, order=desc
 * - Track star velocity (compare current vs cursor snapshot)
 * - Normalize to RawSignal[]
 */
export class GitHubCollector implements Collector {
  readonly source = "github";

  async collect(cursor: CollectorCursor | null): Promise<{
    signals: RawSignal[];
    nextCursor: string;
  }> {
    const token = process.env.GITHUB_TOKEN;
    if (!token) {
      log.warn("No GITHUB_TOKEN — returning empty results");
      return { signals: [], nextCursor: cursor?.lastCursor ?? "" };
    }

    // TODO: implement GitHub collection
    log.info("GitHub collector not yet implemented");
    return { signals: [], nextCursor: cursor?.lastCursor ?? "" };
  }
}
