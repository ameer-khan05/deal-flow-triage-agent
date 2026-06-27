import type { RawSignal } from "@/lib/core/types";
import { RawSignalSchema } from "@/lib/core/types";
import { createLogger } from "@/lib/core/logger";
import type { Collector, CollectorCursor } from "./interface";

const log = createLogger("collector:huggingface");

interface HFModel {
  modelId: string;
  author: string;
  downloads: number;
  likes: number;
  tags: string[];
  lastModified: string;
  pipeline_tag: string | null;
  private: boolean;
}

interface HFResponse {
  models: HFModel[];
}

export class HuggingFaceCollector implements Collector {
  readonly source = "huggingface";
  private fetchFn: (url: string, init?: RequestInit) => Promise<Response>;

  constructor(fetchFn?: (url: string, init?: RequestInit) => Promise<Response>) {
    this.fetchFn = fetchFn ?? globalThis.fetch.bind(globalThis);
  }

  async collect(cursor: CollectorCursor | null): Promise<{
    signals: RawSignal[];
    nextCursor: string;
  }> {
    try {
      const res = await this.fetchFn(
        "https://huggingface.co/api/models?sort=downloads&direction=-1&limit=30",
        { headers: { Accept: "application/json" } }
      );

      if (!res.ok) {
        log.warn(`HuggingFace API error: ${res.status}`);
        return { signals: [], nextCursor: cursor?.lastCursor ?? "" };
      }

      const models = (await res.json()) as HFModel[];
      return this.parseResponse({ models });
    } catch (err) {
      log.warn(`HuggingFace collector error: ${err}`);
      return { signals: [], nextCursor: cursor?.lastCursor ?? "" };
    }
  }

  parseResponse(data: HFResponse): {
    signals: RawSignal[];
    nextCursor: string;
  } {
    const signals: RawSignal[] = [];
    let latestDate = "";

    for (const model of data.models) {
      if (model.private) continue;

      const raw = {
        source: "huggingface" as const,
        externalId: `hf-model-${model.modelId.replace("/", "-")}`,
        title: model.modelId,
        url: `https://huggingface.co/${model.modelId}`,
        body: `Downloads: ${model.downloads}, Likes: ${model.likes}`,
        metadata: {
          author: model.author,
          downloads: model.downloads,
          likes: model.likes,
          tags: model.tags,
          pipelineTag: model.pipeline_tag,
        },
        detectedAt: new Date(model.lastModified),
      };

      const parsed = RawSignalSchema.safeParse(raw);
      if (parsed.success) {
        signals.push(parsed.data);
        if (model.lastModified > latestDate) latestDate = model.lastModified;
      }
    }

    return {
      signals,
      nextCursor: latestDate || new Date().toISOString(),
    };
  }
}
