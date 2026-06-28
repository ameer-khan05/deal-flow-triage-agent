import type { CrmRecord } from "@/lib/core/types";
import { createLogger } from "@/lib/core/logger";

const log = createLogger("crm");

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
      log.warn("Airtable not configured — skipping sync");
      return { id: "" };
    }

    const apiKey = process.env.AIRTABLE_API_KEY!;
    const baseId = process.env.AIRTABLE_BASE_ID!;
    const tableName = process.env.AIRTABLE_TABLE_NAME ?? "Deal Pipeline";

    // Search for existing record by company name
    const searchUrl = `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(tableName)}?filterByFormula=${encodeURIComponent(`{Name}="${record.name}"`)}`;

    const searchRes = await fetch(searchUrl, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (!searchRes.ok) {
      log.warn(`Airtable search failed: ${searchRes.status}`);
      return { id: "" };
    }

    const searchData = (await searchRes.json()) as {
      records: Array<{ id: string }>;
    };

    const fields = {
      Name: record.name,
      Sector: record.sector,
      Score: record.score,
      Tier: record.tier,
      Rationale: record.rationale,
    };

    if (searchData.records.length > 0) {
      // Update existing
      const recordId = searchData.records[0].id;
      const updateRes = await fetch(
        `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(tableName)}/${recordId}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ fields }),
        }
      );

      if (!updateRes.ok) {
        log.warn(`Airtable update failed: ${updateRes.status}`);
        return { id: "" };
      }

      return { id: recordId };
    } else {
      // Create new
      const createRes = await fetch(
        `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(tableName)}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ fields }),
        }
      );

      if (!createRes.ok) {
        log.warn(`Airtable create failed: ${createRes.status}`);
        return { id: "" };
      }

      const createData = (await createRes.json()) as { id: string };
      return { id: createData.id };
    }
  }
}

export class NotionCrmConnector implements CrmConnector {
  readonly name = "notion";

  isConfigured(): boolean {
    return !!process.env.NOTION_TOKEN;
  }

  async upsertDeal(_record: CrmRecord): Promise<{ id: string }> {
    log.warn("Notion CRM connector not yet implemented");
    return { id: "" };
  }
}

export class AffinityCrmConnector implements CrmConnector {
  readonly name = "affinity";

  isConfigured(): boolean {
    return false;
  }

  async upsertDeal(_record: CrmRecord): Promise<{ id: string }> {
    log.warn("Affinity CRM connector not yet implemented");
    return { id: "" };
  }
}

export function createCrmConnector(): CrmConnector {
  if (process.env.AIRTABLE_API_KEY) return new AirtableCrmConnector();
  if (process.env.NOTION_TOKEN) return new NotionCrmConnector();

  log.warn("No CRM credentials found — CRM sync disabled");
  return new AirtableCrmConnector(); // degrades gracefully
}
