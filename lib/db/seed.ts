/**
 * Seed script — loads deterministic fixture data for the demo and tests.
 * Run with: npm run db:seed
 *
 * TODO: Implement seeding logic that:
 * 1. Inserts fixture raw_signals (GitHub + on-chain + RSS) for known test companies
 * 2. Inserts resolved companies rows
 * 3. Inserts scored rows with tiers
 * 4. Is idempotent (can be run multiple times safely)
 */

export async function seed() {
  console.info("[Seed] Seeding database with fixture data...");
  // TODO: implement seeding
  console.info("[Seed] Done.");
}

seed().catch((err) => {
  console.error("[Seed] Failed:", err);
  process.exit(1);
});
