import { inngest } from "./client";
import { getDb, schema } from "@/lib/db";
import { getAllCollectors } from "@/lib/collectors";
import { resolveEntity } from "@/lib/enrichment";
import { extractFeatures, computeBaseScore, scoreToTier } from "@/lib/scoring";
import { createLlmClient } from "@/lib/llm";
import { createSlackClient } from "@/lib/integrations/slack";
import { createCrmConnector } from "@/lib/integrations/crm";
import { loadPreset } from "@/lib/thesis";
import { eq, desc } from "drizzle-orm";
import type { SlackDigestItem, CrmRecord } from "@/lib/core/types";
import { createLogger } from "@/lib/core/logger";

const log = createLogger("pipeline");

const pipelineRun = inngest.createFunction(
  {
    id: "pipeline-run",
    name: "Deal Flow Pipeline",
  },
  { cron: "0 6 * * *" },
  async ({ step }) => {
    const thesisName = process.env.THESIS_PRESET ?? "ai";

    // Step 1: Collect from all sources
    const collectResult = await step.run("collect", async () => {
      const db = getDb();
      const collectors = getAllCollectors();
      let totalCollected = 0;

      for (const collector of collectors) {
        try {
          // Get cursor for this source
          const cursorRow = await db
            .select()
            .from(schema.collectorCursors)
            .where(eq(schema.collectorCursors.source, collector.source))
            .limit(1);

          const cursor = cursorRow.length > 0
            ? { source: collector.source, lastCursor: cursorRow[0].lastCursor, updatedAt: cursorRow[0].updatedAt }
            : null;

          const { signals, nextCursor } = await collector.collect(cursor);

          // Insert raw signals (idempotent via unique constraint)
          for (const signal of signals) {
            await db
              .insert(schema.rawSignals)
              .values({
                source: signal.source,
                externalId: signal.externalId,
                title: signal.title,
                url: signal.url,
                body: signal.body,
                metadata: signal.metadata,
                detectedAt: signal.detectedAt,
              })
              .onConflictDoNothing();
          }

          // Update cursor
          if (nextCursor) {
            await db
              .insert(schema.collectorCursors)
              .values({ source: collector.source, lastCursor: nextCursor })
              .onConflictDoUpdate({
                target: schema.collectorCursors.source,
                set: { lastCursor: nextCursor, updatedAt: new Date() },
              });
          }

          totalCollected += signals.length;
          log.info(`${collector.source}: collected ${signals.length} signals`);
        } catch (err) {
          log.warn(`Collector ${collector.source} failed: ${err}`);
          // Individual collector failure does NOT fail the pipeline
        }
      }

      return { collected: totalCollected };
    });

    // Step 2: Enrich — resolve entities + link signals to companies
    const enrichResult = await step.run("enrich", async () => {
      const db = getDb();
      const llm = createLlmClient();
      let enriched = 0;

      // Get unlinked raw signals (no matching signal row yet)
      const allRawSignals = await db.select().from(schema.rawSignals);

      for (const raw of allRawSignals) {
        // Check if already linked
        const existingLink = await db
          .select()
          .from(schema.signals)
          .where(eq(schema.signals.rawSignalId, raw.id))
          .limit(1);

        if (existingLink.length > 0) continue;

        const resolved = await resolveEntity(
          {
            source: raw.source,
            externalId: raw.externalId,
            title: raw.title,
            url: raw.url ?? undefined,
            body: raw.body ?? undefined,
            metadata: raw.metadata as Record<string, unknown> | undefined,
          },
          llm
        );

        let companyId = resolved.companyId;

        // Create company if new
        if (resolved.isNew && !companyId) {
          const meta = raw.metadata as Record<string, unknown> | null;
          const inserted = await db
            .insert(schema.companies)
            .values({
              name: resolved.companyName,
              githubOrg: meta?.owner as string | undefined,
              industry: "Unknown",
              isEarlyStealth: false,
            })
            .returning({ id: schema.companies.id });

          companyId = inserted[0].id;
        }

        if (companyId) {
          await db.insert(schema.signals).values({
            rawSignalId: raw.id,
            companyId,
            source: raw.source,
            type: `${raw.source}_activity`,
            value: raw.title,
            metadata: raw.metadata,
            detectedAt: raw.detectedAt,
          });
          enriched++;
        }
      }

      return { enriched };
    });

    // Step 3: Score all companies
    const scoreResult = await step.run("score", async () => {
      const db = getDb();
      const thesis = loadPreset(thesisName);
      const llm = createLlmClient();
      let scored = 0;

      const allCompanies = await db.select().from(schema.companies);

      for (const company of allCompanies) {
        const companySignals = await db
          .select()
          .from(schema.signals)
          .where(eq(schema.signals.companyId, company.id));

        if (companySignals.length === 0) continue;

        const features = extractFeatures(
          companySignals.map((s) => ({
            source: s.source,
            type: s.type,
            metadata: s.metadata as Record<string, unknown> | null,
            detectedAt: s.detectedAt,
          }))
        );

        const baseScore = computeBaseScore(features, thesis.signalWeights);
        const baseTier = scoreToTier(baseScore, thesis.tierThresholds);

        // LLM triage (optional layer)
        const triageResult = await llm.triage({
          companyName: company.name,
          profile: {
            industry: company.industry ?? "Unknown",
            subSector: company.subSector ?? "Unknown",
            oneLiner: company.oneLiner ?? "",
            estimatedStage: company.estimatedStage ?? "Unknown",
            founders: (company.founders as string[]) ?? [],
            links: (company.links as Record<string, string>) ?? {},
          },
          featureBreakdown: features,
          baseScore,
          baseTier,
          thesis: thesisName,
        });

        const finalScore = Math.min(100, Math.max(0, baseScore + triageResult.scoreAdjustment));
        const finalTier = triageResult.tier;

        await db.insert(schema.scores).values({
          companyId: company.id,
          score: finalScore,
          tier: finalTier,
          rationale: triageResult.rationale,
          featureBreakdown: features,
          thesisName,
        });

        scored++;
      }

      return { scored };
    });

    // Step 4: Notify — Slack digest + CRM sync
    const notifyResult = await step.run("notify", async () => {
      const db = getDb();
      const slack = createSlackClient();
      const crm = createCrmConnector();
      let notified = 0;

      // Get top scored companies (latest scores)
      const topScores = await db
        .select({
          companyId: schema.scores.companyId,
          score: schema.scores.score,
          tier: schema.scores.tier,
          rationale: schema.scores.rationale,
          companyName: schema.companies.name,
          industry: schema.companies.industry,
        })
        .from(schema.scores)
        .innerJoin(schema.companies, eq(schema.scores.companyId, schema.companies.id))
        .orderBy(desc(schema.scores.score))
        .limit(10);

      const digestItems: SlackDigestItem[] = topScores.map((s) => ({
        companyName: s.companyName,
        score: s.score,
        tier: s.tier as "watch" | "review" | "hot",
        rationale: s.rationale ?? "",
        dashboardUrl: `${process.env.NEXTAUTH_URL ?? "http://localhost:3000"}/company/${s.companyId}`,
      }));

      if (digestItems.length > 0) {
        await slack.sendDigest(digestItems);
        notified++;
      }

      // CRM sync for review/hot tier deals
      if (crm.isConfigured()) {
        for (const s of topScores) {
          if (s.tier === "review" || s.tier === "hot") {
            const record: CrmRecord = {
              name: s.companyName,
              sector: s.industry ?? "Unknown",
              score: s.score,
              rationale: s.rationale ?? "",
              tier: s.tier as "watch" | "review" | "hot",
            };
            try {
              await crm.upsertDeal(record);
            } catch (err) {
              log.warn(`CRM sync failed for ${s.companyName}: ${err}`);
            }
          }
        }
      }

      return { notified, digestItemCount: digestItems.length };
    });

    return {
      status: "complete",
      ...collectResult,
      ...enrichResult,
      ...scoreResult,
      ...notifyResult,
    };
  }
);

export const functions = [pipelineRun];
