/**
 * Extract personal names (esp. rabbinic names) from the Yerushalmi
 * English text corpus, using the regex patterns from Ezra Brand's blog post:
 * https://www.ezrabrand.com/p/automated-extraction-of-over-1000
 *
 * Source translation: Heinrich W. Guggenheimer's English translation of
 * the Jerusalem Talmud, downloaded as bulk JSON dumps from Sefaria-Export
 * (Google Cloud Storage bucket gs://sefaria-export/), one file per tractate.
 *
 * Output:
 *   scripts/yerushalmi-names-results.json  (full sorted list)
 *   scripts/yerushalmi-names-results.md    (human-readable summary)
 *   scripts/.cache/yerushalmi-guggenheimer/<Tractate>.json  (raw dumps)
 *
 * Run: npx tsx scripts/extract-yerushalmi-names.ts
 *      [--tractate=Berakhot] [--no-cache] [--no-strip-quotes]
 */

import * as fs from 'fs';
import * as path from 'path';
import { YERUSHALMI_TRACTATES } from '../shared/yerushalmi-data';

const BUCKET_BASE = 'https://storage.googleapis.com/sefaria-export/json/Talmud/Yerushalmi';
const GUGGENHEIMER_FILENAME =
  'The Jerusalem Talmud, translation and commentary by Heinrich W. Guggenheimer. Berlin, De Gruyter, 1999-2015.json';

// Maps each tractate to its seder folder in the bucket. (The bucket uses the
// "Jerusalem Talmud X" full title and groups by Mishnaic order.)
const TRACTATE_TO_SEDER: Record<string, string> = {
  // Zeraim
  Berakhot: 'Seder Zeraim', Peah: 'Seder Zeraim', Demai: 'Seder Zeraim',
  Kilayim: 'Seder Zeraim', Sheviit: 'Seder Zeraim', Terumot: 'Seder Zeraim',
  Maasrot: 'Seder Zeraim', 'Maaser Sheni': 'Seder Zeraim', Challah: 'Seder Zeraim',
  Orlah: 'Seder Zeraim', Bikkurim: 'Seder Zeraim',
  // Moed
  Shabbat: 'Seder Moed', Eruvin: 'Seder Moed', Pesachim: 'Seder Moed',
  Shekalim: 'Seder Moed', Yoma: 'Seder Moed', Sukkah: 'Seder Moed',
  Beitzah: 'Seder Moed', 'Rosh Hashanah': 'Seder Moed', Taanit: 'Seder Moed',
  Megillah: 'Seder Moed', Chagigah: 'Seder Moed', 'Moed Katan': 'Seder Moed',
  // Nashim
  Yevamot: 'Seder Nashim', Ketubot: 'Seder Nashim', Sotah: 'Seder Nashim',
  Nedarim: 'Seder Nashim', Nazir: 'Seder Nashim', Gittin: 'Seder Nashim',
  Kiddushin: 'Seder Nashim',
  // Nezikin
  'Bava Kamma': 'Seder Nezikin', 'Bava Metzia': 'Seder Nezikin',
  'Bava Batra': 'Seder Nezikin', Sanhedrin: 'Seder Nezikin',
  Makkot: 'Seder Nezikin', Shevuot: 'Seder Nezikin',
  'Avodah Zarah': 'Seder Nezikin', Horayot: 'Seder Nezikin',
  // Niddah lives under Tahorot
  Niddah: 'Seder Tahorot',
};

const CACHE_DIR = path.join(process.cwd(), 'scripts/.cache/yerushalmi-guggenheimer');
const OUT_JSON = path.join(process.cwd(), 'scripts/yerushalmi-names-results.json');
const OUT_MD = path.join(process.cwd(), 'scripts/yerushalmi-names-results.md');

const args = process.argv.slice(2);
const argMap: Record<string, string> = {};
for (const a of args) {
  const m = a.match(/^--([^=]+)(?:=(.*))?$/);
  if (m) argMap[m[1]] = m[2] ?? 'true';
}
const ONLY_TRACTATE = argMap['tractate'];
const USE_CACHE = argMap['no-cache'] !== 'true';
const STRIP_QUOTES = argMap['no-strip-quotes'] !== 'true';

