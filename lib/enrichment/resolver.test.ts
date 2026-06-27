import { describe, it, expect } from "vitest";
import { normalizeKey, detectEarlyStealth } from "./resolver";

describe("normalizeKey", () => {
  it("lowercases and strips non-alphanumeric chars", () => {
    expect(normalizeKey("My-Company.io")).toBe("my-companyio");
    expect(normalizeKey("  Hello World  ")).toBe("helloworld");
  });
});

describe("detectEarlyStealth", () => {
  it("returns true when builder signals present but no funding/press", () => {
    expect(detectEarlyStealth(["github", "onchain"])).toBe(true);
    expect(detectEarlyStealth(["huggingface"])).toBe(true);
  });

  it("returns false when funding/press signals are present", () => {
    expect(detectEarlyStealth(["github", "rss"])).toBe(false);
    expect(detectEarlyStealth(["onchain", "accelerator"])).toBe(false);
  });

  it("returns false when no builder signals present", () => {
    expect(detectEarlyStealth(["rss"])).toBe(false);
    expect(detectEarlyStealth([])).toBe(false);
  });
});
