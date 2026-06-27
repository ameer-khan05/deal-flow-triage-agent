import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().url("DATABASE_URL is required"),

  ANTHROPIC_API_KEY: z.string().optional(),
  ANTHROPIC_MODEL: z.string().default("claude-sonnet-4-20250514"),

  GITHUB_TOKEN: z.string().optional(),
  ALCHEMY_RPC_URL: z.string().optional(),
  NEYNAR_API_KEY: z.string().optional(),

  SLACK_BOT_TOKEN: z.string().optional(),
  SLACK_CHANNEL_ID: z.string().optional(),

  AIRTABLE_API_KEY: z.string().optional(),
  AIRTABLE_BASE_ID: z.string().optional(),
  NOTION_TOKEN: z.string().optional(),

  NEXTAUTH_SECRET: z.string().optional(),
  NEXTAUTH_URL: z.string().url().optional(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  ALLOWED_EMAIL_DOMAIN: z.string().optional(),

  INNGEST_EVENT_KEY: z.string().optional(),
  INNGEST_SIGNING_KEY: z.string().optional(),

  RUN_LIVE_TESTS: z
    .string()
    .transform((v) => v === "1" || v === "true")
    .default("0"),
});

export type Env = z.infer<typeof envSchema>;

let _env: Env | null = null;

export function loadEnv(): Env {
  if (_env) return _env;

  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    const missing = result.error.issues
      .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    throw new Error(
      `Environment validation failed:\n${missing}\n\nSee .env.example for required variables.`
    );
  }
  _env = result.data;
  return _env;
}

export function hasKey(key: keyof Env): boolean {
  const env = loadEnv();
  const val = env[key];
  return val !== undefined && val !== "";
}
