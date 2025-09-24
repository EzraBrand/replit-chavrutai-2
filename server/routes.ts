import express, { type Express } from "express";
import { createServer, type Server } from "http";
import fs from "fs";
import path from "path";
import { storage } from "./storage";
import { insertTextSchema } from "@shared/schema";
import { normalizeSefariaTractateName, isValidTractate } from "@shared/tractates";
import { generateSitemapIndex } from "./routes/sitemap-index";
import { generateMainSitemap } from "./routes/sitemap-main";
import { generateSederSitemap } from "./routes/sitemap-seder";
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

// Helper function to provide fallback corpus data
function getFallbackCorpusData() {
  return {
    totalCategories: 14,
    categories: [
      { category: "Tanakh", heCategory: "תנ\"ך", enDesc: "The Hebrew Bible - Torah, Prophets, and Writings", contentsCount: 7 },
      { category: "Mishnah", heCategory: "משנה", enDesc: "The foundational oral law", contentsCount: 9 },
      { category: "Talmud", heCategory: "תלמוד", enDesc: "Rabbinic discussions and elaborations of the Mishnah", contentsCount: 2 },
      { category: "Midrash", heCategory: "מדרש", enDesc: "Homiletic and exegetical literature", contentsCount: 3 },
      { category: "Halakhah", heCategory: "הלכה", enDesc: "Jewish legal literature and codes", contentsCount: 17 },
      { category: "Kabbalah", heCategory: "קבלה", enDesc: "Mystical and esoteric Jewish texts", contentsCount: 14 },
      { category: "Liturgy", heCategory: "תפילה", enDesc: "Prayer books and liturgical texts", contentsCount: 5 },
      { category: "Jewish Thought", heCategory: "מחשבת ישראל", enDesc: "Philosophy and theological works", contentsCount: 13 },
      { category: "Tosefta", heCategory: "תוספתא", enDesc: "Early rabbinic legal collection", contentsCount: 2 },
      { category: "Chasidut", heCategory: "חסידות", enDesc: "Hasidic teachings and texts", contentsCount: 7 },
      { category: "Musar", heCategory: "מוסר", enDesc: "Jewish ethical and moral literature", contentsCount: 3 },
      { category: "Responsa", heCategory: "שו\"ת", enDesc: "Rabbinic legal decisions and answers", contentsCount: 9 },
      { category: "Second Temple", heCategory: "בית שני", enDesc: "Second Temple period literature", contentsCount: 4 },
      { category: "Reference", heCategory: "ספרי עזר", enDesc: "Reference works and study aids", contentsCount: 3 }
    ],
    talmudStructure: {
      bavli: [
        { 
          category: "Seder Zeraim", 
          heCategory: "סדר זרעים", 
          enDesc: "Agriculture and blessings (1 tractate)",
          contents: [{ title: "Berakhot" }]
        },
        { 
          category: "Seder Moed", 
          heCategory: "סדר מועד", 
          enDesc: "Holidays and appointed times (11 tractates)",
          contents: ["Shabbat", "Eruvin", "Pesachim", "Rosh Hashanah", "Yoma", "Sukkah", "Beitzah", "Taanit", "Megillah", "Moed Katan", "Chagigah"].map(t => ({ title: t }))
        },
        { 
          category: "Seder Nashim", 
          heCategory: "סדר נשים", 
          enDesc: "Women and family law (7 tractates)",
          contents: ["Yevamot", "Ketubot", "Nedarim", "Nazir", "Sotah", "Gittin", "Kiddushin"].map(t => ({ title: t }))
        },
        { 
          category: "Seder Nezikin", 
          heCategory: "סדר נזיקין", 
          enDesc: "Damages and civil law (8 tractates)",
          contents: ["Bava Kamma", "Bava Metzia", "Bava Batra", "Sanhedrin", "Makkot", "Shevuot", "Avodah Zarah", "Horayot"].map(t => ({ title: t }))
        },
        { 
          category: "Seder Kodashim", 
          heCategory: "סדר קדשים", 
          enDesc: "Holy things and sacrifices (9 tractates)",
          contents: ["Zevachim", "Menachot", "Chullin", "Bekhorot", "Arakhin", "Temurah", "Keritot", "Meilah", "Tamid"].map(t => ({ title: t }))
        },
        { 
          category: "Seder Tahorot", 
          heCategory: "סדר טהרות", 
          enDesc: "Ritual purity (1 tractate)",
          contents: [{ title: "Niddah" }]
        },
        { 
          category: "Minor Tractates", 
          heCategory: "מסכתות קטנות", 
          enDesc: "Additional rabbinic tractates (15 tractates)",
          contents: ["Avot DeRabbi Natan", "Tractate Soferim", "Tractate Semachot", "Tractate Kallah", "Tractate Derekh Eretz"].map(t => ({ title: t }))
        },
        { 
          category: "Guides", 
          heCategory: "ספרות עזר", 
          enDesc: "Study guides and introductions (5 works)",
          contents: [{ title: "Introductions to the Babylonian Talmud" }]
        }
      ],
      yerushalmi: [
        { category: "Jerusalem Talmud Sedarim", heCategory: "תלמוד ירושלמי", enDesc: "Jerusalem Talmud orders", contents: [] }
      ]
    }
  };
}

