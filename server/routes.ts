import express, { type Express } from "express";
import { createServer, type Server } from "http";
import fs from "fs";
import path from "path";
import { storage } from "./storage";
import { insertTextSchema, searchRequestSchema, browseRequestSchema, autosuggestRequestSchema } from "@shared/schema";
import { normalizeSefariaTractateName, normalizeDisplayTractateName, isValidTractate } from "@shared/tractates";
import { generateSitemapIndex } from "./routes/sitemap-index";
import { generateMainSitemap } from "./routes/sitemap-main";
import { generateSederSitemap } from "./routes/sitemap-seder";
import { z } from "zod";

// Import text processing utilities from shared library
import { processHebrewTextCore as processHebrewText, processEnglishText } from "@shared/text-processing";

const sefariaAPIBaseURL = "https://www.sefaria.org/api";

// Query parameters schema for text requests
const textQuerySchema = z.object({
  work: z.string(),
  tractate: z.string(), 
  chapter: z.coerce.number(),
  folio: z.coerce.number(),
  side: z.enum(['a', 'b'])
});

const tractateListSchema = z.object({
  work: z.string()
});

// Generate SEO meta tags based on URL route
function generateServerSideMetaTags(url: string): { title: string; description: string; ogTitle: string; ogDescription: string; canonical: string; robots: string } {
  const baseUrl = process.env.NODE_ENV === 'production' ? 'https://chavrutai.com' : 'http://localhost:5000';
  
  // Default fallback (current static meta)
  let seoData = {
    title: "Study Talmud Online - Free Digital Platform | ChavrutAI",
    description: "Access all 37 tractates of the Babylonian Talmud with Hebrew-English text, chapter navigation, and modern study tools. Start learning today - completely free.",
    ogTitle: "Study Talmud Online Free - Digital Platform",
    ogDescription: "Access all 37 tractates of the Babylonian Talmud with Hebrew-English text, chapter navigation, and modern study tools. Start learning today - completely free.",
    canonical: `${baseUrl}/`,
    robots: "index, follow"
  };

  // Route-specific SEO data (mirroring client-side generateSEOData)
  if (url === '/' || url === '/contents') {
    // Homepage/Contents - keep current data
    seoData.canonical = `${baseUrl}${url === '/' ? '/' : '/contents'}`;
  } else if (url === '/about') {
    seoData = {
      title: "About ChavrutAI - Free Digital Talmud Learning Platform",
      description: "Discover how ChavrutAI makes Jewish texts accessible with modern technology. Learn about our free bilingual Talmud study platform designed for learners at all levels.",
      ogTitle: "About ChavrutAI - Free Digital Talmud Learning Platform",
      ogDescription: "Discover how ChavrutAI makes Jewish texts accessible with modern technology. Learn about our free bilingual Talmud study platform designed for learners at all levels.",
      canonical: `${baseUrl}/about`,
      robots: "index, follow"
    };
  } else if (url === '/suggested-pages') {
    seoData = {
      title: "Famous Talmud Pages - Essential Teachings & Stories | ChavrutAI",
      description: "Start with the most famous Talmud pages including Hillel's wisdom, Hannah's prayer, and other essential teachings. Perfect introduction for new learners.",
      ogTitle: "Famous Talmud Pages - Essential Teachings & Stories",
      ogDescription: "Start with the most famous Talmud pages including Hillel's wisdom, Hannah's prayer, and other essential teachings. Perfect introduction for new learners.",
      canonical: `${baseUrl}/suggested-pages`,
      robots: "index, follow"
    };
  } else if (url.match(/^\/contents\/[^/]+$/)) {
    // Tractate pages like /contents/berakhot
    const tractate = url.split('/')[2];
    const tractateTitle = normalizeDisplayTractateName(tractate);
    seoData = {
      title: `${tractateTitle} Talmud - Complete Chapter Guide | ChavrutAI`,
      description: `Study ${tractateTitle} tractate chapter by chapter with Hebrew-English text, detailed folio navigation, and traditional commentary access. Free online Talmud learning.`,
      ogTitle: `${tractateTitle} Talmud - Complete Study Guide`,
      ogDescription: `Study ${tractateTitle} tractate chapter by chapter with Hebrew-English text, detailed folio navigation, and traditional commentary access.`,
      canonical: `${baseUrl}/contents/${tractate}`,
      robots: "index, follow"
    };
  } else if (url.match(/^\/tractate\/[^/]+\/\d+[ab]$/)) {
    // Individual folio pages like /tractate/berakhot/2a
    const urlParts = url.split('/');
    const tractate = urlParts[2];
    const folio = urlParts[3];
    const tractateTitle = normalizeDisplayTractateName(tractate);
    const folioUpper = folio.toUpperCase();
    
    seoData = {
      title: `${tractateTitle} ${folioUpper} – Hebrew & English Talmud | ChavrutAI`,
      description: `Study ${tractateTitle} folio ${folioUpper} with parallel Hebrew-English text, traditional commentary, and modern study tools. Free access to Babylonian Talmud online.`,
      ogTitle: `${tractateTitle} ${folioUpper} – Talmud Study Page`,
      ogDescription: `Study ${tractateTitle} folio ${folioUpper} with parallel Hebrew-English text, traditional commentary, and modern study tools.`,
      canonical: `${baseUrl}/tractate/${tractate}/${folio}`,
      robots: "index, follow"
    };
  }
  
  return seoData;
}

