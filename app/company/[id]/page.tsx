import { getCompanyDetail } from "@/lib/db/queries";
import { notFound } from "next/navigation";

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

function featureColor(value: number): string {
  if (value >= 70) return "var(--accent-green)";
  if (value >= 40) return "var(--accent-blue)";
  if (value >= 20) return "var(--accent-orange)";
  return "var(--text-muted)";
}

function formatFeatureName(key: string): string {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (s) => s.toUpperCase())
    .trim();
}

function timelineSourceClass(source: string): string {
  const s = source.toLowerCase();
  if (s === "github") return "timeline-source github";
  if (s === "onchain") return "timeline-source onchain";
  if (s === "rss") return "timeline-source rss";
  if (s === "arxiv") return "timeline-source arxiv";
  if (s === "producthunt") return "timeline-source producthunt";
  if (s === "farcaster") return "timeline-source farcaster";
  if (s === "huggingface") return "timeline-source huggingface";
  if (s === "accelerator") return "timeline-source accelerator";
  return "timeline-source";
}

function sourceLabel(source: string): string {
  const labels: Record<string, string> = {
    github: "GH",
    onchain: "ON",
    rss: "RSS",
    arxiv: "arX",
    producthunt: "PH",
    farcaster: "FC",
    huggingface: "HF",
    accelerator: "ACC",
    twitter: "TW",
  };
  return labels[source.toLowerCase()] ?? source.slice(0, 3).toUpperCase();
}

function daysAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 30) return `${diffDays}d ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`;
  return `${Math.floor(diffDays / 365)}y ago`;
}

