import type { RawSignal } from "@/lib/core/types";
import { RawSignalSchema } from "@/lib/core/types";
import { createLogger } from "@/lib/core/logger";
import type { Collector, CollectorCursor } from "./interface";

const log = createLogger("collector:github");

interface GitHubRepo {
  id: number;
  full_name: string;
  name: string;
  owner: { login: string };
  html_url: string;
  description: string | null;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  language: string | null;
  topics: string[];
  created_at: string;
  updated_at: string;
  pushed_at: string;
}

interface GitHubSearchResponse {
  items: GitHubRepo[];
  total_count: number;
}

export class GitHubCollector implements Collector {
  readonly source = "github";
  private fetchFn: (url: string, init?: RequestInit) => Promise<Response>;

  constructor(
    fetchFn?: (url: string, init?: RequestInit) => Promise<Response>
  ) {
    this.fetchFn = fetchFn ?? globalThis.fetch.bind(globalThis);
  }

  async collect(cursor: CollectorCursor | null): Promise<{
    signals: RawSignal[];
    nextCursor: string;
  }> {
    const token = process.env.GITHUB_TOKEN;
    if (!token) {
      log.warn("No GITHUB_TOKEN — returning empty results");
      return { signals: [], nextCursor: cursor?.lastCursor ?? "" };
    }

    try {
      const since = cursor?.lastCursor ?? "2020-01-01";
      const query = `topic:ai+topic:llm+pushed:>${since}&sort=stars&order=desc`;
      const url = `https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&per_page=30`;

      const res = await this.fetchFn(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github+json",
        },
      });

      if (!res.ok) {
        log.warn(`GitHub API error: ${res.status} ${res.statusText}`);
        return { signals: [], nextCursor: cursor?.lastCursor ?? "" };
      }

      const data = (await res.json()) as GitHubSearchResponse;
      return this.parseResponse(data);
    } catch (err) {
      log.warn(`GitHub collector error: ${err}`);
      return { signals: [], nextCursor: cursor?.lastCursor ?? "" };
    }
  }

  parseResponse(data: GitHubSearchResponse): {
    signals: RawSignal[];
    nextCursor: string;
  } {
    const signals: RawSignal[] = [];
    let latestDate = "";

    for (const repo of data.items) {
      const raw = {
        source: "github" as const,
        externalId: `github-repo-${repo.id}`,
        title: repo.full_name,
        url: repo.html_url,
        body: repo.description ?? undefined,
        metadata: {
          owner: repo.owner.login,
          stars: repo.stargazers_count,
          forks: repo.forks_count,
          openIssues: repo.open_issues_count,
          language: repo.language,
          topics: repo.topics,
        },
        detectedAt: new Date(repo.pushed_at),
      };

      const parsed = RawSignalSchema.safeParse(raw);
      if (parsed.success) {
        signals.push(parsed.data);
        if (repo.pushed_at > latestDate) latestDate = repo.pushed_at;
      } else {
        log.warn(`Dropping malformed GitHub repo ${repo.full_name}: ${parsed.error.message}`);
      }
    }

    return {
      signals,
      nextCursor: latestDate || new Date().toISOString(),
    };
  }
}
