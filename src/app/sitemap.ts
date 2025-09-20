import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  
  const routes = [
    {
      path: "/",
      priority: 1.0,
      changeFrequency: "weekly" as const,
    },
    {
      path: "/csv-to-pdf",
      priority: 0.9,
      changeFrequency: "monthly" as const,
    },
    {
      path: "/excel-to-charts",
      priority: 0.9,
      changeFrequency: "monthly" as const,
    },
    {
      path: "/pdf-to-word",
      priority: 0.9,
      changeFrequency: "monthly" as const,
    },
    {
      path: "/contact",
      priority: 0.6,
      changeFrequency: "monthly" as const,
    },
    {
      path: "/privacy",
      priority: 0.3,
      changeFrequency: "yearly" as const,
    },
  ];
  
  const now = new Date().toISOString();
  
  return routes.map((route) => ({
    url: `${baseUrl}${route.path}`,
    lastModified: now,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}

