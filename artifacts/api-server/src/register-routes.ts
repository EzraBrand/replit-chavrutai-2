import express, { type Express, type Request, type Response } from "express";
import { createServer, type Server } from "http";
import path from "path";
import { getTractateSlug } from "@workspace/shared-data/tractates";
import { isYerushalmiHalakhahMissing } from "@workspace/shared-data/yerushalmi-missing";
import { getYerushalmiTractateInfo } from "@workspace/shared-data/yerushalmi-data";
import { generateSitemapIndex } from "./routes/sitemap-index";
import { generateMainSitemap } from "./routes/sitemap-main";
import { generateSederSitemap } from "./routes/sitemap-seder";
import { generateMishnahSitemap } from "./routes/sitemap-mishnah";
import { generateYerushalmiSitemap } from "./routes/sitemap-yerushalmi";
import { generateRambamSitemap } from "./routes/sitemap-rambam";
import { servePageWithMeta, shouldNoIndex, renderSeoEnhancement } from "./routes/seo";
import { createTalmudRouter } from "./routes/talmud";
import { createMishnahRouter } from "./routes/mishnah";
import { createYerushalmiRouter } from "./routes/yerushalmi";
import { createRambamRouter } from "./routes/rambam";
import { createBibleRouter } from "./routes/bible";
import { createJastrowRouter } from "./routes/jastrow";
import { createBdbRouter } from "./routes/bdb";
import { createChatRouter } from "./routes/chat";
import { createSearchRouter } from "./routes/search";
import { createFeedRouter } from "./routes/feed";
import { createScholarshipRouter } from "./routes/scholarship";

