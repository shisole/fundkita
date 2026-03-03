import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    // TODO: Update with your site URL
    // sitemap: "https://yourdomain.com/sitemap.xml",
  };
}
