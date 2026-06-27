import type { FeatureBreakdown } from "@/lib/core/types";

interface SignalData {
  source: string;
  type: string;
  metadata: Record<string, unknown> | null;
  detectedAt: Date;
}

export function extractFeatures(
  signals: SignalData[],
  now: Date = new Date()
): FeatureBreakdown {
  let starVelocity = 0;
  let contributorGrowth = 0;
  let onchainGrowth = 0;
  let fundingSignal = 0;
  let socialMomentum = 0;
  let recency = 0;
  let founderPedigree = 0;

  for (const signal of signals) {
    const meta = signal.metadata ?? {};

    // Star velocity from GitHub
    if (signal.source === "github") {
      const stars = (meta.stars as number) ?? 0;
      const forks = (meta.forks as number) ?? 0;
      starVelocity = Math.min(100, starVelocity + stars / 50);
      contributorGrowth = Math.min(100, contributorGrowth + forks / 10);
    }

    // On-chain growth
    if (signal.source === "onchain") {
      const tvl = (meta.tvl as number) ?? 0;
      onchainGrowth = Math.min(100, onchainGrowth + tvl / 100000);
    }

    // Funding signals from RSS/news
    if (signal.source === "rss") {
      const title = (meta.title as string) ?? "";
      const body = (meta.body as string) ?? "";
      const text = `${title} ${body}`.toLowerCase();
      if (text.includes("raise") || text.includes("funding") || text.includes("series")) {
        fundingSignal = Math.min(100, fundingSignal + 60);
      }
    }

    // Social momentum from Farcaster/Twitter/ProductHunt
    if (["farcaster", "twitter", "producthunt"].includes(signal.source)) {
      socialMomentum = Math.min(100, socialMomentum + 30);
    }

    // HuggingFace = contributor / AI signal
    if (signal.source === "huggingface") {
      contributorGrowth = Math.min(100, contributorGrowth + 25);
    }

    // arXiv = founder pedigree / research indicator
    if (signal.source === "arxiv") {
      founderPedigree = Math.min(100, founderPedigree + 20);
    }

    // Accelerator = funding signal
    if (signal.source === "accelerator") {
      fundingSignal = Math.min(100, fundingSignal + 40);
    }

    // Recency — how recent is this signal
    const daysSince =
      (now.getTime() - signal.detectedAt.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSince < 7) {
      recency = Math.min(100, recency + 30);
    } else if (daysSince < 30) {
      recency = Math.min(100, recency + 15);
    }
  }

  return {
    starVelocity: Math.round(starVelocity * 100) / 100,
    contributorGrowth: Math.round(contributorGrowth * 100) / 100,
    onchainGrowth: Math.round(onchainGrowth * 100) / 100,
    fundingSignal: Math.round(fundingSignal * 100) / 100,
    socialMomentum: Math.round(socialMomentum * 100) / 100,
    recency: Math.round(recency * 100) / 100,
    founderPedigree: Math.round(founderPedigree * 100) / 100,
  };
}
