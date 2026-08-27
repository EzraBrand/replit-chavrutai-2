import type { Express, Request, Response } from "express";
import { generateBibleSitemap } from "./sitemap-bible";
import { generateDictionariesSitemap } from "./sitemap-dictionaries";
import { generateSitemapIndex } from "./sitemap-index";
import { generateMainSitemap } from "./sitemap-main";
import { generateMishnahSitemap } from "./sitemap-mishnah";
import { generateRambamSitemap } from "./sitemap-rambam";
import { generateSederSitemap } from "./sitemap-seder";
import { generateYerushalmiSitemap } from "./sitemap-yerushalmi";

type SitemapHandler = (req: Request, res: Response) => void;

export const sitemapRoutes: Readonly<Record<string, SitemapHandler>> = {
  "/sitemap.xml": generateSitemapIndex,
  "/sitemap-main.xml": generateMainSitemap,
  "/sitemap-bible.xml": generateBibleSitemap,
  "/sitemap-seder-zeraim.xml": generateSederSitemap("zeraim"),
  "/sitemap-seder-moed.xml": generateSederSitemap("moed"),
  "/sitemap-seder-nashim.xml": generateSederSitemap("nashim"),
  "/sitemap-seder-nezikin.xml": generateSederSitemap("nezikin"),
  "/sitemap-seder-kodashim.xml": generateSederSitemap("kodashim"),
  "/sitemap-seder-taharot.xml": generateSederSitemap("tohorot"),
  "/sitemap-mishnah.xml": generateMishnahSitemap,
  "/sitemap-yerushalmi.xml": generateYerushalmiSitemap,
  "/sitemap-rambam.xml": generateRambamSitemap,
  "/sitemap-dictionaries.xml": generateDictionariesSitemap,
};

export function registerSitemapRoutes(app: Express) {
  for (const [route, handler] of Object.entries(sitemapRoutes)) {
    app.get(route, handler);
    app.get(`/api${route}`, handler);
  }

  // Preserve the previously published spelling without advertising it.
  const tohorotHandler = generateSederSitemap("tohorot");
  app.get("/sitemap-seder-tohorot.xml", tohorotHandler);
  app.get("/api/sitemap-seder-tohorot.xml", tohorotHandler);
}
