/**
 * Script to check sitemap pages for missing primary text content
 * Run with: npx tsx scripts/check-sitemap-content.ts [--limit=N]
 * 
 * Examples:
 *   npx tsx scripts/check-sitemap-content.ts --limit=10    # Check first 10 pages (test)
 *   npx tsx scripts/check-sitemap-content.ts --limit=100   # Check 100 pages
 *   npx tsx scripts/check-sitemap-content.ts               # Check all pages
 */

const TRACTATE_FOLIO_RANGES: Record<string, number> = {
  "Berakhot": 64, "Shabbat": 157, "Eruvin": 105, "Pesachim": 121, "Yoma": 88,
  "Sukkah": 56, "Beitza": 40, "Rosh Hashanah": 35, "Taanit": 31, "Megillah": 32,
  "Moed Katan": 29, "Chagigah": 27, "Yevamot": 122, "Ketubot": 112, "Nedarim": 91, 
  "Nazir": 66, "Sotah": 49, "Gittin": 90, "Kiddushin": 82, "Bava Kamma": 119, 
  "Bava Metzia": 119, "Bava Batra": 176, "Sanhedrin": 113, "Makkot": 24, "Shevuot": 49, 
  "Avodah Zarah": 76, "Horayot": 14, "Zevachim": 120, "Menachot": 110, "Chullin": 142, 
  "Bekhorot": 61, "Arachin": 34, "Temurah": 34, "Keritot": 28, "Meilah": 22, 
  "Tamid": 8, "Niddah": 73
};

const BIBLE_BOOKS = [
  { name: 'Genesis', chapters: 50 },
  { name: 'Exodus', chapters: 40 },
  { name: 'Leviticus', chapters: 27 },
  { name: 'Numbers', chapters: 36 },
  { name: 'Deuteronomy', chapters: 34 },
  { name: 'Joshua', chapters: 24 },
  { name: 'Judges', chapters: 21 },
  { name: 'I Samuel', chapters: 31 },
  { name: 'II Samuel', chapters: 24 },
  { name: 'I Kings', chapters: 22 },
  { name: 'II Kings', chapters: 25 },
  { name: 'Isaiah', chapters: 66 },
  { name: 'Jeremiah', chapters: 52 },
  { name: 'Ezekiel', chapters: 48 },
  { name: 'Hosea', chapters: 14 },
  { name: 'Joel', chapters: 4 },
  { name: 'Amos', chapters: 9 },
  { name: 'Obadiah', chapters: 1 },
  { name: 'Jonah', chapters: 4 },
  { name: 'Micah', chapters: 7 },
  { name: 'Nahum', chapters: 3 },
  { name: 'Habakkuk', chapters: 3 },
  { name: 'Zephaniah', chapters: 3 },
  { name: 'Haggai', chapters: 2 },
  { name: 'Zechariah', chapters: 14 },
  { name: 'Malachi', chapters: 3 },
  { name: 'Psalms', chapters: 150 },
  { name: 'Proverbs', chapters: 31 },
  { name: 'Job', chapters: 42 },
  { name: 'Song of Songs', chapters: 8 },
  { name: 'Ruth', chapters: 4 },
  { name: 'Lamentations', chapters: 5 },
  { name: 'Ecclesiastes', chapters: 12 },
  { name: 'Esther', chapters: 10 },
  { name: 'Daniel', chapters: 12 },
  { name: 'Ezra', chapters: 10 },
  { name: 'Nehemiah', chapters: 13 },
  { name: 'I Chronicles', chapters: 29 },
  { name: 'II Chronicles', chapters: 36 },
];

const SEFARIA_BASE_URL = 'https://www.sefaria.org.il/api';

interface PageResult {
  ref: string;
  type: 'talmud' | 'bible';
  hebrewTextLength: number;
  englishTextLength: number;
  error?: string;
  url: string;
}

