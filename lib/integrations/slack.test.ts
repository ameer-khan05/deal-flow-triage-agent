import { describe, it, expect } from "vitest";
import { buildDigestBlocks, buildBreakoutBlocks, MockSlackClient } from "./slack";

describe("buildDigestBlocks", () => {
  it("builds valid Block Kit payload with header (AC-8.1)", () => {
    const blocks = buildDigestBlocks([
      {
        companyName: "Acme AI",
        score: 85,
        tier: "hot",
        rationale: "Strong GitHub signal with rapid star growth",
        dashboardUrl: "http://localhost:3000/company/1",
      },
    ]);

    expect(blocks.length).toBeGreaterThan(0);
    expect(blocks[0]).toEqual({
      type: "header",
      text: { type: "plain_text", text: "Deal Flow Digest" },
    });
  });

  it("includes company info in section blocks (AC-8.2)", () => {
    const blocks = buildDigestBlocks([
      {
        companyName: "TestCo",
        score: 60,
        tier: "review",
        rationale: "Moderate signal",
        dashboardUrl: "http://localhost:3000/company/2",
      },
    ]);

    const sectionBlock = blocks.find(
      (b) => (b as Record<string, unknown>).type === "section"
    ) as Record<string, unknown>;
    expect(sectionBlock).toBeTruthy();
    const text = (sectionBlock.text as Record<string, string>).text;
    expect(text).toContain("TestCo");
    expect(text).toContain("60");
    expect(text).toContain("review");
  });

  it("handles empty items array", () => {
    const blocks = buildDigestBlocks([]);
    expect(blocks.length).toBe(2); // header + divider
  });
});

describe("buildBreakoutBlocks", () => {
  it("builds breakout alert with hot tier (AC-8.3)", () => {
    const blocks = buildBreakoutBlocks({
      companyName: "HotCo",
      score: 90,
      tier: "hot",
      rationale: "Breakout growth",
      dashboardUrl: "http://localhost:3000/company/3",
    });

    expect(blocks[0]).toEqual({
      type: "header",
      text: { type: "plain_text", text: "Breakout Alert" },
    });
    const text = ((blocks[1] as Record<string, unknown>).text as Record<string, string>).text;
    expect(text).toContain("HotCo");
    expect(text).toContain("hot");
  });
});

describe("MockSlackClient", () => {
  it("sends digest without error (AC-8.4)", async () => {
    const client = new MockSlackClient();
    await expect(
      client.sendDigest([
        {
          companyName: "Test",
          score: 50,
          tier: "watch",
          rationale: "test",
          dashboardUrl: "http://localhost:3000/company/1",
        },
      ])
    ).resolves.toBeUndefined();
  });
});
