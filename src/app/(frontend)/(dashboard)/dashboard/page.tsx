import { redirect } from "next/navigation";

import BadgeGallery from "@/components/dashboard/BadgeGallery";
import DonorOverview from "@/components/dashboard/DonorOverview";
import { getCurrentUser } from "@/lib/supabase/queries";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?next=/dashboard");
  }

  const supabase = await createClient();

  // ── Fetch donor stats ──────────────────────────────────────────────────────
  const { data: donorStats } = await supabase
    .from("donor_stats")
    .select("*")
    .eq("user_id", user.id)
    .single();

  // ── Fetch recent 5 donations with campaign info ────────────────────────────
  const { data: recentDonations } = await supabase
    .from("donations")
    .select("id, amount_php, payment_status, created_at, campaigns(title, slug)")
    .eq("donor_id", user.id)
    .order("created_at", { ascending: false })
    .limit(5);

  // ── Fetch user badges ──────────────────────────────────────────────────────
  const { data: badges } = await supabase
    .from("donor_badges")
    .select("badge_tier")
    .eq("user_id", user.id);

  // ── Count campaigns supported (distinct campaign_ids from donations) ───────
  const { count: campaignsSupported } = await supabase
    .from("donations")
    .select("campaign_id", { count: "exact", head: true })
    .eq("donor_id", user.id)
    .eq("payment_status", "confirmed");

  // ── Organizer: fetch campaign count ────────────────────────────────────────
  let campaignCount: number | undefined;
  if (user.role === "organizer") {
    const { count } = await supabase
      .from("campaigns")
      .select("id", { count: "exact", head: true })
      .eq("organizer_id", user.id);
    campaignCount = count ?? 0;
  }

  const totalDonated = donorStats?.lifetime_donations_php ?? 0;
  const donationCount = donorStats?.donation_count ?? 0;
  const earnedTiers = (badges ?? []).map((b) => b.badge_tier);

  const typedDonations = (recentDonations ?? []) as {
    id: string;
    amount_php: number;
    payment_status: "pending" | "confirmed" | "failed" | "refunded";
    created_at: string;
    campaigns: { title: string; slug: string } | null;
  }[];

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-heading text-3xl font-bold text-gray-900 dark:text-gray-100">
          Dashboard
        </h1>
        <p className="mt-1 text-gray-500 dark:text-gray-400">
          Welcome back, {user.full_name ?? "there"}!
        </p>
      </div>

      <DonorOverview
        stats={{
          totalDonated,
          donationCount,
          campaignsSupported: campaignsSupported ?? 0,
        }}
        totalDonated={totalDonated}
        recentDonations={typedDonations}
        campaignCount={campaignCount}
      />

      {earnedTiers.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-4 font-heading text-xl font-semibold text-gray-900 dark:text-gray-100">
            Your Badges
          </h2>
          <BadgeGallery earnedTiers={earnedTiers} />
        </div>
      )}
    </div>
  );
}
