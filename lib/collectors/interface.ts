import type { RawSignal } from "@/lib/core/types";

export interface CollectorCursor {
  source: string;
  lastCursor: string;
  updatedAt: Date;
}

export interface Collector {
  readonly source: string;

  collect(cursor: CollectorCursor | null): Promise<{
    signals: RawSignal[];
    nextCursor: string;
  }>;
}
