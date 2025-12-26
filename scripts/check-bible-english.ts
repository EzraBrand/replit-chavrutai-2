/**
 * Script to check for missing English translations in Bible chapters
 * Usage: npx tsx scripts/check-bible-english.ts [limit]
 */

const ALL_BOOKS = [
  { name: "Genesis", slug: "genesis", chapters: 50 },
  { name: "Exodus", slug: "exodus", chapters: 40 },
  { name: "Leviticus", slug: "leviticus", chapters: 27 },
  { name: "Numbers", slug: "numbers", chapters: 36 },
  { name: "Deuteronomy", slug: "deuteronomy", chapters: 34 },
  { name: "Joshua", slug: "joshua", chapters: 24 },
  { name: "Judges", slug: "judges", chapters: 21 },
  { name: "I Samuel", slug: "i-samuel", chapters: 31 },
  { name: "II Samuel", slug: "ii-samuel", chapters: 24 },
  { name: "I Kings", slug: "i-kings", chapters: 22 },
  { name: "II Kings", slug: "ii-kings", chapters: 25 },
  { name: "Isaiah", slug: "isaiah", chapters: 66 },
  { name: "Jeremiah", slug: "jeremiah", chapters: 52 },
  { name: "Ezekiel", slug: "ezekiel", chapters: 48 },
  { name: "Hosea", slug: "hosea", chapters: 14 },
  { name: "Joel", slug: "joel", chapters: 4 },
  { name: "Amos", slug: "amos", chapters: 9 },
  { name: "Obadiah", slug: "obadiah", chapters: 1 },
  { name: "Jonah", slug: "jonah", chapters: 4 },
  { name: "Micah", slug: "micah", chapters: 7 },
  { name: "Nahum", slug: "nahum", chapters: 3 },
  { name: "Habakkuk", slug: "habakkuk", chapters: 3 },
  { name: "Zephaniah", slug: "zephaniah", chapters: 3 },
  { name: "Haggai", slug: "haggai", chapters: 2 },
  { name: "Zechariah", slug: "zechariah", chapters: 14 },
  { name: "Malachi", slug: "malachi", chapters: 3 },
  { name: "Psalms", slug: "psalms", chapters: 150 },
  { name: "Proverbs", slug: "proverbs", chapters: 31 },
  { name: "Job", slug: "job", chapters: 42 },
  { name: "Song of Songs", slug: "song-of-songs", chapters: 8 },
  { name: "Ruth", slug: "ruth", chapters: 4 },
  { name: "Lamentations", slug: "lamentations", chapters: 5 },
  { name: "Ecclesiastes", slug: "ecclesiastes", chapters: 12 },
  { name: "Esther", slug: "esther", chapters: 10 },
  { name: "Daniel", slug: "daniel", chapters: 12 },
  { name: "Ezra", slug: "ezra", chapters: 10 },
  { name: "Nehemiah", slug: "nehemiah", chapters: 13 },
  { name: "I Chronicles", slug: "i-chronicles", chapters: 29 },
  { name: "II Chronicles", slug: "ii-chronicles", chapters: 36 },
];

interface BibleVerse {
  verseNumber: number;
  hebrewSegments: string[];
  englishSegments: string[];
}

interface BibleResponse {
  work: string;
  book: string;
  chapter: number;
  verses: BibleVerse[];
}

interface CheckResult {
  book: string;
  chapter: number;
  totalVerses: number;
  versesWithEnglish: number;
  versesMissingEnglish: number[];
  error?: string;
}

async function checkChapter(bookSlug: string, chapter: number): Promise<CheckResult> {
  const url = `http://localhost:5000/api/bible/text?book=${bookSlug}&chapter=${chapter}`;
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
      return {
        book: bookSlug,
        chapter,
        totalVerses: 0,
        versesWithEnglish: 0,
        versesMissingEnglish: [],
        error: `HTTP ${response.status}`
      };
    }
    
    const data: BibleResponse = await response.json();
    const versesWithEnglish = data.verses.filter(v => 
      v.englishSegments && v.englishSegments.length > 0 && 
      v.englishSegments.some(s => s.trim().length > 0)
    ).length;
    
    const versesMissingEnglish = data.verses
      .filter(v => !v.englishSegments || v.englishSegments.length === 0 || 
        v.englishSegments.every(s => !s || s.trim().length === 0))
      .map(v => v.verseNumber);
    
    return {
      book: bookSlug,
      chapter,
      totalVerses: data.verses.length,
      versesWithEnglish,
      versesMissingEnglish
    };
  } catch (error) {
    return {
      book: bookSlug,
      chapter,
      totalVerses: 0,
      versesWithEnglish: 0,
      versesMissingEnglish: [],
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

function getAllChapters(): { book: string; slug: string; chapter: number }[] {
  const chapters: { book: string; slug: string; chapter: number }[] = [];
  for (const book of ALL_BOOKS) {
    for (let ch = 1; ch <= book.chapters; ch++) {
      chapters.push({ book: book.name, slug: book.slug, chapter: ch });
    }
  }
  return chapters;
}

async function main() {
  const limit = parseInt(process.argv[2] || '10', 10);
  const concurrency = parseInt(process.argv[3] || '10', 10);
  const allChapters = getAllChapters();
  const totalChapters = allChapters.length;
  
  console.log(`\n=== Bible English Translation Check ===`);
  console.log(`Total chapters in Bible: ${totalChapters}`);
  console.log(`Checking first ${limit} chapters (${concurrency} parallel requests)...\n`);
  
  const startTime = Date.now();
  const chaptersToCheck = allChapters.slice(0, limit);
  const results: CheckResult[] = [];
  const issues: CheckResult[] = [];
  
  // Process in batches for parallel requests
  for (let i = 0; i < chaptersToCheck.length; i += concurrency) {
    const batch = chaptersToCheck.slice(i, i + concurrency);
    const batchNum = Math.floor(i / concurrency) + 1;
    const totalBatches = Math.ceil(chaptersToCheck.length / concurrency);
    
    process.stdout.write(`Batch ${batchNum}/${totalBatches}: Checking ${batch.length} chapters...`);
    
    const batchResults = await Promise.all(
      batch.map(({ slug, chapter }) => checkChapter(slug, chapter))
    );
    
    results.push(...batchResults);
    
    const batchIssues = batchResults.filter(r => r.error || r.versesMissingEnglish.length > 0);
    issues.push(...batchIssues);
    
    if (batchIssues.length > 0) {
      console.log(` ${batchIssues.length} issues`);
    } else {
      console.log(` OK`);
    }
  }
  
  const endTime = Date.now();
  const duration = (endTime - startTime) / 1000;
  
  console.log(`\n=== Summary ===`);
  console.log(`Checked: ${limit} chapters`);
  console.log(`Duration: ${duration.toFixed(2)} seconds`);
  console.log(`Avg per chapter: ${(duration / limit).toFixed(2)} seconds`);
  console.log(`Estimated for all ${totalChapters} chapters: ${((duration / limit) * totalChapters / 60).toFixed(1)} minutes`);
  
  if (issues.length > 0) {
    console.log(`\n=== Issues Found: ${issues.length} ===`);
    for (const issue of issues) {
      if (issue.error) {
        console.log(`  ${issue.book} ${issue.chapter}: ERROR - ${issue.error}`);
      } else {
        console.log(`  ${issue.book} ${issue.chapter}: Missing English for verses ${issue.versesMissingEnglish.join(', ')}`);
      }
    }
  } else {
    console.log(`\n✓ No issues found in checked chapters`);
  }
}

main().catch(console.error);
