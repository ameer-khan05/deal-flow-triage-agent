import { describe, it, expect } from "vitest";
import { ArxivCollector } from "./arxiv";
import fixtureData from "./__fixtures__/arxiv.json";

describe("ArxivCollector", () => {
  it("parses fixture data into valid RawSignal[]", () => {
    const collector = new ArxivCollector();
    const { signals } = collector.parseResponse(fixtureData);
    expect(signals.length).toBe(3);
    for (const s of signals) {
      expect(s.source).toBe("arxiv");
      expect(s.externalId).toMatch(/^arxiv-/);
    }
  });

  it("captures author and category metadata", () => {
    const collector = new ArxivCollector();
    const { signals } = collector.parseResponse(fixtureData);
    const meta = signals[0].metadata as Record<string, unknown>;
    expect(meta.authors).toBeInstanceOf(Array);
    expect(meta.categories).toBeInstanceOf(Array);
  });

  it("offline fixture test — passes with no network", async () => {
    const mockFetch = async () =>
      new Response(JSON.stringify(fixtureData), { status: 200 });
    const collector = new ArxivCollector(mockFetch);
    const { signals } = await collector.collect(null);
    expect(signals.length).toBe(3);
  });

  it("returns empty when no fetch function", async () => {
    const collector = new ArxivCollector();
    const { signals } = await collector.collect(null);
    expect(signals).toEqual([]);
  });

  it("idempotent external IDs", () => {
    const collector = new ArxivCollector();
    const r1 = collector.parseResponse(fixtureData);
    const r2 = collector.parseResponse(fixtureData);
    expect(r1.signals.map((s) => s.externalId)).toEqual(r2.signals.map((s) => s.externalId));
  });
});
