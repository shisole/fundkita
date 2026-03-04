import { type Metadata } from "next";
import { notFound } from "next/navigation";

import CampaignDetail from "@/components/campaigns/CampaignDetail";
import { type DonationWithDonor } from "@/components/campaigns/DonorList";
import { getCategoryMeta } from "@/lib/constants/categories";
import { createClient } from "@/lib/supabase/server";
import { type TableRow } from "@/lib/supabase/types";

// ── Types ─────────────────────────────────────────────────────────────────────

type CampaignWithOrganizer = TableRow<"campaigns"> & {
  users: { full_name: string | null; avatar_url: string | null; is_verified: boolean } | null;
};

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

// ── Metadata ──────────────────────────────────────────────────────────────────

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();

  const { data } = await supabase
    .from("campaigns")
    .select("title, description, featured_image_url, category")
    .eq("slug", slug)
    .eq("status", "active")
    .single();

  if (!data) {
    return { title: "Campaign Not Found" };
  }

  const campaign = data as Pick<
    TableRow<"campaigns">,
    "title" | "description" | "featured_image_url" | "category"
  >;
  const categoryMeta = getCategoryMeta(campaign.category);

  return {
    title: campaign.title,
    description: campaign.description.slice(0, 160),
    openGraph: {
      title: campaign.title,
      description: campaign.description.slice(0, 160),
      images: campaign.featured_image_url ? [{ url: campaign.featured_image_url }] : [],
    },
    keywords: [categoryMeta.label, "crowdfunding", "FundKita", "donate", "Philippines"],
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function mapDonation(d: Record<string, unknown>): DonationWithDonor {
  return {
    id: d.id as string,
    amount: d.amount_php as number,
    created_at: d.created_at as string,
    is_anonymous: d.is_anonymous as boolean,
    users: d.users as DonationWithDonor["users"],
  };
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function CampaignSlugPage({ params, searchParams }: PageProps) {
  const [{ slug }, resolvedSearchParams] = await Promise.all([params, searchParams]);
  const supabase = await createClient();

  // Fetch campaign with organizer info
  const { data: campaignData } = await supabase
    .from("campaigns")
    .select("*, users!campaigns_organizer_id_fkey(full_name, avatar_url, is_verified)")
    .eq("slug", slug)
    .eq("status", "active")
    .single();

  if (!campaignData) notFound();

  const campaign = campaignData as CampaignWithOrganizer;

  // Fetch updates, recent donations, and top donors in parallel
  const [updatesResult, donationsResult, topDonorsResult] = await Promise.all([
    supabase
      .from("campaign_updates")
      .select("*")
      .eq("campaign_id", campaign.id)
      .order("created_at", { ascending: false })
      .limit(10),
    supabase
      .from("donations")
      .select(
        "id, amount_php, created_at, is_anonymous, donor_id, users!donations_donor_id_fkey(full_name, avatar_url)",
      )
      .eq("campaign_id", campaign.id)
      .eq("payment_status", "confirmed")
      .order("created_at", { ascending: false })
      .limit(10),
    supabase
      .from("donations")
      .select(
        "id, amount_php, created_at, is_anonymous, donor_id, users!donations_donor_id_fkey(full_name, avatar_url)",
      )
      .eq("campaign_id", campaign.id)
      .eq("payment_status", "confirmed")
      .order("amount_php", { ascending: false })
      .limit(5),
  ]);

  const updates = (updatesResult.data ?? []) as TableRow<"campaign_updates">[];

  const recentDonations = (donationsResult.data ?? []).map((d) =>
    mapDonation(d as unknown as Record<string, unknown>),
  );

  const topDonors = (topDonorsResult.data ?? []).map((d) =>
    mapDonation(d as unknown as Record<string, unknown>),
  );

  const showDonatedBanner = resolvedSearchParams.donated === "true";

  return (
    <CampaignDetail
      campaign={campaign}
      updates={updates}
      recentDonations={recentDonations}
      topDonors={topDonors}
      showDonatedBanner={showDonatedBanner}
    />
  );
}
