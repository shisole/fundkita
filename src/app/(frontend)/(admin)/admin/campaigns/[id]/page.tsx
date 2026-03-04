import Image from "next/image";
import { notFound } from "next/navigation";

import CampaignActions from "@/components/admin/CampaignActions";
import { CheckBadgeIcon } from "@/components/icons";
import { Badge, Breadcrumbs, ProgressBar, StatusBadge } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";
import { type KycStatus, type TableRow } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";

interface PageProps {
  params: Promise<{ id: string }>;
}

type CampaignWithOrganizer = TableRow<"campaigns"> & {
  users: {
    id: string;
    full_name: string | null;
    email: string;
    avatar_url: string | null;
    is_verified: boolean;
  } | null;
};

export default async function AdminCampaignDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  // ── Fetch campaign with organizer ──────────────────────────────────────────
  const { data: campaign } = await supabase
    .from("campaigns")
    .select("*, users!campaigns_organizer_id_fkey(id, full_name, email, avatar_url, is_verified)")
    .eq("id", id)
    .single();

  if (!campaign) notFound();

  const typedCampaign = campaign as CampaignWithOrganizer;

  // ── Fetch related data in parallel ─────────────────────────────────────────
  const organizerId = typedCampaign.organizer_id;

  const [imagesResult, donationStatsResult, kycResult] = await Promise.all([
    // Campaign images
    supabase
      .from("campaign_images")
      .select("*")
      .eq("campaign_id", id)
      .order("sort_order", { ascending: true }),

    // Donation stats
    supabase
      .from("donations")
      .select("amount_php", { count: "exact" })
      .eq("campaign_id", id)
      .eq("payment_status", "confirmed"),

    // Organizer KYC status
    supabase
      .from("kyc_submissions")
      .select("status")
      .eq("user_id", organizerId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single(),
  ]);

  const images = (imagesResult.data ?? []) as TableRow<"campaign_images">[];
  const donorCount = donationStatsResult.count ?? 0;
  const totalRaised = (donationStatsResult.data ?? []).reduce(
    (sum, d) => sum + (d as TableRow<"donations">).amount_php,
    0,
  );
  const kycStatus: KycStatus | "none" = kycResult.data
    ? (kycResult.data as TableRow<"kyc_submissions">).status
    : "none";

  const progress =
    typedCampaign.goal_amount > 0
      ? Math.round((typedCampaign.amount_raised / typedCampaign.goal_amount) * 100)
      : 0;

  const kycBadgeVariant: Record<string, "success" | "warning" | "error" | "default"> = {
    approved: "success",
    pending: "warning",
    rejected: "error",
    none: "default",
  };

  return (
    <div>
      <Breadcrumbs
        items={[
          { label: "Admin", href: "/admin" },
          { label: "Campaigns", href: "/admin/campaigns" },
          { label: typedCampaign.title },
        ]}
        className="mb-4"
      />

      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-heading text-2xl font-bold text-gray-900 dark:text-gray-100">
              {typedCampaign.title}
            </h1>
            <StatusBadge status={typedCampaign.status} />
          </div>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {typedCampaign.category} &middot; {typedCampaign.location}
          </p>
        </div>

        {/* Action buttons */}
        <CampaignActions campaignId={id} currentStatus={typedCampaign.status} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Featured image */}
          {typedCampaign.featured_image_url && (
            <div className="relative aspect-video overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
              <Image
                src={typedCampaign.featured_image_url}
                alt={typedCampaign.title}
                fill
                className="object-cover"
              />
            </div>
          )}

          {/* Additional images */}
          {images.length > 0 && (
            <div>
              <h2 className="mb-3 font-heading text-lg font-semibold text-gray-900 dark:text-gray-100">
                Campaign Images
              </h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {images.map((img) => (
                  <div
                    key={img.id}
                    className="relative aspect-square overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700"
                  >
                    <Image
                      src={img.image_url}
                      alt={`Campaign image ${String(img.sort_order)}`}
                      fill
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          <div>
            <h2 className="mb-3 font-heading text-lg font-semibold text-gray-900 dark:text-gray-100">
              Description
            </h2>
            <div
              className={cn(
                "rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900",
                "prose prose-sm max-w-none dark:prose-invert",
              )}
            >
              <p className="whitespace-pre-wrap text-gray-700 dark:text-gray-300">
                {typedCampaign.description}
              </p>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Donation stats */}
          <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
            <h3 className="mb-4 font-heading text-lg font-semibold text-gray-900 dark:text-gray-100">
              Donation Stats
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">Total Raised</span>
                <span className="font-bold text-gray-900 dark:text-gray-100">
                  ₱{totalRaised.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">Goal</span>
                <span className="font-bold text-gray-900 dark:text-gray-100">
                  ₱{typedCampaign.goal_amount.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">Donors</span>
                <span className="font-bold text-gray-900 dark:text-gray-100">
                  {String(donorCount)}
                </span>
              </div>
              <ProgressBar value={progress} showLabel />
            </div>
          </div>

          {/* Organizer info */}
          <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
            <h3 className="mb-4 font-heading text-lg font-semibold text-gray-900 dark:text-gray-100">
              Organizer
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  {typedCampaign.users?.full_name ?? "Unknown"}
                </span>
                {typedCampaign.users?.is_verified && (
                  <CheckBadgeIcon className="h-4 w-4 text-teal-500" />
                )}
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {typedCampaign.users?.email ?? "No email"}
              </p>

              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500 dark:text-gray-400">KYC Status:</span>
                <Badge variant={kycBadgeVariant[kycStatus] ?? "default"}>
                  {kycStatus === "none"
                    ? "Not Submitted"
                    : kycStatus.charAt(0).toUpperCase() + kycStatus.slice(1)}
                </Badge>
              </div>
            </div>
          </div>

          {/* Campaign details */}
          <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
            <h3 className="mb-4 font-heading text-lg font-semibold text-gray-900 dark:text-gray-100">
              Details
            </h3>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-500 dark:text-gray-400">Category</dt>
                <dd className="font-medium text-gray-900 dark:text-gray-100">
                  {typedCampaign.category.replace("_", " ")}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500 dark:text-gray-400">Location</dt>
                <dd className="font-medium text-gray-900 dark:text-gray-100">
                  {typedCampaign.location}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500 dark:text-gray-400">Created</dt>
                <dd className="font-medium text-gray-900 dark:text-gray-100">
                  {new Date(typedCampaign.created_at).toLocaleDateString()}
                </dd>
              </div>
              {typedCampaign.end_date && (
                <div className="flex justify-between">
                  <dt className="text-gray-500 dark:text-gray-400">End Date</dt>
                  <dd className="font-medium text-gray-900 dark:text-gray-100">
                    {new Date(typedCampaign.end_date).toLocaleDateString()}
                  </dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-gray-500 dark:text-gray-400">Verified</dt>
                <dd className="font-medium text-gray-900 dark:text-gray-100">
                  {typedCampaign.is_verified ? "Yes" : "No"}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
