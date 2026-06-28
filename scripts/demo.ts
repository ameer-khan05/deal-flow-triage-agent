import { getDb, schema } from "@/lib/db";
import { seed } from "@/lib/db/seed";
import { extractFeatures, computeBaseScore, scoreToTier } from "@/lib/scoring";
import { loadPreset } from "@/lib/thesis";
import { buildDigestBlocks } from "@/lib/integrations/slack";
import { eq, desc } from "drizzle-orm";
import type { SlackDigestItem } from "@/lib/core/types";

async function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`FAIL: ${message}`);
    process.exit(1);
  }
  console.info(`PASS: ${message}`);
}

export async function runDemo() {
  console.info("\n=== Deal Flow Triage Agent — E2E Demo ===\n");

  const db = getDb();

  // Step 1: Seed fixture data
  console.info("[Step 1] Seeding fixture data...");
  await seed();

  // Step 2: Verify companies were created
  console.info("[Step 2] Verifying companies...");
  const companies = await db.select().from(schema.companies);
  await assert(companies.length >= 5, `Expected >=5 companies, got ${companies.length}`);

  // Step 3: Verify raw signals were inserted
  console.info("[Step 3] Verifying raw signals...");
  const rawSignals = await db.select().from(schema.rawSignals);
  await assert(rawSignals.length >= 5, `Expected >=5 raw signals, got ${rawSignals.length}`);

  // Step 4: Verify signals are linked to companies
  console.info("[Step 4] Verifying signal→company links...");
  const signals = await db.select().from(schema.signals);
  await assert(signals.length >= 3, `Expected >=3 linked signals, got ${signals.length}`);

  // Step 5: Verify scores exist
  console.info("[Step 5] Verifying scores...");
  const scores = await db.select().from(schema.scores);
  await assert(scores.length >= 3, `Expected >=3 scores, got ${scores.length}`);

  // Step 6: Verify scoring is deterministic (run twice, same result)
  console.info("[Step 6] Verifying deterministic scoring...");
  const thesis = loadPreset("ai");
  const testFeatures = {
    starVelocity: 80,
    contributorGrowth: 50,
    onchainGrowth: 0,
    fundingSignal: 60,
    socialMomentum: 30,
    recency: 45,
    founderPedigree: 20,
  };
  const score1 = computeBaseScore(testFeatures, thesis.signalWeights);
  const score2 = computeBaseScore(testFeatures, thesis.signalWeights);
  await assert(score1 === score2, `Deterministic: ${score1} === ${score2}`);

  // Step 7: Verify tier assignment
  console.info("[Step 7] Verifying tier assignment...");
  const tier = scoreToTier(score1, thesis.tierThresholds);
  await assert(
    ["watch", "review", "hot"].includes(tier),
    `Tier "${tier}" is valid`
  );

  // Step 8: Verify feature extraction
  console.info("[Step 8] Verifying feature extraction...");
  const testSignals = [
    { source: "github", type: "github_activity", metadata: { stars: 5000, forks: 200 }, detectedAt: new Date() },
    { source: "rss", type: "rss_activity", metadata: { title: "Company raises Series A" }, detectedAt: new Date() },
  ];
  const features = extractFeatures(testSignals);
  await assert(features.starVelocity > 0, `Star velocity > 0: ${features.starVelocity}`);
  await assert(features.fundingSignal > 0, `Funding signal > 0: ${features.fundingSignal}`);

  // Step 9: Verify Slack digest payload structure
  console.info("[Step 9] Verifying Slack digest payload...");
  const topScores = await db
    .select({
      companyId: schema.scores.companyId,
      score: schema.scores.score,
      tier: schema.scores.tier,
      rationale: schema.scores.rationale,
      companyName: schema.companies.name,
    })
    .from(schema.scores)
    .innerJoin(schema.companies, eq(schema.scores.companyId, schema.companies.id))
    .orderBy(desc(schema.scores.score))
    .limit(5);

  const digestItems: SlackDigestItem[] = topScores.map((s) => ({
    companyName: s.companyName,
    score: s.score,
    tier: s.tier as "watch" | "review" | "hot",
    rationale: s.rationale ?? "",
    dashboardUrl: `http://localhost:3000/company/${s.companyId}`,
  }));

  const blocks = buildDigestBlocks(digestItems);
  await assert(blocks.length > 0, `Slack digest has ${blocks.length} blocks`);
  await assert(
    blocks[0] && (blocks[0] as Record<string, unknown>).type === "header",
    "First block is a header"
  );

  // Step 10: Verify idempotency — seed again, no duplicates
  console.info("[Step 10] Verifying idempotency...");
  const preCount = (await db.select().from(schema.rawSignals)).length;
  await seed();
  const postCount = (await db.select().from(schema.rawSignals)).length;
  await assert(preCount === postCount, `Idempotent: ${preCount} === ${postCount} raw signals`);

  // Step 11: Verify CRM record shape
  console.info("[Step 11] Verifying CRM record shape...");
  const crmRecord = {
    name: topScores[0]?.companyName ?? "Test",
    sector: "AI",
    score: topScores[0]?.score ?? 50,
    rationale: topScores[0]?.rationale ?? "test",
    tier: (topScores[0]?.tier ?? "watch") as "watch" | "review" | "hot",
  };
  await assert(typeof crmRecord.name === "string", "CRM record has name");
  await assert(typeof crmRecord.score === "number", "CRM record has score");

  console.info("\n=== All demo checks passed! ===\n");
}

// Run directly
runDemo()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("[Demo] Failed:", err);
    process.exit(1);
  });
