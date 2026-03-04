import { ImageResponse } from "next/og";

import { createClient } from "@/lib/supabase/server";
import { type TableRow } from "@/lib/supabase/types";

// ── OG Image Config ──────────────────────────────────────────────────────────

export const alt = "FundKita Campaign";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// ── Helper ───────────────────────────────────────────────────────────────────

function formatCurrency(amount: number): string {
  if (amount >= 1_000_000) {
    return `PHP ${(amount / 1_000_000).toFixed(1)}M`;
  }
  if (amount >= 1000) {
    return `PHP ${(amount / 1000).toFixed(1)}K`;
  }
  return `PHP ${amount.toLocaleString()}`;
}

// ── Image Route ──────────────────────────────────────────────────────────────

export default async function OGImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data } = await supabase
    .from("campaigns")
    .select("title, goal_amount, amount_raised, donor_count, category")
    .eq("slug", slug)
    .single();

  const campaign = data as Pick<
    TableRow<"campaigns">,
    "title" | "goal_amount" | "amount_raised" | "donor_count" | "category"
  > | null;

  if (!campaign) {
    return new ImageResponse(
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          height: "100%",
          backgroundColor: "#0d9488",
          color: "#ffffff",
          fontSize: 48,
          fontWeight: 700,
        }}
      >
        Campaign Not Found
      </div>,
      { ...size },
    );
  }

  const percentage = Math.min(
    100,
    campaign.goal_amount > 0
      ? Math.round((campaign.amount_raised / campaign.goal_amount) * 100)
      : 0,
  );

  const categoryLabel = campaign.category
    .replaceAll("_", " ")
    .replaceAll(/\b\w/g, (c) => c.toUpperCase());

  return new ImageResponse(
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100%",
        backgroundColor: "#ffffff",
      }}
    >
      {/* Brand header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "24px 48px",
          backgroundColor: "#0d9488",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            fontSize: 32,
            fontWeight: 700,
            color: "#ffffff",
          }}
        >
          FundKita
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 20,
            color: "#ccfbf1",
            fontWeight: 500,
          }}
        >
          {categoryLabel}
        </div>
      </div>

      {/* Main content */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          flexGrow: 1,
          padding: "48px",
          justifyContent: "center",
        }}
      >
        {/* Campaign title */}
        <div
          style={{
            display: "flex",
            fontSize: 48,
            fontWeight: 700,
            color: "#111827",
            lineHeight: 1.2,
            maxHeight: "180px",
            overflow: "hidden",
          }}
        >
          {campaign.title.length > 80 ? `${campaign.title.slice(0, 77)}...` : campaign.title}
        </div>

        {/* Progress section */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            marginTop: "40px",
            gap: "16px",
          }}
        >
          {/* Progress bar */}
          <div
            style={{
              display: "flex",
              width: "100%",
              height: "24px",
              backgroundColor: "#e5e7eb",
              borderRadius: "12px",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                display: "flex",
                width: `${String(percentage)}%`,
                height: "100%",
                backgroundColor: "#14b8a6",
                borderRadius: "12px",
              }}
            />
          </div>

          {/* Stats row */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
              <div style={{ display: "flex", fontSize: 36, fontWeight: 700, color: "#0d9488" }}>
                {formatCurrency(campaign.amount_raised)}
              </div>
              <div style={{ display: "flex", fontSize: 22, color: "#6b7280" }}>
                of {formatCurrency(campaign.goal_amount)}
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  fontSize: 28,
                  fontWeight: 600,
                  color: "#14b8a6",
                }}
              >
                {String(percentage)}% funded
              </div>
              <div
                style={{
                  display: "flex",
                  fontSize: 22,
                  color: "#6b7280",
                }}
              >
                {String(campaign.donor_count)} {campaign.donor_count === 1 ? "donor" : "donors"}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "16px 48px",
          backgroundColor: "#f9fafb",
          borderTop: "1px solid #e5e7eb",
        }}
      >
        <div style={{ display: "flex", fontSize: 18, color: "#9ca3af" }}>
          fundkita.com &mdash; Crowdfunding for the Philippines
        </div>
      </div>
    </div>,
    { ...size },
  );
}