async function checkTalmudPage(tractate: string, folio: number, side: 'a' | 'b'): Promise<PageResult> {
  const ref = `${tractate}.${folio}${side}`;
  const slug = tractate.toLowerCase().replace(/\s+/g, '-');
  const url = `/tractate/${slug}/${folio}${side}`;
  
  try {
    const response = await fetch(`${SEFARIA_BASE_URL}/texts/${encodeURIComponent(ref)}?lang=bi&commentary=0`);
    
    if (!response.ok) {
      return { ref, type: 'talmud', hebrewTextLength: 0, englishTextLength: 0, error: `HTTP ${response.status}`, url };
    }

    const data = await response.json() as any;
    
    let hebrewLength = 0;
    let englishLength = 0;
    
    if (Array.isArray(data.he)) {
      hebrewLength = data.he.reduce((acc: number, item: any) => {
        if (typeof item === 'string') return acc + item.length;
        if (Array.isArray(item)) return acc + item.join('').length;
        return acc;
      }, 0);
    } else if (typeof data.he === 'string') {
      hebrewLength = data.he.length;
    }
    
    if (Array.isArray(data.text)) {
      englishLength = data.text.reduce((acc: number, item: any) => {
        if (typeof item === 'string') return acc + item.length;
        if (Array.isArray(item)) return acc + item.join('').length;
        return acc;
      }, 0);
    } else if (typeof data.text === 'string') {
      englishLength = data.text.length;
    }
    
    return { ref, type: 'talmud', hebrewTextLength: hebrewLength, englishTextLength: englishLength, url };
  } catch (error: any) {
    return { ref, type: 'talmud', hebrewTextLength: 0, englishTextLength: 0, error: error.message, url };
  }
}

async function checkBibleChapter(book: string, chapter: number): Promise<PageResult> {
  const ref = `${book}.${chapter}`;
  const slug = book.toLowerCase().replace(/\s+/g, '-');
  const url = `/bible/${slug}/${chapter}`;
  
  try {
    const response = await fetch(`${SEFARIA_BASE_URL}/v3/texts/${encodeURIComponent(ref)}`);
    
    if (!response.ok) {
      return { ref, type: 'bible', hebrewTextLength: 0, englishTextLength: 0, error: `HTTP ${response.status}`, url };
    }

    const data = await response.json() as any;
    
    let hebrewLength = 0;
    let englishLength = 0;
    
    if (data.versions) {
      for (const version of data.versions) {
        const textContent = Array.isArray(version.text) ? version.text.join('') : (version.text || '');
        if (version.language === 'he' || version.languageCode === 'he') {
          hebrewLength = textContent.length;
        } else if (version.language === 'en' || version.languageCode === 'en') {
          englishLength = textContent.length;
        }
      }
    }
    
    return { ref, type: 'bible', hebrewTextLength: hebrewLength, englishTextLength: englishLength, url };
  } catch (error: any) {
    return { ref, type: 'bible', hebrewTextLength: 0, englishTextLength: 0, error: error.message, url };
  }
}

interface PageToCheck {
  ref: string;
  type: 'talmud' | 'bible';
  tractate?: string;
  folio?: number;
  side?: 'a' | 'b';
  book?: string;
  chapter?: number;
}

function generatePagesToCheck(): PageToCheck[] {
  const pages: PageToCheck[] = [];
  
  for (const [tractate, lastFolio] of Object.entries(TRACTATE_FOLIO_RANGES)) {
    for (let folio = 2; folio <= lastFolio; folio++) {
      for (const side of ['a', 'b'] as const) {
        pages.push({ 
          ref: `${tractate}.${folio}${side}`, 
          type: 'talmud',
          tractate,
          folio,
          side
        });
      }
    }
  }
  
  for (const book of BIBLE_BOOKS) {
    for (let chapter = 1; chapter <= book.chapters; chapter++) {
      pages.push({ 
        ref: `${book.name}.${chapter}`, 
        type: 'bible',
        book: book.name,
        chapter
      });
    }
  }
  
  return pages;
}

function generateFinalPages(): PageToCheck[] {
  const pages: PageToCheck[] = [];
  
  for (const [tractate, lastFolio] of Object.entries(TRACTATE_FOLIO_RANGES)) {
    for (const side of ['a', 'b'] as const) {
      pages.push({ 
        ref: `${tractate}.${lastFolio}${side}`, 
        type: 'talmud',
        tractate,
        folio: lastFolio,
        side
      });
    }
    if (lastFolio > 2) {
      pages.push({ 
        ref: `${tractate}.${lastFolio - 1}b`, 
        type: 'talmud',
        tractate,
        folio: lastFolio - 1,
        side: 'b'
      });
    }
  }
  
  for (const book of BIBLE_BOOKS) {
    pages.push({ 
      ref: `${book.name}.${book.chapters}`, 
      type: 'bible',
      book: book.name,
      chapter: book.chapters
    });
  }
  
  return pages;
}

