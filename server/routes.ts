import type { Express } from "express";
import { createServer, type Server } from "http";
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

// SEO route handler for tractate pages
function shouldNoIndex(url: string): boolean {
  // Folio pages should be noindexed (e.g., /tractate/berakhot/2a)
  return /^\/tractate\/[^\/]+\/\d+[ab]$/i.test(url);
}

// Generate dynamic meta tags based on route
function generateMetaTags(url: string): { title: string; description: string; ogTitle: string; ogDescription: string; ogUrl: string; robots: string } {
  const baseUrl = 'https://chavrutai.com';
  
  // Default meta tags
  const defaultMeta = {
    title: "Study Talmud Online - Free Digital Platform | ChavrutAI",
    description: "Access all 37 tractates of the Babylonian Talmud with Hebrew-English text, chapter navigation, and modern study tools. Start learning today - completely free.",
    ogTitle: "Study Talmud Online Free - Digital Platform",
    ogDescription: "Access all 37 tractates of the Babylonian Talmud with Hebrew-English text, chapter navigation, and modern study tools. Start learning today - completely free.",
    ogUrl: `${baseUrl}/`,
    robots: "index, follow"
  };
  
  // Route-specific meta tags
  if (url === '/' || url === '') {
    return { ...defaultMeta, ogUrl: `${baseUrl}/` };
  }
  
  if (url === '/about') {
    return {
      title: "About ChavrutAI - Free Digital Talmud Learning Platform",
      description: "Discover how ChavrutAI makes Jewish texts accessible with modern technology. Learn about our free bilingual Talmud study platform designed for learners at all levels.",
      ogTitle: "About ChavrutAI - Digital Talmud Platform",
      ogDescription: "Discover how ChavrutAI makes Jewish texts accessible with modern technology. Learn about our free bilingual Talmud study platform.",
      ogUrl: `${baseUrl}/about`,
      robots: "index, follow"
    };
  }
  
  if (url === '/contents') {
    return {
      title: "Talmud Study Guide - All 37 Tractates Organized | ChavrutAI",
      description: "Navigate through all tractates of the Babylonian Talmud organized by traditional Seder. Easy chapter breakdown with Hebrew-English text display.",
      ogTitle: "Complete Talmud Study Guide - All Tractates",
      ogDescription: "Navigate through all tractates of the Babylonian Talmud organized by traditional Seder. Easy chapter breakdown with Hebrew-English text display.",
      ogUrl: `${baseUrl}/contents`,
      robots: "index, follow"
    };
  }
  
  if (url === '/suggested-pages') {
    return {
      title: "Famous Talmud Pages - Essential Teachings & Stories | ChavrutAI",
      description: "Start with the most famous Talmud pages including Hillel's wisdom, Hannah's prayer, and other essential teachings. Perfect introduction for new learners.",
      ogTitle: "Famous Talmud Pages - Essential Teachings",
      ogDescription: "Start with the most famous Talmud pages including Hillel's wisdom, Hannah's prayer, and other essential teachings.",
      ogUrl: `${baseUrl}/suggested-pages`,
      robots: "index, follow"
    };
  }
  
  if (url === '/sitemap') {
    return {
      title: "Sitemap - All Pages & Tractates | ChavrutAI",
      description: "Complete sitemap of ChavrutAI's digital Talmud study platform. Find all tractates, famous pages, and study resources organized for easy navigation.",
      ogTitle: "ChavrutAI Sitemap - All Pages",
      ogDescription: "Complete sitemap of ChavrutAI's digital Talmud study platform. Find all tractates, famous pages, and study resources.",
      ogUrl: `${baseUrl}/sitemap`,
      robots: "index, follow"
    };
  }
  
  // Tractate contents pages
  const tractateContentsMatch = url.match(/^\/contents\/([^\/]+)$/);
  if (tractateContentsMatch) {
    const tractate = tractateContentsMatch[1].replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    return {
      title: `${tractate} Talmud - Complete Chapter Guide | ChavrutAI`,
      description: `Study ${tractate} tractate chapter by chapter with Hebrew-English text, detailed folio navigation, and traditional commentary access. Free online Talmud learning.`,
      ogTitle: `${tractate} Talmud - Complete Study Guide`,
      ogDescription: `Study ${tractate} tractate chapter by chapter with Hebrew-English text, detailed folio navigation, and traditional commentary access.`,
      ogUrl: `${baseUrl}${url}`,
      robots: "index, follow"
    };
  }
  
  // Folio pages (should be noindexed)
  const folioMatch = url.match(/^\/tractate\/([^\/]+)\/(\d+[ab])$/);
  if (folioMatch) {
    const tractate = folioMatch[1].replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    const folio = folioMatch[2];
    return {
      title: `${tractate} ${folio} - Talmud Bavli | ChavrutAI`,
      description: `Study ${tractate} folio ${folio} from the Babylonian Talmud with bilingual Hebrew-English text display. Read, analyze and learn from this classic text on ChavrutAI's digital study platform.`,
      ogTitle: `${tractate} ${folio} - Study Talmud Bavli`,
      ogDescription: `Study ${tractate} folio ${folio} from the Babylonian Talmud with Hebrew-English bilingual text on ChavrutAI.`,
      ogUrl: `${baseUrl}${url}`,
      robots: "noindex, nofollow"
    };
  }
  
  // Default fallback
  return { ...defaultMeta, ogUrl: `${baseUrl}${url}` };
}

