import { describe, it, expect } from "vitest";
import { ThesisSchema } from "./schema";
import { cryptoPreset, aiPreset, loadPreset } from "./presets";

describe("thesis presets", () => {
  it("crypto and ai presets both validate against ThesisSchema", () => {
    expect(() => ThesisSchema.parse(cryptoPreset)).not.toThrow();
    expect(() => ThesisSchema.parse(aiPreset)).not.toThrow();
  });

  it("crypto and ai have different signalWeights (AC-3.2)", () => {
    expect(cryptoPreset.signalWeights).not.toEqual(aiPreset.signalWeights);
  });

  it("crypto and ai have different watchedTopics (AC-3.2)", () => {
    expect(cryptoPreset.watchedTopics).not.toEqual(aiPreset.watchedTopics);
  });

  it("loadPreset returns the correct preset by name", () => {
    expect(loadPreset("crypto")).toEqual(cryptoPreset);
    expect(loadPreset("ai")).toEqual(aiPreset);
  });

  it("loadPreset throws for unknown preset names", () => {
    expect(() => loadPreset("unknown")).toThrow("Unknown thesis preset");
  });

  it("invalid thesis fails validation with descriptive error (AC-3.3)", () => {
    const invalid = {
      ...cryptoPreset,
      sectors: [],
    };
    const result = ThesisSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it("rejects thresholds not in order (watch < review < hot)", () => {
    const invalid = {
      ...cryptoPreset,
      tierThresholds: { watch: 80, review: 50, hot: 30 },
    };
    const result = ThesisSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });
});