if (USE_CACHE && !fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR, { recursive: true });

function flatTractates() {
  const out: { name: string; chapters: number; sefaria: string; order: string }[] = [];
  for (const [orderName, list] of Object.entries(YERUSHALMI_TRACTATES)) {
    for (const t of list as any[]) out.push({ ...t, order: orderName });
  }
  return out;
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(parseInt(dec, 10)))
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&[a-z]+;/gi, ' ');
}

// Mirror of the blog post's quote-stripping step: blank out anything inside
// double quotation marks (Bible verse citations). Covers curly and straight
// double quotes only. We deliberately do NOT strip single-quoted content
// because Guggenheimer uses U+2018/U+2019 as apostrophes inside names
// (e.g. "Ze'ira", "Naph'a") — stripping them would truncate those names.
function stripQuotedVerses(text: string): string {
  return text
    .replace(/[\u201C\u201F\u201E]([^\u201D]*?)[\u201D]/g, ' ')
    .replace(/"([^"]*?)"/g, ' ');
}

// ─── Regex patterns (translated from the blog post, + Guggenheimer additions) ──
//
// Guggenheimer uses "Rebbi" (not "Rabbi") for Palestinian sages, and the
// abbreviated "R." for both. These appear ~41 k and ~12 k times respectively
// and were completely missed by the original Bavli-tuned pattern. They are
// added everywhere "Rabbi" / "Rav" appear in the original.
//
// Longest-match strategy: all spans from both patterns are collected first,
// then sorted (start ASC, length DESC), and only non-overlapping spans are
// kept. This prevents "Simeon ben Laqish" and "ben Laqish" from both being
// counted when they refer to the same text occurrence.

// NAME_TOKEN covers standard ASCII letters plus the full range of Latin
// extended characters Guggenheimer uses for transliteration:
//   ï (Zeïra/Meïr), ā/ē/ō/ū (long vowels), ḥ/ḳ/ṭ/ṣ/ẓ (dot-below), etc.
// Unicode blocks included:
//   \u00C0-\u024F  Latin-1 Supplement + Extended-A + Extended-B (upper+lower)
//   \u1E00-\u1EFF  Latin Extended Additional (ḥ, ḳ, ṭ, ṣ, …)
// Apostrophe/glottal variants used by Guggenheimer inside names:
//   \u2018  LEFT SINGLE QUOTATION MARK  Ze'ira
//   \u2019  RIGHT SINGLE QUOTATION MARK
//   \u02BC  MODIFIER LETTER APOSTROPHE
//   \u02CB  MODIFIER LETTER GRAVE ACCENT  Zeˋira
//   \u0060  GRAVE ACCENT (backtick)       Ze`ira
const NAME_TOKEN =
  '[A-Z\u00C0-\u024E\u1E00-\u1EFF]' +
  "[a-z\u00C0-\u024F\u1E00-\u1EFF\u2019\u02BC\u2018\u02CB\u0060',]+";

