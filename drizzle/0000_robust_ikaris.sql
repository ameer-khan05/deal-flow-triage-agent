CREATE TABLE "collector_cursors" (
	"id" serial PRIMARY KEY NOT NULL,
	"source" varchar(50) NOT NULL,
	"last_cursor" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "collector_cursors_source_unique" UNIQUE("source")
);
--> statement-breakpoint
CREATE TABLE "companies" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(500) NOT NULL,
	"domain" varchar(500),
	"github_org" varchar(500),
	"contract_address" varchar(500),
	"industry" varchar(200),
	"sub_sector" varchar(200),
	"one_liner" text,
	"estimated_stage" varchar(100),
	"founders" jsonb,
	"links" jsonb,
	"is_early_stealth" boolean DEFAULT false,
	"human_edited" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "raw_signals" (
	"id" serial PRIMARY KEY NOT NULL,
	"source" varchar(50) NOT NULL,
	"external_id" varchar(500) NOT NULL,
	"title" text NOT NULL,
	"url" text,
	"body" text,
	"metadata" jsonb,
	"detected_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scores" (
	"id" serial PRIMARY KEY NOT NULL,
	"company_id" integer NOT NULL,
	"score" real NOT NULL,
	"tier" varchar(20) NOT NULL,
	"rationale" text,
	"feature_breakdown" jsonb,
	"thesis_name" varchar(100),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "signals" (
	"id" serial PRIMARY KEY NOT NULL,
	"raw_signal_id" integer,
	"company_id" integer,
	"source" varchar(50) NOT NULL,
	"type" varchar(100) NOT NULL,
	"value" text,
	"metadata" jsonb,
	"detected_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sources" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"type" varchar(50) NOT NULL,
	"config" jsonb,
	"enabled" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "triage_decisions" (
	"id" serial PRIMARY KEY NOT NULL,
	"company_id" integer NOT NULL,
	"user_id" integer,
	"action" varchar(20) NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" varchar(500) NOT NULL,
	"name" varchar(500),
	"image" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "watchlist_companies" (
	"id" serial PRIMARY KEY NOT NULL,
	"watchlist_id" integer NOT NULL,
	"company_id" integer NOT NULL,
	"added_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "watchlists" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(200) NOT NULL,
	"user_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "scores" ADD CONSTRAINT "scores_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "signals" ADD CONSTRAINT "signals_raw_signal_id_raw_signals_id_fk" FOREIGN KEY ("raw_signal_id") REFERENCES "public"."raw_signals"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "signals" ADD CONSTRAINT "signals_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "triage_decisions" ADD CONSTRAINT "triage_decisions_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "triage_decisions" ADD CONSTRAINT "triage_decisions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "watchlist_companies" ADD CONSTRAINT "watchlist_companies_watchlist_id_watchlists_id_fk" FOREIGN KEY ("watchlist_id") REFERENCES "public"."watchlists"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "watchlist_companies" ADD CONSTRAINT "watchlist_companies_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "watchlists" ADD CONSTRAINT "watchlists_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "raw_signals_source_external_id_uniq" ON "raw_signals" USING btree ("source","external_id");--> statement-breakpoint
CREATE UNIQUE INDEX "watchlist_company_uniq" ON "watchlist_companies" USING btree ("watchlist_id","company_id");