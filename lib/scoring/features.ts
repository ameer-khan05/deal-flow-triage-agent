import type { FeatureBreakdown, Tier } from "@/lib/core/types";
import type { SignalWeights, TierThresholds } from "@/lib/thesis";

/**
 * Pure, deterministic feature scorer.
 * Same inputs always produce the same score — no side effects, no randomness.
 */
export function computeBaseScore(
  features: FeatureBreakdown,
  weights: SignalWeights
): number {
  const raw =
    features.starVelocity * weights.starVelocity +
    features.contributorGrowth * weights.contributorGrowth +
    features.onchainGrowth * weights.onchainGrowth +
    features.fundingSignal * weights.fundingSignal +
    features.socialMomentum * weights.socialMomentum +
    features.recency * weights.recency +
    features.founderPedigree * weights.founderPedigree;

  return Math.round(Math.min(100, Math.max(0, raw)) * 100) / 100;
}

/**
 * Map a 0–100 score to a tier using thesis thresholds.
 */
export function scoreToTier(score: number, thresholds: TierThresholds): Tier {
  if (score >= thresholds.hot) return "hot";
  if (score >= thresholds.review) return "review";
  return "watch";
}
