import { describe, it, expect } from "vitest";
import { extractFeatures } from "./extract";

describe("extractFeatures", () => {
  it("extracts star velocity from GitHub signals", () => {
    const result = extractFeatures([
      { source: "github", type: "github_activity", metadata: { stars: 5000, forks: 200 }, detectedAt: new Date() },
    ]);
    expect(result.starVelocity).toBeGreaterThan(0);
    expect(result.contributorGrowth).toBeGreaterThan(0);
  });

  it("extracts onchain growth from onchain signals", () => {
    const result = extractFeatures([
      { source: "onchain", type: "onchain_activity", metadata: { tvl: 10000000 }, detectedAt: new Date() },
    ]);
    expect(result.onchainGrowth).toBeGreaterThan(0);
  });

  it("detects funding signal from RSS keywords", () => {
    const result = extractFeatures([
      { source: "rss", type: "rss_activity", metadata: { title: "Company raises Series A" }, detectedAt: new Date() },
    ]);
    expect(result.fundingSignal).toBeGreaterThan(0);
  });

  it("detects social momentum from farcaster/producthunt", () => {
    const result = extractFeatures([
      { source: "farcaster", type: "farcaster_activity", metadata: {}, detectedAt: new Date() },
      { source: "producthunt", type: "producthunt_activity", metadata: {}, detectedAt: new Date() },
    ]);
    expect(result.socialMomentum).toBeGreaterThan(0);
  });

  it("assigns high recency for recent signals", () => {
    const result = extractFeatures([
      { source: "github", type: "github_activity", metadata: { stars: 100 }, detectedAt: new Date() },
    ]);
    expect(result.recency).toBeGreaterThan(0);
  });

  it("assigns lower recency for older signals", () => {
    const oldDate = new Date();
    oldDate.setDate(oldDate.getDate() - 60);
    const result = extractFeatures([
      { source: "github", type: "github_activity", metadata: { stars: 100 }, detectedAt: oldDate },
    ]);
    expect(result.recency).toBe(0);
  });

  it("returns all-zero for empty signals", () => {
    const result = extractFeatures([]);
    expect(result.starVelocity).toBe(0);
    expect(result.onchainGrowth).toBe(0);
    expect(result.fundingSignal).toBe(0);
    expect(result.socialMomentum).toBe(0);
    expect(result.recency).toBe(0);
  });

  it("caps values at 100", () => {
    const result = extractFeatures([
      { source: "github", type: "github_activity", metadata: { stars: 100000, forks: 50000 }, detectedAt: new Date() },
    ]);
    expect(result.starVelocity).toBeLessThanOrEqual(100);
    expect(result.contributorGrowth).toBeLessThanOrEqual(100);
  });

  it("detects arXiv as founder pedigree", () => {
    const result = extractFeatures([
      { source: "arxiv", type: "arxiv_activity", metadata: {}, detectedAt: new Date() },
    ]);
    expect(result.founderPedigree).toBeGreaterThan(0);
  });

  it("detects accelerator as funding signal", () => {
    const result = extractFeatures([
      { source: "accelerator", type: "accelerator_activity", metadata: {}, detectedAt: new Date() },
    ]);
    expect(result.fundingSignal).toBeGreaterThan(0);
  });
});
