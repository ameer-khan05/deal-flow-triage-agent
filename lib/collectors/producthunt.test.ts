import { describe, it, expect } from "vitest";
import { ProductHuntCollector } from "./producthunt";
import fixtureData from "./__fixtures__/producthunt.json";

describe("ProductHuntCollector", () => {
  it("parses fixture data into valid RawSignal[]", () => {
    const collector = new ProductHuntCollector();
    const { signals } = collector.parseResponse(fixtureData);
    expect(signals.length).toBe(2);
    for (const s of signals) {
      expect(s.source).toBe("producthunt");
      expect(s.externalId).toMatch(/^ph-/);
    }
  });

  it("captures votes and topics metadata", () => {
    const collector = new ProductHuntCollector();
    const { signals } = collector.parseResponse(fixtureData);
    const meta = signals[0].metadata as Record<string, unknown>;
    expect(meta.votes).toBeTypeOf("number");
    expect(meta.topics).toBeInstanceOf(Array);
  });

  it("offline fixture test — passes with no network", async () => {
    const mockFetch = async () =>
      new Response(JSON.stringify(fixtureData), { status: 200 });
    const collector = new ProductHuntCollector(mockFetch);
    const { signals } = await collector.collect(null);
    expect(signals.length).toBe(2);
  });

  it("returns empty when no fetch function", async () => {
    const collector = new ProductHuntCollector();
    const { signals } = await collector.collect(null);
    expect(signals).toEqual([]);
  });

  it("idempotent external IDs", () => {
    const collector = new ProductHuntCollector();
    const r1 = collector.parseResponse(fixtureData);
    const r2 = collector.parseResponse(fixtureData);
    expect(r1.signals.map((s) => s.externalId)).toEqual(r2.signals.map((s) => s.externalId));
  });
});
