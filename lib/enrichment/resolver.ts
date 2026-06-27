/**
 * Entity resolution — collapses signals into canonical Company rows.
 *
 * Resolution strategy:
 * 1. Deterministic keys first: domain, contract address, GitHub org, handle
 * 2. LLM-assisted fuzzy matching for near-duplicates (behind LlmClient interface)
 *
 * Rules:
 * - Never silently overwrite human-edited company fields (humanEdited=true)
 * - "Early/stealth" flag: set true when builder/on-chain signals present
 *   but funding/press signals are absent
 *
 * TODO: Implement full resolution logic
 */

export interface ResolverInput {
  source: string;
  externalId: string;
  title: string;
  url?: string;
  metadata?: Record<string, unknown>;
}

export interface ResolvedEntity {
  companyName: string;
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
