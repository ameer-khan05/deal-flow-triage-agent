import { describe, it, expect } from "vitest";
import { computeBaseScore, scoreToTier } from "./features";
import type { FeatureBreakdown } from "@/lib/core/types";
import type { SignalWeights, TierThresholds } from "@/lib/thesis";

describe("computeBaseScore", () => {
  const weights: SignalWeights = {
    starVelocity: 0.25,
    contributorGrowth: 0.20,
    onchainGrowth: 0.00,
    fundingSignal: 0.15,
    socialMomentum: 0.10,
    recency: 0.15,
    founderPedigree: 0.15,
  };

  it("is a pure function — same inputs produce same output", () => {
    const features: FeatureBreakdown = {
      starVelocity: 80,
      contributorGrowth: 60,
      onchainGrowth: 0,
      fundingSignal: 40,
      socialMomentum: 30,
      recency: 70,
      founderPedigree: 50,
    };
    const score1 = computeBaseScore(features, weights);
    const score2 = computeBaseScore(features, weights);
    expect(score1).toBe(score2);
  });

  it("returns 0 when all features are 0", () => {
    const features: FeatureBreakdown = {
      starVelocity: 0,
      contributorGrowth: 0,
      onchainGrowth: 0,
      fundingSignal: 0,
      socialMomentum: 0,
      recency: 0,
      founderPedigree: 0,
    };
    expect(computeBaseScore(features, weights)).toBe(0);
  });

  it("clamps score to 0-100 range", () => {
    const features: FeatureBreakdown = {
      starVelocity: 500,
      contributorGrowth: 500,
      onchainGrowth: 500,
      fundingSignal: 500,
      socialMomentum: 500,
      recency: 500,
      founderPedigree: 500,
    };
    expect(computeBaseScore(features, weights)).toBeLessThanOrEqual(100);
  });

  it("produces different scores with different weights (AC-6.3)", () => {
    const features: FeatureBreakdown = {
      starVelocity: 80,
      contributorGrowth: 60,
      onchainGrowth: 90,
      fundingSignal: 40,
      socialMomentum: 30,
      recency: 70,
      founderPedigree: 50,
    };

    const cryptoWeights: SignalWeights = {
      starVelocity: 0.10,
      contributorGrowth: 0.10,
      onchainGrowth: 0.30,
      fundingSignal: 0.15,
      socialMomentum: 0.15,
      recency: 0.10,
      founderPedigree: 0.10,
    };

    const aiWeights: SignalWeights = {
      starVelocity: 0.25,
      contributorGrowth: 0.20,
      onchainGrowth: 0.00,
      fundingSignal: 0.15,
      socialMomentum: 0.10,
      recency: 0.15,
      founderPedigree: 0.15,
    };

    const cryptoScore = computeBaseScore(features, cryptoWeights);
    const aiScore = computeBaseScore(features, aiWeights);

    expect(cryptoScore).not.toBe(aiScore);
  });
});

describe("scoreToTier", () => {
  const thresholds: TierThresholds = { watch: 30, review: 55, hot: 75 };

  it("returns 'watch' for scores below review threshold", () => {
    expect(scoreToTier(0, thresholds)).toBe("watch");
    expect(scoreToTier(29, thresholds)).toBe("watch");
    expect(scoreToTier(54, thresholds)).toBe("watch");
  });

  it("returns 'review' for scores at or above review but below hot", () => {
    expect(scoreToTier(55, thresholds)).toBe("review");
    expect(scoreToTier(74, thresholds)).toBe("review");
  });

  it("returns 'hot' for scores at or above hot threshold", () => {
    expect(scoreToTier(75, thresholds)).toBe("hot");
    expect(scoreToTier(100, thresholds)).toBe("hot");
  });
});
