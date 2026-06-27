import { z } from "zod";

// ─── Signal source identifiers ──────────────────────────────────────────────
export const SignalSourceSchema = z.enum([
  "github",
  "onchain",
  "huggingface",
  "arxiv",
  "accelerator",
  "producthunt",
  "farcaster",
  "rss",
  "twitter",
]);
export type SignalSource = z.infer<typeof SignalSourceSchema>;

// ─── Raw signal (collector output) ──────────────────────────────────────────
export const RawSignalSchema = z.object({
  source: SignalSourceSchema,
  externalId: z.string().min(1),
  title: z.string(),
  url: z.string().url().optional(),
  body: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
  detectedAt: z.coerce.date(),
});
export type RawSignal = z.infer<typeof RawSignalSchema>;

// ─── Company profile (enrichment output) ─────────────────────────────────────
export const CompanyProfileSchema = z.object({
  industry: z.string(),
  subSector: z.string(),
  oneLiner: z.string(),
  estimatedStage: z.string(),
  founders: z.array(z.string()),
  links: z.record(z.string().url()),
});
export type CompanyProfile = z.infer<typeof CompanyProfileSchema>;

// ─── Score tier ──────────────────────────────────────────────────────────────
export const TierSchema = z.enum(["watch", "review", "hot"]);
export type Tier = z.infer<typeof TierSchema>;

// ─── Feature breakdown (scoring input/output) ────────────────────────────────
export const FeatureBreakdownSchema = z.object({
  starVelocity: z.number().default(0),
  contributorGrowth: z.number().default(0),
  onchainGrowth: z.number().default(0),
  fundingSignal: z.number().default(0),
  socialMomentum: z.number().default(0),
  recency: z.number().default(0),
  founderPedigree: z.number().default(0),
});
export type FeatureBreakdown = z.infer<typeof FeatureBreakdownSchema>;

// ─── Scoring result ──────────────────────────────────────────────────────────
export const ScoreResultSchema = z.object({
  score: z.number().min(0).max(100),
  tier: TierSchema,
  rationale: z.string(),
  featureBreakdown: FeatureBreakdownSchema,
  keySignals: z.array(z.string()),
  suggestedAction: z.string().optional(),
});
export type ScoreResult = z.infer<typeof ScoreResultSchema>;

// ─── LLM triage output ──────────────────────────────────────────────────────
export const LlmTriageResultSchema = z.object({
  scoreAdjustment: z.number(),
  tier: TierSchema,
  rationale: z.string(),
  keySignals: z.array(z.string()),
  suggestedAction: z.string(),
});
export type LlmTriageResult = z.infer<typeof LlmTriageResultSchema>;

// ─── LLM entity match output ────────────────────────────────────────────────
export const LlmEntityMatchResultSchema = z.object({
  isSameEntity: z.boolean(),
  confidence: z.number().min(0).max(1),
  reasoning: z.string(),
});
export type LlmEntityMatchResult = z.infer<typeof LlmEntityMatchResultSchema>;

// ─── Triage decision (human feedback) ────────────────────────────────────────
export const TriageActionSchema = z.enum(["interested", "pass", "snooze"]);
export type TriageAction = z.infer<typeof TriageActionSchema>;

// ─── CRM sync record ────────────────────────────────────────────────────────
export const CrmRecordSchema = z.object({
  name: z.string(),
  sector: z.string(),
  score: z.number(),
  rationale: z.string(),
  links: z.record(z.string()).optional(),
  tier: TierSchema,
});
export type CrmRecord = z.infer<typeof CrmRecordSchema>;

// ─── Slack digest item ───────────────────────────────────────────────────────
export const SlackDigestItemSchema = z.object({
  companyName: z.string(),
  score: z.number(),
  tier: TierSchema,
  rationale: z.string(),
  dashboardUrl: z.string(),
});
export type SlackDigestItem = z.infer<typeof SlackDigestItemSchema>;
