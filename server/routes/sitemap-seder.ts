import { Request, Response } from 'express';
import { SEDER_TRACTATES, getTractateSlug, type SederName } from '@shared/tractates';

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

export function generateSederSitemap(sederName: SederName) {
  return (req: Request, res: Response) => {
    // Use production URL for deployed site
    const baseUrl = process.env.NODE_ENV === 'production' 
      ? 'https://chavrutai.com' 
      : req.protocol + '://' + req.get('host');
    
    const tractates = SEDER_TRACTATES[sederName];
    const sederDisplayName = sederName.charAt(0).toUpperCase() + sederName.slice(1);
    
    let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- Seder ${sederDisplayName} - ${tractates.length} tractates -->`;

    tractates.forEach(tractate => {
      const tractateSlug = getTractateSlug(tractate.name);
      const lastSide = tractate.lastSide;
      const pageCount = (tractate.folios - 1) * 2 + (lastSide === 'b' ? 2 : 1);
      
      sitemap += `
  
  <!-- ${tractate.name} (${tractate.folios} folios ending at ${tractate.folios}${lastSide}, ${pageCount} pages) -->`;
      
      // Add all folio pages for this tractate (2a through final folio)
      for (let folio = 2; folio <= tractate.folios; folio++) {
        const sides = folio === tractate.folios && lastSide === 'a' ? ['a'] : ['a', 'b'];
        sides.forEach(side => {
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

    const totalPages = tractates.reduce((sum, t) => {
      return sum + (t.folios - 1) * 2 + (t.lastSide === 'b' ? 2 : 1);
    }, 0);
    sitemap += `

  <!-- Seder ${sederDisplayName}: ${totalPages} folio pages across ${tractates.length} tractates -->
</urlset>`;

    res.set('Content-Type', 'application/xml');
    res.send(sitemap);
  };
}