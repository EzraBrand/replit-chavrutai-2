const fs = require('fs');
const path = require('path');

const shapesData = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'shared', 'data', 'yerushalmi-shapes.json'), 'utf8'));

const TRACTATE_SLUG_MAP = {
  "Jerusalem_Talmud_Berakhot": "Berakhot",
  "Jerusalem_Talmud_Peah": "Peah",
  "Jerusalem_Talmud_Demai": "Demai",
  "Jerusalem_Talmud_Kilayim": "Kilayim",
  "Jerusalem_Talmud_Sheviit": "Sheviit",
  "Jerusalem_Talmud_Terumot": "Terumot",
  "Jerusalem_Talmud_Maasrot": "Maasrot",
  "Jerusalem_Talmud_Maaser_Sheni": "Maaser_Sheni",
  "Jerusalem_Talmud_Challah": "Challah",
  "Jerusalem_Talmud_Orlah": "Orlah",
  "Jerusalem_Talmud_Bikkurim": "Bikkurim",
  "Jerusalem_Talmud_Shabbat": "Shabbat",
  "Jerusalem_Talmud_Eruvin": "Eruvin",
  "Jerusalem_Talmud_Pesachim": "Pesachim",
  "Jerusalem_Talmud_Shekalim": "Shekalim",
  "Jerusalem_Talmud_Yoma": "Yoma",
  "Jerusalem_Talmud_Sukkah": "Sukkah",
  "Jerusalem_Talmud_Beitzah": "Beitzah",
  "Jerusalem_Talmud_Rosh_Hashanah": "Rosh_Hashanah",
  "Jerusalem_Talmud_Taanit": "Taanit",
  "Jerusalem_Talmud_Megillah": "Megillah",
  "Jerusalem_Talmud_Chagigah": "Chagigah",
  "Jerusalem_Talmud_Moed_Katan": "Moed_Katan",
  "Jerusalem_Talmud_Yevamot": "Yevamot",
  "Jerusalem_Talmud_Ketubot": "Ketubot",
  "Jerusalem_Talmud_Sotah": "Sotah",
  "Jerusalem_Talmud_Nedarim": "Nedarim",
  "Jerusalem_Talmud_Nazir": "Nazir",
  "Jerusalem_Talmud_Gittin": "Gittin",
  "Jerusalem_Talmud_Kiddushin": "Kiddushin",
  "Jerusalem_Talmud_Bava_Kamma": "Bava_Kamma",
  "Jerusalem_Talmud_Bava_Metzia": "Bava_Metzia",
  "Jerusalem_Talmud_Bava_Batra": "Bava_Batra",
  "Jerusalem_Talmud_Sanhedrin": "Sanhedrin",
  "Jerusalem_Talmud_Makkot": "Makkot",
  "Jerusalem_Talmud_Shevuot": "Shevuot",
  "Jerusalem_Talmud_Avodah_Zarah": "Avodah_Zarah",
  "Jerusalem_Talmud_Horayot": "Horayot",
  "Jerusalem_Talmud_Niddah": "Niddah",
};

const SEFARIA_API = 'https://www.sefaria.org/api/texts';
const GUGGENHEIM_VERSION = 'versionTitle=The%20Jerusalem%20Talmud%2C%20translation%20and%20commentary%20by%20Heinrich%20W.%20Guggenheimer&versionTitleInHebrew=%D9%AA';
const BASE_URL = 'https://chavrutai.com';

const RATE_LIMIT_MS = 100;

function stripHtml(html) {
  return html.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ').trim();
}

function extractFootnotes(segmentHtml) {
  const footnotes = [];
  const fnRegex = /<i class="footnote">([\s\S]*?)<\/i>/g;
  let match;
  while ((match = fnRegex.exec(segmentHtml)) !== null) {
    footnotes.push(match[1]);
  }
  return footnotes;
}

function hasGreekChars(str) {
  return /[\u0370-\u03FF\u1F00-\u1FFF]/.test(str);
}

function isCommonEnglish(str) {
  const common = new Set([
    'is', 'are', 'was', 'were', 'the', 'and', 'or', 'for', 'in', 'on', 'at',
    'to', 'of', 'a', 'an', 'it', 'its', 'he', 'she', 'his', 'her', 'by',
    'with', 'from', 'that', 'this', 'which', 'who', 'whom', 'not', 'no',
    'but', 'if', 'as', 'has', 'had', 'have', 'been', 'be', 'will', 'would',
    'could', 'should', 'may', 'might', 'shall', 'can', 'do', 'does', 'did',
    'then', 'than', 'so', 'also', 'only', 'very', 'just', 'about', 'up',
    'out', 'into', 'over', 'after', 'before', 'between', 'under', 'since',
    'without', 'within', 'during', 'through', 'against', 'above', 'below',
    'each', 'every', 'all', 'both', 'few', 'more', 'most', 'other', 'some',
    'such', 'any', 'only', 'same', 'given', 'equivalent', 'means', 'word',
    'meaning', 'cf', 'see', 'note', 'above', 'below',
  ]);
  return common.has(str.toLowerCase());
}

