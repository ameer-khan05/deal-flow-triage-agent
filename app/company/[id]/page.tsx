import { getCompanyDetail } from "@/lib/db/queries";
import { notFound } from "next/navigation";

function tierColor(tier: string): string {
  if (tier === "hot") return "#e53e3e";
  if (tier === "review") return "#dd6b20";
  return "#718096";
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
    <main style={{ padding: "2rem", fontFamily: "system-ui, sans-serif", maxWidth: "900px", margin: "0 auto" }}>
      <a href="/" style={{ color: "#3182ce", fontSize: "14px" }}>
        &larr; Back to feed
      </a>

      <div style={{ marginTop: "1rem" }}>
        <h1 style={{ marginBottom: "4px" }}>
          {company.name}
          {company.isEarlyStealth && (
            <span style={{ marginLeft: "8px", fontSize: "14px", color: "#805ad5" }}>
              STEALTH
            </span>
          )}
        </h1>
        {company.oneLiner && (
          <p style={{ color: "#666", fontSize: "15px", marginTop: 0 }}>
            {company.oneLiner}
          </p>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginTop: "1.5rem" }}>
        <div>
          <strong>Industry:</strong> {company.industry ?? "Unknown"}
        </div>
        <div>
          <strong>Sub-sector:</strong> {company.subSector ?? "Unknown"}
        </div>
        <div>
          <strong>Stage:</strong> {company.estimatedStage ?? "Unknown"}
        </div>
        <div>
          <strong>Domain:</strong> {company.domain ?? "—"}
        </div>
        {company.founders && company.founders.length > 0 && (
          <div>
            <strong>Founders:</strong> {company.founders.join(", ")}
          </div>
        )}
        {company.links && Object.keys(company.links).length > 0 && (
          <div>
            <strong>Links:</strong>{" "}
            {Object.entries(company.links).map(([k, v]) => (
              <a key={k} href={v} style={{ marginRight: "8px", color: "#3182ce" }}>
                {k}
              </a>
            ))}
          </div>
        )}
      </div>

      {latestScore && (
        <div
          style={{
            marginTop: "1.5rem",
            padding: "1rem",
            border: "1px solid #e2e8f0",
            borderRadius: "8px",
          }}
        >
          <h2 style={{ marginTop: 0 }}>Latest Score</h2>
          <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
            <span style={{ fontSize: "28px", fontWeight: 700 }}>
              {latestScore.score}
            </span>
            <span
              style={{
                padding: "4px 12px",
                borderRadius: "4px",
                color: "white",
                fontWeight: 600,
                backgroundColor: tierColor(latestScore.tier),
              }}
            >
              {latestScore.tier.toUpperCase()}
            </span>
          </div>
          {latestScore.rationale && (
            <p style={{ color: "#666", marginBottom: 0 }}>{latestScore.rationale}</p>
          )}
          {latestScore.featureBreakdown && (
            <div style={{ marginTop: "0.5rem", fontSize: "13px", color: "#555" }}>
              {Object.entries(latestScore.featureBreakdown).map(([k, v]) => (
                <span key={k} style={{ marginRight: "12px" }}>
                  {k}: {v}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      <div style={{ marginTop: "1.5rem" }}>
        <h2>Signal Timeline ({company.signals.length})</h2>
        {company.signals.length === 0 && (
          <p style={{ color: "#999" }}>No signals recorded.</p>
        )}
        {company.signals.map((signal) => (
          <div
            key={signal.id}
            style={{
              padding: "0.5rem 0",
              borderBottom: "1px solid #f0f0f0",
              fontSize: "14px",
            }}
          >
            <span style={{ color: "#3182ce", fontWeight: 500 }}>
              [{signal.source}]
            </span>{" "}
            {signal.value ?? signal.type} —{" "}
            <span style={{ color: "#999" }}>
              {signal.detectedAt.toISOString().slice(0, 10)}
            </span>
          </div>
        ))}
      </div>

      {company.scoreHistory.length > 1 && (
        <div style={{ marginTop: "1.5rem" }}>
          <h2>Score History</h2>
          {company.scoreHistory.map((score) => (
            <div
              key={score.id}
              style={{
                padding: "0.5rem 0",
                borderBottom: "1px solid #f0f0f0",
                fontSize: "14px",
              }}
            >
              <strong>{score.score}</strong>{" "}
              <span style={{ color: tierColor(score.tier) }}>
                {score.tier}
              </span>{" "}
              — {score.createdAt.toISOString().slice(0, 10)}
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
