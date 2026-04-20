/**
 * dump-yerushalmi-text.ts
 *
 * Produces two flat text files from the cached Guggenheimer Yerushalmi JSONs:
 *
 *   scripts/yerushalmi-full-text.txt      — cleaned text, footnotes removed
 *   scripts/yerushalmi-names-redacted.txt — same but every matched name span
 *                                           replaced with {NAME}
 *
 * Both files are gitignored by the existing scripts/* rule.
 *
 * Run: npx tsx scripts/dump-yerushalmi-text.ts
 *      [--tractate=Berakhot]
 */

import * as fs from 'fs';
import * as path from 'path';

// ─── Tractate → Seder map (must match extract-yerushalmi-names.ts) ──────────
const TRACTATE_TO_SEDER: Record<string, string> = {
  Berakhot: 'Seder Zeraim', Peah: 'Seder Zeraim', Demai: 'Seder Zeraim',
  Kilayim: 'Seder Zeraim', Sheviit: 'Seder Zeraim', Terumot: 'Seder Zeraim',
  Maasrot: 'Seder Zeraim', 'Maaser Sheni': 'Seder Zeraim', Challah: 'Seder Zeraim',
  Orlah: 'Seder Zeraim', Bikkurim: 'Seder Zeraim',
  Shabbat: 'Seder Moed', Eruvin: 'Seder Moed', Pesachim: 'Seder Moed',
  Shekalim: 'Seder Moed', Yoma: 'Seder Moed', Sukkah: 'Seder Moed',
  Beitzah: 'Seder Moed', 'Rosh Hashanah': 'Seder Moed', Taanit: 'Seder Moed',
  Megillah: 'Seder Moed', Chagigah: 'Seder Moed', 'Moed Katan': 'Seder Moed',
  Yevamot: 'Seder Nashim', Ketubot: 'Seder Nashim', Sotah: 'Seder Nashim',
  Nedarim: 'Seder Nashim', Nazir: 'Seder Nashim', Gittin: 'Seder Nashim',
  Kiddushin: 'Seder Nashim',
  'Bava Kamma': 'Seder Nezikin', 'Bava Metzia': 'Seder Nezikin',
  'Bava Batra': 'Seder Nezikin', Sanhedrin: 'Seder Nezikin',
  Makkot: 'Seder Nezikin', Shevuot: 'Seder Nezikin',
  'Avodah Zarah': 'Seder Nezikin', Horayot: 'Seder Nezikin',
  Niddah: 'Seder Tahorot',
};

const CACHE_DIR = path.join(process.cwd(), 'scripts/.cache/yerushalmi-guggenheimer');
const OUT_FULL    = path.join(process.cwd(), 'scripts/yerushalmi-full-text.txt');
const OUT_REDACT  = path.join(process.cwd(), 'scripts/yerushalmi-names-redacted.txt');

const args = process.argv.slice(2);
const argMap: Record<string, string> = {};
for (const a of args) {
  const m = a.match(/^--([^=]+)(?:=(.*))?$/);
  if (m) argMap[m[1]] = m[2] ?? 'true';
}
const ONLY_TRACTATE = argMap['tractate'];

// ─── Cleaning functions (identical to extract-yerushalmi-names.ts) ───────────

