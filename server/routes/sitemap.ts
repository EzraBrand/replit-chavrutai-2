import { Request, Response } from 'express';
import { TRACTATE_LISTS } from '../../shared/tractates';
import { TRACTATE_FOLIO_RANGES } from '../../client/src/lib/tractate-ranges';

export function generateSitemap(req: Request, res: Response) {
  // Use production URL for deployed site
  const baseUrl = process.env.NODE_ENV === 'production' 
    ? 'https://chavrutai.com' 
    : req.protocol + '://' + req.get('host');
  
  let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- Main pages -->
  <url>
    <loc>${baseUrl}/</loc>
    <priority>1.0</priority>
    <changefreq>weekly</changefreq>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
  </url>
  <url>
    <loc>${baseUrl}/contents</loc>
    <priority>0.9</priority>
    <changefreq>weekly</changefreq>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
  </url>
  <url>
    <loc>${baseUrl}/suggested-pages</loc>
    <priority>0.8</priority>
    <changefreq>monthly</changefreq>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
  </url>
  <url>
    <loc>${baseUrl}/about</loc>
    <priority>0.8</priority>
    <changefreq>monthly</changefreq>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
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

  sitemap += `

  <!-- Comprehensive folio pages organized by Seder (Order) -->`;
  
  // Generate all folio pages organized by tractate and seder
  const tractates = [
    // Seder Zeraim
    { name: 'Berakhot', folios: 64, seder: 'Zeraim' },
    
    // Seder Moed  
    { name: 'Shabbat', folios: 157, seder: 'Moed' },
    { name: 'Eruvin', folios: 105, seder: 'Moed' },
    { name: 'Pesachim', folios: 121, seder: 'Moed' },
    { name: 'Rosh Hashanah', folios: 35, seder: 'Moed' },
    { name: 'Yoma', folios: 88, seder: 'Moed' },
    { name: 'Sukkah', folios: 56, seder: 'Moed' },
    { name: 'Beitza', folios: 40, seder: 'Moed' },
    { name: 'Taanit', folios: 31, seder: 'Moed' },
    { name: 'Megillah', folios: 32, seder: 'Moed' },
    { name: 'Moed Katan', folios: 29, seder: 'Moed' },
    { name: 'Chagigah', folios: 27, seder: 'Moed' },
    
    // Seder Nashim
    { name: 'Yevamot', folios: 122, seder: 'Nashim' },
    { name: 'Ketubot', folios: 112, seder: 'Nashim' },
    { name: 'Nedarim', folios: 91, seder: 'Nashim' },
    { name: 'Nazir', folios: 66, seder: 'Nashim' },
    { name: 'Sotah', folios: 49, seder: 'Nashim' },
    { name: 'Gittin', folios: 90, seder: 'Nashim' },
    { name: 'Kiddushin', folios: 82, seder: 'Nashim' },
    
    // Seder Nezikin
    { name: 'Bava Kamma', folios: 119, seder: 'Nezikin' },
    { name: 'Bava Metzia', folios: 119, seder: 'Nezikin' },
    { name: 'Bava Batra', folios: 176, seder: 'Nezikin' },
    { name: 'Sanhedrin', folios: 113, seder: 'Nezikin' },
    { name: 'Makkot', folios: 24, seder: 'Nezikin' },
    { name: 'Shevuot', folios: 49, seder: 'Nezikin' },
    { name: 'Avodah Zarah', folios: 76, seder: 'Nezikin' },
    { name: 'Horayot', folios: 14, seder: 'Nezikin' },
    
    // Seder Kodashim
    { name: 'Zevachim', folios: 120, seder: 'Kodashim' },
    { name: 'Menachot', folios: 110, seder: 'Kodashim' },
    { name: 'Chullin', folios: 142, seder: 'Kodashim' },
    { name: 'Bekhorot', folios: 61, seder: 'Kodashim' },
    { name: 'Arachin', folios: 34, seder: 'Kodashim' },
    { name: 'Temurah', folios: 34, seder: 'Kodashim' },
    { name: 'Keritot', folios: 28, seder: 'Kodashim' },
    { name: 'Meilah', folios: 22, seder: 'Kodashim' },
    { name: 'Tamid', folios: 8, seder: 'Kodashim' },
    { name: 'Middot', folios: 3, seder: 'Kodashim' },
    { name: 'Kinnim', folios: 4, seder: 'Kodashim' },
    
    // Seder Tohorot  
    { name: 'Niddah', folios: 73, seder: 'Tohorot' }
  ];

  // Helper function to identify significant folios
  function isSignificantFolio(tractate: string, folio: string): boolean {
    const significantFolios = [
      'berakhot/3a', 'berakhot/5a', 'berakhot/17a', 'berakhot/28b',
      'shabbat/31a', 'shabbat/7a', 'shabbat/119a',
      'eruvin/13b', 'pesachim/10a', 'pesachim/116a',
      'rosh-hashanah/16a', 'yoma/85b', 'bava-metzia/59b',
      'sanhedrin/37a', 'sanhedrin/99a', 'avodah-zarah/3b'
    ];
    return significantFolios.includes(`${tractate}/${folio}`);
  }

  let currentSeder = '';
  tractates.forEach(tractate => {
    const tractateSlug = tractate.name.toLowerCase().replace(/\s+/g, '-');
    
    // Add seder header comment when starting a new seder
    if (tractate.seder !== currentSeder) {
      currentSeder = tractate.seder;
      sitemap += `

  <!-- Seder ${tractate.seder} (Order of ${tractate.seder}) -->`;
    }
    
    sitemap += `
  <!-- ${tractate.name} (${tractate.folios} folios) -->`;
    
    // Add all folio pages for this tractate (2a through final folio)
    for (let folio = 2; folio <= tractate.folios; folio++) {
      ['a', 'b'].forEach(side => {
        // Determine priority: higher for significant folios, lower for regular folios
        let priority = '0.4'; // Default for regular folios
        
        // First folios (2a) get higher priority as entry points
        if (folio === 2 && side === 'a') {
          priority = '0.7';
        }
        // Significant folios get medium-high priority
        else if (isSignificantFolio(tractateSlug, `${folio}${side}`)) {
          priority = '0.6';
        }
        // Early folios in each tractate get slightly higher priority
        else if (folio <= 10) {
          priority = '0.5';
        }
        
        sitemap += `
  <url>
    <loc>${baseUrl}/tractate/${tractateSlug}/${folio}${side}</loc>
    <priority>${priority}</priority>
    <changefreq>yearly</changefreq>
  </url>`;
      });
    }
  });

  sitemap += `

  <!-- Comprehensive sitemap: ${tractates.reduce((total, t) => total + t.folios * 2, 0)} folio pages across 37 tractates -->
</urlset>`;

  res.set('Content-Type', 'application/xml');
  res.send(sitemap);
}