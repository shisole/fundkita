import { type MetadataRoute } from "next";

import { createClient } from "@/lib/supabase/server";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://fundkita.com";
  const supabase = await createClient();

  // Fetch all active campaigns for dynamic entries
  const { data: campaigns } = await supabase
    .from("campaigns")
    .select("slug, updated_at")
    .eq("status", "active")
    .order("updated_at", { ascending: false });

  const staticEntries: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${baseUrl}/campaigns`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/leaderboard`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.7,
    },
  ];

  const campaignEntries: MetadataRoute.Sitemap = (campaigns ?? []).map((campaign) => ({
    url: `${baseUrl}/campaigns/${campaign.slug}`,
    lastModified: new Date(campaign.updated_at),
    changeFrequency: "daily" as const,
    priority: 0.8,
  }));

  return [...staticEntries, ...campaignEntries];
}
