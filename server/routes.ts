import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertTextSchema } from "@shared/schema";
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

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Get specific text
  app.get("/api/text", async (req, res) => {
    try {
      const { work, tractate, chapter, folio, side } = textQuerySchema.parse(req.query);
      
      // Try to get from local storage first
      let text = await storage.getText(work, tractate, chapter, folio, side);
      
      // If not found locally, try to fetch from Sefaria
      if (!text) {
        try {
          const sefariaRef = `${tractate}.${folio}${side}`;
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
              sefariaRef
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
      
      // Hardcoded tractate lists based on traditional ordering
      const tractates: Record<string, string[]> = {
        "Bible": [
          "Genesis", "Exodus", "Leviticus", "Numbers", "Deuteronomy",
          "Joshua", "Judges", "Samuel I", "Samuel II", "Kings I", "Kings II",
          "Isaiah", "Jeremiah", "Ezekiel", "Hosea", "Joel", "Amos", "Obadiah",
          "Jonah", "Micah", "Nahum", "Habakkuk", "Zephaniah", "Haggai", "Zechariah", "Malachi",
          "Psalms", "Proverbs", "Job", "Song of Songs", "Ruth", "Lamentations",
          "Ecclesiastes", "Esther", "Daniel", "Ezra", "Nehemiah", "Chronicles I", "Chronicles II"
        ],
        "Mishnah": [
          "Berakhot", "Peah", "Demai", "Kilayim", "Sheviit", "Terumot", "Maasrot", "Maaser Sheni", "Challah", "Orlah", "Bikkurim",
          "Shabbat", "Eruvin", "Pesachim", "Shekalim", "Yoma", "Sukkah", "Beitzah", "Rosh Hashanah", "Taanit", "Megillah", "Moed Katan", "Chagigah",
          "Yevamot", "Ketubot", "Nedarim", "Nazir", "Sotah", "Gittin", "Kiddushin",
          "Bava Kamma", "Bava Metzia", "Bava Batra", "Sanhedrin", "Makkot", "Shevuot", "Eduyot", "Avodah Zarah", "Avot", "Horayot",
          "Zevachim", "Menachot", "Chullin", "Bekhorot", "Arakhin", "Temurah", "Keritot", "Meilah", "Tamid", "Middot", "Kinnim",
          "Kelim", "Oholot", "Negaim", "Parah", "Taharot", "Mikvaot", "Niddah", "Makhshirin", "Zavim", "Tevul Yom", "Yadayim", "Uktzin"
        ],
        "Talmud Yerushalmi": [
          "Berakhot", "Peah", "Demai", "Kilayim", "Sheviit", "Terumot", "Maasrot", "Maaser Sheni", "Challah", "Orlah", "Bikkurim",
          "Shabbat", "Eruvin", "Pesachim", "Shekalim", "Yoma", "Sukkah", "Beitzah", "Rosh Hashanah", "Taanit", "Megillah", "Chagigah",
          "Yevamot", "Ketubot", "Nedarim", "Nazir", "Sotah", "Gittin", "Kiddushin",
          "Bava Kamma", "Bava Metzia", "Bava Batra", "Sanhedrin", "Makkot", "Shevuot", "Avodah Zarah", "Horayot", "Niddah"
        ],
        "Talmud Bavli": [
          "Berakhot",
          "Shabbat", "Eruvin", "Pesachim", "Rosh Hashanah", "Yoma", "Sukkah", "Beitzah", "Taanit", "Megillah", "Moed Katan", "Chagigah",
          "Yevamot", "Ketubot", "Nedarim", "Nazir", "Sotah", "Gittin", "Kiddushin",
          "Bava Kamma", "Bava Metzia", "Bava Batra", "Sanhedrin", "Makkot", "Shevuot", "Avodah Zarah", "Avot", "Horayot",
          "Zevachim", "Menachot", "Chullin", "Bekhorot", "Arakhin", "Temurah", "Keritot", "Meilah", "Tamid", "Middot", "Kinnim", "Niddah"
        ]
      };
      
      res.json({ tractates: tractates[work] || [] });
    } catch (error) {
      res.status(400).json({ message: "Invalid work parameter" });
    }
  });

  // Get chapters for a tractate
  app.get("/api/chapters", async (req, res) => {
    try {
      const { tractate } = z.object({ tractate: z.string() }).parse(req.query);
      
      // Expanded chapter data with larger folio ranges (up to 150 pages)
      const chapters = [
        { number: 1, folioRange: "2-25" },
        { number: 2, folioRange: "25-50" }, 
        { number: 3, folioRange: "50-75" },
        { number: 4, folioRange: "75-100" },
        { number: 5, folioRange: "100-125" },
        { number: 6, folioRange: "125-150" }
      ];
      
      res.json({ chapters });
    } catch (error) {
      res.status(400).json({ message: "Invalid tractate parameter" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
