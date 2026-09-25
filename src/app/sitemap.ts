import type { MetadataRoute } from "next";
import { categories } from "@/lib/catalog";
import { siteUrl } from "@/lib/site";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return [
    { url: siteUrl, lastModified, changeFrequency: "weekly", priority: 1 },
    { url: `${siteUrl}/shop`, lastModified, changeFrequency: "daily", priority: 0.9 },
    ...categories.map((category) => ({
      url: `${siteUrl}/shop?category=${category.id}`,
      lastModified,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ];
}
