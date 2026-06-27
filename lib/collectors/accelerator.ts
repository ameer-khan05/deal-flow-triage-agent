import type { RawSignal } from "@/lib/core/types";
import { RawSignalSchema } from "@/lib/core/types";
import { createLogger } from "@/lib/core/logger";
import type { Collector, CollectorCursor } from "./interface";

const log = createLogger("collector:accelerator");

interface AcceleratorCompany {
  name: string;
  batch: string;
  program: string;
  oneLiner: string;
  url: string;
  verticals: string[];
  teamSize: number;
  launched: string;
}

interface AcceleratorResponse {
  companies: AcceleratorCompany[];
}

export class AcceleratorCollector implements Collector {
  readonly source = "accelerator";
  private fetchFn: ((url: string, init?: RequestInit) => Promise<Response>) | null;

  constructor(fetchFn?: (url: string, init?: RequestInit) => Promise<Response>) {
    this.fetchFn = fetchFn ?? null;
  }

  async collect(cursor: CollectorCursor | null): Promise<{
    signals: RawSignal[];
    nextCursor: string;
  }> {
    if (!this.fetchFn) {
      log.info("Accelerator collector: no fetch function provided, skipping");
      return { signals: [], nextCursor: cursor?.lastCursor ?? "" };
    }

    try {
      const res = await this.fetchFn("https://api.ycombinator.com/companies", {});
      if (!res.ok) {
        return { signals: [], nextCursor: cursor?.lastCursor ?? "" };
      }
      const data = (await res.json()) as AcceleratorResponse;
      return this.parseResponse(data);
    } catch (err) {
      log.warn(`Accelerator collector error: ${err}`);
      return { signals: [], nextCursor: cursor?.lastCursor ?? "" };
    }
  }

  parseResponse(data: AcceleratorResponse): {
    signals: RawSignal[];
    nextCursor: string;
  } {
    const signals: RawSignal[] = [];
    let latestDate = "";

    for (const company of data.companies) {
      const raw = {
        source: "accelerator" as const,
        externalId: `accel-${company.program.toLowerCase().replace(/\s/g, "")}-${company.batch}-${company.name.toLowerCase().replace(/\s/g, "-")}`,
        title: `${company.name} (${company.program} ${company.batch})`,
        url: company.url,
        body: company.oneLiner,
        metadata: {
          program: company.program,
          batch: company.batch,
          verticals: company.verticals,
          teamSize: company.teamSize,
        },
        detectedAt: new Date(company.launched),
      };

      const parsed = RawSignalSchema.safeParse(raw);
      if (parsed.success) {
        signals.push(parsed.data);
        if (company.launched > latestDate) latestDate = company.launched;
      }
    }

    return {
      signals,
      nextCursor: latestDate || new Date().toISOString(),
    };
  }
}
