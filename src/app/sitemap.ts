import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  // TODO: Update with your site URL and pages
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://yourdomain.com";

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
  ];
}
