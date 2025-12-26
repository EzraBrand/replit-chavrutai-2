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
      const startFolio = (tractate as any).startFolio ?? 2;
      const startSide = (tractate as any).startSide ?? 'a';
      const startOffset = startSide === 'b' ? 1 : 0;
      const endOffset = lastSide === 'a' ? 1 : 0;
      const pageCount = (tractate.folios - startFolio) * 2 + 2 - startOffset - endOffset;
      
      sitemap += `
  
  <!-- ${tractate.name} (folios ${startFolio}${startSide} to ${tractate.folios}${lastSide}, ${pageCount} pages) -->`;
      
      // Add all folio pages for this tractate (startFolio through final folio)
      for (let folio = startFolio; folio <= tractate.folios; folio++) {
        // Determine which sides to include
        const isFirstFolio = folio === startFolio;
        const isLastFolio = folio === tractate.folios;
        const sides: ('a' | 'b')[] = [];
        
        // Add 'a' side if not the first folio or if startSide is 'a'
        if (!isFirstFolio || startSide === 'a') {
          sides.push('a');
        }
        // Add 'b' side if not the last folio or if lastSide is 'b'
        if (!isLastFolio || lastSide === 'b') {
          sides.push('b');
        }
        
        sides.forEach(side => {
          // Determine priority: higher for significant folios, lower for regular folios
          let priority = '0.4'; // Default for regular folios
          
          // First folios get higher priority as entry points
          if (folio === startFolio && side === startSide) {
            priority = '0.7';
          }
          // Significant folios get medium-high priority
          else if (isSignificantFolio(tractateSlug, `${folio}${side}`)) {
            priority = '0.6';
          }
          // Early folios in each tractate get slightly higher priority
          else if (folio <= startFolio + 8) {
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
      const startFolio = (t as any).startFolio ?? 2;
      const startSide = (t as any).startSide ?? 'a';
      const startOffset = startSide === 'b' ? 1 : 0;
      const endOffset = t.lastSide === 'a' ? 1 : 0;
      return sum + (t.folios - startFolio) * 2 + 2 - startOffset - endOffset;
    }, 0);
    sitemap += `

  <!-- Seder ${sederDisplayName}: ${totalPages} folio pages across ${tractates.length} tractates -->
</urlset>`;

    res.set('Content-Type', 'application/xml');
    res.send(sitemap);
  };
}