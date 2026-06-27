import {
  pgTable,
  text,
  timestamp,
  integer,
  jsonb,
  uniqueIndex,
  serial,
  varchar,
  boolean,
  real,
} from "drizzle-orm/pg-core";

// ─── Raw signals (collector output, pre-enrichment) ─────────────────────────
export const rawSignals = pgTable(
  "raw_signals",
  {
    id: serial("id").primaryKey(),
    source: varchar("source", { length: 50 }).notNull(),
    externalId: varchar("external_id", { length: 500 }).notNull(),
    title: text("title").notNull(),
    url: text("url"),
    body: text("body"),
    metadata: jsonb("metadata"),
    detectedAt: timestamp("detected_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    sourceExternalIdUniq: uniqueIndex("raw_signals_source_external_id_uniq").on(
      table.source,
      table.externalId
    ),
  })
);

// ─── Companies (resolved entities) ──────────────────────────────────────────
export const companies = pgTable("companies", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 500 }).notNull(),
  domain: varchar("domain", { length: 500 }),
  githubOrg: varchar("github_org", { length: 500 }),
  contractAddress: varchar("contract_address", { length: 500 }),
  industry: varchar("industry", { length: 200 }),
  subSector: varchar("sub_sector", { length: 200 }),
  oneLiner: text("one_liner"),
  estimatedStage: varchar("estimated_stage", { length: 100 }),
  founders: jsonb("founders").$type<string[]>(),
  links: jsonb("links").$type<Record<string, string>>(),
  isEarlyStealth: boolean("is_early_stealth").default(false),
  humanEdited: boolean("human_edited").default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// ─── Signals (typed, linked to company) ─────────────────────────────────────
export const signals = pgTable("signals", {
  id: serial("id").primaryKey(),
  rawSignalId: integer("raw_signal_id").references(() => rawSignals.id),
  companyId: integer("company_id").references(() => companies.id),
  source: varchar("source", { length: 50 }).notNull(),
  type: varchar("type", { length: 100 }).notNull(),
  value: text("value"),
  metadata: jsonb("metadata"),
  detectedAt: timestamp("detected_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// ─── Scores (versioned per company) ─────────────────────────────────────────
export const scores = pgTable("scores", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id")
    .references(() => companies.id)
    .notNull(),
  score: real("score").notNull(),
  tier: varchar("tier", { length: 20 }).notNull(),
  rationale: text("rationale"),
  featureBreakdown: jsonb("feature_breakdown").$type<Record<string, number>>(),
  thesisName: varchar("thesis_name", { length: 100 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// ─── Triage decisions (human feedback) ──────────────────────────────────────
export const triageDecisions = pgTable("triage_decisions", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id")
    .references(() => companies.id)
    .notNull(),
  userId: integer("user_id").references(() => users.id),
  action: varchar("action", { length: 20 }).notNull(), // interested | pass | snooze
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// ─── Sources (metadata about data sources) ──────────────────────────────────
export const sources = pgTable("sources", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  type: varchar("type", { length: 50 }).notNull(),
  config: jsonb("config"),
  enabled: boolean("enabled").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// ─── Watchlists ─────────────────────────────────────────────────────────────
export const watchlists = pgTable("watchlists", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  userId: integer("user_id").references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const watchlistCompanies = pgTable(
  "watchlist_companies",
  {
    id: serial("id").primaryKey(),
    watchlistId: integer("watchlist_id")
      .references(() => watchlists.id)
      .notNull(),
    companyId: integer("company_id")
      .references(() => companies.id)
      .notNull(),
    addedAt: timestamp("added_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    watchlistCompanyUniq: uniqueIndex("watchlist_company_uniq").on(
      table.watchlistId,
      table.companyId
    ),
  })
);

// ─── Users ──────────────────────────────────────────────────────────────────
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 500 }).notNull(),
  name: varchar("name", { length: 500 }),
  image: text("image"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// ─── Collector cursors (incremental collection tracking) ─────────────────────
export const collectorCursors = pgTable("collector_cursors", {
  id: serial("id").primaryKey(),
  source: varchar("source", { length: 50 }).notNull().unique(),
  lastCursor: text("last_cursor").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