// Honorific/relational prefixes that may start a name expression.
// Guggenheimer additions: "Rebbi", "R\\.", "R\\. bar", "R\\. ben", etc.
const HONORIFIC1 =
  '(?:' + [
    // Guggenheimer-specific first (longer alternatives before shorter)
    'the son of Rebbi', 'son of Rebbi', 'bar Rebbi', 'ben Rebbi',
    'the grandson of Rebbi', 'grandson of Rebbi',
    'the brother of Rebbi', 'brother of Rebbi',
    'the father of Rebbi', 'father of Rebbi',
    'the wife of Rebbi', 'The wife of Rebbi',
    'The daughter of Rebbi', 'the daughter of Rebbi',
    'the son of the daughter of Rebbi', 'son of the daughter of Rebbi',
    'Rebbi',
    'R\\.',
    // Original patterns
    'the son of Rav', 'the son of Rabbi', 'bar Rabbi', 'ben Rabbi',
    'son of Rabbi', 'son of Rav', 'the son of', 'son of',
    'the grandson of Rav', 'the grandson of Rabbi',
    'grandson of Rabbi', 'grandson of Rav',
    'the brother of Rav', 'the brother of Rabbi',
    'brother of Rabbi', 'brother of Rav',
    'the father of Rav', 'the father of Rabbi',
    'father of Rabbi', 'father of Rav',
    'bar Mar', 'Bar Mar', 'Mar bar Rav', 'Mar Bar Rav', 'ben Imma',
    'the house of Bar', 'the house of', 'the house',
    'Rabbi', 'Rav', 'Avin', 'Ravin', 'Mar', 'Rabban',
    'Imma', 'Abba', 'Ben', 'Bar', 'ben', 'bar', 'King', 'Queen',
    'the wife of Rabbi', 'the wife of Rav',
    'The wife of Rabbi', 'The wife of Rav',
    'the son of the daughter of', 'son of the daughter of',
    'the son of the daughter of Rav', 'son of the daughter of Rav',
    'the son of the daughter of Rabbi', 'son of the daughter of Rabbi',
    'The daughter of', 'the daughter of',
  ].join('|') + ')';

// Connectors that join the main name to a patronymic / place suffix.
const CONNECTOR =
  '(?:' + [
    'bar Rebbi', 'ben Rebbi',
    'bar Rav', 'the son of Rav', 'the son of Rabbi',
    'bar Rabbi', 'ben Rabbi', 'son of Rabbi', 'son of Rav',
    'the son of', 'son of',
    'the grandson of Rav', 'the grandson of Rabbi',
    'grandson of Rabbi', 'grandson of Rav',
    'the brother of Rav', 'the brother of Rabbi',
    'brother of Rabbi', 'brother of Rav',
    'the father of Rav', 'the father of Rabbi',
    'father of Rabbi', 'father of Rav',
    'bar Mar', 'Bar Mar', 'ben Imma', 'bar Abba',
    'the son of the son of Rabbi', 'the son of the son of Rav',
    'son of the son of Rabbi', 'son of the son of Rav',
    'of the village of', 'of the city of', 'of the',
    'of Nehar', 'from Bei', 'from Nehar', 'from the',
    'of', 'from', 'Ish', 'ben', 'bar', 'Ben', 'Bar', 'the',
  ].join('|') + ')';

const PLACE_TAIL =
  '(?:of Nehar|of the village of|of the city of|of the|of|from|the)';

// Pattern 1: honorific-first  (e.g. "Rabbi X ben Y", "R. X bar Y")
const pattern1 = new RegExp(
  HONORIFIC1 + ' ' + NAME_TOKEN +
    '(?: ' + CONNECTOR + ' ' + NAME_TOKEN + ')?' +
    '(?: ' + CONNECTOR + ' ' + NAME_TOKEN + ')?' +
    '(?: ' + PLACE_TAIL + ' ' + NAME_TOKEN + ')?',
  'g'
);

// Honorific connectors used in Pattern 2 (name-first, e.g. "Simeon ben X")
const HONORIFIC2 =
  '(?:' + [
    'bar Rebbi', 'ben Rebbi',
    'bar Rav', 'the son of Rav', 'the son of Rabbi',
    'bar Rabbi', 'ben Rabbi', 'son of Rabbi', 'son of Rav',
    'the son of', 'son of',
    'the grandson of Rav', 'the grandson of Rabbi',
    'grandson of Rabbi', 'grandson of Rav',
    'the brother of Rav', 'the brother of Rabbi',
    'brother of Rabbi', 'brother of Rav',
    'the father of Rav', 'the father of Rabbi',
    'The father of Rav', 'The father of Rabbi',
    'father of Rabbi', 'father of Rav',
    'the wife of Rebbi', 'The wife of Rebbi',
    'the wife of Rabbi', 'the wife of Rav',
    'The wife of Rabbi', 'The wife of Rav',
    'The daughter of Rebbi', 'the daughter of Rebbi',
    'The daughter of Rabbi', 'The daughter of Rav',
    'the daughter of Rabbi', 'the daughter of Rav',
    'The daughter of', 'the daughter of',
    'bar Mar', 'Bar Mar', 'ben Imma', 'bar Abba',
    'ben', 'bar', 'Ben', 'Bar',
  ].join('|') + ')';