// Helper function to extract Bavli structure from Sefaria index
function extractBavliStructure(sefariaIndex: any[]): any[] {
  try {
    const talmudCategory = sefariaIndex.find(cat => cat.category === "Talmud");
    if (!talmudCategory || !talmudCategory.contents) return getFallbackCorpusData().talmudStructure.bavli;
    
    const bavliCategory = talmudCategory.contents.find((subcat: any) => subcat.category === "Bavli");
    if (!bavliCategory || !bavliCategory.contents) return getFallbackCorpusData().talmudStructure.bavli;
    
    return bavliCategory.contents.map((seder: any) => ({
      category: seder.category,
      heCategory: seder.heCategory,
      enDesc: seder.enDesc || `${seder.category} (${seder.contents ? seder.contents.length : 0} items)`,
      contents: (seder.contents || []).map((item: any) => ({
        title: item.title || item.category
      }))
    }));
  } catch (error) {
    console.error('Error extracting Bavli structure:', error);
    return getFallbackCorpusData().talmudStructure.bavli;
  }
}

// Helper function to extract Yerushalmi structure from Sefaria index
function extractYerushalmiStructure(sefariaIndex: any[]): any[] {
  try {
    const talmudCategory = sefariaIndex.find(cat => cat.category === "Talmud");
    if (!talmudCategory || !talmudCategory.contents) return getFallbackCorpusData().talmudStructure.yerushalmi;
    
    const yerushalmiCategory = talmudCategory.contents.find((subcat: any) => subcat.category === "Yerushalmi");
    if (!yerushalmiCategory || !yerushalmiCategory.contents) return getFallbackCorpusData().talmudStructure.yerushalmi;
    
    return yerushalmiCategory.contents.map((seder: any) => ({
      category: seder.category,
      heCategory: seder.heCategory,
      enDesc: seder.enDesc || `${seder.category} (${seder.contents ? seder.contents.length : 0} items)`,
      contents: (seder.contents || []).map((item: any) => ({
        title: item.title || item.category
      }))
    }));
  } catch (error) {
    console.error('Error extracting Yerushalmi structure:', error);
    return getFallbackCorpusData().talmudStructure.yerushalmi;
  }
}

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

// SEO route handler - now allowing all pages to be indexed
function shouldNoIndex(url: string): boolean {
  // Allow all pages to be indexed for comprehensive search coverage
  // This enables indexing of all 5,496+ folio pages across 37 tractates
  return false; // Index all pages
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

  // Get comprehensive Sefaria corpus structure
  app.get("/api/sefaria-corpus", async (req, res) => {
    try {
      // Fetch the complete Sefaria index
      const response = await fetch(`${sefariaAPIBaseURL}/index`);
      
      if (!response.ok) {
        console.error('Failed to fetch Sefaria index:', response.statusText);
        // Return fallback data based on our exploration
        res.json(getFallbackCorpusData());
        return;
      }
      
      const sefariaIndex = await response.json();
      
      // Process and structure the data
      const corpusData = {
        totalCategories: sefariaIndex.length,
        categories: sefariaIndex.map((category: any) => ({
          category: category.category,
          heCategory: category.heCategory,
          enDesc: category.enDesc,
          contentsCount: category.contents ? category.contents.length : 0
        })),
        talmudStructure: {
          bavli: extractBavliStructure(sefariaIndex),
          yerushalmi: extractYerushalmiStructure(sefariaIndex)
        }
      };
      
      res.json(corpusData);
    } catch (error) {
      console.error('Error fetching Sefaria corpus:', error);
      // Return fallback data
      res.json(getFallbackCorpusData());
    }
  });

  // SEO Routes - Nested sitemap structure
  app.get('/sitemap.xml', generateSitemapIndex);
  app.get('/sitemap-main.xml', generateMainSitemap);
  app.get('/sitemap-seder-zeraim.xml', generateSederSitemap('zeraim'));
  app.get('/sitemap-seder-moed.xml', generateSederSitemap('moed'));
  app.get('/sitemap-seder-nashim.xml', generateSederSitemap('nashim'));
  app.get('/sitemap-seder-nezikin.xml', generateSederSitemap('nezikin'));
  app.get('/sitemap-seder-kodashim.xml', generateSederSitemap('kodashim'));
  app.get('/sitemap-seder-tohorot.xml', generateSederSitemap('tohorot'));

  const httpServer = createServer(app);
  return httpServer;
}