// Inject meta tags into HTML template
function injectMetaTags(html: string, metaTags: ReturnType<typeof generateMetaTags>): string {
  // Replace title
  html = html.replace(
    /<title>.*?<\/title>/i,
    `<title>${metaTags.title}</title>`
  );
  
  // Replace description
  html = html.replace(
    /<meta name="description" content=".*?"/i,
    `<meta name="description" content="${metaTags.description}"`
  );
  
  // Replace robots
  html = html.replace(
    /<meta name="robots" content=".*?"/i,
    `<meta name="robots" content="${metaTags.robots}"`
  );
  
  // Replace Open Graph title
  html = html.replace(
    /<meta property="og:title" content=".*?"/i,
    `<meta property="og:title" content="${metaTags.ogTitle}"`
  );
  
  // Replace Open Graph description
  html = html.replace(
    /<meta property="og:description" content=".*?"/i,
    `<meta property="og:description" content="${metaTags.ogDescription}"`
  );
  
  // Replace Open Graph URL
  html = html.replace(
    /<meta property="og:url" content=".*?"/i,
    `<meta property="og:url" content="${metaTags.ogUrl}"`
  );
  
  // Replace Twitter title
  html = html.replace(
    /<meta name="twitter:title" content=".*?"/i,
    `<meta name="twitter:title" content="${metaTags.ogTitle}"`
  );
  
  // Replace Twitter description
  html = html.replace(
    /<meta name="twitter:description" content=".*?"/i,
    `<meta name="twitter:description" content="${metaTags.ogDescription}"`
  );
  
  return html;
}

export async function registerRoutes(app: Express): Promise<Server> {
  
  // SEO middleware for dynamic meta tags
  app.use('*', (req, res, next) => {
    if (shouldNoIndex(req.originalUrl)) {
      // Set custom headers for client-side detection
      res.setHeader('X-SEO-NoIndex', 'true');
      // Set official robots header for search engines
      res.setHeader('X-Robots-Tag', 'noindex, nofollow');
    }
    next();
  });

  // Serve custom HTML with dynamic meta tags for key pages
  const servePageWithMeta = async (req: any, res: any, next: any) => {
    try {
      const fs = await import('fs');
      const path = await import('path');
      
      // Determine the correct path to index.html
      let htmlPath;
      if (process.env.NODE_ENV === 'production') {
        htmlPath = path.resolve(import.meta.dirname, 'public', 'index.html');
      } else {
        htmlPath = path.resolve(import.meta.dirname, '..', 'client', 'index.html');
      }
      
      // Check if file exists
      if (!fs.existsSync(htmlPath)) {
        return next(); // Fall back to default handler
      }
      
      // Read the HTML template
      const html = await fs.promises.readFile(htmlPath, 'utf-8');
      
      // Generate meta tags for this route
      const metaTags = generateMetaTags(req.originalUrl);
      
      // Inject the meta tags
      const modifiedHtml = injectMetaTags(html, metaTags);
      
      res.setHeader('Content-Type', 'text/html');
      res.send(modifiedHtml);
    } catch (error) {
      console.error('Error serving page with meta tags:', error);
      next(); // Fall back to default handler
    }
  };

  // Register routes for pages that need unique meta tags
  app.get('/', servePageWithMeta);
  app.get('/about', servePageWithMeta);
  app.get('/contents', servePageWithMeta);
  app.get('/suggested-pages', servePageWithMeta);
  app.get('/sitemap', servePageWithMeta);
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
