import type {
  CompanyProfile,
  LlmEntityMatchResult,
  LlmTriageResult,
  FeatureBreakdown,
  Tier,
} from "@/lib/core/types";

export interface EntityMatchInput {
  companyA: { name: string; signals: string[] };
  companyB: { name: string; signals: string[] };
}

export interface ProfileBuildInput {
  companyName: string;
  signals: string[];
  urls: string[];
}

export interface TriageInput {
  companyName: string;
  profile: CompanyProfile;
  featureBreakdown: FeatureBreakdown;
  baseScore: number;
  baseTier: Tier;
  thesis: string;
  recentDecisions?: Array<{ company: string; action: string }>;
}

export interface LlmClient {
  entityMatch(input: EntityMatchInput): Promise<LlmEntityMatchResult>;
  buildProfile(input: ProfileBuildInput): Promise<CompanyProfile>;
  triage(input: TriageInput): Promise<LlmTriageResult>;
}