export async function registerRoutes(app: Express): Promise<Server> {
  
  app.use((req, res, next) => {
    const url = req.path;
    let canonicalUrl = url;
    let needsRedirect = false;
    
    if (url.length > 1 && url.endsWith('/')) {
      canonicalUrl = canonicalUrl.slice(0, -1);
      needsRedirect = true;
    }
    
    const talmudFolioMatch = canonicalUrl.match(/^\/talmud\/([^/]+)\/(\d+)([ab])$/i);
    if (talmudFolioMatch) {
      const [, tractate, folio, side] = talmudFolioMatch;
      const normalizedTractate = getTractateSlug(tractate);
      const normalizedFolio = folio + side.toLowerCase();
      const normalizedUrl = `/talmud/${normalizedTractate}/${normalizedFolio}`;
      
      if (canonicalUrl !== normalizedUrl) {
        canonicalUrl = normalizedUrl;
        needsRedirect = true;
      }
    }
    
    const oldTractateMatch = canonicalUrl.match(/^\/tractate\/([^/]+)\/(\d+)([ab])$/i);
    if (oldTractateMatch) {
      const [, tractate, folio, side] = oldTractateMatch;
      const normalizedTractate = getTractateSlug(tractate);
      const normalizedFolio = folio + side.toLowerCase();
      canonicalUrl = `/talmud/${normalizedTractate}/${normalizedFolio}`;
      needsRedirect = true;
    }
    
    const talmudPageMatch = canonicalUrl.match(/^\/talmud\/([^/]+)$/i);
    if (talmudPageMatch) {
      const [, tractate] = talmudPageMatch;
      const normalizedTractate = getTractateSlug(tractate);
      const normalizedUrl = `/talmud/${normalizedTractate}`;
      
      if (canonicalUrl !== normalizedUrl) {
        canonicalUrl = normalizedUrl;
        needsRedirect = true;
      }
    }
    
    const yerushalmiOldChapterMatch = canonicalUrl.match(/^\/yerushalmi\/([^/]+)\/(\d+)$/);
    if (yerushalmiOldChapterMatch) {
      const [, tractate, chapter] = yerushalmiOldChapterMatch;
      const chapterNum = parseInt(chapter, 10);
      // Normalize tractate slug (e.g. "shabbat") to display name ("Shabbat") for the missing-chapter check.
      const tractateDisplayName = getYerushalmiTractateInfo(tractate)?.name ?? tractate;
      // If the entire chapter has no Yerushalmi text (e.g. Shabbat 21+, Makkot 3), redirect to tractate page.
      if (isYerushalmiHalakhahMissing(tractateDisplayName, chapterNum, 1)) {
        canonicalUrl = `/yerushalmi/${tractate}`;
      } else {
        canonicalUrl = `/yerushalmi/${tractate}/${chapter}.1`;
      }
      needsRedirect = true;
    }
    
    if (canonicalUrl === '/contents') {
      canonicalUrl = '/talmud';
      needsRedirect = true;
    }

    // Legacy /dictionary -> /jastrow (preserves query string via the unified redirect tail below)
    if (canonicalUrl === '/dictionary') {
      canonicalUrl = '/jastrow';
      needsRedirect = true;
    }
    const oldContentsPageMatch = canonicalUrl.match(/^\/contents\/([^/]+)$/i);
    if (oldContentsPageMatch) {
      const [, tractate] = oldContentsPageMatch;
      const normalizedTractate = getTractateSlug(tractate);
      canonicalUrl = `/talmud/${normalizedTractate}`;
      needsRedirect = true;
    }
    
    if (needsRedirect) {
      const fullCanonicalUrl = canonicalUrl + (req.url.includes('?') ? req.url.substring(req.url.indexOf('?')) : '');
      return res.redirect(301, fullCanonicalUrl);
    }
    
    next();
  });
  
  app.use('{*path}', (req, res, next) => {
    if (shouldNoIndex(req.originalUrl)) {
      res.setHeader('X-SEO-NoIndex', 'true');
      res.setHeader('X-Robots-Tag', 'noindex, nofollow');
    }
    next();
  });
  
  app.get('/', servePageWithMeta);
  app.get('/about', servePageWithMeta);
  app.get('/talmud', servePageWithMeta);
  app.get('/suggested-pages', servePageWithMeta);
  app.get('/privacy', servePageWithMeta);
  app.get('/search', servePageWithMeta);
  app.get('/sitemap', servePageWithMeta);
  app.get('/contact', servePageWithMeta);
  app.get('/changelog', servePageWithMeta);
  app.get('/jastrow', servePageWithMeta);
  app.get('/jastrow/abbreviations', servePageWithMeta);
  app.get('/talmud/term-replacements', servePageWithMeta);
  app.get('/bdb', servePageWithMeta);
  app.get('/bdb/abbreviations', servePageWithMeta);
  app.get('/term-index', servePageWithMeta);
  app.get('/blog-posts', servePageWithMeta);
  app.get('/biblical-index', servePageWithMeta);
  app.get('/bible', servePageWithMeta);
  app.get('/bible/:book', servePageWithMeta);
  app.get('/bible/:book/:chapter', servePageWithMeta);
  app.get('/sugya-viewer', servePageWithMeta);
  app.get('/mishnah-map', servePageWithMeta);
  app.get('/mishnah', servePageWithMeta);
  app.get('/mishnah/:tractate', servePageWithMeta);
  app.get('/mishnah/:tractate/:chapter', servePageWithMeta);
  app.get('/yerushalmi', servePageWithMeta);
  app.get('/yerushalmi/:tractate', servePageWithMeta);
  app.get('/yerushalmi/:tractate/:chapterHalakhah', servePageWithMeta);
  app.get('/rambam', servePageWithMeta);
  app.get('/rambam/:hilchot', servePageWithMeta);
  app.get('/rambam/:hilchot/:chapter', servePageWithMeta);
  app.get('/scholarship', servePageWithMeta);
  app.get('/scholarship/:workSlug', servePageWithMeta);
  app.get('/scholarship/:workSlug/:sectionSlug', servePageWithMeta);
  app.get('/talmud/:tractate', servePageWithMeta);
  app.get('/talmud/:tractate/:folio', servePageWithMeta);

  app.use(createTalmudRouter());
  app.use(createMishnahRouter());
  app.use(createYerushalmiRouter());
  app.use(createRambamRouter());
  app.use(createBibleRouter());
  app.use(createJastrowRouter());
  app.use(createBdbRouter());
  app.use(createChatRouter());
  app.use(createSearchRouter());
  app.use(createFeedRouter());
  app.use(createScholarshipRouter());

  // Crawler-only SEO enhancement (JSON-LD + pre-rendered body) consumed by the
  // frontend's production server. Core meta tags are computed on the frontend
  // via the shared getPageSEO; this only adds storage-backed enrichment.
  app.get("/api/seo/enhance", async (req, res) => {
    try {
      const rawPath = typeof req.query["path"] === "string" ? req.query["path"] : "/";
      const safePath = rawPath.startsWith("/") ? rawPath : `/${rawPath}`;
      const { structuredData, bodyContent } = await renderSeoEnhancement(safePath);
      res.json({ structuredData, bodyContent });
    } catch (error) {
      req.log.error({ err: error }, "Error in /api/seo/enhance");
      res.status(500).json({ structuredData: null, bodyContent: "" });
    }
  });

  app.get("/api/sitemap", async (req, res) => {
    try {
      const { SEDER_TRACTATES } = await import('@workspace/shared-data/tractates');

      const sederInfo = {
        zeraim: { name: 'Zeraim', description: 'Order of Seeds - Agricultural laws and blessings' },
        moed: { name: 'Moed', description: 'Order of Appointed Times - Sabbath and festivals' },
        nashim: { name: 'Nashim', description: 'Order of Women - Marriage and divorce laws' },
        nezikin: { name: 'Nezikin', description: 'Order of Damages - Civil and criminal law' },
        kodashim: { name: 'Kodashim', description: 'Order of Holy Things - Temple service and ritual slaughter' },
        tohorot: { name: 'Tohorot', description: 'Order of Purities - Ritual purity laws' }
      };

      const getPageCount = (t: { folios: number; lastSide: 'a' | 'b'; startFolio?: number; startSide?: 'a' | 'b' }) => {
        const startFolio = (t as any).startFolio ?? 2;
        const startSide = (t as any).startSide ?? 'a';
        const startOffset = startSide === 'b' ? 1 : 0;
        const endOffset = t.lastSide === 'a' ? 1 : 0;
        return (t.folios - startFolio) * 2 + 2 - startOffset - endOffset;
      };

      const sitemapData = Object.entries(SEDER_TRACTATES).map(([sederKey, tractates]) => {
        const totalFolios = tractates.reduce((sum, t) => sum + t.folios, 0);
        const totalPages = tractates.reduce((sum, t) => sum + getPageCount(t), 0);
        
        return {
          seder: sederKey,
          name: sederInfo[sederKey as keyof typeof sederInfo].name,
          description: sederInfo[sederKey as keyof typeof sederInfo].description,
          tractates: tractates.map(t => ({
            name: t.name,
            folios: t.folios,
            lastSide: t.lastSide,
            startFolio: (t as any).startFolio ?? 2,
            startSide: (t as any).startSide ?? 'a',
            slug: getTractateSlug(t.name),
            pages: getPageCount(t)
          })),
          totalTractates: tractates.length,
          totalFolios,
          totalPages
        };
      });

      const allTractates = Object.values(SEDER_TRACTATES).flat();
      res.json({ 
        sedarim: sitemapData,
        summary: {
          totalSedarim: 6,
          totalTractates: allTractates.length,
          totalFolios: allTractates.reduce((sum, t) => sum + t.folios, 0),
          totalPages: allTractates.reduce((sum, t) => sum + getPageCount(t), 0)
        }
      });
    } catch (error) {
      console.error('Error in /api/sitemap:', error);
      res.status(500).json({ message: "Error generating sitemap data" });
    }
  });

  // Sitemap generators. Registered both at the root path (legacy/direct access)
  // and under the /api prefix, because the shared proxy forwards requests to
  // this server with the /api prefix intact. The chavrutai web server proxies
  // root-domain /sitemap*.xml requests to the /api-prefixed versions.
  const sitemapRoutes: Record<string, (req: Request, res: Response) => void> = {
    '/sitemap.xml': generateSitemapIndex,
    '/sitemap-main.xml': generateMainSitemap,
    '/sitemap-bible.xml': async (req, res) => {
      const { generateBibleSitemap } = await import('./routes/sitemap-bible');
      generateBibleSitemap(req, res);
    },
    '/sitemap-seder-zeraim.xml': generateSederSitemap('zeraim'),
    '/sitemap-seder-moed.xml': generateSederSitemap('moed'),
    '/sitemap-seder-nashim.xml': generateSederSitemap('nashim'),
    '/sitemap-seder-nezikin.xml': generateSederSitemap('nezikin'),
    '/sitemap-seder-kodashim.xml': generateSederSitemap('kodashim'),
    '/sitemap-seder-tohorot.xml': generateSederSitemap('tohorot'),
    '/sitemap-mishnah.xml': generateMishnahSitemap,
    '/sitemap-yerushalmi.xml': generateYerushalmiSitemap,
    '/sitemap-rambam.xml': generateRambamSitemap,
  };
  for (const [route, handler] of Object.entries(sitemapRoutes)) {
    app.get(route, handler);
    app.get(`/api${route}`, handler);
  }

  app.get("/api/glossary", async (_req, res) => {
    const glossary = (await import("@workspace/shared-data/data/glossary_v4.json")).default;
    res.setHeader("Cache-Control", "no-cache");
    res.json(glossary);
  });

  const httpServer = createServer(app);
  return httpServer;
}
