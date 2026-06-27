import { z } from "zod";

export const SignalWeightsSchema = z.object({
  starVelocity: z.number().min(0).max(1),
  contributorGrowth: z.number().min(0).max(1),
  onchainGrowth: z.number().min(0).max(1),
  fundingSignal: z.number().min(0).max(1),
  socialMomentum: z.number().min(0).max(1),
  recency: z.number().min(0).max(1),
  founderPedigree: z.number().min(0).max(1),
});
export type SignalWeights = z.infer<typeof SignalWeightsSchema>;

export const TierThresholdsSchema = z.object({
  watch: z.number().min(0).max(100),
  review: z.number().min(0).max(100),
  hot: z.number().min(0).max(100),
}).refine(
  (t) => t.watch < t.review && t.review < t.hot,
  { message: "Thresholds must be ordered: watch < review < hot" }
);
export type TierThresholds = z.infer<typeof TierThresholdsSchema>;

export const ThesisSchema = z.object({
  name: z.string().min(1),
  sectors: z.array(z.string().min(1)).min(1),
  signalWeights: SignalWeightsSchema,
  watchedTopics: z.array(z.string()),
  watchedOrgs: z.array(z.string()),
  watchedPeople: z.array(z.string()),
  watchedWallets: z.array(z.string()),
  tierThresholds: TierThresholdsSchema,
});
export type Thesis = z.infer<typeof ThesisSchema>;
