import { CANONICAL_BASE_URL } from "@workspace/shared-data/brand";
import type { Request, Response } from "express";

const HEBREW_LETTERS = [
  "א", "ב", "ג", "ד", "ה", "ו", "ז", "ח", "ט", "י", "כ",
  "ל", "מ", "נ", "ס", "ע", "פ", "צ", "ק", "ר", "ש", "ת",
] as const;

export function generateDictionariesSitemap(req: Request, res: Response) {
  const baseUrl =
    process.env.NODE_ENV === "production"
      ? CANONICAL_BASE_URL
      : `${req.protocol}://${req.get("host")}`;

  const paths = ["jastrow", "bdb"].flatMap((dictionary) => [
    `/${dictionary}`,
    `/${dictionary}/headwords`,
    `/${dictionary}/abbreviations`,
    ...HEBREW_LETTERS.map(
      (letter) => `/${dictionary}/headwords/${encodeURIComponent(letter)}`,
    ),
  ]);

  const urls = paths
    .map(
      (path) => `  <url>
    <loc>${baseUrl}${path}</loc>
    <changefreq>monthly</changefreq>
    <priority>${path.split("/").length === 2 ? "0.8" : "0.6"}</priority>
  </url>`,
    )
    .join("\n");

  res
    .type("application/xml")
    .send(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`);
}
