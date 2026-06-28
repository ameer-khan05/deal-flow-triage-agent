import { describe, it, expect } from "vitest";
import { AcceleratorCollector } from "./accelerator";
import fixtureData from "./__fixtures__/accelerator.json";

describe("AcceleratorCollector", () => {
  it("parses fixture data into valid RawSignal[]", () => {
    const collector = new AcceleratorCollector();
    const { signals } = collector.parseResponse(fixtureData);
    expect(signals.length).toBe(3);
    for (const s of signals) {
      expect(s.source).toBe("accelerator");
      expect(s.externalId).toMatch(/^accel-/);
    }
  });

  it("captures program and batch metadata", () => {
    const collector = new AcceleratorCollector();
    const { signals } = collector.parseResponse(fixtureData);
    const meta = signals[0].metadata as Record<string, unknown>;
    expect(meta.program).toBeTruthy();
    expect(meta.batch).toBeTruthy();
  });

  it("offline fixture test — passes with no network", async () => {
    const mockFetch = async () =>
      new Response(JSON.stringify(fixtureData), { status: 200 });
    const collector = new AcceleratorCollector(mockFetch);
    const { signals } = await collector.collect(null);
    expect(signals.length).toBe(3);
  });

  it("returns empty when no fetch function", async () => {
    const collector = new AcceleratorCollector();
    const { signals } = await collector.collect(null);
    expect(signals).toEqual([]);
  });

  it("idempotent external IDs", () => {
    const collector = new AcceleratorCollector();
    const r1 = collector.parseResponse(fixtureData);
    const r2 = collector.parseResponse(fixtureData);
    expect(r1.signals.map((s) => s.externalId)).toEqual(r2.signals.map((s) => s.externalId));
  });
});
