import { Request, Response } from 'express';

// Tractate data organized by Seder with accurate folio counts
const SEDER_TRACTATES = {
  zeraim: [
    { name: 'Berakhot', folios: 64 }
  ],
  moed: [
    { name: 'Shabbat', folios: 157 },
    { name: 'Eruvin', folios: 105 },
    { name: 'Pesachim', folios: 121 },
    { name: 'Rosh Hashanah', folios: 35 },
    { name: 'Yoma', folios: 88 },
    { name: 'Sukkah', folios: 56 },
    { name: 'Beitza', folios: 40 },
    { name: 'Taanit', folios: 31 },
    { name: 'Megillah', folios: 32 },
    { name: 'Moed Katan', folios: 29 },
    { name: 'Chagigah', folios: 27 }
  ],
  nashim: [
    { name: 'Yevamot', folios: 122 },
    { name: 'Ketubot', folios: 112 },
    { name: 'Nedarim', folios: 91 },
    { name: 'Nazir', folios: 66 },
    { name: 'Sotah', folios: 49 },
    { name: 'Gittin', folios: 90 },
    { name: 'Kiddushin', folios: 82 }
  ],
  nezikin: [
    { name: 'Bava Kamma', folios: 119 },
    { name: 'Bava Metzia', folios: 119 },
    { name: 'Bava Batra', folios: 176 },
    { name: 'Sanhedrin', folios: 113 },
    { name: 'Makkot', folios: 24 },
    { name: 'Shevuot', folios: 49 },
    { name: 'Avodah Zarah', folios: 76 },
    { name: 'Horayot', folios: 14 }
  ],
  kodashim: [
    { name: 'Zevachim', folios: 120 },
    { name: 'Menachot', folios: 110 },
    { name: 'Chullin', folios: 142 },
    { name: 'Bekhorot', folios: 61 },
    { name: 'Arachin', folios: 34 },
    { name: 'Temurah', folios: 34 },
    { name: 'Keritot', folios: 28 },
    { name: 'Meilah', folios: 22 },
    { name: 'Tamid', folios: 8 },
    { name: 'Middot', folios: 3 },
    { name: 'Kinnim', folios: 4 }
  ],
  tohorot: [
    { name: 'Niddah', folios: 73 }
  ]
};

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

export function generateSederSitemap(sederName: keyof typeof SEDER_TRACTATES) {
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
      const tractateSlug = tractate.name.toLowerCase().replace(/\s+/g, '-');
      
      sitemap += `
  
  <!-- ${tractate.name} (${tractate.folios} folios, ${tractate.folios * 2} pages) -->`;
      
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

    const totalPages = tractates.reduce((sum, t) => sum + (t.folios * 2), 0);
    sitemap += `

  <!-- Seder ${sederDisplayName}: ${totalPages} folio pages across ${tractates.length} tractates -->
</urlset>`;

    res.set('Content-Type', 'application/xml');
    res.send(sitemap);
  };
}