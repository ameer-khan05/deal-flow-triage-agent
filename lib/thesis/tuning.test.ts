import { describe, it, expect } from "vitest";
import { suggestWeightAdjustments } from "./tuning";

describe("suggestWeightAdjustments", () => {
  const baseWeights = {
    starVelocity: 0.25,
    contributorGrowth: 0.20,
    onchainGrowth: 0.00,
    fundingSignal: 0.15,
    socialMomentum: 0.10,
    recency: 0.15,
    founderPedigree: 0.15,
  };

  it("returns current weights when no feedback", () => {
    const result = suggestWeightAdjustments(baseWeights, []);
    expect(result).toEqual(baseWeights);
  });

  it("boosts weights for features strong in interested deals", () => {
    const feedback = [
      {
        companyId: 1,
        action: "interested",
        score: 80,
        featureBreakdown: {
          starVelocity: 90, contributorGrowth: 70,
          onchainGrowth: 0, fundingSignal: 80,
          socialMomentum: 30, recency: 60, founderPedigree: 50,
        },
      },
      {
        companyId: 2,
        action: "pass",
        score: 40,
        featureBreakdown: {
          starVelocity: 10, contributorGrowth: 5,
          onchainGrowth: 0, fundingSignal: 0,
          socialMomentum: 5, recency: 10, founderPedigree: 0,
        },
      },
    ];

    const result = suggestWeightAdjustments(baseWeights, feedback);

    // starVelocity should increase (90 vs 10)
    expect(result.starVelocity).toBeGreaterThan(0);
    // All weights should be normalized (sum ~= 1)
    const total = Object.values(result).reduce((a, b) => a + b, 0);
    expect(total).toBeCloseTo(1.0, 1);
  });

  it("produces valid weights (all >= 0, all <= 1)", () => {
    const feedback = [
      {
        companyId: 1,
        action: "interested",
        score: 50,
        featureBreakdown: {
          starVelocity: 100, contributorGrowth: 0,
          onchainGrowth: 100, fundingSignal: 0,
          socialMomentum: 0, recency: 0, founderPedigree: 0,
        },
      },
    ];

    const result = suggestWeightAdjustments(baseWeights, feedback);
    for (const v of Object.values(result)) {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(1);
    }
  });
});
