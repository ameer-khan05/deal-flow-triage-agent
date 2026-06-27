import { getDealFeed } from "@/lib/db/queries";

function tierColor(tier: string): string {
  if (tier === "hot") return "#e53e3e";
  if (tier === "review") return "#dd6b20";
  return "#718096";
}

function tierBadge(tier: string) {
  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 8px",
        borderRadius: "4px",
        fontSize: "12px",
        fontWeight: 600,
        color: "white",
        backgroundColor: tierColor(tier),
      }}
    >
      {tier.toUpperCase()}
    </span>
  );
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { sector?: string; minScore?: string; stage?: string };
}) {
  let deals: Awaited<ReturnType<typeof getDealFeed>> = [];
  let dbAvailable = true;

  try {
    deals = await getDealFeed({
      sector: searchParams.sector,
      minScore: searchParams.minScore ? Number(searchParams.minScore) : undefined,
      stage: searchParams.stage,
    });
  } catch {
    dbAvailable = false;
  }

  return (
    <main style={{ padding: "2rem", fontFamily: "system-ui, sans-serif", maxWidth: "1000px", margin: "0 auto" }}>
      <h1 style={{ marginBottom: "0.5rem" }}>Deal Flow Triage Agent</h1>
      <p style={{ color: "#666", marginBottom: "2rem" }}>
        {deals.length} deal{deals.length !== 1 ? "s" : ""} found
        {!dbAvailable && " (database unavailable — run docker compose up -d)"}
      </p>

      {deals.length === 0 && dbAvailable && (
        <p style={{ color: "#999" }}>
          No deals found. Run the pipeline to collect and score signals.
        </p>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {deals.map((deal) => (
          <a
            key={deal.companyId}
            href={`/company/${deal.companyId}`}
            style={{
              display: "block",
              padding: "1rem",
              border: "1px solid #e2e8f0",
              borderRadius: "8px",
              textDecoration: "none",
              color: "inherit",
              transition: "border-color 0.2s",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <strong style={{ fontSize: "16px" }}>{deal.companyName}</strong>
                {deal.isEarlyStealth && (
                  <span style={{ marginLeft: "8px", fontSize: "11px", color: "#805ad5" }}>
                    STEALTH
                  </span>
                )}
                {deal.industry && (
                  <span style={{ marginLeft: "8px", color: "#718096", fontSize: "13px" }}>
                    {deal.industry}
                  </span>
                )}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontWeight: 600, fontSize: "18px" }}>
                  {deal.score}
                </span>
                {tierBadge(deal.tier)}
              </div>
            </div>
            {deal.rationale && (
              <p style={{ color: "#666", fontSize: "13px", marginTop: "4px", marginBottom: 0 }}>
                {deal.rationale}
              </p>
            )}
            {deal.topSignal && (
              <p style={{ color: "#999", fontSize: "12px", marginTop: "2px", marginBottom: 0 }}>
                Top signal: {deal.topSignal}
              </p>
            )}
          </a>
        ))}
      </div>
    </main>
  );
}
