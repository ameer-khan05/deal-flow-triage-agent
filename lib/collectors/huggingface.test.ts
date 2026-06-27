import { describe, it, expect } from "vitest";
import { HuggingFaceCollector } from "./huggingface";
import fixtureData from "./__fixtures__/huggingface.json";

describe("HuggingFaceCollector", () => {
  it("parses fixture data into valid RawSignal[]", () => {
    const collector = new HuggingFaceCollector();
    const { signals, nextCursor } = collector.parseResponse(fixtureData);

    expect(signals.length).toBe(3);
    expect(nextCursor).toBeTruthy();

    for (const signal of signals) {
      expect(signal.source).toBe("huggingface");
      expect(signal.externalId).toMatch(/^hf-model-/);
    }
  });

  it("captures model metadata: author, downloads, likes, tags", () => {
    const collector = new HuggingFaceCollector();
    const { signals } = collector.parseResponse(fixtureData);

    const first = signals[0];
    const meta = first.metadata as Record<string, unknown>;
    expect(meta.author).toBeTruthy();
    expect(meta.downloads).toBeTypeOf("number");
    expect(meta.likes).toBeTypeOf("number");
    expect(meta.tags).toBeInstanceOf(Array);
  });

  it("sets nextCursor to latest lastModified date", () => {
    const collector = new HuggingFaceCollector();
    const { nextCursor } = collector.parseResponse(fixtureData);
    expect(nextCursor).toBe("2026-06-20T12:00:00Z");
  });

  it("skips private models", () => {
    const collector = new HuggingFaceCollector();
    const { signals } = collector.parseResponse({
      models: [
        {
          modelId: "secret/model",
          author: "secret",
          downloads: 100,
          likes: 5,
          tags: [],
          lastModified: "2026-06-01T00:00:00Z",
          pipeline_tag: null,
          private: true,
        },
      ],
    });
    expect(signals.length).toBe(0);
  });

  it("offline fixture test — passes with no network", async () => {
    const mockFetch = async () =>
      new Response(JSON.stringify(fixtureData.models), { status: 200 });

    const collector = new HuggingFaceCollector(mockFetch);
    const { signals } = await collector.collect(null);
    expect(signals.length).toBe(3);
  });

  it("handles API errors gracefully", async () => {
    const mockFetch = async () => new Response("error", { status: 500 });
    const collector = new HuggingFaceCollector(mockFetch);
    const { signals } = await collector.collect(null);
    expect(signals).toEqual([]);
  });

  it("idempotent external IDs based on modelId", () => {
    const collector = new HuggingFaceCollector();
    const result1 = collector.parseResponse(fixtureData);
    const result2 = collector.parseResponse(fixtureData);
    const ids1 = result1.signals.map((s) => s.externalId);
    const ids2 = result2.signals.map((s) => s.externalId);
    expect(ids1).toEqual(ids2);
  });
});
