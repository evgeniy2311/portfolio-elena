import type { MetadataRoute } from "next";
import { works } from "@/lib/works";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://elena-badyina.example";
  return [
    { url: base, changeFrequency: "monthly", priority: 1 },
    { url: `${base}/works`, changeFrequency: "monthly", priority: 0.9 },
    ...works.map((item) => ({ url: `${base}/works/${item.slug}`, changeFrequency: "monthly" as const, priority: 0.7 })),
  ];
}