export default async function CompanyDetailPage({
  params,
}: {
  params: { id: string };
}) {
  let company: Awaited<ReturnType<typeof getCompanyDetail>> = null;

  try {
    company = await getCompanyDetail(Number(params.id));
  } catch {
    // DB unavailable
  }

  if (!company) return notFound();

  const latestScore = company.scoreHistory[0];

  return (
    <main className="container">
      <a href="/" className="back-link">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        Back to deal flow
      </a>

      {/* Company header */}
      <div className="company-header">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <h1 className="company-name">{company.name}</h1>
            {company.isEarlyStealth && <span className="stealth-tag">STEALTH</span>}
            {latestScore && (
              <span className={`tier-badge ${tierClass(latestScore.tier)}`} style={{ fontSize: "0.75rem", padding: "0.25rem 0.625rem" }}>
                {latestScore.tier.toUpperCase()}
              </span>
            )}
          </div>
          {company.oneLiner && (
            <p style={{ color: "var(--text-secondary)", fontSize: "1rem", marginTop: "0.5rem" }}>
              {company.oneLiner}
            </p>
          )}
          <div className="company-meta">
            {company.industry && <span className="meta-tag">{company.industry}</span>}
            {company.subSector && <span className="meta-tag">{company.subSector}</span>}
            {company.estimatedStage && <span className="meta-tag">{company.estimatedStage}</span>}
          </div>
        </div>
        {latestScore && (
          <div style={{ textAlign: "right" }}>
            <div className="score-big" style={{ color: scoreColor(latestScore.score) }}>
              {latestScore.score % 1 === 0 ? latestScore.score : latestScore.score.toFixed(1)}
            </div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
              SCORE
            </div>
          </div>
        )}
      </div>

      {/* Company info grid */}
      <div className="info-grid">
        {company.domain && (
          <div className="info-item">
            <div className="info-label">Domain</div>
            <div className="info-value">
              <a href={`https://${company.domain}`} style={{ color: "var(--accent-blue)" }} target="_blank" rel="noopener noreferrer">
                {company.domain}
              </a>
            </div>
          </div>
        )}
        {company.githubOrg && (
          <div className="info-item">
            <div className="info-label">GitHub</div>
            <div className="info-value">
              <a href={`https://github.com/${company.githubOrg}`} style={{ color: "var(--accent-blue)" }} target="_blank" rel="noopener noreferrer">
                {company.githubOrg}
              </a>
            </div>
          </div>
        )}
        {company.founders && company.founders.length > 0 && (
          <div className="info-item">
            <div className="info-label">Founders</div>
            <div className="info-value">{company.founders.join(", ")}</div>
          </div>
        )}
        {company.links && Object.keys(company.links).length > 0 && (
          <div className="info-item">
            <div className="info-label">Links</div>
            <div className="info-value" style={{ display: "flex", gap: "0.5rem" }}>
              {Object.entries(company.links).map(([k, v]) => (
                <a key={k} href={v} style={{ color: "var(--accent-blue)" }} target="_blank" rel="noopener noreferrer">
                  {k}
                </a>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Score card with feature breakdown */}
      {latestScore && (
        <div className="score-card">
          <div className="score-card-header">
            <div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Composite Score
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginTop: "0.25rem" }}>
                <span className="score-big" style={{ color: scoreColor(latestScore.score), fontSize: "2.5rem" }}>
                  {latestScore.score % 1 === 0 ? latestScore.score : latestScore.score.toFixed(1)}
                </span>
                <span style={{ fontSize: "1rem", color: "var(--text-muted)" }}>/ 100</span>
              </div>
            </div>
          </div>
          {latestScore.rationale && (
            <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", marginBottom: "1rem" }}>
              {latestScore.rationale}
            </p>
          )}
          {latestScore.featureBreakdown && (
            <div className="feature-grid">
              {Object.entries(latestScore.featureBreakdown).map(([key, value]) => (
                <div key={key} className="feature-item">
                  <div className="feature-label">{formatFeatureName(key)}</div>
                  <div className="feature-value" style={{ color: featureColor(value) }}>
                    {typeof value === "number" ? (value % 1 === 0 ? value : value.toFixed(1)) : value}
                  </div>
                  <div className="feature-bar">
                    <div
                      className="feature-bar-fill"
                      style={{
                        width: `${Math.min(100, Number(value))}%`,
                        backgroundColor: featureColor(value),
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Triage actions */}
      <div className="triage-actions">
        <form action={`/api/triage`} method="POST" style={{ display: "contents" }}>
          <input type="hidden" name="companyId" value={company.id} />
          <input type="hidden" name="action" value="interested" />
          <button type="submit" className="triage-btn interested">
            Interested
          </button>
        </form>
        <form action={`/api/triage`} method="POST" style={{ display: "contents" }}>
          <input type="hidden" name="companyId" value={company.id} />
          <input type="hidden" name="action" value="snooze" />
          <button type="submit" className="triage-btn">
            Snooze
          </button>
        </form>
        <form action={`/api/triage`} method="POST" style={{ display: "contents" }}>
          <input type="hidden" name="companyId" value={company.id} />
          <input type="hidden" name="action" value="pass" />
          <button type="submit" className="triage-btn pass">
            Pass
          </button>
        </form>
      </div>

      {/* Signal timeline */}
      <h2 className="section-heading">
        Signal Timeline ({company.signals.length})
      </h2>
      {company.signals.length === 0 && (
        <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>
          No signals recorded yet.
        </p>
      )}
      <div className="timeline">
        {company.signals.map((signal) => (
          <div key={signal.id} className="timeline-item">
            <div className={timelineSourceClass(signal.source)}>
              {sourceLabel(signal.source)}
            </div>
            <div className="timeline-content">
              <div className="timeline-title">
                {signal.value ?? signal.type}
              </div>
              <div className="timeline-date">
                {signal.source} &middot; {daysAgo(signal.detectedAt)}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Score history */}
      {company.scoreHistory.length > 1 && (
        <>
          <h2 className="section-heading">Score History</h2>
          <div className="score-card" style={{ padding: "0" }}>
            {company.scoreHistory.map((score, i) => (
              <div
                key={score.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "0.75rem 1rem",
                  borderBottom: i < company.scoreHistory.length - 1 ? "1px solid var(--border)" : "none",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <span style={{ fontWeight: 700, fontSize: "1.125rem", color: scoreColor(score.score), fontVariantNumeric: "tabular-nums" }}>
                    {score.score % 1 === 0 ? score.score : score.score.toFixed(1)}
                  </span>
                  <span className={`tier-badge ${tierClass(score.tier)}`}>
                    {score.tier.toUpperCase()}
                  </span>
                </div>
                <span style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>
                  {score.createdAt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </main>
  );
}
