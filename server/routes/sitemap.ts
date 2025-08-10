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
  </url>
  <url>
    <loc>${baseUrl}/about</loc>
    <priority>0.8</priority>
    <changefreq>monthly</changefreq>
  </url>
  <url>
    <loc>${baseUrl}/suggested-pages</loc>
    <priority>0.8</priority>
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

  // Strategic folio pages - focus on key entry points and significant passages
  
  // Add first folio (2a) for each tractate as primary entry points
  TRACTATE_LISTS["Talmud Bavli"].forEach((tractate: string) => {
    const tractateSlug = tractate.toLowerCase().replace(/\s+/g, '-');
    sitemap += `
  <url>
    <loc>${baseUrl}/tractate/${tractateSlug}/2a</loc>
    <priority>0.7</priority>
    <changefreq>yearly</changefreq>
  </url>`;
  });

  // Famous and significant folios - educational and cultural importance
  const significantFolios = [
    // Berakhot - foundational blessings and prayer
    { tractate: 'berakhot', folio: '3a' }, // Times for Shema
    { tractate: 'berakhot', folio: '5a' }, // Suffering and reward
    { tractate: 'berakhot', folio: '17a' }, // Prayer of Mar son of Ravina
    { tractate: 'berakhot', folio: '28b' }, // Prayer of Rabbi Nehunia
    
    // Shabbat - core Sabbath laws and famous stories
    { tractate: 'shabbat', folio: '31a' }, // Hillel and the convert
    { tractate: 'shabbat', folio: '7a' }, // Primary categories of work
    { tractate: 'shabbat', folio: '119a' }, // Rewards for Sabbath observance
    
    // Eruvin - boundary laws
    { tractate: 'eruvin', folio: '13b' }, // Disputes of Hillel and Shammai
    
    // Pesachim - Passover laws
    { tractate: 'pesachim', folio: '10a' }, // Search for chametz
    { tractate: 'pesachim', folio: '116a' }, // Four questions
    
    // Rosh Hashanah - New Year and judgment
    { tractate: 'rosh-hashanah', folio: '16a' }, // Divine judgment
    
    // Yoma - Day of Atonement
    { tractate: 'yoma', folio: '85b' }, // Saving life overrides Sabbath
    
    // Bava Metzia - ethics and business law
    { tractate: 'bava-metzia', folio: '59b' }, // Oven of Akhnai
    
    // Sanhedrin - court procedures and capital punishment
    { tractate: 'sanhedrin', folio: '37a' }, // Value of human life
    { tractate: 'sanhedrin', folio: '99a' }, // Defining a heretic
    
    // Avodah Zarah - idolatry laws
    { tractate: 'avodah-zarah', folio: '3b' } // God's daily schedule
  ];

  // Add significant folios with medium priority
  significantFolios.forEach(({ tractate, folio }) => {
    sitemap += `
  <url>
    <loc>${baseUrl}/tractate/${tractate}/${folio}</loc>
    <priority>0.6</priority>
    <changefreq>yearly</changefreq>
  </url>`;
  });

  sitemap += `
  
  <!-- Strategic sitemap focusing on key entry points and significant folios -->
</urlset>`;

  res.set('Content-Type', 'application/xml');
  res.send(sitemap);
}