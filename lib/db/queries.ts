import { desc, eq, and, sql } from "drizzle-orm";
import { getDb, schema } from "./index";

export interface DealFeedItem {
  companyId: number;
  companyName: string;
  industry: string | null;
  subSector: string | null;
  estimatedStage: string | null;
  oneLiner: string | null;
  domain: string | null;
  score: number;
  tier: string;
  rationale: string | null;
  topSignal: string | null;
  signalCount: number;
  isEarlyStealth: boolean | null;
  featureBreakdown: Record<string, number> | null;
}

export async function getDealFeed(filters?: {
  minScore?: number;
  sector?: string;
  stage?: string;
  signalType?: string;
}): Promise<DealFeedItem[]> {
  const db = getDb();

  // Get latest score per company with company info
  const latestScores = await db
    .select({
      companyId: schema.scores.companyId,
      score: schema.scores.score,
      tier: schema.scores.tier,
      rationale: schema.scores.rationale,
      companyName: schema.companies.name,
      industry: schema.companies.industry,
      isEarlyStealth: schema.companies.isEarlyStealth,
    })
    .from(schema.scores)
    .innerJoin(
      schema.companies,
      eq(schema.scores.companyId, schema.companies.id)
    )
    .orderBy(desc(schema.scores.score));

  // Deduplicate to latest score per company
  const seen = new Set<number>();
  const results: DealFeedItem[] = [];

  for (const row of latestScores) {
    if (seen.has(row.companyId)) continue;
    seen.add(row.companyId);

    // Apply filters
    if (filters?.minScore && row.score < filters.minScore) continue;
    if (filters?.sector && row.industry !== filters.sector) continue;

    // Get top signal for this company
    const topSignals = await db
      .select({ value: schema.signals.value })
      .from(schema.signals)
      .where(eq(schema.signals.companyId, row.companyId))
      .limit(1);

    // Get signal count for this company
    const signalCountResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(schema.signals)
      .where(eq(schema.signals.companyId, row.companyId));

    // Get feature breakdown from latest score
    const latestScoreRow = await db
      .select({ featureBreakdown: schema.scores.featureBreakdown })
      .from(schema.scores)
      .where(eq(schema.scores.companyId, row.companyId))
      .orderBy(desc(schema.scores.createdAt))
      .limit(1);

    // Get company details for extra fields
    const companyDetails = await db
      .select({
        subSector: schema.companies.subSector,
        estimatedStage: schema.companies.estimatedStage,
        oneLiner: schema.companies.oneLiner,
        domain: schema.companies.domain,
      })
      .from(schema.companies)
      .where(eq(schema.companies.id, row.companyId))
      .limit(1);

    results.push({
      companyId: row.companyId,
      companyName: row.companyName,
      industry: row.industry,
      subSector: companyDetails[0]?.subSector ?? null,
      estimatedStage: companyDetails[0]?.estimatedStage ?? null,
      oneLiner: companyDetails[0]?.oneLiner ?? null,
      domain: companyDetails[0]?.domain ?? null,
      score: row.score,
      tier: row.tier,
      rationale: row.rationale,
      topSignal: topSignals[0]?.value ?? null,
      signalCount: signalCountResult[0]?.count ?? 0,
      isEarlyStealth: row.isEarlyStealth,
      featureBreakdown: latestScoreRow[0]?.featureBreakdown ?? null,
    });
  }

  return results;
}

export interface CompanyDetail {
  id: number;
  name: string;
  domain: string | null;
  githubOrg: string | null;
  industry: string | null;
  subSector: string | null;
  oneLiner: string | null;
  estimatedStage: string | null;
  founders: string[] | null;
  links: Record<string, string> | null;
  isEarlyStealth: boolean | null;
  signals: Array<{
    id: number;
    source: string;
    type: string;
    value: string | null;
    detectedAt: Date;
  }>;
  scoreHistory: Array<{
    id: number;
    score: number;
    tier: string;
    rationale: string | null;
    featureBreakdown: Record<string, number> | null;
    createdAt: Date;
  }>;
}

export async function getCompanyDetail(
  companyId: number
): Promise<CompanyDetail | null> {
  const db = getDb();

  const companies = await db
    .select()
    .from(schema.companies)
    .where(eq(schema.companies.id, companyId))
    .limit(1);

  if (companies.length === 0) return null;

  const company = companies[0];

  const signals = await db
    .select()
    .from(schema.signals)
    .where(eq(schema.signals.companyId, companyId))
    .orderBy(desc(schema.signals.detectedAt));

  const scoreHistory = await db
    .select()
    .from(schema.scores)
    .where(eq(schema.scores.companyId, companyId))
    .orderBy(desc(schema.scores.createdAt));

  return {
    ...company,
    signals: signals.map((s) => ({
      id: s.id,
      source: s.source,
      type: s.type,
      value: s.value,
      detectedAt: s.detectedAt,
    })),
    scoreHistory: scoreHistory.map((s) => ({
      id: s.id,
      score: s.score,
      tier: s.tier,
      rationale: s.rationale,
      featureBreakdown: s.featureBreakdown,
      createdAt: s.createdAt,
    })),
  };
}

export async function createTriageDecision(
  companyId: number,
  action: string,
  userId?: number,
  notes?: string
) {
  const db = getDb();
  await db.insert(schema.triageDecisions).values({
    companyId,
    userId: userId ?? null,
    action,
    notes: notes ?? null,
  });
}

export async function getPassedCompanyIds(): Promise<number[]> {
  const db = getDb();
  const decisions = await db
    .select({ companyId: schema.triageDecisions.companyId })
    .from(schema.triageDecisions)
    .where(eq(schema.triageDecisions.action, "pass"));

  return [...new Set(decisions.map((d) => d.companyId))];
}

export async function addToWatchlist(watchlistId: number, companyId: number) {
  const db = getDb();
  await db
    .insert(schema.watchlistCompanies)
    .values({ watchlistId, companyId })
    .onConflictDoNothing();
}

export async function removeFromWatchlist(
  watchlistId: number,
  companyId: number
) {
  const db = getDb();
  await db
    .delete(schema.watchlistCompanies)
    .where(
      and(
        eq(schema.watchlistCompanies.watchlistId, watchlistId),
        eq(schema.watchlistCompanies.companyId, companyId)
      )
    );
}