// Check if request is from a search engine crawler
function isCrawlerRequest(userAgent: string): boolean {
  const crawlerPatterns = [
    /googlebot/i,
    /bingbot/i,
    /slurp/i, // Yahoo
    /duckduckbot/i,
    /baiduspider/i,
    /yandexbot/i,
    /facebookexternalhit/i,
    /twitterbot/i,
    /linkedinbot/i,
    /whatsapp/i,
    /telegrambot/i,
    /applebot/i,
    /crawler/i,
    /spider/i,
    /bot/i
  ];
  
  return crawlerPatterns.some(pattern => pattern.test(userAgent));
}

// Serve HTML page with server-side injected meta tags (only for crawlers)
async function servePageWithMeta(req: express.Request, res: express.Response, next: express.NextFunction): Promise<void> {
  try {
    const userAgent = req.get('User-Agent') || '';
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    // Only serve SSR for crawlers - let static/Vite handle regular browsers and assets
    if (!isCrawlerRequest(userAgent)) {
      return next(); // Let Vite (dev) or static serving (prod) handle this request
    }
    
    // Additional safety: don't serve SSR for asset requests
    const isAssetRequest = req.path.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$/i);
    if (isAssetRequest) {
      return next();
    }
    
    const clientTemplate = path.resolve(
      import.meta.dirname,
      "..",
      "client",
      "index.html",
    );

    // Read the HTML template
    let template = await fs.promises.readFile(clientTemplate, "utf-8");
    
    // Generate SEO data for this route
    const seoData = generateServerSideMetaTags(req.originalUrl);
    
    // Replace static meta tags with dynamic ones
    template = template
      .replace(
        /<title>.*?<\/title>/,
        `<title>${seoData.title}</title>`
      )
      .replace(
        /<meta name="description" content=".*?"/,
        `<meta name="description" content="${seoData.description}"`
      )
      .replace(
        /<meta property="og:title" content=".*?"/,
        `<meta property="og:title" content="${seoData.ogTitle}"`
      )
      .replace(
        /<meta property="og:description" content=".*?"/,
        `<meta property="og:description" content="${seoData.ogDescription}"`
      )
      .replace(
        /<meta property="og:url" content=".*?"/,
        `<meta property="og:url" content="${seoData.canonical}"`
      )
      .replace(
        /<meta name="robots" content=".*?"/,
        `<meta name="robots" content="${seoData.robots}"`
      );
    
    // Add canonical tag if not present
    if (!template.includes('<link rel="canonical"')) {
      template = template.replace(
        '</head>',
        `  <link rel="canonical" href="${seoData.canonical}" />\n  </head>`
      );
    }
    
    res.status(200).set({ "Content-Type": "text/html" }).end(template);
  } catch (error) {
    console.error('Error serving page with meta:', error);
    // Fall through to next middleware (Vite)
    next(error);
  }
}

// SEO route handler - now allowing all pages to be indexed
function shouldNoIndex(url: string): boolean {
  // Allow all pages to be indexed for comprehensive search coverage
  // This enables indexing of all 5,496+ folio pages across 37 tractates
  return false; // Index all pages
}

