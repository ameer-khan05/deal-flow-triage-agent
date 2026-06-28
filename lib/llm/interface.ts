import type {
  CompanyProfile,
  LlmEntityMatchResult,
  LlmTriageResult,
  FeatureBreakdown,
  Tier,
} from "@/lib/core/types";

export interface EntityMatchInput {
  signalTitle: string;
  signalBody?: string;
  signalSource: string;
  candidateName: string;
  candidateDomain?: string | null;
  candidateGithubOrg?: string | null;
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
