import { getDb, schema } from "./index";
import { eq } from "drizzle-orm";

const FIXTURE_COMPANIES = [
  {
    name: "Acme AI",
    domain: "acme-ai.com",
    githubOrg: "acme-ai",
    industry: "AI Infrastructure",
    subSector: "Inference",
    oneLiner: "High-performance inference engine for transformer models",
    estimatedStage: "Series A",
    founders: ["Alice Chen"],
    links: { github: "https://github.com/acme-ai/neural-engine" },
    isEarlyStealth: false,
  },
  {
    name: "DeFi Labs",
    domain: "defilabs.xyz",
    githubOrg: "defi-labs",
    contractAddress: "0x1234567890abcdef1234567890abcdef12345678",
    industry: "DeFi",
    subSector: "DEX",
    oneLiner: "Decentralized exchange protocol with concentrated liquidity",
    estimatedStage: "Seed",
    founders: ["Bob Martinez"],
    links: { github: "https://github.com/defi-labs/swap-protocol" },
    isEarlyStealth: false,
  },
  {
    name: "BuildFast Inc",
    domain: "buildfast.dev",
    githubOrg: "buildfast-inc",
    industry: "AI Application",
    subSector: "AI Agents",
    oneLiner: "Production-ready framework for building AI agents with tool use",
    estimatedStage: "Series B",
    founders: ["Carol Wang", "Dave Kim"],
    links: { github: "https://github.com/buildfast-inc/agent-framework" },
    isEarlyStealth: false,
  },
  {
    name: "Chain Core",
    domain: "chaincore.io",
    githubOrg: "chain-core",
    industry: "Crypto Infrastructure",
    subSector: "Bridges",
    oneLiner: "Cross-chain bridge with ZK proof verification",
    estimatedStage: "Pre-seed",
    founders: ["Eve Johnson"],
    links: { github: "https://github.com/chain-core/bridge-v2" },
    isEarlyStealth: true,
  },
  {
    name: "Stealth ML",
    domain: "stealthml.ai",
    githubOrg: "stealth-ml",
    industry: "AI Infrastructure",
    subSector: "Diffusion Models",
    oneLiner: "Optimized diffusion model inference with quantization",
    estimatedStage: "Pre-seed",
    founders: [],
    links: { github: "https://github.com/stealth-ml/diffusion-opt" },
    isEarlyStealth: true,
  },
];

const FIXTURE_RAW_SIGNALS = [
  {
    source: "github",
    externalId: "github-repo-100001",
    title: "acme-ai/neural-engine",
    url: "https://github.com/acme-ai/neural-engine",
    body: "High-performance inference engine for transformer models",
    metadata: { owner: "acme-ai", stars: 4200, forks: 310, topics: ["ai", "inference", "transformer", "llm"] },
    detectedAt: new Date("2026-06-20T11:00:00Z"),
  },
  {
    source: "github",
    externalId: "github-repo-100002",
    title: "defi-labs/swap-protocol",
    url: "https://github.com/defi-labs/swap-protocol",
    body: "Decentralized exchange protocol with concentrated liquidity",
    metadata: { owner: "defi-labs", stars: 1800, forks: 150, topics: ["defi", "dex", "ethereum"] },
    detectedAt: new Date("2026-06-19T07:30:00Z"),
  },
  {
    source: "github",
    externalId: "github-repo-100003",
    title: "buildfast-inc/agent-framework",
    url: "https://github.com/buildfast-inc/agent-framework",
    body: "Production-ready framework for building AI agents with tool use",
    metadata: { owner: "buildfast-inc", stars: 8900, forks: 620, topics: ["ai-agent", "llm", "rag"] },
    detectedAt: new Date("2026-06-20T13:45:00Z"),
  },
  {
    source: "onchain",
    externalId: "onchain-defilabs-tvl",
    title: "DeFi Labs TVL Growth",
    url: "https://defillama.com/protocol/defi-labs",
    body: "TVL increased 45% in the last 30 days",
    metadata: { tvl: 15000000, chain: "ethereum" },
    detectedAt: new Date("2026-06-18T10:00:00Z"),
  },
  {
    source: "rss",
    externalId: "rss-techcrunch-buildfast",
    title: "BuildFast raises $25M Series B for AI agent platform",
    url: "https://techcrunch.com/2026/06/15/buildfast-series-b",
    body: "BuildFast Inc announced a $25M Series B round led by Sequoia",
    metadata: { feedSource: "TechCrunch", publishedDate: "2026-06-15" },
    detectedAt: new Date("2026-06-15T14:00:00Z"),
  },
];

