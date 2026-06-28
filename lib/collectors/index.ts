export type { Collector, CollectorCursor } from "./interface";
export { GitHubCollector } from "./github";
export { OnchainCollector } from "./onchain";
export { HuggingFaceCollector } from "./huggingface";
export { RssCollector } from "./rss";
export { ArxivCollector } from "./arxiv";
export { AcceleratorCollector } from "./accelerator";
export { ProductHuntCollector } from "./producthunt";
export { FarcasterCollector } from "./farcaster";
export { TwitterCollector } from "./twitter";

import type { Collector } from "./interface";
import { GitHubCollector } from "./github";
import { OnchainCollector } from "./onchain";
import { HuggingFaceCollector } from "./huggingface";
import { RssCollector } from "./rss";
import { ArxivCollector } from "./arxiv";
import { AcceleratorCollector } from "./accelerator";
import { ProductHuntCollector } from "./producthunt";
import { FarcasterCollector } from "./farcaster";
import { TwitterCollector } from "./twitter";

export function getAllCollectors(): Collector[] {
  const collectors: Collector[] = [
    new GitHubCollector(),
    new OnchainCollector(),
    new HuggingFaceCollector(),
    new RssCollector(),
    new ArxivCollector(),
    new AcceleratorCollector(),
    new ProductHuntCollector(),
    new FarcasterCollector(),
  ];

  // Twitter is opt-in
  if (process.env.ENABLE_TWITTER_COLLECTOR === "1") {
    collectors.push(new TwitterCollector());
  }

  return collectors;
}
