import type { Thesis } from "./schema";

export const cryptoPreset: Thesis = {
  name: "crypto",
  sectors: ["DeFi", "Crypto Infrastructure", "NFT", "DAO", "Web3"],
  signalWeights: {
    starVelocity: 0.10,
    contributorGrowth: 0.10,
    onchainGrowth: 0.30,
    fundingSignal: 0.15,
    socialMomentum: 0.15,
    recency: 0.10,
    founderPedigree: 0.10,
  },
  watchedTopics: ["defi", "ethereum", "solana", "zk", "layer2", "staking", "dex", "bridge", "rollup"],
  watchedOrgs: ["uniswap", "aave", "paradigm", "a16zcrypto"],
  watchedPeople: [],
  watchedWallets: [],
  tierThresholds: { watch: 30, review: 55, hot: 75 },
};

export const aiPreset: Thesis = {
  name: "ai",
  sectors: ["AI Infrastructure", "AI Application", "ML Tooling", "Foundation Models", "AI Safety"],
  signalWeights: {
    starVelocity: 0.25,
    contributorGrowth: 0.20,
    onchainGrowth: 0.00,
    fundingSignal: 0.15,
    socialMomentum: 0.10,
    recency: 0.15,
    founderPedigree: 0.15,
  },
  watchedTopics: ["llm", "transformer", "diffusion", "rlhf", "fine-tuning", "inference", "ai-agent", "rag"],
  watchedOrgs: ["openai", "anthropic", "huggingface", "google-deepmind"],
  watchedPeople: [],
  watchedWallets: [],
  tierThresholds: { watch: 25, review: 50, hot: 70 },
};

const presets: Record<string, Thesis> = {
  crypto: cryptoPreset,
  ai: aiPreset,
};

export function loadPreset(name: string): Thesis {
  const preset = presets[name];
  if (!preset) {
    throw new Error(`Unknown thesis preset: "${name}". Available: ${Object.keys(presets).join(", ")}`);
  }
  return preset;
}
