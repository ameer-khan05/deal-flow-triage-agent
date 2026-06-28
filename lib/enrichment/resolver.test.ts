import { describe, it, expect } from "vitest";
import { normalizeKey, detectEarlyStealth, extractGithubOrg, extractDomain } from "./resolver";

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

describe("extractGithubOrg", () => {
  it("extracts owner from metadata", () => {
    expect(extractGithubOrg({ owner: "acme-ai" })).toBe("acme-ai");
  });

  it("normalizes the org name", () => {
    expect(extractGithubOrg({ owner: "Acme-AI" })).toBe("acme-ai");
  });

  it("returns null when no owner", () => {
    expect(extractGithubOrg({})).toBeNull();
    expect(extractGithubOrg(undefined)).toBeNull();
  });
});

describe("extractDomain", () => {
  it("extracts domain from URL", () => {
    expect(extractDomain("https://acme-ai.com/about")).toBe("acme-ai.com");
  });

  it("strips www prefix", () => {
    expect(extractDomain("https://www.example.com")).toBe("example.com");
  });

  it("returns null for invalid URLs", () => {
    expect(extractDomain("not-a-url")).toBeNull();
    expect(extractDomain(undefined)).toBeNull();
  });
});
