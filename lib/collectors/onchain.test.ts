import { describe, it, expect } from "vitest";
import { OnchainCollector } from "./onchain";
import rawFixture from "./__fixtures__/onchain.json";

const fixtureData = rawFixture as unknown as Parameters<InstanceType<typeof OnchainCollector>["parseResponse"]>[0];

describe("OnchainCollector", () => {
  it("parses fixture data into valid RawSignal[]", () => {
    const collector = new OnchainCollector();
    const { signals, nextCursor } = collector.parseResponse(fixtureData);

    // Only protocols with TVL > 1M and 30d change > 10% are included
    expect(signals.length).toBeGreaterThan(0);
    expect(nextCursor).toBeTruthy();

    for (const signal of signals) {
      expect(signal.source).toBe("onchain");
      expect(signal.externalId).toBeTruthy();
      expect(signal.title).toContain("TVL Growth");
    }
  });

  it("captures TVL and chain metadata", () => {
    const collector = new OnchainCollector();
    const { signals } = collector.parseResponse(fixtureData);

    for (const signal of signals) {
      const meta = signal.metadata as Record<string, unknown>;
      expect(meta.tvl).toBeTypeOf("number");
      expect(meta.chains).toBeInstanceOf(Array);
    }
  });

  it("filters out low-TVL or stagnant protocols", () => {
    const collector = new OnchainCollector();
    const { signals } = collector.parseResponse({
      protocols: [
        {
          id: "tiny",
          name: "Tiny Protocol",
          slug: "tiny",
          tvl: 500,
          chainTvls: {},
          change_1d: 0,
          change_7d: 0,
          change_1m: 0,
          chains: [],
          category: "Other",
          url: "",
        },
      ],
    });
    expect(signals.length).toBe(0);
  });

  it("offline fixture test — passes with no network", async () => {
    const mockFetch = async () =>
      new Response(JSON.stringify(fixtureData.protocols), { status: 200 });

    const collector = new OnchainCollector(mockFetch);
    const { signals } = await collector.collect(null);
    expect(signals.length).toBeGreaterThan(0);
  });

  it("handles API errors gracefully", async () => {
    const mockFetch = async () => new Response("error", { status: 500 });
    const collector = new OnchainCollector(mockFetch);
    const { signals } = await collector.collect(null);
    expect(signals).toEqual([]);
  });

  it("idempotent external IDs based on slug", () => {
    const collector = new OnchainCollector();
    const result1 = collector.parseResponse(fixtureData);
    const result2 = collector.parseResponse(fixtureData);
    const ids1 = result1.signals.map((s) => s.externalId);
    const ids2 = result2.signals.map((s) => s.externalId);
    expect(ids1).toEqual(ids2);
  });
});
