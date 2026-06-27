import { describe, it, expect } from "vitest";
import { FarcasterCollector } from "./farcaster";
import fixtureData from "./__fixtures__/farcaster.json";

describe("FarcasterCollector", () => {
  it("parses fixture data into valid RawSignal[] with engagement filter", () => {
    const collector = new FarcasterCollector();
    const { signals } = collector.parseResponse(fixtureData);
    // Only casts with engagement > 50 are included
    expect(signals.length).toBeGreaterThan(0);
    for (const s of signals) {
      expect(s.source).toBe("farcaster");
      expect(s.externalId).toMatch(/^fc-/);
    }
  });

  it("captures engagement metadata", () => {
    const collector = new FarcasterCollector();
    const { signals } = collector.parseResponse(fixtureData);
    const meta = signals[0].metadata as Record<string, unknown>;
    expect(meta.likes).toBeTypeOf("number");
    expect(meta.recasts).toBeTypeOf("number");
    expect(meta.engagementScore).toBeTypeOf("number");
  });

  it("filters low-engagement casts", () => {
    const collector = new FarcasterCollector();
    const { signals } = collector.parseResponse({
      casts: [
        {
          hash: "0xlow",
          author: { fid: 1, username: "low", displayName: "Low" },
          text: "not interesting",
          timestamp: "2026-06-01T00:00:00Z",
          reactions: { likes: 2, recasts: 0 },
          replies: { count: 1 },
          embeds: [],
        },
      ],
    });
    expect(signals.length).toBe(0);
  });

  it("offline fixture test — passes with no network", async () => {
    const mockFetch = async () =>
      new Response(JSON.stringify(fixtureData), { status: 200 });
    const collector = new FarcasterCollector(mockFetch);
    const { signals } = await collector.collect(null);
    expect(signals.length).toBeGreaterThan(0);
  });

  it("returns empty when no fetch function", async () => {
    const collector = new FarcasterCollector();
    const { signals } = await collector.collect(null);
    expect(signals).toEqual([]);
  });

  it("idempotent external IDs", () => {
    const collector = new FarcasterCollector();
    const r1 = collector.parseResponse(fixtureData);
    const r2 = collector.parseResponse(fixtureData);
    expect(r1.signals.map((s) => s.externalId)).toEqual(r2.signals.map((s) => s.externalId));
  });
});
