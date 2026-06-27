import type { LlmClient } from "./interface";
import { MockLlmClient } from "./mock";

export function createLlmClient(): LlmClient {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    console.info("[LLM] No ANTHROPIC_API_KEY found — using MockLlmClient");
    return new MockLlmClient();
  }

  // TODO: implement AnthropicLlmClient using @anthropic-ai/sdk
  // For now, always return mock
  console.info("[LLM] ANTHROPIC_API_KEY present — AnthropicLlmClient not yet implemented, using MockLlmClient");
  return new MockLlmClient();
}

export type { LlmClient } from "./interface";
export type {
  EntityMatchInput,
  ProfileBuildInput,
  TriageInput,
} from "./interface";
