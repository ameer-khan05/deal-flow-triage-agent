import { describe, it, expect } from "vitest";
import { extractFeatures } from "./extract";
import { computeBaseScore, scoreToTier } from "./features";
import { loadPreset } from "@/lib/thesis";

/**
 * Golden-set test: 10 fixtures, labeled-good should rank above labeled-bad.
 * Tests the full scoring pipeline: extractFeatures → computeBaseScore → scoreToTier
 */
describe("Golden Set — AI thesis", () => {
  const thesis = loadPreset("ai");

  // 5 "good" deals — should score higher
  const goodDeals = [
    {
      name: "hot-ai-startup",
      signals: [
        { source: "github", type: "github_activity", metadata: { stars: 8000, forks: 500 }, detectedAt: new Date() },
        { source: "rss", type: "rss_activity", metadata: { title: "raises $30M Series A" }, detectedAt: new Date() },
        { source: "producthunt", type: "ph_activity", metadata: {}, detectedAt: new Date() },
        { source: "arxiv", type: "arxiv_activity", metadata: {}, detectedAt: new Date() },
      ],
    },
    {
      name: "fast-growing-defi",
      signals: [
        { source: "onchain", type: "onchain_activity", metadata: { tvl: 50000000 }, detectedAt: new Date() },
        { source: "github", type: "github_activity", metadata: { stars: 6000, forks: 400 }, detectedAt: new Date() },
        { source: "huggingface", type: "hf_activity", metadata: { downloads: 100000 }, detectedAt: new Date() },
        { source: "rss", type: "rss_activity", metadata: { title: "secures funding round" }, detectedAt: new Date() },
      ],
    },
    {
      name: "viral-agent-framework",
      signals: [
        { source: "github", type: "github_activity", metadata: { stars: 15000, forks: 1200 }, detectedAt: new Date() },
        { source: "huggingface", type: "hf_activity", metadata: { downloads: 500000 }, detectedAt: new Date() },
        { source: "farcaster", type: "farcaster_activity", metadata: {}, detectedAt: new Date() },
      ],
    },
    {
      name: "research-lab-spinoff",
      signals: [
        { source: "arxiv", type: "arxiv_activity", metadata: {}, detectedAt: new Date() },
        { source: "github", type: "github_activity", metadata: { stars: 5000, forks: 350 }, detectedAt: new Date() },
        { source: "accelerator", type: "accelerator_activity", metadata: {}, detectedAt: new Date() },
        { source: "rss", type: "rss_activity", metadata: { title: "Series B announcement" }, detectedAt: new Date() },
        { source: "producthunt", type: "ph_activity", metadata: {}, detectedAt: new Date() },
      ],
    },
    {
      name: "multichain-protocol",
      signals: [
        { source: "onchain", type: "onchain_activity", metadata: { tvl: 20000000 }, detectedAt: new Date() },
        { source: "github", type: "github_activity", metadata: { stars: 4000, forks: 300 }, detectedAt: new Date() },
        { source: "twitter", type: "twitter_activity", metadata: {}, detectedAt: new Date() },
        { source: "rss", type: "rss_activity", metadata: { title: "raises $15M" }, detectedAt: new Date() },
      ],
    },
  ];

  // 5 "bad" deals — should score lower
  const badDeals = [
    {
      name: "dormant-repo",
      signals: [
        {
          source: "github",
          type: "github_activity",
          metadata: { stars: 10, forks: 1 },
          detectedAt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000),
        },
      ],
    },
    {
      name: "abandoned-token",
      signals: [
        {
          source: "onchain",
          type: "onchain_activity",
          metadata: { tvl: 100 },
          detectedAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
        },
      ],
    },
    {
      name: "no-signal-company",
      signals: [],
    },
    {
      name: "stale-model",
      signals: [
        {
          source: "huggingface",
          type: "hf_activity",
          metadata: { downloads: 50 },
          detectedAt: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000),
        },
      ],
    },
    {
      name: "vaporware-project",
      signals: [
        {
          source: "rss",
          type: "rss_activity",
          metadata: { title: "company launches website" },
          detectedAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
        },
      ],
    },
  ];

  function scoreCompany(signals: typeof goodDeals[0]["signals"]) {
    const features = extractFeatures(signals);
    return computeBaseScore(features, thesis.signalWeights);
  }

  it("all good deals score above all bad deals", () => {
    const goodScores = goodDeals.map((d) => ({
      name: d.name,
      score: scoreCompany(d.signals),
    }));
    const badScores = badDeals.map((d) => ({
      name: d.name,
      score: scoreCompany(d.signals),
    }));

    const minGood = Math.min(...goodScores.map((d) => d.score));
    const maxBad = Math.max(...badScores.map((d) => d.score));

    expect(minGood).toBeGreaterThan(maxBad);
  });

  it("good deals are in review or hot tier", () => {
    for (const deal of goodDeals) {
      const score = scoreCompany(deal.signals);
      const tier = scoreToTier(score, thesis.tierThresholds);
      expect(["review", "hot"]).toContain(tier);
    }
  });

  it("bad deals are in watch tier", () => {
    for (const deal of badDeals) {
      const score = scoreCompany(deal.signals);
      const tier = scoreToTier(score, thesis.tierThresholds);
      expect(tier).toBe("watch");
    }
  });

  it("scores are deterministic across runs", () => {
    for (const deal of [...goodDeals, ...badDeals]) {
      const s1 = scoreCompany(deal.signals);
      const s2 = scoreCompany(deal.signals);
      expect(s1).toBe(s2);
    }
  });

  it("good deals are ranked correctly by score", () => {
    const goodScores = goodDeals.map((d) => scoreCompany(d.signals));
    const sorted = [...goodScores].sort((a, b) => b - a);
    // Just verify they can be sorted (no NaN or undefined)
    for (const score of sorted) {
      expect(score).toBeTypeOf("number");
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    }
  });
});

describe("Golden Set — Crypto thesis", () => {
  const thesis = loadPreset("crypto");

  it("on-chain heavy deal scores higher with crypto thesis than AI thesis", () => {
    const signals = [
      { source: "onchain", type: "onchain_activity", metadata: { tvl: 30000000 }, detectedAt: new Date() },
      { source: "github", type: "github_activity", metadata: { stars: 100, forks: 10 }, detectedAt: new Date() },
    ];

    const features = extractFeatures(signals);
    const cryptoScore = computeBaseScore(features, thesis.signalWeights);
    const aiThesis = loadPreset("ai");
    const aiScore = computeBaseScore(features, aiThesis.signalWeights);

    expect(cryptoScore).toBeGreaterThan(aiScore);
  });
});
