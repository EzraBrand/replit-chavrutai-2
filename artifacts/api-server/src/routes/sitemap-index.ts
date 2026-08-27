import { CANONICAL_BASE_URL } from '@workspace/shared-data/brand';
import { SITEMAP_CHILD_PATHS } from '@workspace/shared-data/sitemap-routes';
import { Request, Response } from 'express';

export function generateSitemapIndex(req: Request, res: Response) {
  // Use production URL for deployed site
  const baseUrl = process.env.NODE_ENV === 'production' 
    ? CANONICAL_BASE_URL 
    : req.protocol + '://' + req.get('host');
  
  const currentDate = new Date().toISOString().split('T')[0];
  
  const children = SITEMAP_CHILD_PATHS.map((path) => `  <sitemap>
    <loc>${baseUrl}${path}</loc>
    <lastmod>${currentDate}</lastmod>
  </sitemap>`).join('\n');

  const sitemapIndex = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${children}
</sitemapindex>`;

  res.set('Content-Type', 'application/xml');
  res.send(sitemapIndex);
}