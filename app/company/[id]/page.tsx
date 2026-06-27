/**
 * Company detail page.
 *
 * TODO: Implement (Phase 2)
 * - Signal timeline
 * - Score history (multiple scores rows over time)
 * - Rationale
 * - Links
 * - Early/stealth flag
 * - Triage UI: interested / pass / snooze buttons
 */
export default function CompanyDetailPage({
  params,
}: {
  params: { id: string };
}) {
  return (
    <main style={{ padding: "2rem", fontFamily: "system-ui, sans-serif" }}>
      <h1>Company #{params.id}</h1>
      <p style={{ color: "#666" }}>Company detail page — not yet implemented.</p>
    </main>
  );
}
