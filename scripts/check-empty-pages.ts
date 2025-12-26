/**
 * Script to check all Talmud and Bible pages for missing primary text
 * Run with: npx tsx scripts/check-empty-pages.ts
 */

const TRACTATE_FOLIO_RANGES: Record<string, number> = {
  "Berakhot": 64, "Shabbat": 157, "Eruvin": 105, "Pesachim": 121, "Shekalim": 22, "Yoma": 88,
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

interface EmptyPageResult {
  ref: string;
  type: 'talmud' | 'bible';
  hebrewTextLength: number;
  englishTextLength: number;
  error?: string;
}

const SEFARIA_BASE_URL = 'https://www.sefaria.org/api';

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function getTextLength(data: any): { hebrew: number; english: number } {
  let hebrewLength = 0;
  let englishLength = 0;

  // Handle Talmud API response
  if (data.he !== undefined) {
    if (Array.isArray(data.he)) {
      hebrewLength = data.he.reduce((acc: number, item: any) => {
        if (typeof item === 'string') return acc + item.length;
        if (Array.isArray(item)) return acc + item.join('').length;
        return acc;
      }, 0);
    } else if (typeof data.he === 'string') {
      hebrewLength = data.he.length;
    }
  }

  if (data.text !== undefined) {
    if (Array.isArray(data.text)) {
      englishLength = data.text.reduce((acc: number, item: any) => {
        if (typeof item === 'string') return acc + item.length;
        if (Array.isArray(item)) return acc + item.join('').length;
        return acc;
      }, 0);
    } else if (typeof data.text === 'string') {
      englishLength = data.text.length;
    }
  }

  // Handle v3 API response (Bible)
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

  return { hebrew: hebrewLength, english: englishLength };
}

async function checkTalmudPage(tractate: string, folio: number, side: 'a' | 'b'): Promise<EmptyPageResult> {
  const ref = `${tractate}.${folio}${side}`;
  try {
    const response = await fetch(`${SEFARIA_BASE_URL}/texts/${encodeURIComponent(ref)}?lang=bi&commentary=0`);
    
    if (!response.ok) {
      return { 
        ref, 
        type: 'talmud', 
        hebrewTextLength: 0, 
        englishTextLength: 0, 
        error: `HTTP ${response.status}` 
      };
    }

    const data = await response.json();
    const lengths = getTextLength(data);

    return {
      ref,
      type: 'talmud',
      hebrewTextLength: lengths.hebrew,
      englishTextLength: lengths.english
    };
  } catch (error: any) {
    return { 
      ref, 
      type: 'talmud', 
      hebrewTextLength: 0, 
      englishTextLength: 0, 
      error: error.message 
    };
  }
}

async function checkBibleChapter(book: string, chapter: number): Promise<EmptyPageResult> {
  const ref = `${book}.${chapter}`;
  try {
    const response = await fetch(`${SEFARIA_BASE_URL}/v3/texts/${encodeURIComponent(ref)}`);
    
    if (!response.ok) {
      return { 
        ref, 
        type: 'bible', 
        hebrewTextLength: 0, 
        englishTextLength: 0, 
        error: `HTTP ${response.status}` 
      };
    }

    const data = await response.json();
    const lengths = getTextLength(data);

    return {
      ref,
      type: 'bible',
      hebrewTextLength: lengths.hebrew,
      englishTextLength: lengths.english
    };
  } catch (error: any) {
    return { 
      ref, 
      type: 'bible', 
      hebrewTextLength: 0, 
      englishTextLength: 0, 
      error: error.message 
    };
  }
}

function generateAllPages(): { ref: string; type: 'talmud' | 'bible' }[] {
  const pages: { ref: string; type: 'talmud' | 'bible' }[] = [];
  
  for (const [tractate, lastFolio] of Object.entries(TRACTATE_FOLIO_RANGES)) {
    for (let folio = 2; folio <= lastFolio; folio++) {
      for (const side of ['a', 'b'] as const) {
        pages.push({ ref: `${tractate}.${folio}${side}`, type: 'talmud' });
      }
    }
  }
  
  for (const book of BIBLE_BOOKS) {
    for (let chapter = 1; chapter <= book.chapters; chapter++) {
      pages.push({ ref: `${book.name}.${chapter}`, type: 'bible' });
    }
  }
  
  return pages;
}

async function main() {
  const args = process.argv.slice(2);
  const limitArg = args.find(a => a.startsWith('--limit='));
  const limit = limitArg ? parseInt(limitArg.split('=')[1]) : (args.includes('--all') ? Infinity : 100);
  
  console.log('=== Checking for Empty Talmud and Bible Pages ===\n');

  const allPages = generateAllPages();
  const totalTalmudPages = allPages.filter(p => p.type === 'talmud').length;
  const totalBibleChapters = allPages.filter(p => p.type === 'bible').length;

  console.log(`Total Talmud pages available: ${totalTalmudPages}`);
  console.log(`Total Bible chapters available: ${totalBibleChapters}`);
  console.log(`Total: ${allPages.length}`);
  console.log(`Checking: ${limit === Infinity ? 'ALL' : limit} pages\n`);

  const pagesToCheck = limit === Infinity ? allPages : allPages.slice(0, limit);
  const emptyPages: EmptyPageResult[] = [];
  const lowTextPages: EmptyPageResult[] = [];
  let checked = 0;

  console.log('--- Checking Pages ---');
  
  for (const page of pagesToCheck) {
    let result: EmptyPageResult;
    
    if (page.type === 'talmud') {
      const match = page.ref.match(/^(.+)\.(\d+)([ab])$/);
      if (match) {
        result = await checkTalmudPage(match[1], parseInt(match[2]), match[3] as 'a' | 'b');
      } else {
        continue;
      }
    } else {
      const match = page.ref.match(/^(.+)\.(\d+)$/);
      if (match) {
        result = await checkBibleChapter(match[1], parseInt(match[2]));
      } else {
        continue;
      }
    }
    
    if (result.error) {
      console.log(`  ERROR: ${result.ref} - ${result.error}`);
      emptyPages.push(result);
    } else if (result.hebrewTextLength === 0 && result.englishTextLength === 0) {
      console.log(`  EMPTY: ${result.ref}`);
      emptyPages.push(result);
    } else if (result.hebrewTextLength < 50 || result.englishTextLength < 50) {
      console.log(`  LOW TEXT: ${result.ref} (Hebrew: ${result.hebrewTextLength}, English: ${result.englishTextLength})`);
      lowTextPages.push(result);
    }
    
    checked++;
    
    if (checked % 50 === 0) {
      console.log(`  Progress: ${checked}/${pagesToCheck.length} pages...`);
    }
    
    await sleep(100);
  }

  console.log('\n=== SUMMARY ===');
  console.log(`Total checked: ${checked}`);
  console.log(`Empty/Error pages: ${emptyPages.length}`);
  console.log(`Low text pages: ${lowTextPages.length}`);

  if (emptyPages.length > 0) {
    console.log('\n--- Empty/Error Pages ---');
    for (const page of emptyPages) {
      console.log(`  ${page.type.toUpperCase()}: ${page.ref}${page.error ? ` (${page.error})` : ''}`);
    }
  }

  if (lowTextPages.length > 0) {
    console.log('\n--- Low Text Pages ---');
    for (const page of lowTextPages) {
      console.log(`  ${page.type.toUpperCase()}: ${page.ref} (H: ${page.hebrewTextLength}, E: ${page.englishTextLength})`);
    }
  }

  const fs = await import('fs');
  const report = {
    timestamp: new Date().toISOString(),
    totalChecked: checked,
    emptyCount: emptyPages.length,
    lowTextCount: lowTextPages.length,
    emptyPages,
    lowTextPages
  };
  const reportPath = `scripts/empty-pages-report-${Date.now()}.json`;
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\nReport saved to: ${reportPath}`);

  console.log('\nDone!');
}

main().catch(console.error);
