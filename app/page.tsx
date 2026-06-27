/**
 * Dashboard — ranked deal feed.
 *
 * TODO: Implement
 * - Fetch companies + latest scores from DB, ordered by score desc
 * - Render each as: company name, sector, score, tier badge, top signal
 * - Empty state when no data
 * - Filters (Phase 2): sector, stage, min-score, signal type
 */
export default function DashboardPage() {
  return (
    <main style={{ padding: "2rem", fontFamily: "system-ui, sans-serif" }}>
      <h1>Deal Flow Triage Agent</h1>
      <p style={{ color: "#666" }}>
        No deals found. Run the pipeline to collect and score signals.
      </p>
    </main>
  );
}
