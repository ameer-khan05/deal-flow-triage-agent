/**
 * End-to-end demo (AC-12.3) — fully offline, fixtures + mocked LLM/Slack/CRM.
 *
 * Steps:
 * 1. Seeds raw GitHub + on-chain + news signals for a known fixture company
 * 2. Runs the pipeline (collect → enrich → score → surface)
 * 3. Asserts:
 *    - One resolved companies row
 *    - >=1 versioned scores row with a tier
 *    - A generated Slack digest payload containing that company
 *    - A CRM upsert payload for it
 * 4. Prints PASS/FAIL summary and exits non-zero on failure
 *
 * Usage: npm run demo
 *
 * TODO: Implement demo logic
 */

export async function runDemo() {
  console.log("=== Deal Flow Triage Agent — E2E Demo ===\n");

  const results: Array<{ name: string; pass: boolean; detail?: string }> = [];

  // TODO: implement demo steps

  console.log("\n=== Results ===");
  for (const r of results) {
    const status = r.pass ? "PASS" : "FAIL";
    console.log(`  [${status}] ${r.name}${r.detail ? `: ${r.detail}` : ""}`);
  }

  const failures = results.filter((r) => !r.pass);
  if (failures.length > 0) {
    console.log(`\n${failures.length} test(s) FAILED`);
    process.exit(1);
  }

  console.log("\nAll tests PASSED");
}

runDemo().catch((err) => {
  console.error("Demo failed with error:", err);
  process.exit(1);
});
