import type { SignalWeights } from "./schema";
import { getDb, schema } from "@/lib/db";
import { eq, desc } from "drizzle-orm";
import { createLogger } from "@/lib/core/logger";

const log = createLogger("thesis:tuning");

interface FeedbackRecord {
  companyId: number;
  action: string;
  score: number;
  featureBreakdown: Record<string, number> | null;
}

/**
 * Collects feedback data: triage decisions paired with the score/features
 * that were active at the time of the decision.
 */
export async function collectFeedback(): Promise<FeedbackRecord[]> {
  const db = getDb();

  const decisions = await db
    .select({
      companyId: schema.triageDecisions.companyId,
      action: schema.triageDecisions.action,
    })
    .from(schema.triageDecisions);

  const results: FeedbackRecord[] = [];

  for (const decision of decisions) {
    const latestScore = await db
      .select()
      .from(schema.scores)
      .where(eq(schema.scores.companyId, decision.companyId))
      .orderBy(desc(schema.scores.createdAt))
      .limit(1);

    if (latestScore.length > 0) {
      results.push({
        companyId: decision.companyId,
        action: decision.action,
        score: latestScore[0].score,
        featureBreakdown: latestScore[0].featureBreakdown,
      });
    }
  }

  return results;
}

/**
 * Suggests weight adjustments based on feedback patterns.
 * "interested" decisions with low scores suggest the model is underweighting
 * the features that are strong in those deals. "pass" decisions with high
 * scores suggest overweighting.
 */
export function suggestWeightAdjustments(
  currentWeights: SignalWeights,
  feedback: FeedbackRecord[]
): SignalWeights {
  if (feedback.length === 0) return currentWeights;

  // Separate interested vs pass decisions
  const interested = feedback.filter((f) => f.action === "interested" && f.featureBreakdown);
  const passed = feedback.filter((f) => f.action === "pass" && f.featureBreakdown);

  if (interested.length === 0 && passed.length === 0) return currentWeights;

  const featureKeys: (keyof SignalWeights)[] = [
    "starVelocity", "contributorGrowth", "onchainGrowth",
    "fundingSignal", "socialMomentum", "recency", "founderPedigree",
  ];

  const adjustments: SignalWeights = { ...currentWeights };
  const learningRate = 0.05;

  for (const key of featureKeys) {
    // Average feature value for interested deals
    const interestedAvg = interested.length > 0
      ? interested.reduce((sum, f) => sum + (f.featureBreakdown?.[key] ?? 0), 0) / interested.length
      : 0;

    // Average feature value for passed deals
    const passedAvg = passed.length > 0
      ? passed.reduce((sum, f) => sum + (f.featureBreakdown?.[key] ?? 0), 0) / passed.length
      : 0;

    // If interested deals have higher values for this feature, boost its weight
    const diff = interestedAvg - passedAvg;
    if (Math.abs(diff) > 5) {
      const adjustment = diff > 0 ? learningRate : -learningRate;
      adjustments[key] = Math.max(0, Math.min(1, currentWeights[key] + adjustment));
    }
  }

  // Normalize so weights sum to ~1.0
  const total = featureKeys.reduce((sum, k) => sum + adjustments[k], 0);
  if (total > 0) {
    for (const key of featureKeys) {
      adjustments[key] = Math.round((adjustments[key] / total) * 1000) / 1000;
    }
  }

  log.info(`Weight suggestions: ${JSON.stringify(adjustments)}`);
  return adjustments;
}
