import { Router } from "express";
import { z } from "zod/v4";
import { AsyncTtlLruCache } from "../lib/async-ttl-lru-cache";

interface BibleTextResult {
  work: "Bible";
  book: string;
  chapter: number;
  verses: Array<{
    verseNumber: number;
    hebrewSegments: ReturnType<typeof import("../lib/bible-text-processing").processHebrewVerse>;
    englishSegments: ReturnType<typeof import("../lib/bible-text-processing").processEnglishVerse>;
  }>;
  sefariaRef: string;
  verseCount: number;
}

class SefariaResponseError extends Error {
  constructor(
    readonly language: "Hebrew" | "English",
    readonly status: number,
    readonly statusText: string,
  ) {
    super(`Sefaria API error (${language}): ${status} ${statusText}`);
  }
}

const bibleTextCache = new AsyncTtlLruCache<BibleTextResult>(250, 6 * 60 * 60 * 1000);

export function createBibleRouter(): Router {
  const router = Router();

  router.get("/api/bible/text", async (req, res) => {
    try {
      const { BibleQuerySchema } = await import('@workspace/shared-data/schema');
      const { book, chapter } = BibleQuerySchema.parse(req.query);
      
      const { getBookBySlug, normalizeSefariaBookName } = await import('@workspace/shared-data/bible-books');
      const { processHebrewVerse, processEnglishVerse } = await import('../lib/bible-text-processing');
      
      const bookInfo = getBookBySlug(book);
      if (!bookInfo) {
        res.status(404).json({ error: `Invalid book: ${book}` });
        return;
      }
      
      if (chapter < 1 || chapter > bookInfo.chapters) {
        res.status(400).json({ error: `Invalid chapter ${chapter} for ${bookInfo.name}. Valid range: 1-${bookInfo.chapters}` });
        return;
      }
      
      const sefariaBookName = normalizeSefariaBookName(book);
      const sefariaRef = `${sefariaBookName}.${chapter}`;
      
      const cacheKey = `${bookInfo.slug}:${chapter}`;
      const load = bibleTextCache.load(cacheKey, async () => {
        const hebrewUrl = `https://www.sefaria.org/api/v3/texts/${encodeURIComponent(sefariaRef)}`;
        const englishUrl = `https://www.sefaria.org/api/texts/${encodeURIComponent(sefariaRef)}?lang=en&ven=${encodeURIComponent('The Koren Jerusalem Bible')}&context=0`;
        console.log(`Fetching Bible text from Sefaria: ${sefariaRef}`);

        const [hebrewResponse, englishResponse] = await Promise.all([
          fetch(hebrewUrl),
          fetch(englishUrl),
        ]);
        if (!hebrewResponse.ok) {
          throw new SefariaResponseError("Hebrew", hebrewResponse.status, hebrewResponse.statusText);
        }
        if (!englishResponse.ok) {
          throw new SefariaResponseError("English", englishResponse.status, englishResponse.statusText);
        }

        const [hebrewData, englishData]: any[] = await Promise.all([
          hebrewResponse.json(),
          englishResponse.json(),
        ]);
        const hebrewVerses = Array.isArray(hebrewData.versions[0]?.text) ? hebrewData.versions[0].text : [];
        const englishVerses = Array.isArray(englishData.text) ? englishData.text : [];
        const verses = hebrewVerses.map((hebrewVerse: string, index: number) => ({
          verseNumber: index + 1,
          hebrewSegments: processHebrewVerse(hebrewVerse),
          englishSegments: processEnglishVerse(englishVerses[index] || ''),
        }));

        return {
          work: "Bible" as const,
          book: bookInfo.slug,
          chapter,
          verses,
          sefariaRef,
          verseCount: verses.length,
        };
      });
      res.locals.cacheOutcome = load.outcome;
      res.json(await load.value);
    } catch (error) {
      if (error instanceof SefariaResponseError) {
        console.error(error.message);
        res.status(error.status).json({ error: `Failed to fetch ${error.language} Bible text from Sefaria` });
        return;
      }
      console.error('Error in /api/bible/text:', error);
      res.status(500).json({ error: "Failed to fetch Bible text" });
    }
  });

  router.get("/api/bible/books", async (req, res) => {
    try {
      const { ALL_BIBLE_BOOKS, BIBLE_SECTIONS } = await import('@workspace/shared-data/bible-books');
      
      res.json({
        books: ALL_BIBLE_BOOKS,
        sections: BIBLE_SECTIONS
      });
    } catch (error) {
      console.error('Error in /api/bible/books:', error);
      res.status(500).json({ error: "Failed to fetch Bible books" });
    }
  });

  router.get("/api/bible/chapters", async (req, res) => {
    try {
      const { book } = z.object({ book: z.string() }).parse(req.query);
      const { getBookBySlug } = await import('@workspace/shared-data/bible-books');
      
      const bookInfo = getBookBySlug(book);
      if (!bookInfo) {
        res.status(404).json({ error: `Invalid book: ${book}` });
        return;
      }
      
      const chapters = Array.from({ length: bookInfo.chapters }, (_, i) => i + 1);
      
      res.json({ chapters });
    } catch (error) {
      console.error('Error in /api/bible/chapters:', error);
      res.status(500).json({ error: "Failed to fetch chapters" });
    }
  });

  return router;
}
