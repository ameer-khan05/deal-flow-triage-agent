import { getDealFeed } from "@/lib/db/queries";
import type { DealFeedItem } from "@/lib/db/queries";

function tierClass(tier: string): string {
  if (tier === "hot") return "tier-hot";
  if (tier === "review") return "tier-review";
  return "tier-watch";
}

function scoreColor(score: number): string {
  if (score >= 75) return "var(--accent-red)";
  if (score >= 50) return "var(--accent-orange)";
  if (score >= 25) return "var(--accent-blue)";
  return "var(--text-muted)";
}

function formatScore(score: number): string {
  return score % 1 === 0 ? String(score) : score.toFixed(1);
}

function DealRow({ deal }: { deal: DealFeedItem }) {
  return (
    <a href={`/company/${deal.companyId}`} className="deal-row">
      <div>
        <div style={{ display: "flex", alignItems: "center" }}>
          <span className="deal-name">{deal.companyName}</span>
          {deal.isEarlyStealth && <span className="stealth-tag">STEALTH</span>}
        </div>
        {deal.oneLiner && (
          <div className="deal-oneliner">{deal.oneLiner}</div>
        )}
      </div>
      <div className="deal-industry">
        {deal.industry ?? "—"}
        {deal.subSector && (
          <span style={{ color: "var(--text-muted)", display: "block", fontSize: "0.75rem" }}>
            {deal.subSector}
          </span>
        )}
      </div>
      <div className="deal-stage">{deal.estimatedStage ?? "—"}</div>
      <div className="score-pill">
        <span className="score-value" style={{ color: scoreColor(deal.score) }}>
          {formatScore(deal.score)}
        </span>
      </div>
      <div>
        <span className={`tier-badge ${tierClass(deal.tier)}`}>
          {deal.tier.toUpperCase()}
        </span>
        {deal.signalCount > 0 && (
          <span style={{ 
            fontSize: "0.6875rem", 
            color: "var(--text-muted)", 
            marginLeft: "0.5rem" 
          }}>
            {deal.signalCount} signal{deal.signalCount !== 1 ? "s" : ""}
          </span>
        )}
      </div>
    </a>
  );
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { sector?: string; minScore?: string; stage?: string; tier?: string };
}) {
  let deals: DealFeedItem[] = [];
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

  // Apply tier filter on the client side for UI filtering
  const tierFilter = searchParams.tier;
  const filteredDeals = tierFilter
    ? deals.filter((d) => d.tier === tierFilter)
    : deals;

  // Compute stats
  const hotCount = deals.filter((d) => d.tier === "hot").length;
  const reviewCount = deals.filter((d) => d.tier === "review").length;
  const watchCount = deals.filter((d) => d.tier === "watch").length;
  const avgScore = deals.length > 0
    ? Math.round(deals.reduce((sum, d) => sum + d.score, 0) / deals.length * 10) / 10
    : 0;

  // Get unique industries for filters
  const industries = [...new Set(deals.map((d) => d.industry).filter(Boolean))];

  return (
    <main className="container">
      <div className="header">
        <div>
          <h1>Deal Flow</h1>
          <div className="header-subtitle">
            Automated signal collection and scoring
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>
            Last updated
          </div>
          <div style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>
            {new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
          </div>
        </div>
      </div>

      {!dbAvailable && (
        <div className="db-warning">
          Database unavailable. Run <code>docker compose up -d postgres</code> and <code>npm run db:migrate</code> to get started.
        </div>
      )}

      {/* Stats bar */}
      <div className="stats-bar">
        <div className="stat-card">
          <div className="stat-value">{deals.length}</div>
          <div className="stat-label">Total Deals</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: "var(--accent-red)" }}>{hotCount}</div>
          <div className="stat-label">Hot</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: "var(--accent-orange)" }}>{reviewCount}</div>
          <div className="stat-label">Review</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{watchCount}</div>
          <div className="stat-label">Watch</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{avgScore}</div>
          <div className="stat-label">Avg Score</div>
        </div>
      </div>

      {/* Filters */}
      <div className="filters">
        <a
          href="/"
          className={`filter-btn ${!tierFilter && !searchParams.sector ? "active" : ""}`}
        >
          All
        </a>
        <a
          href="/?tier=hot"
          className={`filter-btn ${tierFilter === "hot" ? "active" : ""}`}
        >
          Hot
        </a>
        <a
          href="/?tier=review"
          className={`filter-btn ${tierFilter === "review" ? "active" : ""}`}
        >
          Review
        </a>
        <a
          href="/?tier=watch"
          className={`filter-btn ${tierFilter === "watch" ? "active" : ""}`}
        >
          Watch
        </a>
        <span style={{ width: "1px", background: "var(--border)", margin: "0 0.25rem" }} />
        {industries.map((ind) => (
          <a
            key={ind}
            href={`/?sector=${encodeURIComponent(ind!)}`}
            className={`filter-btn ${searchParams.sector === ind ? "active" : ""}`}
          >
            {ind}
          </a>
        ))}
      </div>

      {filteredDeals.length === 0 && dbAvailable && (
        <div className="empty-state">
          <h2>No deals found</h2>
          <p>Run the pipeline to collect and score signals, or adjust your filters.</p>
        </div>
      )}

      {filteredDeals.length > 0 && (
        <>
          <div className="deal-table-header">
            <span>Company</span>
            <span>Industry</span>
            <span>Stage</span>
            <span>Score</span>
            <span>Tier</span>
          </div>
          {filteredDeals.map((deal) => (
            <DealRow key={deal.companyId} deal={deal} />
          ))}
        </>
      )}
    </main>
  );
}