function extractGreekLatinWords(noteHtml) {
  const noteText = stripHtml(noteHtml);
  const words = [];

  const greekWordPattern = /[\u0370-\u03FF\u1F00-\u1FFF\u0300-\u036F\u0027]+/gu;
  let m;
  while ((m = greekWordPattern.exec(noteText)) !== null) {
    const word = m[0].trim();
    if (word.length > 1 && hasGreekChars(word)) {
      words.push({ word, type: 'Greek' });
    }
  }

  const italicPattern = /<i>([^<]+)<\/i>/g;
  while ((m = italicPattern.exec(noteHtml)) !== null) {
    const context = noteHtml.substring(Math.max(0, m.index - 50), m.index);
    if (context.match(/(?:Greek|Latin|Gr\.|Lat\.)\s*$/i)) {
      const word = m[1].replace(/[,;."'\)]+$/, '').trim();
      if (word && !word.match(/[\u0590-\u05FF]/) && word.length > 1 && !isCommonEnglish(word)) {
        const type = context.match(/(?:Greek|Gr\.)\s*$/i) ? 'Greek' : 'Latin';
        words.push({ word, type });
      }
    }
  }

  const labeledPattern = /(?:(?:from\s+)?(?:Greek|Latin|Gr\.|Lat\.)\s+)([\u0370-\u03FF\u1F00-\u1FFF\u0300-\u036F\w'"]+(?:[,\s]+["'][\w\s]+["'])?)/gi;
  while ((m = labeledPattern.exec(noteText)) !== null) {
    const raw = m[1].replace(/[,;."'\)]+$/, '').trim();
    if (raw && raw.length > 1 && !raw.match(/[\u0590-\u05FF]/) && !isCommonEnglish(raw) && !hasGreekChars(raw)) {
      const type = m[0].match(/Greek|Gr\./i) ? 'Greek' : 'Latin';
      words.push({ word: raw, type });
    }
  }

  const seen = new Set();
  return words.filter(w => {
    const key = w.word.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function escapeCsv(str) {
  if (str.includes('"') || str.includes(',') || str.includes('\n')) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchHalakhah(sefariaRef) {
  const url = `${SEFARIA_API}/${sefariaRef}?lang=bi&commentary=0&${GUGGENHEIM_VERSION}`;
  const response = await fetch(url);
  if (!response.ok) return null;
  return response.json();
}

async function processChapter(sefariaBase, chapterNum, halakhotSegmentCounts, slug) {
  const results = [];

  const halakhotData = await Promise.all(
    halakhotSegmentCounts.map((_, halIdx) => {
      const ref = `${sefariaBase}.${chapterNum}.${halIdx + 1}`;
      return fetchHalakhah(ref).catch(e => {
        console.error(`  Error fetching ${ref}: ${e.message}`);
        return null;
      });
    })
  );

  for (let halIdx = 0; halIdx < halakhotData.length; halIdx++) {
    const data = halakhotData[halIdx];
    if (!data) continue;

    const enSegs = Array.isArray(data.text) ? data.text : [data.text || ''];

    for (let segIdx = 0; segIdx < enSegs.length; segIdx++) {
      const segHtml = enSegs[segIdx] || '';
      const footnotes = extractFootnotes(segHtml);

      for (const fnHtml of footnotes) {
        const greekLatinWords = extractGreekLatinWords(fnHtml);
        if (greekLatinWords.length > 0) {
          const noteClean = stripHtml(fnHtml);
          const chavrutaiUrl = `${BASE_URL}/yerushalmi/${slug}/${chapterNum}#${halIdx + 1}-${segIdx + 1}`;

          for (const { word, type } of greekLatinWords) {
            results.push({
              word,
              type,
              note: noteClean,
              url: chavrutaiUrl,
              ref: `${sefariaBase}.${chapterNum}.${halIdx + 1}.${segIdx + 1}`,
            });
          }
        }
      }
    }
  }

  return results;
}

async function main() {
  const tractates = Object.keys(shapesData);
  const startFrom = process.argv[2] || null;
  let started = !startFrom;

  const outputPath = path.join(__dirname, 'guggenheimer-greek-latin.csv');
  const csvHeader = 'word,type,note,url,sefaria_ref';

  const resuming = startFrom && fs.existsSync(outputPath);
  if (!resuming) {
    fs.writeFileSync(outputPath, csvHeader + '\n', 'utf8');
  }

  let totalCount = 0;

  console.log(`Found ${tractates.length} tractates in shape data`);
  console.log(`Rate limit: ${RATE_LIMIT_MS}ms between requests`);
  if (startFrom) console.log(`${resuming ? 'Resuming' : 'Starting'} from: ${startFrom}`);
  console.log(`Output: ${outputPath}`);
  console.log('');

  for (const sefariaBase of tractates) {
    if (!started) {
      if (sefariaBase === startFrom) started = true;
      else continue;
    }

    const slug = TRACTATE_SLUG_MAP[sefariaBase];
    if (!slug) {
      console.error(`No slug mapping for ${sefariaBase}, skipping`);
      continue;
    }

    const chapters = shapesData[sefariaBase];
    console.log(`Processing ${sefariaBase} (${chapters.length} chapters)...`);

    for (let chIdx = 0; chIdx < chapters.length; chIdx++) {
      const chapterNum = chIdx + 1;
      const halakhotSegmentCounts = chapters[chIdx];
      process.stdout.write(`  Chapter ${chapterNum}/${chapters.length} (${halakhotSegmentCounts.length} halakhot)...`);

      const results = await processChapter(sefariaBase, chapterNum, halakhotSegmentCounts, slug);
      await sleep(500);
      totalCount += results.length;

      if (results.length > 0) {
        const rows = results.map(r =>
          `${escapeCsv(r.word)},${escapeCsv(r.type)},${escapeCsv(r.note)},${escapeCsv(r.url)},${escapeCsv(r.ref)}`
        );
        fs.appendFileSync(outputPath, rows.join('\n') + '\n', 'utf8');
      }

      console.log(` found ${results.length} (total: ${totalCount})`);
    }
  }

  console.log(`\nDone! Found ${totalCount} Greek/Latin word entries`);
  console.log(`Output: ${outputPath}`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