async function runBatch(pages: PageToCheck[], batchSize: number = 10): Promise<PageResult[]> {
  const results: PageResult[] = [];
  
  for (let i = 0; i < pages.length; i += batchSize) {
    const batch = pages.slice(i, i + batchSize);
    const batchPromises = batch.map(page => {
      if (page.type === 'talmud' && page.tractate && page.folio && page.side) {
        return checkTalmudPage(page.tractate, page.folio, page.side);
      } else if (page.type === 'bible' && page.book && page.chapter) {
        return checkBibleChapter(page.book, page.chapter);
      }
      return Promise.resolve(null);
    });
    
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults.filter((r): r is PageResult => r !== null));
    
    if (i + batchSize < pages.length) {
      console.log(`  Progress: ${Math.min(i + batchSize, pages.length)}/${pages.length}`);
    }
  }
  
  return results;
}

async function main() {
  const args = process.argv.slice(2);
  const limitArg = args.find(a => a.startsWith('--limit='));
  const limit = limitArg ? parseInt(limitArg.split('=')[1]) : Infinity;
  const checkFinalOnly = args.includes('--final');
  
  console.log('=== Checking Sitemap Pages for Missing Content ===\n');
  
  const allPages = checkFinalOnly ? generateFinalPages() : generatePagesToCheck();
  const pagesToCheck = limit === Infinity ? allPages : allPages.slice(0, limit);
  
  console.log(`Total pages in sitemap: ${generatePagesToCheck().length}`);
  console.log(`Pages to check: ${pagesToCheck.length}`);
  console.log(`Mode: ${checkFinalOnly ? 'Final pages only' : 'All pages'}`);
  console.log('');
  
  console.log('--- Running checks (no rate limiting) ---');
  const results = await runBatch(pagesToCheck);
  
  const emptyPages = results.filter(r => 
    r.error || (r.hebrewTextLength === 0 && r.englishTextLength === 0)
  );
  const lowTextPages = results.filter(r => 
    !r.error && (r.hebrewTextLength > 0 || r.englishTextLength > 0) && 
    (r.hebrewTextLength < 50 || r.englishTextLength < 50)
  );
  
  console.log('\n=== SUMMARY ===');
  console.log(`Total checked: ${results.length}`);
  console.log(`Empty/Error pages: ${emptyPages.length}`);
  console.log(`Low text pages (<50 chars): ${lowTextPages.length}`);
  
  if (emptyPages.length > 0) {
    console.log('\n--- Empty/Error Pages (should be removed from sitemap) ---');
    for (const page of emptyPages) {
      console.log(`  ${page.type.toUpperCase()}: ${page.ref} -> ${page.url}${page.error ? ` (${page.error})` : ''}`);
    }
  }
  
  if (lowTextPages.length > 0) {
    console.log('\n--- Low Text Pages (may need review) ---');
    for (const page of lowTextPages) {
      console.log(`  ${page.type.toUpperCase()}: ${page.ref} -> ${page.url} (H: ${page.hebrewTextLength}, E: ${page.englishTextLength})`);
    }
  }
  
  const fs = await import('fs');
  const report = {
    timestamp: new Date().toISOString(),
    totalChecked: results.length,
    emptyCount: emptyPages.length,
    lowTextCount: lowTextPages.length,
    emptyPages: emptyPages.map(p => ({ ref: p.ref, url: p.url, error: p.error })),
    lowTextPages: lowTextPages.map(p => ({ ref: p.ref, url: p.url, hebrew: p.hebrewTextLength, english: p.englishTextLength }))
  };
  const reportPath = `scripts/sitemap-content-report-${Date.now()}.json`;
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\nReport saved to: ${reportPath}`);
  
  console.log('\nDone!');
}

main().catch(console.error);
