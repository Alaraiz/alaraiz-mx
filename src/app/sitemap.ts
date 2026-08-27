import type { MetadataRoute } from "next";
import { db, ensureMigrated } from "@/lib/db";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://alaraiz.mx";
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date("2026-06-01"),
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/detente/01`,
      lastModified: new Date("2026-01-15"),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/detente/02`,
      lastModified: new Date("2026-03-01"),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/nueva-experiencia`,
      lastModified: new Date("2026-05-01"),
      changeFrequency: "monthly",
      priority: 0.6,
    },
  ];

  try {
    await ensureMigrated();
    const result = await db.execute(
      `SELECT slug, updated_at, created_at
       FROM experiences
       WHERE is_published = 1 AND slug IS NOT NULL
       ORDER BY created_at ASC`
    );

    const experienceRoutes: MetadataRoute.Sitemap = result.rows.map((row) => ({
      url: `${baseUrl}/reservar/${String(row.slug)}`,
      lastModified: new Date(String(row.updated_at || row.created_at || "2026-06-01")),
      changeFrequency: "weekly",
      priority: 0.7,
    }));

    return [...staticRoutes, ...experienceRoutes];
  } catch {
    return staticRoutes;
  }
}
