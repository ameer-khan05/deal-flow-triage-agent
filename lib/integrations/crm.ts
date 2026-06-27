import type { CrmRecord } from "@/lib/core/types";

export interface CrmConnector {
  readonly name: string;

  upsertDeal(record: CrmRecord): Promise<{ id: string }>;

  isConfigured(): boolean;
}

export class AirtableCrmConnector implements CrmConnector {
  readonly name = "airtable";

  isConfigured(): boolean {
    return !!(process.env.AIRTABLE_API_KEY && process.env.AIRTABLE_BASE_ID);
  }

  async upsertDeal(record: CrmRecord): Promise<{ id: string }> {
    if (!this.isConfigured()) {
      console.warn("[CRM:Airtable] Not configured — skipping sync");
      return { id: "" };
    }
    // TODO: implement Airtable upsert using the airtable SDK
    // Must be idempotent: match on company name, update if exists, create if not
    throw new Error("AirtableCrmConnector.upsertDeal not yet implemented");
  }
}

export class NotionCrmConnector implements CrmConnector {
  readonly name = "notion";

  isConfigured(): boolean {
    return !!process.env.NOTION_TOKEN;
  }

  async upsertDeal(_record: CrmRecord): Promise<{ id: string }> {
    // TODO: implement Notion CRM sync
    throw new Error("NotionCrmConnector not yet implemented");
  }
}

export class AffinityCrmConnector implements CrmConnector {
  readonly name = "affinity";

  isConfigured(): boolean {
    return false;
  }

  async upsertDeal(_record: CrmRecord): Promise<{ id: string }> {
    // TODO: implement Affinity CRM sync
    throw new Error("AffinityCrmConnector not yet implemented");
  }
}

export function createCrmConnector(): CrmConnector {
  if (process.env.AIRTABLE_API_KEY) return new AirtableCrmConnector();
  if (process.env.NOTION_TOKEN) return new NotionCrmConnector();

  console.warn("[CRM] No CRM credentials found — CRM sync disabled");
  return new AirtableCrmConnector(); // default, will degrade gracefully
}
