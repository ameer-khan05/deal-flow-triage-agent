import type { LlmClient } from "@/lib/llm/interface";
import { createLogger } from "@/lib/core/logger";
import { getDb, schema } from "@/lib/db";
import { eq } from "drizzle-orm";

const log = createLogger("enrichment:resolver");

export interface ResolverInput {
  source: string;
  externalId: string;
  title: string;
  url?: string;
  body?: string;
  metadata?: Record<string, unknown>;
}

export interface ResolvedEntity {
  companyName: string;
  companyId: number | null;
  matchedBy: "domain" | "contract" | "github_org" | "handle" | "llm_fuzzy" | "new";
  isNew: boolean;
}

export function normalizeKey(key: string): string {
  return key.toLowerCase().trim().replace(/[^a-z0-9-]/g, "");
}

export function detectEarlyStealth(signalSources: string[]): boolean {
  const hasBuilderSignal = signalSources.some((s) =>
    ["github", "onchain", "huggingface"].includes(s)
  );
  const hasFundingOrPress = signalSources.some((s) =>
    ["rss", "accelerator", "producthunt"].includes(s)
  );
  return hasBuilderSignal && !hasFundingOrPress;
}

export function extractGithubOrg(metadata?: Record<string, unknown>): string | null {
  const owner = metadata?.owner;
  if (typeof owner === "string" && owner.length > 0) {
    return normalizeKey(owner);
  }
  return null;
}

export function extractDomain(url?: string): string | null {
  if (!url) return null;
  try {
    const hostname = new URL(url).hostname;
    return hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

export async function resolveEntity(
  input: ResolverInput,
  llmClient?: LlmClient
): Promise<ResolvedEntity> {
  const db = getDb();

  // 1. Try deterministic keys: GitHub org
  const githubOrg = extractGithubOrg(input.metadata);
  if (githubOrg) {
    const matches = await db
      .select()
      .from(schema.companies)
      .where(eq(schema.companies.githubOrg, githubOrg))
      .limit(1);

    if (matches.length > 0) {
      return {
        companyName: matches[0].name,
        companyId: matches[0].id,
        matchedBy: "github_org",
        isNew: false,
      };
    }
  }

  // 2. Try domain matching
  const domain = extractDomain(input.url);
  if (domain && !["github.com", "arxiv.org", "huggingface.co"].includes(domain)) {
    const matches = await db
      .select()
      .from(schema.companies)
      .where(eq(schema.companies.domain, domain))
      .limit(1);

    if (matches.length > 0) {
      return {
        companyName: matches[0].name,
        companyId: matches[0].id,
        matchedBy: "domain",
        isNew: false,
      };
    }
  }

  // 3. Try contract address
  const contractAddress = input.metadata?.contractAddress as string | undefined;
  if (contractAddress) {
    const matches = await db
      .select()
      .from(schema.companies)
      .where(eq(schema.companies.contractAddress, contractAddress))
      .limit(1);

    if (matches.length > 0) {
      return {
        companyName: matches[0].name,
        companyId: matches[0].id,
        matchedBy: "contract",
        isNew: false,
      };
    }
  }

  // 4. LLM fuzzy match (if available)
  if (llmClient) {
    const allCompanies = await db.select().from(schema.companies);
    for (const company of allCompanies) {
      const result = await llmClient.entityMatch({
        signalTitle: input.title,
        signalBody: input.body,
        signalSource: input.source,
        candidateName: company.name,
        candidateDomain: company.domain,
        candidateGithubOrg: company.githubOrg,
      });

      if (result.isSameEntity && result.confidence > 0.7) {
        log.info(`LLM matched "${input.title}" to "${company.name}" (${result.confidence})`);
        return {
          companyName: company.name,
          companyId: company.id,
          matchedBy: "llm_fuzzy",
          isNew: false,
        };
      }
    }
  }

  // 5. New entity
  const name = githubOrg ?? input.title.split("/").pop() ?? input.title;
  return {
    companyName: name,
    companyId: null,
    matchedBy: "new",
    isNew: true,
  };
}
