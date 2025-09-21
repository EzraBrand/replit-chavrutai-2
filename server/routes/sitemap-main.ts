import { Request, Response } from 'express';
import { TRACTATE_LISTS } from '../../shared/tractates';

export function generateMainSitemap(req: Request, res: Response) {
  // Use production URL for deployed site
  const baseUrl = process.env.NODE_ENV === 'production' 
    ? 'https://chavrutai.com' 
    : req.protocol + '://' + req.get('host');
  
  const currentDate = new Date().toISOString().split('T')[0];
  
  let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- Main navigation pages -->
  <url>
    <loc>${baseUrl}/</loc>
    <priority>1.0</priority>
    <changefreq>weekly</changefreq>
    <lastmod>${currentDate}</lastmod>
  </url>
  <url>
    <loc>${baseUrl}/contents</loc>
    <priority>0.9</priority>
    <changefreq>weekly</changefreq>
    <lastmod>${currentDate}</lastmod>
  </url>
  <url>
    <loc>${baseUrl}/suggested-pages</loc>
    <priority>0.8</priority>
    <changefreq>monthly</changefreq>
    <lastmod>${currentDate}</lastmod>
  </url>
  <url>
    <loc>${baseUrl}/about</loc>
    <priority>0.8</priority>
    <changefreq>monthly</changefreq>
    <lastmod>${currentDate}</lastmod>
  </url>
  <url>
    <loc>${baseUrl}/blog-posts</loc>
    <priority>0.8</priority>
    <changefreq>weekly</changefreq>
    <lastmod>${currentDate}</lastmod>
  </url>
  <url>
    <loc>${baseUrl}/outline/sanhedrin/10</loc>
    <priority>0.7</priority>
    <changefreq>monthly</changefreq>
    <lastmod>${currentDate}</lastmod>
  </url>

  <!-- Tractate contents pages -->`;

  // Add all tractate contents pages
  TRACTATE_LISTS["Talmud Bavli"].forEach((tractate: string) => {
    const tractateSlug = tractate.toLowerCase().replace(/\s+/g, '-');
    sitemap += `
  <url>
    <loc>${baseUrl}/contents/${tractateSlug}</loc>
    <priority>0.7</priority>
    <changefreq>monthly</changefreq>
  </url>`;
  });

  sitemap += `
</urlset>`;

  res.set('Content-Type', 'application/xml');
  res.send(sitemap);
}