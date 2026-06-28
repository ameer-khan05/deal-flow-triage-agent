import { getDb, schema } from "./index";
import { eq } from "drizzle-orm";

const FIXTURE_COMPANIES: Array<{
  name: string;
  domain: string;
  githubOrg: string;
  contractAddress?: string;
  industry: string;
  subSector: string;
  oneLiner: string;
  estimatedStage: string;
  founders: string[];
  links: Record<string, string>;
  isEarlyStealth: boolean;
}> = [
  {
    name: "Acme AI",
    domain: "acme-ai.com",
    githubOrg: "acme-ai",
    industry: "AI Infrastructure",
    subSector: "Inference",
    oneLiner: "High-performance inference engine for transformer models",
    estimatedStage: "Series A",
    founders: ["Alice Chen", "James Park"],
    links: { github: "https://github.com/acme-ai/neural-engine", website: "https://acme-ai.com" },
    isEarlyStealth: false,
  },
  {
    name: "DeFi Labs",
    domain: "defilabs.xyz",
    githubOrg: "defi-labs",
    contractAddress: "0x1234567890abcdef1234567890abcdef12345678",
    industry: "DeFi",
    subSector: "DEX",
    oneLiner: "Decentralized exchange protocol with concentrated liquidity and MEV protection",
    estimatedStage: "Seed",
    founders: ["Bob Martinez"],
    links: { github: "https://github.com/defi-labs/swap-protocol", website: "https://defilabs.xyz" },
    isEarlyStealth: false,
  },
  {
    name: "BuildFast Inc",
    domain: "buildfast.dev",
    githubOrg: "buildfast-inc",
    industry: "AI Application",
    subSector: "AI Agents",
    oneLiner: "Production-ready framework for building AI agents with tool use and memory",
    estimatedStage: "Series B",
    founders: ["Carol Wang", "Dave Kim"],
    links: { github: "https://github.com/buildfast-inc/agent-framework", website: "https://buildfast.dev" },
    isEarlyStealth: false,
  },
  {
    name: "Chain Core",
    domain: "chaincore.io",
    githubOrg: "chain-core",
    industry: "Crypto Infrastructure",
    subSector: "Bridges",
    oneLiner: "Cross-chain bridge with ZK proof verification for trustless asset transfers",
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
    oneLiner: "Optimized diffusion model inference with 4-bit quantization",
    estimatedStage: "Pre-seed",
    founders: [],
    links: { github: "https://github.com/stealth-ml/diffusion-opt" },
    isEarlyStealth: true,
  },
  {
    name: "Nebula Data",
    domain: "nebuladata.io",
    githubOrg: "nebula-data",
    industry: "Data Infrastructure",
    subSector: "Vector Databases",
    oneLiner: "Distributed vector database optimized for real-time RAG at scale",
    estimatedStage: "Series A",
    founders: ["Priya Sharma", "Leo Zhang"],
    links: { github: "https://github.com/nebula-data/vectordb", website: "https://nebuladata.io" },
    isEarlyStealth: false,
  },
  {
    name: "ZK Proof Systems",
    domain: "zkproof.dev",
    githubOrg: "zkproof-sys",
    contractAddress: "0xabcdef1234567890abcdef1234567890abcdef12",
    industry: "Crypto Infrastructure",
    subSector: "Zero Knowledge",
    oneLiner: "Developer toolkit for building ZK applications with Rust and WASM",
    estimatedStage: "Seed",
    founders: ["Marco Rossi"],
    links: { github: "https://github.com/zkproof-sys/zk-toolkit" },
    isEarlyStealth: false,
  },
  {
    name: "ContextWindow AI",
    domain: "contextwindow.ai",
    githubOrg: "contextwindow",
    industry: "AI Application",
    subSector: "Document Intelligence",
    oneLiner: "AI-powered document understanding with sub-second latency on million-page corpora",
    estimatedStage: "Series A",
    founders: ["Sarah Mitchell", "Alex Nguyen"],
    links: { github: "https://github.com/contextwindow/docai", website: "https://contextwindow.ai" },
    isEarlyStealth: false,
  },
];

