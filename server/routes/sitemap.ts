import { Request, Response } from 'express';
import { TRACTATE_LISTS } from '../shared/tractates';
import { TRACTATE_FOLIO_RANGES } from '../client/src/lib/tractate-ranges';

export function generateSitemap(req: Request, res: Response) {
  const baseUrl = req.protocol + '://' + req.get('host');
  
  let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- Main pages -->
  <url>
    <loc>${baseUrl}/</loc>
    <priority>1.0</priority>
    <changefreq>weekly</changefreq>
  </url>
  <url>
    <loc>${baseUrl}/about</loc>
    <priority>0.8</priority>
    <changefreq>monthly</changefreq>
  </url>
  <url>
    <loc>${baseUrl}/contents</loc>
    <priority>0.9</priority>
    <changefreq>monthly</changefreq>
  </url>
  
  <!-- Tractate contents pages -->`;

  // Add tractate contents pages
  TRACTATE_LISTS["Talmud Bavli"].forEach((tractate: string) => {
    const tractateSlug = tractate.toLowerCase().replace(/\s+/g, '-');
    sitemap += `
  <url>
    <loc>${baseUrl}/contents/${tractateSlug}</loc>
    <priority>0.7</priority>
    <changefreq>monthly</changefreq>
  </url>`;
  });

  // Add individual folio pages (sample of main folios to avoid massive sitemap)
  TRACTATE_LISTS["Talmud Bavli"].forEach((tractate: string) => {
    const tractateSlug = tractate.toLowerCase().replace(/\s+/g, '-');
    const maxFolio = TRACTATE_FOLIO_RANGES[tractate] || 150;
    
    // Add first few folios and some strategic ones
    const strategicFolios = [2, 3, 4, 5, 10, 15, 20, 25, 30];
    strategicFolios.forEach(folio => {
      if (folio <= maxFolio) {
        ['a', 'b'].forEach(side => {
          sitemap += `
  <url>
    <loc>${baseUrl}/tractate/${tractateSlug}/${folio}${side}</loc>
    <priority>0.6</priority>
    <changefreq>yearly</changefreq>
  </url>`;
        });
      }
    });
  });

  sitemap += `
</urlset>`;

  res.set('Content-Type', 'application/xml');
  res.send(sitemap);
}