export async function seed() {
  const db = getDb();

  console.info("[Seed] Seeding database with fixture data...");

  // Insert companies (idempotent — skip if name already exists)
  for (const company of FIXTURE_COMPANIES) {
    const existing = await db
      .select()
      .from(schema.companies)
      .where(eq(schema.companies.name, company.name))
      .limit(1);

    if (existing.length === 0) {
      await db.insert(schema.companies).values(company);
    }
  }

  // Insert raw signals (idempotent — skip on unique constraint violation)
  for (const signal of FIXTURE_RAW_SIGNALS) {
    try {
      await db.insert(schema.rawSignals).values(signal).onConflictDoNothing();
    } catch {
      // already exists
    }
  }

  // Link signals to companies and insert typed signals
  const allCompanies = await db.select().from(schema.companies);
  const allRawSignals = await db.select().from(schema.rawSignals);

  for (const raw of allRawSignals) {
    const meta = raw.metadata as Record<string, unknown> | null;
    const owner = meta?.owner as string | undefined;

    const matchedCompany = allCompanies.find(
      (c) => c.githubOrg === owner || raw.title.toLowerCase().includes(c.name.toLowerCase().split(" ")[0])
    );

    if (matchedCompany) {
      const existingSignal = await db
        .select()
        .from(schema.signals)
        .where(eq(schema.signals.rawSignalId, raw.id))
        .limit(1);

      if (existingSignal.length === 0) {
        await db.insert(schema.signals).values({
          rawSignalId: raw.id,
          companyId: matchedCompany.id,
          source: raw.source,
          type: `${raw.source}_activity`,
          value: raw.title,
          metadata: raw.metadata,
          detectedAt: raw.detectedAt,
        });
      }
    }
  }

  // Score each company
  for (const company of allCompanies) {
    const companySignals = await db
      .select()
      .from(schema.signals)
      .where(eq(schema.signals.companyId, company.id));

    const signalCount = companySignals.length;
    const meta = companySignals[0]?.metadata as Record<string, unknown> | null;
    const stars = (meta?.stars as number) ?? 0;

    // Simple deterministic scoring based on signal count and stars
    const starScore = Math.min(100, stars / 100);
    const signalScore = Math.min(100, signalCount * 20);
    const baseScore = Math.round((starScore * 0.6 + signalScore * 0.4) * 100) / 100;

    const tier = baseScore >= 75 ? "hot" : baseScore >= 50 ? "review" : "watch";

    const existingScore = await db
      .select()
      .from(schema.scores)
      .where(eq(schema.scores.companyId, company.id))
      .limit(1);

    if (existingScore.length === 0) {
      await db.insert(schema.scores).values({
        companyId: company.id,
        score: baseScore,
        tier,
        rationale: `Based on ${signalCount} signal(s) and ${stars} GitHub stars`,
        featureBreakdown: {
          starVelocity: starScore,
          contributorGrowth: 0,
          onchainGrowth: 0,
          fundingSignal: 0,
          socialMomentum: 0,
          recency: signalScore,
          founderPedigree: 0,
        },
        thesisName: "ai",
      });
    }
  }

  console.info("[Seed] Done.");
}

// Run directly with tsx
if (require.main === module) {
  seed()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("[Seed] Failed:", err);
      process.exit(1);
    });
}