// Pattern 2: name-first  (e.g. "Simeon ben Laqish", "Joḥanan bar Nappaḥa")
const pattern2 = new RegExp(
  NAME_TOKEN + ' ' + HONORIFIC2 + ' ' + NAME_TOKEN +
    '(?: ' + PLACE_TAIL + ' ' + NAME_TOKEN + ')?',
  'g'
);

function normalizeName(raw: string): string {
  return raw
    .replace(/\s+/g, ' ')
    .replace(/,+$/g, '')
    .replace(/[\u2019\u02BC\u2018']s$/g, '')
    .trim();
}

/**
 * Extract names from a single cleaned text segment using greedy
 * longest-match across both patterns. Overlapping spans are resolved by
 * keeping the longest match at each position, so e.g. "Simeon ben Laqish"
 * is counted once rather than also contributing a count to "ben Laqish".
 */
function extractNames(text: string): string[] {
  const spans: { start: number; end: number; text: string }[] = [];

  for (const re of [pattern1, pattern2]) {
    re.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      spans.push({ start: m.index, end: m.index + m[0].length, text: m[0] });
      if (m.index === re.lastIndex) re.lastIndex++;
    }
  }

  if (spans.length === 0) return [];

  // Sort: start position ascending; for ties, longer match first.
  spans.sort((a, b) => a.start - b.start || (b.end - b.start) - (a.end - a.start));

  // Greedy non-overlapping selection.
  const kept: string[] = [];
  let cursor = -1;
  for (const sp of spans) {
    if (sp.start < cursor) continue; // overlaps a previously accepted match
    kept.push(normalizeName(sp.text));
    cursor = sp.end;
  }
  return kept.filter(n => n.length > 0);
}

async function fetchTractateDump(tractateName: string): Promise<any> {
  const seder = TRACTATE_TO_SEDER[tractateName];
  if (!seder) throw new Error(`Unknown seder for tractate: ${tractateName}`);
  const cachePath = path.join(CACHE_DIR, `${tractateName.replace(/\s+/g, '_')}.json`);
  if (USE_CACHE && fs.existsSync(cachePath)) {
    return JSON.parse(fs.readFileSync(cachePath, 'utf-8'));
  }
  const url = `${BUCKET_BASE}/${encodeURIComponent(seder)}/${encodeURIComponent('Jerusalem Talmud ' + tractateName)}/English/${encodeURIComponent(GUGGENHEIMER_FILENAME)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${tractateName}: ${url}`);
  const data = await res.json();
  if (USE_CACHE) fs.writeFileSync(cachePath, JSON.stringify(data));
  return data;
}

interface NameOccurrence {
  count: number;
  exampleRefs: string[];
}