function stripFootnotes(html: string): string {
  const OPEN = '<i class="footnote">';
  let result = '';
  let i = 0;
  while (i < html.length) {
    const fi = html.indexOf(OPEN, i);
    if (fi === -1) { result += html.slice(i); break; }
    result += html.slice(i, fi);
    let depth = 1;
    let j = fi + OPEN.length;
    while (j < html.length && depth > 0) {
      const nextOpen  = html.indexOf('<i', j);
      const nextClose = html.indexOf('</i>', j);
      if (nextClose === -1) { j = html.length; break; }
      if (nextOpen !== -1 && nextOpen < nextClose) { depth++; j = nextOpen + 2; }
      else { depth--; j = nextClose + 4; }
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

function cleanSegment(raw: string): string {
  let s = stripFootnotes(raw);
  // Strip footnote-marker superscripts with their numeral content BEFORE generic
  // HTML stripping, otherwise the number is left as a stray token in the text.
  // e.g. <sup class="footnote-marker">23</sup> → removed entirely.
  s = s.replace(/<sup[^>]*class="footnote-marker"[^>]*>[\s\S]*?<\/sup>/g, '');
  s = stripHtml(s);
  s = s.normalize('NFC');
  // Hebrew final nun ן between Latin letters → ï
  s = s.replace(/(?<=[A-Za-z\u00C0-\u024F\u1E00-\u1EFF])\u05DF(?=[A-Za-z\u00C0-\u024F\u1E00-\u1EFF])/g, '\u00EF');
  // Stray ASCII double-quote between Latin letters → ï
  s = s.replace(/(?<=[A-Za-z\u00C0-\u024F\u1E00-\u1EFF])"(?=[A-Za-z\u00C0-\u024F\u1E00-\u1EFF])/g, '\u00EF');
  return s.replace(/\s+/g, ' ').trim();
}

// ─── Name regex (identical to extract-yerushalmi-names.ts) ───────────────────

const NAME_TOKEN =
  '[A-Z\u00C0-\u024E\u1E00-\u1EFF\u0406]' +
  "[a-z\u00C0-\u024F\u1E00-\u1EFF\u0457\u2019\u02BC\u2018\u02CB\u0060']+";

const HONORIFIC1 =
  '(?:' + [
    'the son of Rebbi', '(?<= )son of Rebbi', 'bar Rebbi', 'ben Rebbi',
    'the grandson of Rebbi', '(?<= )grandson of Rebbi',
    'the brother of Rebbi', '(?<= )brother of Rebbi',
    'the father of Rebbi', '(?<= )father of Rebbi',
    'the wife of Rebbi', 'The wife of Rebbi',
    'The daughter of Rebbi', 'the daughter of Rebbi',
    'the son of the daughter of Rebbi', '(?<= )son of the daughter of Rebbi',
    'Rebbi', 'R\\.',
    'the son of Rav', 'the son of Rabbi', 'bar Rabbi', 'ben Rabbi',
    '(?<= )son of Rabbi', '(?<= )son of Rav',
    'the son of', '(?<= )son of',
    'the grandson of Rav', 'the grandson of Rabbi',
    '(?<= )grandson of Rabbi', '(?<= )grandson of Rav',
    'the brother of Rav', 'the brother of Rabbi',
    '(?<= )brother of Rabbi', '(?<= )brother of Rav',
    'the father of Rav', 'the father of Rabbi',
    '(?<= )father of Rabbi', '(?<= )father of Rav',
    'bar Mar', 'Bar Mar', 'Mar bar Rav', 'Mar Bar Rav', 'ben Imma',
    'the house of Bar', 'the house of', 'the house',
    'Rabbi', 'Rav', 'Avin', 'Ravin', 'Mar', 'Rabban',
    'Imma', 'Abba', 'Ben', 'Bar', 'ben', 'bar', 'King', 'Queen',
    'the wife of Rabbi', 'the wife of Rav',
    'The wife of Rabbi', 'The wife of Rav',
    'the son of the daughter of', '(?<![a-zA-Z])son of the daughter of',
    'the son of the daughter of Rav', '(?<![a-zA-Z])son of the daughter of Rav',
    'the son of the daughter of Rabbi', '(?<![a-zA-Z])son of the daughter of Rabbi',
    'The daughter of', 'the daughter of',
  ].join('|') + ')';

const CONNECTOR =
  '(?:' + [
    'bar Rebbi', 'ben Rebbi',
    'bar Rav', 'ben Rav', 'the son of Rebbi', 'the son of Rav', 'the son of Rabbi',
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

const COMMA_PATRONYMIC =
  '(?:, (?:the )?(?:son|daughter) of (?:Rebbi|R\\.|Rav|Rabbi) ' + NAME_TOKEN + ')?';

const HONORIFIC2 =
  '(?:' + [
    'bar Rebbi', 'ben Rebbi',
    'bar Rav', 'ben Rav', 'the son of Rebbi', 'the son of Rav', 'the son of Rabbi',
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

const pattern1 = new RegExp(
  HONORIFIC1 + ' ' + NAME_TOKEN +
    COMMA_PATRONYMIC +
    '(?: ' + CONNECTOR + ' ' + NAME_TOKEN + ')?' +
    '(?: ' + CONNECTOR + ' ' + NAME_TOKEN + ')?' +
    '(?: ' + PLACE_TAIL + ' ' + NAME_TOKEN + ')?',
  'g'
);
const pattern2 = new RegExp(
  NAME_TOKEN + ' ' + HONORIFIC2 + ' ' + NAME_TOKEN +
    '(?: ' + PLACE_TAIL + ' ' + NAME_TOKEN + ')?',
  'g'
);

// Pattern 3: hardcoded proper names only (no "Rav said" / "in the name of" phrases —
// those are attribution markers, not names to redact in the readable text).
const _B  = '(?<![a-zA-Z\u00C0-\u024F\u1E00-\u1EFF])';
const _A  = '(?![a-zA-Z\u00C0-\u024F\u1E00-\u1EFF])';
// ORDERING: longer/more-specific phrases before shorter ones they contain.
const SPECIAL_NAMES_REDACT: string[] = [
  // ── Kinship / collective phrases ──────────────────────────────────────────
  'The maternal uncle of Rebbi Ada',
  'The maternal uncle of Rav Cahana',
  'The Samaritans of Caesarea', 'the Samaritans of Caesarea',
  'The rabbis of Caesarea', 'the rabbis of Caesarea',
  'The rabbis of Caesaria', 'the rabbis of Caesaria',
  'the rabbis of Cesarea',
  'The rabbis of Rebbi Justinus',
  'The rabbis of Newe',
  'The father-in-law of Rebbi Yannai the younger',
  'the father-in-law of Rebbi Yannai the younger',
  'Abime the brother of \u1e24efa',
  // ── "the great Rebbi X" ───────────────────────────────────────────────────
  'The great Rebbi \u1e24oshaia', 'the great Rebbi \u1e24oshaia',
  'The great Rebbi \u1e24iyya',   'the great Rebbi \u1e24iyya',
  'The great Rebbi Yose',         'the great Rebbi Yose',
  'The great Rebbi A\u1e25a',     'the great Rebbi A\u1e25a',
  'The great Rebbi Isaac',        'the great Rebbi Isaac',
  'The great Jehudah',            'the great Jehudah',
  // ── Bracketed/parenthesised editorial forms ───────────────────────────────
  '(Rebbi) Abba [bar Jeremiah]',
  'Rebbi (Eleazar) [Eliezer]',
  'Rebbi (Eleazar)',
  'Rebbi [Jo\u1e25anan]',
  'Rebbi (Joshua) [Hoshaia]',
  'Rav (A\u1e25a) [Ada] bar A\u1e25awa',
  'Rebbi \u1e24izqiah (said) [from Acco]',
  'Rabban (Simeon ben) Gamliel',
  // ── "X the scribe / carpenter" ────────────────────────────────────────────
  'Jo\u1e25anan the scribe of Gufta',
  'Rebbi \u1e24iyya the scribe',
  'Rebbi \u1e24anina the scribe',
  'Bar Shelemiah the scribe',
  'Na\u1e25um the scribe',
  'Bar Ko\u1e25a the carpenter',
  // ── "the House of" — before standalone Hillel / Shammai ──────────────────
  'The House of Shammai', 'the House of Shammai', 'The Hause of Shammai',
  'The House of Hillel',  'the House of Hillel',
  'the school of Shammai', 'The school of Shammai',
  'the school of Hillel',  'The school of Hillel',
  // ── "X the Elder" — before standalone names ───────────────────────────────
  'Hillel the Elder',
  'Gamliel the Elder',
  'Samuel the Elder',
  'Isaac the Elder',
  'Simlai the Southerner',
  // ── Other multi-word proper nouns ─────────────────────────────────────────
  'Alexander the Macedonian',
  'Rebbi Yudan Antoraya',
  'Rebbi Abba Mari',
  'Elisha of the bird\u2019s wings', "Elisha of the bird's wings",
  'the people of Sepphoris', 'The people of Sepphoris',
  'the father of Samuel', 'The father of Samuel',
  'An Aramean youth',
  'the family Osinos',
  'Na\u1e25man the Old',
  'Benjamin from Ginzak',
  // ── Single-word proper names ───────────────────────────────────────────────
  'Aphrodite',
  'Resh Laqish',
  'king Diocletian', 'King Diocletian',
  'Abbahu',
  'Mena\u1E25em',
  '\u1e24izqiah',
  'Maisha',
  'Ganiba',
  'Gedilah',
  'Ze\u00EFra',
  'Ze\u0457ra',
  'Rabba',
  'Hillel',
  'Shammai',
  'Issy',
  '\u1e24efa',
  'Assi',
  'Cahana',
  'Abdan',
  'Ulla',
  'Samuel',
  'Shmuel',
];
const pattern3 = new RegExp(
  SPECIAL_NAMES_REDACT.map(n => _B + n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + _A).join('|'),
  'g'
);

/** Return all non-overlapping match spans, longest-first at each position. */
function matchSpans(text: string): { start: number; end: number }[] {
  const spans: { start: number; end: number }[] = [];
  for (const re of [pattern1, pattern2, pattern3]) {
    re.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      spans.push({ start: m.index, end: m.index + m[0].length });
      if (m.index === re.lastIndex) re.lastIndex++;
    }
  }
  spans.sort((a, b) => a.start - b.start || (b.end - b.start) - (a.end - a.start));
  const kept: { start: number; end: number }[] = [];
  let cursor = -1;
  for (const sp of spans) {
    if (sp.start < cursor) continue;
    kept.push(sp);
    cursor = sp.end;
  }
  return kept;
}

/** Replace every name span in `text` with `{NAME}`. */
function redactNames(text: string): string {
  const spans = matchSpans(text);
  if (spans.length === 0) return text;
  let out = '';
  let pos = 0;
  for (const sp of spans) {
    out += text.slice(pos, sp.start) + '{NAME}';
    pos = sp.end;
  }
  out += text.slice(pos);
  return out;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

function flatTractates() {
  const out: { name: string }[] = [];
  for (const name of Object.keys(TRACTATE_TO_SEDER)) out.push({ name });
  return out;
}

async function main() {
  const tractates = flatTractates().filter(
    t => !ONLY_TRACTATE || t.name.toLowerCase() === ONLY_TRACTATE.toLowerCase()
  );

  const fullLines: string[] = [];
  const redactLines: string[] = [];

  for (const t of tractates) {
    const cachePath = path.join(CACHE_DIR, `${t.name.replace(/\s+/g, '_')}.json`);
    if (!fs.existsSync(cachePath)) {
      console.warn(`! ${t.name}: cache file not found, skipping`);
      continue;
    }
    const dump = JSON.parse(fs.readFileSync(cachePath, 'utf-8'));
    const text: any[] = Array.isArray(dump.text) ? dump.text : [];

    fullLines.push(`\n${'='.repeat(60)}`);
    fullLines.push(`TRACTATE: ${t.name}`);
    fullLines.push('='.repeat(60));
    redactLines.push(`\n${'='.repeat(60)}`);
    redactLines.push(`TRACTATE: ${t.name}`);
    redactLines.push('='.repeat(60));

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
          const ref = `[${t.name} ${chIdx + 1}:${halIdx + 1}.${segIdx + 1}]`;
          const cleaned = cleanSegment(raw);
          fullLines.push(`${ref} ${cleaned}`);
          redactLines.push(`${ref} ${redactNames(cleaned)}`);
        }
      }
    }

    console.log(`[${t.name}] done`);
  }

  fs.writeFileSync(OUT_FULL,   fullLines.join('\n'),   'utf-8');
  fs.writeFileSync(OUT_REDACT, redactLines.join('\n'), 'utf-8');
  console.log(`\nWrote ${OUT_FULL}`);
  console.log(`Wrote ${OUT_REDACT}`);
}

main().catch(e => { console.error(e); process.exit(1); });
