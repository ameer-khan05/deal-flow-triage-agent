import type {
  CompanyProfile,
  LlmEntityMatchResult,
  LlmTriageResult,
} from "@/lib/core/types";
import type {
  LlmClient,
  EntityMatchInput,
  ProfileBuildInput,
  TriageInput,
} from "./interface";

export class MockLlmClient implements LlmClient {
  async entityMatch(_input: EntityMatchInput): Promise<LlmEntityMatchResult> {
    return {
      isSameEntity: false,
      confidence: 0.5,
      reasoning: "Mock: defaulting to separate entities",
    };
  }

  async buildProfile(input: ProfileBuildInput): Promise<CompanyProfile> {
    return {
      industry: "Technology",
      subSector: "General",
      oneLiner: `${input.companyName} is an emerging technology company.`,
      estimatedStage: "Seed",
      founders: [],
      links: {},
    };
  }

  async triage(input: TriageInput): Promise<LlmTriageResult> {
    return {
      scoreAdjustment: 0,
      tier: input.baseTier,
      rationale: "auto (LLM unavailable)",
      keySignals: [],
      suggestedAction: "Monitor",
    };
  }
}