async function main() {
  const tractates = flatTractates().filter(
    t => !ONLY_TRACTATE || t.name.toLowerCase() === ONLY_TRACTATE.toLowerCase()
  );

  const allNames = new Map<string, NameOccurrence>();
  const perTractate: Record<string, { total: number; uniqueNames: number; segments: number }> = {};

  let totalSegments = 0;
  const startedAt = Date.now();

  for (const t of tractates) {
    let dump: any;
    try {
      dump = await fetchTractateDump(t.name);
    } catch (e: any) {
      console.warn(`! ${t.name}: ${e.message}`);
      continue;
    }
    const text: any[] = Array.isArray(dump.text) ? dump.text : [];

    let tractateMatches = 0;
    let tractateSegments = 0;
    const tractateUnique = new Set<string>();

    for (let chIdx = 0; chIdx < text.length; chIdx++) {
      const chapter = text[chIdx];
      if (!Array.isArray(chapter)) continue;
      for (let halIdx = 0; halIdx < chapter.length; halIdx++) {
        const halakhah = chapter[halIdx];
        const segs: string[] = Array.isArray(halakhah)
          ? halakhah
          : (halakhah ? [halakhah] : []);
        for (let segIdx = 0; segIdx < segs.length; segIdx++) {
          const raw = segs[segIdx];
          if (!raw || typeof raw !== 'string') continue;
          // NFC-normalize: Guggenheimer text uses decomposed sequences such
          // as "h" + U+0323 (combining dot below) for ḥ; without composition
          // the regex would truncate "Yoḥai" -> "Yoh".
          let cleaned = stripHtml(raw);
          if (STRIP_QUOTES) cleaned = stripQuotedVerses(cleaned);
          cleaned = cleaned.normalize('NFC');
          tractateSegments++;
          totalSegments++;

          const ref = `${t.name} ${chIdx + 1}:${halIdx + 1}.${segIdx + 1}`;

          for (const name of extractNames(cleaned)) {
            tractateMatches++;
            tractateUnique.add(name);
            const cur = allNames.get(name);
            if (cur) {
              cur.count++;
              if (cur.exampleRefs.length < 3 && !cur.exampleRefs.includes(ref)) {
                cur.exampleRefs.push(ref);
              }
            } else {
              allNames.set(name, { count: 1, exampleRefs: [ref] });
            }
          }
        }
      }
    }

    perTractate[t.name] = {
      total: tractateMatches,
      uniqueNames: tractateUnique.size,
      segments: tractateSegments,
    };
    console.log(
      `[${t.name}] segments=${tractateSegments} matches=${tractateMatches} unique=${tractateUnique.size}`
    );
  }

  const sortedNames = [...allNames.entries()].sort((a, b) => b[1].count - a[1].count);

  const result = {
    generatedAt: new Date().toISOString(),
    source: 'Sefaria-Export bucket — Guggenheimer English translation of the Jerusalem Talmud',
    regexSource: 'https://www.ezrabrand.com/p/automated-extraction-of-over-1000',
    totals: {
      tractates: tractates.length,
      segmentsProcessed: totalSegments,
      totalNameOccurrences: sortedNames.reduce((s, [, v]) => s + v.count, 0),
      uniqueNames: sortedNames.length,
      runtimeSeconds: Math.round((Date.now() - startedAt) / 1000),
    },
    perTractate,
    names: sortedNames.map(([name, v]) => ({
      name,
      count: v.count,
      examples: v.exampleRefs,
    })),
  };

  fs.writeFileSync(OUT_JSON, JSON.stringify(result, null, 2));

  const top100 = sortedNames.slice(0, 100);
  const md = [
    `# Yerushalmi Personal Name Extraction`,
    ``,
    `- **Source translation:** ${result.source}`,
    `- **Regex source:** ${result.regexSource}`,
    `- **Generated:** ${result.generatedAt}`,
    ``,
    `## Totals`,
    `- Tractates processed: ${result.totals.tractates}`,
    `- Segments processed: ${result.totals.segmentsProcessed}`,
    `- Total name occurrences: ${result.totals.totalNameOccurrences}`,
    `- Unique names: ${result.totals.uniqueNames}`,
    `- Runtime: ${result.totals.runtimeSeconds}s`,
    ``,
    `## Top 100 names by occurrence`,
    ``,
    `| # | Name | Count | First example |`,
    `|---|------|-------|---------------|`,
    ...top100.map(([n, v], i) => `| ${i + 1} | ${n} | ${v.count} | ${v.exampleRefs[0] ?? ''} |`),
    ``,
    `## Per-tractate counts`,
    ``,
    `| Tractate | Segments | Matches | Unique names |`,
    `|----------|----------|---------|--------------|`,
    ...Object.entries(perTractate).map(
      ([n, v]) => `| ${n} | ${v.segments} | ${v.total} | ${v.uniqueNames} |`
    ),
    ``,
  ].join('\n');
  fs.writeFileSync(OUT_MD, md);

  console.log(`\nWrote ${OUT_JSON}`);
  console.log(`Wrote ${OUT_MD}`);
  console.log(
    `Done: ${result.totals.uniqueNames} unique names, ${result.totals.totalNameOccurrences} total occurrences`
  );
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
