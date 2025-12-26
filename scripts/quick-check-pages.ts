/**
 * Quick script to spot-check Talmud and Bible pages for missing text
 * Run with: npx tsx scripts/quick-check-pages.ts
 */

interface PageCheck {
  ref: string;
  type: 'talmud' | 'bible';
  hasHebrew: boolean;
  hasEnglish: boolean;
  hebrewLength: number;
  englishLength: number;
  error?: string;
}

async function checkTalmudPage(tractate: string, folio: number, side: 'a' | 'b'): Promise<PageCheck> {
  const ref = `${tractate}.${folio}${side}`;
  try {
    const response = await fetch(`https://www.sefaria.org/api/texts/${encodeURIComponent(ref)}?lang=bi&commentary=0`);
    
    if (!response.ok) {
      return { ref, type: 'talmud', hasHebrew: false, hasEnglish: false, hebrewLength: 0, englishLength: 0, error: `HTTP ${response.status}` };
    }

    const data = await response.json();
    
    // Parse response - text can be string or array
    const hebrewContent = Array.isArray(data.he) ? data.he.filter(Boolean).join('') : (data.he || '');
    const englishContent = Array.isArray(data.text) ? data.text.filter(Boolean).join('') : (data.text || '');
    
    return {
      ref,
      type: 'talmud',
      hasHebrew: hebrewContent.length > 0,
      hasEnglish: englishContent.length > 0,
      hebrewLength: hebrewContent.length,
      englishLength: englishContent.length
    };
  } catch (error: any) {
    return { ref, type: 'talmud', hasHebrew: false, hasEnglish: false, hebrewLength: 0, englishLength: 0, error: error.message };
  }
}

async function checkBibleChapter(book: string, chapter: number): Promise<PageCheck> {
  const ref = `${book}.${chapter}`;
  try {
    const response = await fetch(`https://www.sefaria.org/api/v3/texts/${encodeURIComponent(ref)}`);
    
    if (!response.ok) {
      return { ref, type: 'bible', hasHebrew: false, hasEnglish: false, hebrewLength: 0, englishLength: 0, error: `HTTP ${response.status}` };
    }

    const data = await response.json();
    
    let hebrewLength = 0;
    let englishLength = 0;
    
    if (data.versions) {
      for (const version of data.versions) {
        const textContent = Array.isArray(version.text) ? version.text.filter(Boolean).join('') : (version.text || '');
        if (version.language === 'he') {
          hebrewLength = textContent.length;
        } else if (version.language === 'en') {
          englishLength = textContent.length;
        }
      }
    }
    
    return {
      ref,
      type: 'bible',
      hasHebrew: hebrewLength > 0,
      hasEnglish: englishLength > 0,
      hebrewLength,
      englishLength
    };
  } catch (error: any) {
    return { ref, type: 'bible', hasHebrew: false, hasEnglish: false, hebrewLength: 0, englishLength: 0, error: error.message };
  }
}

async function main() {
  console.log('=== Quick Page Check ===\n');

  const problems: PageCheck[] = [];
  
  // Check a sample of Talmud pages - first, middle, last of a few tractates
  const talmudSamples = [
    { tractate: 'Berakhot', folio: 2, side: 'a' as const },
    { tractate: 'Berakhot', folio: 30, side: 'b' as const },
    { tractate: 'Berakhot', folio: 64, side: 'a' as const },
    { tractate: 'Shabbat', folio: 2, side: 'a' as const },
    { tractate: 'Shabbat', folio: 157, side: 'b' as const },
    { tractate: 'Bava Kamma', folio: 2, side: 'a' as const },
    { tractate: 'Bava Batra', folio: 176, side: 'b' as const },
    { tractate: 'Sanhedrin', folio: 2, side: 'a' as const },
    { tractate: 'Niddah', folio: 73, side: 'a' as const },
    { tractate: 'Tamid', folio: 25, side: 'b' as const }, // Edge case - Tamid starts at 25b
    { tractate: 'Tamid', folio: 26, side: 'a' as const },
  ];

  console.log('--- Talmud Sample Check ---');
  for (const sample of talmudSamples) {
    const result = await checkTalmudPage(sample.tractate, sample.folio, sample.side);
    const status = result.error ? `ERROR: ${result.error}` : 
                   (!result.hasHebrew || !result.hasEnglish) ? 'MISSING TEXT' : 'OK';
    console.log(`  ${result.ref}: ${status} (H:${result.hebrewLength}, E:${result.englishLength})`);
    
    if (result.error || !result.hasHebrew || !result.hasEnglish) {
      problems.push(result);
    }
  }

  // Check Bible samples
  const bibleSamples = [
    { book: 'Genesis', chapter: 1 },
    { book: 'Genesis', chapter: 50 },
    { book: 'Exodus', chapter: 1 },
    { book: 'Psalms', chapter: 1 },
    { book: 'Psalms', chapter: 150 },
    { book: 'Isaiah', chapter: 1 },
    { book: 'Malachi', chapter: 3 },
  ];

  console.log('\n--- Bible Sample Check ---');
  for (const sample of bibleSamples) {
    const result = await checkBibleChapter(sample.book, sample.chapter);
    const status = result.error ? `ERROR: ${result.error}` : 
                   !result.hasHebrew ? 'MISSING HEBREW' : 'OK';
    console.log(`  ${result.ref}: ${status} (H:${result.hebrewLength}, E:${result.englishLength})`);
    
    if (result.error || !result.hasHebrew) {
      problems.push(result);
    }
  }

  // Summary
  console.log('\n=== SUMMARY ===');
  if (problems.length === 0) {
    console.log('All sampled pages have text content!');
  } else {
    console.log(`Found ${problems.length} pages with issues:`);
    for (const p of problems) {
      console.log(`  - ${p.ref}: ${p.error || 'Missing text'}`);
    }
  }
}

main().catch(console.error);