const FIXTURE_RAW_SIGNALS = [
  // Acme AI signals
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
    source: "huggingface",
    externalId: "hf-acme-neural",
    title: "acme-ai/neural-engine-v3",
    url: "https://huggingface.co/acme-ai/neural-engine-v3",
    body: "Latest neural engine model with 2x throughput improvement",
    metadata: { downloads: 85000, likes: 340 },
    detectedAt: new Date("2026-06-22T09:00:00Z"),
  },
  // DeFi Labs signals
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
    source: "onchain",
    externalId: "onchain-defilabs-tvl",
    title: "DeFi Labs TVL Growth",
    url: "https://defillama.com/protocol/defi-labs",
    body: "TVL increased 45% in the last 30 days",
    metadata: { tvl: 15000000, chain: "ethereum" },
    detectedAt: new Date("2026-06-18T10:00:00Z"),
  },
  {
    source: "farcaster",
    externalId: "fc-defilabs-launch",
    title: "DeFi Labs v2 launch discussion",
    url: "https://warpcast.com/defilabs/cast123",
    body: "Massive engagement on DeFi Labs v2 launch announcement",
    metadata: { likes: 420, recasts: 89, replies: 67 },
    detectedAt: new Date("2026-06-21T15:00:00Z"),
  },
  // BuildFast signals
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
    source: "rss",
    externalId: "rss-techcrunch-buildfast",
    title: "BuildFast raises $25M Series B for AI agent platform",
    url: "https://techcrunch.com/2026/06/15/buildfast-series-b",
    body: "BuildFast Inc announced a $25M Series B round led by Sequoia Capital. The company has seen 5x ARR growth.",
    metadata: { feedSource: "TechCrunch", publishedDate: "2026-06-15" },
    detectedAt: new Date("2026-06-15T14:00:00Z"),
  },
  {
    source: "producthunt",
    externalId: "ph-buildfast-agents",
    title: "BuildFast Agents - Ship AI agents in minutes",
    url: "https://producthunt.com/posts/buildfast-agents",
    body: "#1 Product of the Day with 1200+ upvotes",
    metadata: { upvotes: 1247, rank: 1, comments: 89 },
    detectedAt: new Date("2026-06-17T12:00:00Z"),
  },
  // Nebula Data signals
  {
    source: "github",
    externalId: "github-repo-100004",
    title: "nebula-data/vectordb",
    url: "https://github.com/nebula-data/vectordb",
    body: "Distributed vector database optimized for real-time RAG",
    metadata: { owner: "nebula-data", stars: 6200, forks: 430, topics: ["vector-db", "rag", "embeddings"] },
    detectedAt: new Date("2026-06-23T10:00:00Z"),
  },
  {
    source: "rss",
    externalId: "rss-venturebeat-nebula",
    title: "Nebula Data closes $18M Series A for vector database platform",
    url: "https://venturebeat.com/2026/06/20/nebula-data-series-a",
    body: "Nebula Data raised $18M led by a16z to scale its vector database infrastructure.",
    metadata: { feedSource: "VentureBeat", publishedDate: "2026-06-20" },
    detectedAt: new Date("2026-06-20T16:00:00Z"),
  },
  {
    source: "arxiv",
    externalId: "arxiv-nebula-2026",
    title: "Efficient Approximate Nearest Neighbor Search in High-Dimensional Spaces",
    url: "https://arxiv.org/abs/2606.12345",
    body: "Novel indexing algorithm achieving 3x faster query times for billion-scale vector datasets.",
    metadata: { authors: ["P. Sharma", "L. Zhang"], categories: ["cs.DB", "cs.IR"] },
    detectedAt: new Date("2026-06-22T08:00:00Z"),
  },
  // ZK Proof Systems signals
  {
    source: "github",
    externalId: "github-repo-100005",
    title: "zkproof-sys/zk-toolkit",
    url: "https://github.com/zkproof-sys/zk-toolkit",
    body: "Developer toolkit for building ZK applications with Rust and WASM",
    metadata: { owner: "zkproof-sys", stars: 3100, forks: 210, topics: ["zk", "rust", "wasm", "cryptography"] },
    detectedAt: new Date("2026-06-21T14:00:00Z"),
  },
  {
    source: "accelerator",
    externalId: "acc-yc-zkproof",
    title: "ZK Proof Systems - YC S26 Batch",
    url: "https://ycombinator.com/companies/zk-proof-systems",
    body: "Selected for Y Combinator Summer 2026 batch",
    metadata: { program: "YC", batch: "S26", vertical: "Crypto" },
    detectedAt: new Date("2026-06-10T09:00:00Z"),
  },
  // ContextWindow AI signals
  {
    source: "github",
    externalId: "github-repo-100006",
    title: "contextwindow/docai",
    url: "https://github.com/contextwindow/docai",
    body: "AI-powered document understanding engine",
    metadata: { owner: "contextwindow", stars: 5500, forks: 380, topics: ["ai", "nlp", "document-ai", "rag"] },
    detectedAt: new Date("2026-06-24T11:00:00Z"),
  },
  {
    source: "huggingface",
    externalId: "hf-contextwindow-docparse",
    title: "contextwindow/doc-parser-v2",
    url: "https://huggingface.co/contextwindow/doc-parser-v2",
    body: "Document parsing model with state-of-the-art accuracy on DocVQA benchmark",
    metadata: { downloads: 120000, likes: 560 },
    detectedAt: new Date("2026-06-25T10:00:00Z"),
  },
  // Chain Core signals
  {
    source: "github",
    externalId: "github-repo-100007",
    title: "chain-core/bridge-v2",
    url: "https://github.com/chain-core/bridge-v2",
    body: "Cross-chain bridge with ZK proof verification",
    metadata: { owner: "chain-core", stars: 890, forks: 65, topics: ["bridge", "zk", "cross-chain"] },
    detectedAt: new Date("2026-06-18T08:00:00Z"),
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

  // Score each company with richer feature breakdown
  for (const company of allCompanies) {
    const companySignals = await db
      .select()
      .from(schema.signals)
      .where(eq(schema.signals.companyId, company.id));

    const signalCount = companySignals.length;

    // Compute feature scores per signal type
    let starVelocity = 0;
    let contributorGrowth = 0;
    let onchainGrowth = 0;
    let fundingSignal = 0;
    let socialMomentum = 0;
    let founderPedigree = 0;

    for (const sig of companySignals) {
      const meta = sig.metadata as Record<string, unknown> | null;

      if (sig.source === "github") {
        const stars = (meta?.stars as number) ?? 0;
        starVelocity = Math.min(100, stars / 100);
        const forks = (meta?.forks as number) ?? 0;
        contributorGrowth = Math.min(100, forks / 10);
      } else if (sig.source === "onchain") {
        const tvl = (meta?.tvl as number) ?? 0;
        onchainGrowth = Math.min(100, tvl / 200000);
      } else if (sig.source === "rss") {
        const body = sig.value?.toLowerCase() ?? "";
        if (body.includes("raise") || body.includes("series") || body.includes("funding") || body.includes("closes")) {
          fundingSignal = 80;
        }
      } else if (sig.source === "farcaster" || sig.source === "producthunt") {
        const likes = (meta?.likes as number) ?? (meta?.upvotes as number) ?? 0;
        socialMomentum = Math.max(socialMomentum, Math.min(100, likes / 15));
      } else if (sig.source === "huggingface") {
        const downloads = (meta?.downloads as number) ?? 0;
        starVelocity = Math.max(starVelocity, Math.min(100, downloads / 1500));
      } else if (sig.source === "accelerator") {
        founderPedigree = 85;
      }
    }

    // Recency bonus based on signal freshness
    const now = new Date();
    const newestSignal = companySignals.length > 0
      ? Math.max(...companySignals.map((s) => s.detectedAt.getTime()))
      : 0;
    const daysSinceNewest = newestSignal > 0
      ? (now.getTime() - newestSignal) / (1000 * 60 * 60 * 24)
      : 999;
    const recency = daysSinceNewest <= 7 ? 80 : daysSinceNewest <= 14 ? 50 : daysSinceNewest <= 30 ? 25 : 0;

    // Weighted average (AI thesis weights)
    const weights = {
      starVelocity: 0.20,
      contributorGrowth: 0.15,
      onchainGrowth: 0.05,
      fundingSignal: 0.20,
      socialMomentum: 0.15,
      recency: 0.15,
      founderPedigree: 0.10,
    };

    const baseScore = Math.round(
      (starVelocity * weights.starVelocity +
        contributorGrowth * weights.contributorGrowth +
        onchainGrowth * weights.onchainGrowth +
        fundingSignal * weights.fundingSignal +
        socialMomentum * weights.socialMomentum +
        recency * weights.recency +
        founderPedigree * weights.founderPedigree) * 100
    ) / 100;

    const tier = baseScore >= 75 ? "hot" : baseScore >= 50 ? "review" : baseScore >= 25 ? "watch" : "watch";

    const rationales: string[] = [];
    if (starVelocity > 50) rationales.push("strong GitHub traction");
    if (fundingSignal > 50) rationales.push("recent funding activity");
    if (socialMomentum > 50) rationales.push("high social engagement");
    if (onchainGrowth > 50) rationales.push("notable on-chain growth");
    if (founderPedigree > 50) rationales.push("top accelerator alumni");
    if (rationales.length === 0 && signalCount > 0) rationales.push(`${signalCount} signal(s) detected`);
    if (rationales.length === 0) rationales.push("limited signal data");

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
        rationale: rationales.join(", ").replace(/^./, (s) => s.toUpperCase()),
        featureBreakdown: {
          starVelocity: Math.round(starVelocity * 10) / 10,
          contributorGrowth: Math.round(contributorGrowth * 10) / 10,
          onchainGrowth: Math.round(onchainGrowth * 10) / 10,
          fundingSignal: Math.round(fundingSignal * 10) / 10,
          socialMomentum: Math.round(socialMomentum * 10) / 10,
          recency: Math.round(recency * 10) / 10,
          founderPedigree: Math.round(founderPedigree * 10) / 10,
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
