import { type Metadata } from "next";
import { notFound } from "next/navigation";

import DonationForm from "@/components/donations/DonationForm";
import { createClient } from "@/lib/supabase/server";
import { type TableRow } from "@/lib/supabase/types";

// ── Types ─────────────────────────────────────────────────────────────────────

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
    .select("title")
    .eq("slug", slug)
    .eq("status", "active")
    .single();

  if (!data) {
    return { title: "Campaign Not Found" };
  }

  const campaign = data as Pick<TableRow<"campaigns">, "title">;

  return {
    title: `Donate to ${campaign.title}`,
  };
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function DonateSlugPage({ params, searchParams }: PageProps) {
  const [{ slug }, resolvedSearchParams] = await Promise.all([params, searchParams]);
  const supabase = await createClient();

  // Fetch active campaign by slug
  const { data: campaignData } = await supabase
    .from("campaigns")
    .select("id, title, slug, goal_amount, amount_raised")
    .eq("slug", slug)
    .eq("status", "active")
    .single();

  if (!campaignData) notFound();

  const campaign = campaignData as Pick<
    TableRow<"campaigns">,
    "id" | "title" | "slug" | "goal_amount" | "amount_raised"
  >;

  // Get current user session (optional — guest donations allowed)
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  let userInfo: { full_name: string; email: string } | null = null;

  if (authUser) {
    const { data: profile } = await supabase
      .from("users")
      .select("full_name, email")
      .eq("id", authUser.id)
      .single();

    if (profile) {
      const typedProfile = profile as Pick<TableRow<"users">, "full_name" | "email">;
      userInfo = {
        full_name: typedProfile.full_name ?? "",
        email: typedProfile.email,
      };
    }
  }

  // Check for payment error in search params
  const hasError = resolvedSearchParams.error === "payment";

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="mb-2 font-heading text-2xl font-bold text-gray-900 dark:text-gray-100">
        Donate to {campaign.title}
      </h1>
      <p className="mb-8 text-gray-500 dark:text-gray-400">
        Your contribution makes a difference. Thank you for your generosity.
      </p>

      <DonationForm campaign={campaign} user={userInfo} hasError={hasError} />
    </div>
  );
}