export async function registerRoutes(app: Express): Promise<Server> {
  
  // URL normalization middleware - redirect all URL variations to canonical format
  app.use((req, res, next) => {
    const url = req.path;
    let canonicalUrl = url;
    let needsRedirect = false;
    
    // Remove trailing slashes (except for root)
    if (url.length > 1 && url.endsWith('/')) {
      canonicalUrl = canonicalUrl.slice(0, -1);
      needsRedirect = true;
    }
    
    // Normalize tractate folio pages: /tractate/:tractate/:folio
    const tractatePageMatch = canonicalUrl.match(/^\/tractate\/([^/]+)\/(\d+)([ab])$/i);
    if (tractatePageMatch) {
      const [, tractate, folio, side] = tractatePageMatch;
      const normalizedTractate = tractate.toLowerCase().replace(/\s+/g, '-');
      const normalizedFolio = folio + side.toLowerCase();
      const normalizedUrl = `/tractate/${normalizedTractate}/${normalizedFolio}`;
      
      if (canonicalUrl !== normalizedUrl) {
        canonicalUrl = normalizedUrl;
        needsRedirect = true;
      }
    }
    
    // Normalize tractate contents pages: /contents/:tractate
    const contentsPageMatch = canonicalUrl.match(/^\/contents\/([^/]+)$/i);
    if (contentsPageMatch) {
      const [, tractate] = contentsPageMatch;
      const normalizedTractate = tractate.toLowerCase().replace(/\s+/g, '-');
      const normalizedUrl = `/contents/${normalizedTractate}`;
      
      if (canonicalUrl !== normalizedUrl) {
        canonicalUrl = normalizedUrl;
        needsRedirect = true;
      }
    }
    
    // Perform 301 redirect if URL needs normalization
    if (needsRedirect) {
      const fullCanonicalUrl = canonicalUrl + (req.url.includes('?') ? req.url.substring(req.url.indexOf('?')) : '');
      return res.redirect(301, fullCanonicalUrl);
    }
    
    next();
  });
  
  // SEO middleware for strategic indexing (must run before specific routes)
  app.use('*', (req, res, next) => {
    if (shouldNoIndex(req.originalUrl)) {
      // Set custom headers for client-side detection
      res.setHeader('X-SEO-NoIndex', 'true');
      // Set official robots header for search engines
      res.setHeader('X-Robots-Tag', 'noindex, nofollow');
    }
    next();
  });
  
  // Server-side meta tag injection for critical pages
  app.get('/', servePageWithMeta);
  app.get('/about', servePageWithMeta);
  app.get('/contents', servePageWithMeta);
  app.get('/suggested-pages', servePageWithMeta);
  app.get('/privacy', servePageWithMeta);
  app.get('/contents/:tractate', servePageWithMeta);
  app.get('/tractate/:tractate/:folio', servePageWithMeta);
  
  // Get specific text
  app.get("/api/text", async (req, res) => {
    try {
      const { work, tractate, chapter, folio, side } = textQuerySchema.parse(req.query);
      
      // Validate tractate name
      if (!isValidTractate(tractate)) {
        res.status(404).json({ error: `Invalid tractate: ${tractate}` });
        return;
      }
      
      // Try to get from local storage first
      let text = await storage.getText(work, tractate, chapter, folio, side);
      
      // If not found locally, try to fetch from Sefaria
      if (!text) {
        try {
          // Normalize tractate name for Sefaria API
          const normalizedTractate = normalizeSefariaTractateName(tractate);
          const sefariaRef = `${normalizedTractate}.${folio}${side}`;
          console.log(`Fetching from Sefaria: ${sefariaRef} (original: ${tractate})`);
          const response = await fetch(`${sefariaAPIBaseURL}/texts/${sefariaRef}?lang=bi&commentary=0`);
          
          if (response.ok) {
            const sefariaData = await response.json();
            
            // Parse Sefaria response and preserve section structure
            const hebrewSections = Array.isArray(sefariaData.he) ? sefariaData.he : [sefariaData.he || ''];
            const englishSections = Array.isArray(sefariaData.text) ? sefariaData.text : [sefariaData.text || ''];
            
            // Process each section individually
            const processedHebrewSections = hebrewSections.map((section: string) => processHebrewText(section || ''));
            const processedEnglishSections = englishSections.map((section: string) => processEnglishText(section || ''));
            
            // Also create combined text for backward compatibility
            const hebrewText = processedHebrewSections.join('\n\n');
            const englishText = processedEnglishSections.join('\n\n');
            
            // Fetch next page's first section for page continuation
            let nextPageFirstSection: { hebrew: string; english: string } | null = null;
            
            try {
              const nextFolio = side === 'a' ? folio : folio + 1;
              const nextSide = side === 'a' ? 'b' : 'a';
              const nextSefariaRef = `${normalizedTractate}.${nextFolio}${nextSide}`;
              const nextResponse = await fetch(`${sefariaAPIBaseURL}/texts/${nextSefariaRef}?lang=bi&commentary=0`);
              
              if (nextResponse.ok) {
                const nextSefariaData = await nextResponse.json();
                const nextHebrewSections = Array.isArray(nextSefariaData.he) ? nextSefariaData.he : [nextSefariaData.he || ''];
                const nextEnglishSections = Array.isArray(nextSefariaData.text) ? nextSefariaData.text : [nextSefariaData.text || ''];
                
                if (nextHebrewSections[0] || nextEnglishSections[0]) {
                  nextPageFirstSection = {
                    hebrew: processHebrewText(nextHebrewSections[0] || ''),
                    english: processEnglishText(nextEnglishSections[0] || '')
                  };
                }
              }
            } catch (nextPageError) {
              console.log('Could not fetch next page for continuation:', nextPageError);
            }

            const newText = {
              work,
              tractate,
              chapter,
              folio,
              side,
              hebrewText,
              englishText,
              hebrewSections: processedHebrewSections,
              englishSections: processedEnglishSections,
              sefariaRef,
              nextPageFirstSection
            };
            
            text = await storage.createText(newText);
          }
        } catch (sefariaError) {
          console.error('Error fetching from Sefaria:', sefariaError);
        }
      }
      
      if (!text) {
        return res.status(404).json({ 
          message: `Text not found for ${work} ${tractate} ${chapter} ${folio}${side}` 
        });
      }
      
      res.json(text);
    } catch (error) {
      console.error('Error in /api/text:', error);
      res.status(400).json({ message: "Invalid request parameters" });
    }
  });

  // Get list of tractates for a work
  app.get("/api/tractates", async (req, res) => {
    try {
      const { work } = tractateListSchema.parse(req.query);
      const { TRACTATE_LISTS } = await import('../shared/tractates');
      
      res.json({ tractates: TRACTATE_LISTS[work as keyof typeof TRACTATE_LISTS] || [] });
    } catch (error) {
      res.status(400).json({ message: "Invalid work parameter" });
    }
  });

  // Get chapters for a tractate
  app.get("/api/chapters", async (req, res) => {
    try {
      const { tractate } = z.object({ tractate: z.string() }).parse(req.query);
      
      const { TRACTATE_FOLIO_RANGES } = await import('../shared/tractates');
      
      const maxFolio = TRACTATE_FOLIO_RANGES[tractate as keyof typeof TRACTATE_FOLIO_RANGES] || 150;
      
      // Return a single chapter covering the full folio range
      const chapters = [
        { number: 1, folioRange: `2-${maxFolio}` }
      ];
      
      res.json({ chapters });
    } catch (error) {
      res.status(400).json({ message: "Invalid tractate parameter" });
    }
  });

  // Sefaria fetch endpoint for the fetch page
  app.get("/api/sefaria-fetch", async (req, res) => {
    try {
      const { inputMethod, tractate, page, section, url } = req.query;

      let sefariaRef = '';
      let parsedTractate = '';
      let parsedPage = '';
      let parsedSection: number | undefined;

      if (inputMethod === 'url' && typeof url === 'string') {
        // Parse Sefaria URL - remove query parameters first
        const cleanUrl = url.split('?')[0];
        const urlParts = cleanUrl.split('/');
        const reference = urlParts[urlParts.length - 1];
        
        if (!reference) {
          res.status(400).json({ error: 'Invalid URL format' });
          return;
        }

        // Parse reference (e.g., "Sanhedrin.43b.9", "Berakhot.2a", or "Sukkah.53a.5-6")
        // Support both single section and section ranges
        const match = reference.match(/^([^.]+)\.(\d+[ab])(?:\.(\d+(?:-\d+)?))?$/);
        if (!match) {
          res.status(400).json({ error: 'Invalid reference format' });
          return;
        }

        parsedTractate = match[1];
        parsedPage = match[2];
        // For ranges like "5-6", just take the first section for now
        if (match[3]) {
          const sectionPart = match[3].split('-')[0];
          parsedSection = parseInt(sectionPart);
        }
      } else if (inputMethod === 'dropdown') {
        parsedTractate = tractate as string;
        parsedPage = page as string;
        parsedSection = (section && section !== 'all') ? parseInt(section as string) : undefined;
      } else {
        res.status(400).json({ error: 'Invalid input method' });
        return;
      }

      // Normalize tractate name for Sefaria API
      const normalizedTractate = normalizeSefariaTractateName(parsedTractate);
      sefariaRef = `${normalizedTractate}.${parsedPage}`;

      console.log(`Fetching from Sefaria: ${sefariaRef}`);
      const response = await fetch(`${sefariaAPIBaseURL}/texts/${sefariaRef}?lang=bi&commentary=0`);
      
      if (!response.ok) {
        res.status(response.status).json({ error: `Failed to fetch text from Sefaria` });
        return;
      }

      const sefariaData = await response.json();
      
      // Parse Sefaria response and preserve section structure
      let hebrewSections = Array.isArray(sefariaData.he) ? sefariaData.he : [sefariaData.he || ''];
      let englishSections = Array.isArray(sefariaData.text) ? sefariaData.text : [sefariaData.text || ''];

      // Filter to specific section or range if requested
      if (parsedSection !== undefined) {
        const sectionIdx = parsedSection - 1;
        // Check if the URL has a range (e.g., "5-6")
        const urlParts = typeof url === 'string' ? url.split('?')[0].split('/') : [];
        const reference = urlParts[urlParts.length - 1] || '';
        const rangeMatch = reference.match(/\.(\d+)-(\d+)$/);
        
        if (rangeMatch) {
          // Handle section range
          const startSection = parseInt(rangeMatch[1]);
          const endSection = parseInt(rangeMatch[2]);
          const startIdx = startSection - 1;
          const endIdx = endSection; // end is inclusive
          
          if (startIdx >= 0 && startIdx < hebrewSections.length) {
            hebrewSections = hebrewSections.slice(startIdx, endIdx);
            englishSections = englishSections.slice(startIdx, endIdx);
          } else {
            hebrewSections = [];
            englishSections = [];
          }
        } else {
          // Handle single section
          if (sectionIdx >= 0 && sectionIdx < hebrewSections.length) {
            hebrewSections = [hebrewSections[sectionIdx]];
            englishSections = [englishSections[sectionIdx]];
          } else {
            hebrewSections = [];
            englishSections = [];
          }
        }
      }

      // Process each section individually with the same text processing as the rest of the app
      const processedHebrewSections = hebrewSections.map((section: string) => processHebrewText(section || ''));
      const processedEnglishSections = englishSections.map((section: string) => processEnglishText(section || ''));

      const span = parsedSection 
        ? `${parsedTractate} ${parsedPage}:${parsedSection}`
        : `${parsedTractate} ${parsedPage}:1-${englishSections.length}`;

      res.json({
        tractate: parsedTractate,
        page: parsedPage,
        section: parsedSection,
        hebrewSections: processedHebrewSections,
        englishSections: processedEnglishSections,
        span
      });
    } catch (error) {
      console.error('Error in /api/sefaria-fetch:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Get sitemap data for human-readable HTML sitemap page
  app.get("/api/sitemap", async (req, res) => {
    try {
      // Import the same SEDER_TRACTATES data structure used for XML sitemaps
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

      const sederInfo = {
        zeraim: { name: 'Zeraim', description: 'Order of Seeds - Agricultural laws and blessings' },
        moed: { name: 'Moed', description: 'Order of Appointed Times - Sabbath and festivals' },
        nashim: { name: 'Nashim', description: 'Order of Women - Marriage and divorce laws' },
        nezikin: { name: 'Nezikin', description: 'Order of Damages - Civil and criminal law' },
        kodashim: { name: 'Kodashim', description: 'Order of Holy Things - Temple service and ritual slaughter' },
        tohorot: { name: 'Tohorot', description: 'Order of Purities - Ritual purity laws' }
      };

      // Calculate total pages for each Seder
      const sitemapData = Object.entries(SEDER_TRACTATES).map(([sederKey, tractates]) => {
        const totalFolios = tractates.reduce((sum, t) => sum + t.folios, 0);
        const totalPages = totalFolios * 2; // Each folio has 'a' and 'b' sides
        
        return {
          seder: sederKey,
          name: sederInfo[sederKey as keyof typeof sederInfo].name,
          description: sederInfo[sederKey as keyof typeof sederInfo].description,
          tractates: tractates.map(t => ({
            ...t,
            slug: t.name.toLowerCase().replace(/\s+/g, '-'),
            pages: t.folios * 2
          })),
          totalTractates: tractates.length,
          totalFolios,
          totalPages
        };
      });

      res.json({ 
        sedarim: sitemapData,
        summary: {
          totalSedarim: 6,
          totalTractates: Object.values(SEDER_TRACTATES).flat().length,
          totalFolios: Object.values(SEDER_TRACTATES).flat().reduce((sum, t) => sum + t.folios, 0),
          totalPages: Object.values(SEDER_TRACTATES).flat().reduce((sum, t) => sum + t.folios, 0) * 2
        }
      });
    } catch (error) {
      console.error('Error in /api/sitemap:', error);
      res.status(500).json({ message: "Error generating sitemap data" });
    }
  });

  // Bible API Routes
  // Get Bible text for a specific book and chapter
  app.get("/api/bible/text", async (req, res) => {
    try {
      const { BibleQuerySchema } = await import('@shared/schema');
      const { book, chapter } = BibleQuerySchema.parse(req.query);
      
      const { getBookBySlug, normalizeSefariaBookName } = await import('@shared/bible-books');
      const { processHebrewVerse, processEnglishVerse } = await import('./lib/bible-text-processing');
      
      // Validate book
      const bookInfo = getBookBySlug(book);
      if (!bookInfo) {
        res.status(404).json({ error: `Invalid book: ${book}` });
        return;
      }
      
      // Validate chapter
      if (chapter < 1 || chapter > bookInfo.chapters) {
        res.status(400).json({ error: `Invalid chapter ${chapter} for ${bookInfo.name}. Valid range: 1-${bookInfo.chapters}` });
        return;
      }
      
      // Fetch from Sefaria - need to make two calls since v3 API doesn't support multi-version parameter
      const sefariaBookName = normalizeSefariaBookName(book);
      const sefariaRef = `${sefariaBookName}.${chapter}`;
      
      // Fetch Hebrew version
      const hebrewUrl = `https://www.sefaria.org/api/v3/texts/${encodeURIComponent(sefariaRef)}`;
      console.log(`Fetching Hebrew Bible text from Sefaria: ${hebrewUrl}`);
      const hebrewResponse = await fetch(hebrewUrl);
      
      if (!hebrewResponse.ok) {
        console.error(`Sefaria API error (Hebrew): ${hebrewResponse.status} ${hebrewResponse.statusText}`);
        res.status(hebrewResponse.status).json({ error: `Failed to fetch Hebrew Bible text from Sefaria` });
        return;
      }
      
      const hebrewData = await hebrewResponse.json();
      
      // Fetch English version (JPS 1985)
      const englishUrl = `https://www.sefaria.org/api/v3/texts/${encodeURIComponent(sefariaRef)}?version=english&versionTitle=JPS%201985%20Tanakh`;
      console.log(`Fetching English Bible text from Sefaria: ${englishUrl}`);
      const englishResponse = await fetch(englishUrl);
      
      if (!englishResponse.ok) {
        console.error(`Sefaria API error (English): ${englishResponse.status} ${englishResponse.statusText}`);
        res.status(englishResponse.status).json({ error: `Failed to fetch English Bible text from Sefaria` });
        return;
      }
      
      const englishData = await englishResponse.json();
      
      // Extract Hebrew and English verses from their respective responses
      const hebrewVerses = Array.isArray(hebrewData.versions[0]?.text) ? hebrewData.versions[0].text : [];
      const englishVerses = Array.isArray(englishData.versions[0]?.text) ? englishData.versions[0].text : [];
      
      // Process each verse
      const verses = hebrewVerses.map((hebrewVerse: string, index: number) => {
        const englishVerse = englishVerses[index] || '';
        
        return {
          verseNumber: index + 1,
          hebrewSegments: processHebrewVerse(hebrewVerse),
          englishSegments: processEnglishVerse(englishVerse)
        };
      });
      
      res.json({
        work: "Bible",
        book: bookInfo.slug,
        chapter,
        verses,
        sefariaRef,
        verseCount: verses.length
      });
    } catch (error) {
      console.error('Error in /api/bible/text:', error);
      res.status(500).json({ error: "Failed to fetch Bible text" });
    }
  });

  // Get list of all Bible books
  app.get("/api/bible/books", async (req, res) => {
    try {
      const { ALL_BIBLE_BOOKS, BIBLE_SECTIONS } = await import('@shared/bible-books');
      
      res.json({
        books: ALL_BIBLE_BOOKS,
        sections: BIBLE_SECTIONS
      });
    } catch (error) {
      console.error('Error in /api/bible/books:', error);
      res.status(500).json({ error: "Failed to fetch Bible books" });
    }
  });

  // Get chapters for a specific Bible book
  app.get("/api/bible/chapters", async (req, res) => {
    try {
      const { book } = z.object({ book: z.string() }).parse(req.query);
      const { getBookBySlug } = await import('@shared/bible-books');
      
      const bookInfo = getBookBySlug(book);
      if (!bookInfo) {
        res.status(404).json({ error: `Invalid book: ${book}` });
        return;
      }
      
      // Generate array of chapter numbers [1, 2, 3, ..., n]
      const chapters = Array.from({ length: bookInfo.chapters }, (_, i) => i + 1);
      
      res.json({ chapters });
    } catch (error) {
      console.error('Error in /api/bible/chapters:', error);
      res.status(500).json({ error: "Failed to fetch chapters" });
    }
  });

  // SEO Routes - Nested sitemap structure
  app.get('/sitemap.xml', generateSitemapIndex);
  app.get('/sitemap-main.xml', generateMainSitemap);
  app.get('/sitemap-bible.xml', async (req, res) => {
    const { generateBibleSitemap } = await import('./routes/sitemap-bible');
    generateBibleSitemap(req, res);
  });
  app.get('/sitemap-seder-zeraim.xml', generateSederSitemap('zeraim'));
  app.get('/sitemap-seder-moed.xml', generateSederSitemap('moed'));
  app.get('/sitemap-seder-nashim.xml', generateSederSitemap('nashim'));
  app.get('/sitemap-seder-nezikin.xml', generateSederSitemap('nezikin'));
  app.get('/sitemap-seder-kodashim.xml', generateSederSitemap('kodashim'));
  app.get('/sitemap-seder-tohorot.xml', generateSederSitemap('tohorot'));

  // Dictionary API Routes
  // Search dictionary entries
  app.get("/api/dictionary/search", async (req, res) => {
    try {
      const { query } = searchRequestSchema.parse(req.query);
      const entries = await storage.searchEntries({ query });
      res.json(entries);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid search query" });
      } else {
        console.error("Dictionary search error:", error);
        res.status(500).json({ error: "Dictionary search failed" });
      }
    }
  });

  // Browse entries by Hebrew letter
  app.get("/api/dictionary/browse", async (req, res) => {
    try {
      const { letter } = browseRequestSchema.parse(req.query);
      const entries = await storage.browseByLetter({ letter });
      res.json(entries);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid letter parameter" });
      } else {
        console.error("Dictionary browse error:", error);
        res.status(500).json({ error: "Dictionary browse failed" });
      }
    }
  });

  // Autosuggest for search terms
  app.get("/api/dictionary/autosuggest", async (req, res) => {
    try {
      const { query } = autosuggestRequestSchema.parse(req.query);
      const suggestions = await storage.getAutosuggest({ query });
      res.json(suggestions);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid autosuggest query" });
      } else {
        console.error("Dictionary autosuggest error:", error);
        res.status(500).json({ error: "Dictionary autosuggest failed" });
      }
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
