import express, { type Express } from "express";
import { createServer, type Server } from "http";
import fs from "fs";
import path from "path";
import { storage } from "./storage";
import { insertTextSchema } from "@shared/schema";
import { normalizeSefariaTractateName } from "@shared/tractates";
import { generateSitemap } from "./routes/sitemap";
import { z } from "zod";

// Text processing utilities
function removeNikud(hebrewText: string): string {
  return hebrewText.replace(/[\u0591-\u05AF\u05B0-\u05BD\u05BF\u05C1-\u05C2\u05C4-\u05C5\u05C7]/g, '');
}

function processHebrewText(text: string): string {
  if (!text) return '';
  
  let processed = removeNikud(text);
  processed = processed
    .replace(/[ \t]+/g, ' ')
    .replace(/\n[ \t]+/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .trim();
    
  return processed;
}

function processEnglishText(text: string): string {
  if (!text) return '';
  
  let processed = text
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n[ \t]+/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .trim();
  
  // No additional formatting - preserve original text
  return processed;
}

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
    const tractateTitle = tractate.charAt(0).toUpperCase() + tractate.slice(1);
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
    const tractateTitle = tractate.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
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

// SEO route handler for strategic indexing
function shouldNoIndex(url: string): boolean {
  // Strategic indexing: Only index pages that are in our sitemap
  // This prevents indexing of all 2,700+ folio pages (wrapper strategy)
  
  // Allow main pages, tractate contents, and strategic folios
  if (url === '/' || url === '/contents' || url === '/about' || url === '/suggested-pages') {
    return false; // Index main pages
  }
  
  if (url.match(/^\/contents\/[^/]+$/)) {
    return false; // Index tractate contents pages
  }
  
  // Strategic folios - first folios (2a) for each tractate
  if (url.match(/^\/tractate\/[^/]+\/2a$/)) {
    return false; // Index 2a pages as entry points
  }
  
  // Famous/significant folios (matching our sitemap)
  const strategicFolios = [
    '/tractate/berakhot/3a', '/tractate/berakhot/5a', '/tractate/berakhot/17a', '/tractate/berakhot/28b',
    '/tractate/shabbat/31a', '/tractate/shabbat/7a', '/tractate/shabbat/119a',
    '/tractate/eruvin/13b', '/tractate/pesachim/10a', '/tractate/pesachim/116a',
    '/tractate/rosh-hashanah/16a', '/tractate/yoma/85b', '/tractate/bava-metzia/59b',
    '/tractate/sanhedrin/37a', '/tractate/sanhedrin/99a', '/tractate/avodah-zarah/3b'
  ];
  
  if (strategicFolios.includes(url)) {
    return false; // Index significant folios
  }
  
  // NoIndex all other folio pages (maintaining wrapper strategy)
  return true;
}

export async function registerRoutes(app: Express): Promise<Server> {
  
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
  app.get('/contents/:tractate', servePageWithMeta);
  app.get('/tractate/:tractate/:folio', servePageWithMeta);
  
  // Get specific text
  app.get("/api/text", async (req, res) => {
    try {
      const { work, tractate, chapter, folio, side } = textQuerySchema.parse(req.query);
      
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

  // SEO Routes
  app.get('/sitemap.xml', generateSitemap);

  const httpServer = createServer(app);
  return httpServer;
}
