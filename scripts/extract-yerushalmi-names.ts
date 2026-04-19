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

// Strip Guggenheimer's inline footnotes BEFORE stripping HTML tags.
// Each footnote is encoded as:
//   <sup class="footnote-marker">N</sup><i class="footnote">...text...</i>
// After generic HTML stripping, the footnote *text* is left in the segment
// alongside the main translation, causing modern scholar names and historical
// references (e.g. Taubenschlag, Bar Kochba) to be matched as rabbinic names.
//
// IMPORTANT: footnote bodies may contain nested <i>book title</i> markup.
// A simple non-greedy regex stops at the inner </i> rather than the outer one,
// leaving the tail of the footnote (often a medieval scholar's name) in the
// text. We therefore use a depth-counting scanner to find the true matching </i>.
function stripFootnotes(html: string): string {
  const OPEN = '<i class="footnote">';
  let result = '';
  let i = 0;
  while (i < html.length) {
    const fi = html.indexOf(OPEN, i);
    if (fi === -1) { result += html.slice(i); break; }
    result += html.slice(i, fi);
    // Walk forward counting <i> opens and </i> closes to find the matching </i>
    let depth = 1;
    let j = fi + OPEN.length;
    while (j < html.length && depth > 0) {
      const nextOpen  = html.indexOf('<i', j);
      const nextClose = html.indexOf('</i>', j);
      if (nextClose === -1) { j = html.length; break; }
      if (nextOpen !== -1 && nextOpen < nextClose) {
        depth++;
        j = nextOpen + 2;  // advance past '<i'
      } else {
        depth--;
        j = nextClose + 4; // advance past '</i>'
      }
    }
    i = j;
  }
  return result;
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
// Guggenheimer also uses Cyrillic ї (U+0457) and Ї (U+0406) in some segments
// as a typographic stand-in for Latin ï — e.g. "Meїr", "Zeїra".
// Apostrophe/glottal variants used by Guggenheimer inside names:
//   \u2018  LEFT SINGLE QUOTATION MARK  Ze'ira
//   \u2019  RIGHT SINGLE QUOTATION MARK
//   \u02BC  MODIFIER LETTER APOSTROPHE
//   \u02CB  MODIFIER LETTER GRAVE ACCENT  Zeˋira
//   \u0060  GRAVE ACCENT (backtick)       Ze`ira
const NAME_TOKEN =
  '[A-Z\u00C0-\u024E\u1E00-\u1EFF\u0406]' +
  "[a-z\u00C0-\u024F\u1E00-\u1EFF\u0457\u2019\u02BC\u2018\u02CB\u0060',]+";

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

// Produce a canonical normalized form of a raw matched name string, following
// Steinsaltz-style transliteration conventions and using R' for רבי.
// This is stored alongside the raw name for grouping and comparison; it does
// not replace the raw string in the count.
function normalizedRabbinicalName(raw: string): string {
  // Ensure consistent Unicode composition before all pattern matching
  let n = raw.normalize('NFC');

  // 1. Cyrillic ї/Ї (U+0457/U+0406) → Latin ï/Ï — Guggenheimer typographic quirk
  n = n.replace(/\u0457/g, '\u00EF').replace(/\u0406/g, '\u00CF');

  // 2. Honorifics: Rebbi → R'  |  R. → R'
  n = n.replace(/\bRebbi\b/g, "R'").replace(/\bR\.\s*/g, "R' ");

  // 3. J/I → Y (Guggenheimer uses Latin J/I for Hebrew Yod at word start)
  n = n.replace(/\bJo(ḥ|h)anan\b/g, 'Yo$1anan');
  n = n.replace(/\bJehudah\b/g, 'Yehudah');
  n = n.replace(/\bJoshua\b/g, 'Yehoshua');
  n = n.replace(/\bJonah\b/g, 'Yonah');
  n = n.replace(/\bJonathan\b/g, 'Yonatan');
  n = n.replace(/\bJeremiah\b/g, 'Yirmeyah');
  n = n.replace(/\bJacob\b/g, "Ya'akov");
  n = n.replace(/\bIo(ḥ|h)ai\b/g, 'Yo$1ai');   // Ioḥai → Yoḥai
  n = n.replace(/\bJosef\b/g, 'Yosef');
  n = n.replace(/\bJoseph\b/g, 'Yosef');

  // 4. Other name normalizations
  n = n.replace(/\bSimeon\b/g, 'Shimon');
  n = n.replace(/\bSimon\b/g, 'Shimon');
  n = n.replace(/\bSamuel\b/g, 'Shmuel');
  n = n.replace(/\bIsmael\b/g, 'Yishmael');
  n = n.replace(/\bIshmael\b/g, 'Yishmael');
  n = n.replace(/\bAqiba\b/g, 'Akiva');
  n = n.replace(/\bAqabia\b/g, 'Akavia');
  n = n.replace(/\bEleazar\b/g, 'Elazar');
  n = n.replace(/\bLaqish\b/g, 'Lakish');
  n = n.replace(/\bQappara\b/g, 'Kappara');
  n = n.replace(/\bNathan\b/g, 'Natan');
  n = n.replace(/\bPhineas\b/g, 'Pinḥas');
  n = n.replace(/\bZadok\b/g, 'Tzadok');
  n = n.replace(/\bHoshaia\b/g, 'Hoshaya');
  n = n.replace(/\bAzariah\b/g, 'Azaryah');
  n = n.replace(/\bBenjamin\b/g, 'Binyamin');
  n = n.replace(/\bCahana\b/g, 'Kahana');
  n = n.replace(/\bCohen\b/g, 'Kohen');
  n = n.replace(/(?<![a-zA-Z])\u1E24alaphta(?![a-zA-Z])/g, '\u1E24alafta');  // Ḥalaphta → Ḥalafta
  n = n.replace(/\bAbime\b/g, 'Avimi');
  n = n.replace(/\bAbimi\b/g, 'Avimi');
  n = n.replace(/\bA\u1E25awah?\b/g, 'Aḥava');  // Aḥawa / Aḥawah → Aḥava
  n = n.replace(/\bEudaimon\b/g, 'Avdimi');
  n = n.replace(/\bGamli\u00EBl\b/g, 'Gamliel');  // Gamliël → Gamliel
  // "Rab" as standalone honorific (not Rabb- or Raba etc.) → Rav
  n = n.replace(/\bRab\b/g, 'Rav');

  // 5. Meïr and diacritic variants → Meir
  // Step 1 already converted Cyrillic ї → ï (U+00EF), handle remaining variants:
  // Meĩr (U+0129), Meīr (U+012B), Meïr (U+00EF), and Ṃeïr (U+1E42 = M with dot below)
  n = n.replace(/\u1E42e[\u00EF\u0129\u012B]r\b/g, 'Meir');  // Ṃeïr / Ṃeĩr / Ṃeīr
  n = n.replace(/Me[\u00EF\u0129\u012B]r\b/g, 'Meir');        // Meïr / Meĩr / Meīr

  // 6a. Ze'ura spelling variants → Ze'ura (different person from Ze'ira)
  n = n.replace(/Ze[\u2019\u2018\u02BC\u02CB\u0060']ura\b/g, "Ze'ura");

  // 6b. Ze'ira spelling variants → Ze'ira
  // "Zeïra": ï (U+00EF) represents both glottal stop + vowel i (Ze+ï+ra)
  // "Zeīra": ī (U+012B i-macron) same structure (Ze+ī+ra)
  // "Zeˋira(h)"/"Ze`ira(h)": glottal-stop char is a separate token before "ira"
  n = n.replace(/Ze[\u00EF\u012B]ra\b/g, "Ze'ira");              // Zeïra, Zeīra
  n = n.replace(/Ze[\u02CB\u0060\u2018\u2019']irah?\b/g, "Ze'ira"); // Zeˋira(h), Ze`ira(h), Ze'ira(h)

  return n.replace(/\s+/g, ' ').trim();
}

// ─── Hardcoded false-positive exclusions ────────────────────────────────────
// Names that pass the regex and normalization filters but are not Talmudic
// sages: Biblical figures cited in passing, Talmud-category terms misread as
// names, context fragments, and hybrid matches that include surrounding prose.
// Checked against BOTH the raw matched string and its normalizedRabbinicalName.
const EXCLUDED_NAMES = new Set([
  // Biblical / historical figures (not Talmudic sages)
  'Abner, Ben Qubisin',
  'Ahab, Ben Kalba',
  'Asaph, Ben Ṣiṣit',
  'Balaq ben Ṣippor',
  'Bileam ben Beor',
  'Caleb ben Ḥeṣron',
  'Caleb ben Yephuneh',
  'David, Ben Yaṣaf',
  'Ḥushim ben Dan',
  'Jehu ben Nimshi',
  'Jerobeam ben Nebaṭ',
  'Jeroboam ben Nabat',
  'Jeroboam ben Nabath',
  'Jeroboam ben Nevat',
  'Jeroboam ben Nevat the Ephraimite',
  'Joab ben Ṣeruya',
  'Joab ben Ẓeruiah',
  'Joiakim ben Josia',
  'King David',
  'King Joash',
  'King Joiachin',
  'King Solomon',
  'King Uziah',
  'King Uziahu',
  'King Yeḥizkiahu',
  'King Yehoyakim',
  'Mephiboshet ben Yonatan',
  'Michaihu ben Nimla',
  'Michal the daughter of Kushi',
  'Michal the daughter of Saul',
  'Michal, the daughter of Saul',
  'Not the son of Amram',
  // Context fragments / prose bleed-through
  'About Ben Qatin',
  'About Ben Qaṭin',
  'Amora, bar Pada',
  'Babli, Ben Azzai',
  'ben R\'',
  'Could Ben Azzai',
  'Does Bar Piqa',
  'Following Ben Azai',
  'Following Ben Nanas',
  'If Ben Bathyra',
  'In Ben Azzai',
  // Normalized forms that include surrounding prose
  "R' Ḥizqiah, the Rabbinic",
  "R' Ya'akov bar Ada, Bar Athlay",
  "R' Yehudah ben R' Illai, the Ark",
  "R' Yose, the House of Shammai",
  "R' Ze'ira, the Mishnah",
  // Raw forms of the same (before normalization)
  'Rebbi Ḥizqiah, the Rabbinic',
  'R. Ḥizqiah, the Rabbinic',
  "Rebbi Ya'akov bar Ada, Bar Athlay",
  "R. Ya'akov bar Ada, Bar Athlay",
  'Rebbi Jehudah ben Rebbi Illai, the Ark',
  'R. Jehudah ben R. Illai, the Ark',
  'Rebbi Yose, the House of Shammai',
  'R. Yose, the House of Shammai',
  'Rebbi Ze\'ira, the Mishnah',
  "Rebbi Ze'ira, the Mishnah",
  'R. Ze\'ira, the Mishnah',
]);

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
          let cleaned = stripFootnotes(raw);
          cleaned = stripHtml(cleaned);
          if (STRIP_QUOTES) cleaned = stripQuotedVerses(cleaned);
          cleaned = cleaned.normalize('NFC');
          // Fix Guggenheimer OCR/typographic artifacts that break name tokenisation:
          // 1. Hebrew final nun (ן U+05DF) embedded between Latin letters is a
          //    stand-in for ï (e.g. "Meןr" → "Meïr").
          cleaned = cleaned.replace(/(?<=[A-Za-z\u00C0-\u024F\u1E00-\u1EFF])\u05DF(?=[A-Za-z\u00C0-\u024F\u1E00-\u1EFF])/g, '\u00EF');
          // 2. Stray ASCII double-quote between Latin letters (e.g. `Mei"r` → `Meïr`).
          cleaned = cleaned.replace(/(?<=[A-Za-z\u00C0-\u024F\u1E00-\u1EFF])"(?=[A-Za-z\u00C0-\u024F\u1E00-\u1EFF])/g, '\u00EF');
          tractateSegments++;
          totalSegments++;

          const ref = `${t.name} ${chIdx + 1}:${halIdx + 1}.${segIdx + 1}`;

          for (const name of extractNames(cleaned)) {
            // Reject template/placeholder names where any word token is a bare
            // single uppercase ASCII letter — e.g. "V son of W", "X ben Y",
            // "Z daughter of U" used as variables in halakhic examples.
            if (/(?:^|\s)[A-Z](?:\s|$)/.test(name)) continue;
            // Reject prose fragments that begin with an obvious English context word.
            if (/^(?:Similarly|About|Could|Does|If|In|Not|Babli|Amora|Following)\b/.test(name)) continue;
            // Reject names where a comma introduces a category description rather
            // than a lineage phrase.  Legitimate exceptions: "the son/daughter/
            // grandson/wife/brother/father/mother/Head of …" are kept.
            if (/,\s+the\s+(?!(?:son|daughter|grandson|granddaughter|wife|brother|father|mother|Head)\b)/.test(name)) continue;
            // Reject hardcoded false positives (checked against raw and normalized).
            if (EXCLUDED_NAMES.has(name) || EXCLUDED_NAMES.has(normalizedRabbinicalName(name))) continue;
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

  const namedRows = sortedNames.map(([name, v], i) => ({
    rank: i + 1,
    name,
    normalizedName: normalizedRabbinicalName(name),
    count: v.count,
    examples: v.exampleRefs,
  }));

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
    names: namedRows,
  };

  fs.writeFileSync(OUT_JSON, JSON.stringify(result, null, 2));

  // CSV
  const OUT_CSV = path.join(process.cwd(), 'scripts/yerushalmi-names-results.csv');
  const csvRows = [
    'rank,name,normalized_name,count,example_1,example_2,example_3',
    ...namedRows.map(r => {
      const cols = [r.rank, r.name, r.normalizedName, r.count, r.examples[0] ?? '', r.examples[1] ?? '', r.examples[2] ?? ''];
      return cols.map(c => (String(c).includes(',') || String(c).includes('"') ? `"${String(c).replace(/"/g, '""')}"` : String(c))).join(',');
    }),
  ];
  fs.writeFileSync(OUT_CSV, csvRows.join('\n'));

  // Group by normalized name for the top-100 table
  const normalizedGroups = new Map<string, { rawNames: string[]; count: number; firstExample: string }>();
  for (const r of namedRows) {
    const key = r.normalizedName;
    const existing = normalizedGroups.get(key);
    if (existing) {
      existing.rawNames.push(r.name);
      existing.count += r.count;
    } else {
      normalizedGroups.set(key, { rawNames: [r.name], count: r.count, firstExample: r.examples[0] ?? '' });
    }
  }
  const top100 = [...normalizedGroups.entries()]
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 100);

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
    `| # | Name (raw) | Normalized | Count | First example |`,
    `|---|-----------|-----------|-------|---------------|`,
    ...top100.map(([norm, g], i) => `| ${i + 1} | ${g.rawNames.join('; ')} | ${norm} | ${g.count} | ${g.firstExample} |`),
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
  console.log(`Wrote ${OUT_CSV}`);
  console.log(`Wrote ${OUT_MD}`);
  console.log(
    `Done: ${result.totals.uniqueNames} unique names, ${result.totals.totalNameOccurrences} total occurrences`
  );
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
