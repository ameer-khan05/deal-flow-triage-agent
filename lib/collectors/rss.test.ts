import { describe, it, expect } from "vitest";
import { RssCollector } from "./rss";
import fixtureData from "./__fixtures__/rss.json";

describe("RssCollector", () => {
  it("parses fixture data into valid RawSignal[]", () => {
    const collector = new RssCollector();
    const { signals, nextCursor } = collector.parseResponse(fixtureData);

    expect(signals.length).toBe(4);
    expect(nextCursor).toBeTruthy();

    for (const signal of signals) {
      expect(signal.source).toBe("rss");
      expect(signal.externalId).toMatch(/^rss-/);
      expect(signal.url).toBeTruthy();
    }
  });

  it("captures RSS metadata: feedSource, categories", () => {
    const collector = new RssCollector();
    const { signals } = collector.parseResponse(fixtureData);

    const first = signals[0];
    const meta = first.metadata as Record<string, unknown>;
    expect(meta.feedSource).toBeTruthy();
    expect(meta.categories).toBeInstanceOf(Array);
    expect(meta.publishedDate).toBeTruthy();
  });

  it("sets nextCursor to latest pubDate", () => {
    const collector = new RssCollector();
    const { nextCursor } = collector.parseResponse(fixtureData);
    expect(nextCursor).toBe("2026-06-20T08:00:00Z");
  });

  it("offline fixture test — passes with no network", async () => {
    const mockFetch = async () =>
      new Response(JSON.stringify(fixtureData), { status: 200 });

    const collector = new RssCollector(mockFetch);
    const { signals } = await collector.collect(null);
    expect(signals.length).toBe(4);
  });

  it("returns empty when no fetch function", async () => {
    const collector = new RssCollector();
    const { signals } = await collector.collect(null);
    expect(signals).toEqual([]);
  });

  it("handles API errors gracefully", async () => {
    const mockFetch = async () => new Response("error", { status: 500 });
    const collector = new RssCollector(mockFetch);
    const { signals } = await collector.collect(null);
    expect(signals).toEqual([]);
  });

  it("idempotent external IDs based on link", () => {
    const collector = new RssCollector();
    const result1 = collector.parseResponse(fixtureData);
    const result2 = collector.parseResponse(fixtureData);
    const ids1 = result1.signals.map((s) => s.externalId);
    const ids2 = result2.signals.map((s) => s.externalId);
    expect(ids1).toEqual(ids2);
  });

  it("preserves article body/snippet", () => {
    const collector = new RssCollector();
    const { signals } = collector.parseResponse(fixtureData);
    expect(signals[0].body).toContain("$25M Series B");
  });
});
