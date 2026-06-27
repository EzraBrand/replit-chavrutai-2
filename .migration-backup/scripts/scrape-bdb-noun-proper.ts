/**
 * scrape-bdb-noun-proper.ts
 *
 * Walk the cached BDB corpus (scripts/.cache/bdb-corpus/) and extract every
 * "noun proper" sense (n.pr., n.pr.m., n.pr.f., n.pr.loc., n.pr.gent., …) into
 * a human-readable CSV. Modernizes BDB shorthand using:
 *   - client/src/data/bdb-mappings.json for POS abbreviations
 *   - Sefaria's data-ref attributes for canonical Bible references
 *   - shared/bible-books.ts to separate Bible refs from internal BDB cross-refs
 *
 * Run:
 *   npx tsx scripts/scrape-bdb-noun-proper.ts
 *
 * Output:
 *   scripts/bdb-noun-proper.csv   — columns: row, headword, sense_index, pos, etymology, definition, refs, other_refs
 *                                   (`row` is a CSV-only 1-indexed sequential ID; not in JSON)
 *   scripts/bdb-noun-proper.json  — same data as JSON for further analysis (no `row` field)
 *
 * Each n.pr. sense becomes one row. A headword with multiple n.pr. senses
 * appears multiple times, with sense_index 1, 2, … in the order Sefaria
 * lists them. Headwords whose first sense is something else (e.g. אָדָם whose
 * sense 1 is "n.m. man" and sense 3 is "n.pr.m. Adam") are picked up by the
 * recursive walk over the whole sense tree.
 *
 * Prereq: BDB corpus must already be cached (run scan-lexicon-acronyms.ts --lexicon=bdb first).
 */

import * as fs from 'fs';
import * as path from 'path';
import { ALL_BIBLE_BOOKS } from '../shared/bible-books';
import { annotateAllTransliterations } from '../shared/transliteration';

const CACHE_DIR = path.join(process.cwd(), 'scripts/.cache/bdb-corpus');
const OUT_CSV = path.join(process.cwd(), 'scripts/bdb-noun-proper.csv');
const OUT_JSON = path.join(process.cwd(), 'scripts/bdb-noun-proper.json');
const MAPPINGS_PATH = path.join(process.cwd(), 'shared/data/lexicon-mappings/bdb.json');

// Sense.definition strings that mark an n.pr. block. The leading <strong> may
// optionally be preceded by a dagger (†) or double-dagger (‡) glyph.
const POS_DETECT = /<strong>\s*[†‡]?\s*n\.pr\./;
const POS_RAW_RE = /<strong>\s*([†‡]?\s*)(n\.pr\.[a-z.]*)/i;

// Build a Set of canonical Sefaria book names for Bible-ref filtering.
// data-ref values look like "II Samuel 23:32" or "I Chronicles 11:33".
const BIBLE_BOOK_SET = new Set<string>(ALL_BIBLE_BOOKS.map((b) => b.sefaria));

interface Parsed {
  headword: string;
  sense_index: number;
  pos_raw: string;
  pos: string;
  etymology: string;
  definition: string;
  refs: string[];        // Bible refs only
  other_refs: string[];  // BDB cross-refs and any non-Bible data-ref values
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n, 10)));
}

function stripTags(html: string): string {
  return html.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
}

// Greek/Syriac/Arabic transliteration is imported from shared/transliteration.ts
// so the live BDB / Jastrow readers can apply the exact same rules. See that
// module for the full convention notes (η→ē, ω→ō, ngamma, rough breathing, etc.).

function expandPos(posRaw: string, mappings: Record<string, string>): string {
  // Try longest-first so n.pr.loc. wins over n.pr., etc.
  const ordered = Object.keys(mappings)
    .filter((k) => k.startsWith('n.pr'))
    .sort((a, b) => b.length - a.length);
  for (const k of ordered) {
    if (posRaw === k) return mappings[k];
  }
  // Fallback: prefix match for unmapped compounds (n.pr.gent.pl., n.pr.m.coll., …)
  for (const k of ordered) {
    if (posRaw.startsWith(k)) {
      const tail = posRaw.slice(k.length).replace(/\.$/, '');
      return tail ? `${mappings[k]} (${tail})` : mappings[k];
    }
  }
  return posRaw;
}

function isBibleRef(ref: string): boolean {
  // data-ref looks like "II Samuel 23:32" — book is everything before " <number>".
  const m = ref.match(/^(.+?)\s+\d/);
  if (!m) return false;
  return BIBLE_BOOK_SET.has(m[1]);
}

function parseEntry(headword: string, defHtml: string, senseIndex: number, mappings: Record<string, string>): Parsed | null {
  const posMatch = defHtml.match(POS_RAW_RE);
  if (!posMatch) return null;
  // Always end POS with a single period ("n.pr.dei" → "n.pr.dei.")
  let posRaw = posMatch[2];
  if (!posRaw.endsWith('.')) posRaw += '.';
  posRaw = posRaw.replace(/\.+$/, '.');

  // Extract every <a data-ref="..."> link. We KEEP the data-ref string verbatim
  // and replace the anchor tag with a sentinel so refs survive tag-stripping
  // and we can scrub them out of the prose at the end.
  const allRefs: string[] = [];
  const refMarked = defHtml.replace(
    /<a\b[^>]*\bdata-ref="([^"]+)"[^>]*>[\s\S]*?<\/a>/g,
    (_m, ref) => {
      allRefs.push(ref);
      return ' ◊REF◊ ';
    },
  );

  const flat = decodeEntities(stripTags(refMarked));

  // Strip the leading dagger and POS token off the flat string to find the body.
  const bodyMatch = flat.match(/^[†‡]?\s*n\.pr\.[a-z.]*\s*/i);
  let body = bodyMatch ? flat.slice(bodyMatch[0].length) : flat;

  // Helper: strip ◊REF◊ sentinels and tidy whitespace/punctuation.
  const cleanProse = (s: string): string =>
    s
      .replace(/◊REF◊/g, '')
      .replace(/\s*[,;]\s*(?=[.,;:])/g, '')
      .replace(/\s+([,.;:])/g, '$1')
      .replace(/[,;\s]+\.$/g, '.')
      .replace(/^[,.;:\s]+/, '')
      .replace(/\s+/g, ' ')
      .trim();

  // Extract etymology from a leading parenthetical (with balanced-paren matching).
  let etymology = '';
  if (body.startsWith('(')) {
    let depth = 0;
    let endIdx = -1;
    for (let i = 0; i < body.length; i++) {
      if (body[i] === '(') depth++;
      else if (body[i] === ')') {
        depth--;
        if (depth === 0) {
          endIdx = i;
          break;
        }
      }
    }
    if (endIdx > 0) {
      etymology = cleanProse(body.slice(1, endIdx));
      body = body.slice(endIdx + 1).trim();
    }
  }

  let definition = cleanProse(body);
  if (definition === '.') definition = '';
  // Append Latin transliteration in [brackets] after each Greek run, in both
  // the definition and the etymology (etymologies sometimes cite Septuagint /
  // Eusebian Greek forms too).
  definition = annotateAllTransliterations(definition);
  etymology = annotateAllTransliterations(etymology);

  // Split refs into Bible vs other (internal BDB cross-refs etc).
  const refs: string[] = [];
  const other_refs: string[] = [];
  for (const r of allRefs) {
    if (isBibleRef(r)) refs.push(r);
    else other_refs.push(r);
  }

  return {
    headword,
    sense_index: senseIndex,
    pos_raw: posRaw,
    pos: expandPos(posRaw, mappings),
    etymology,
    definition,
    refs,
    other_refs,
  };
}

/**
 * Recursively collect every {definition, index} pair from a sense tree. Sefaria
 * sometimes nests sub-senses under `senses[i].senses` etc. The index is a
 * 1-based counter across the full traversal so the caller can disambiguate
 * homonyms in the CSV.
 */
function collectSenses(senses: any[], counter: { n: number }): Array<{ definition: string; index: number }> {
  const out: Array<{ definition: string; index: number }> = [];
  if (!Array.isArray(senses)) return out;
  for (const s of senses) {
    counter.n++;
    if (s && typeof s.definition === 'string') {
      out.push({ definition: s.definition, index: counter.n });
    }
    if (s && Array.isArray(s.senses)) {
      out.push(...collectSenses(s.senses, counter));
    }
  }
  return out;
}

function csvEscape(s: string): string {
  if (s == null) return '';
  if (/["\n\r,]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function main() {
  if (!fs.existsSync(CACHE_DIR)) {
    console.error(`Cache dir not found: ${CACHE_DIR}`);
    console.error(`Run: npx tsx scripts/scan-lexicon-acronyms.ts --lexicon=bdb`);
    process.exit(1);
  }
  const mappings = JSON.parse(fs.readFileSync(MAPPINGS_PATH, 'utf8')).mappings as Record<string, string>;

  const files = fs.readdirSync(CACHE_DIR);
  const rows: Parsed[] = [];
  let totalEntries = 0;
  let scannedFiles = 0;
  let parseFailures = 0;
  let duplicateEntries = 0;

  // Dedupe across cache files: a single BDB entry (rid) often appears in
  // multiple cache files because Sefaria returns related entries from queries
  // for voweled/unvoweled/cantillated variants of the headword (e.g. BDB00130
  // "Adam" comes back from queries for both אָדָם and אֱדֹם). Process each rid
  // exactly once. Entries without a rid (rare) fall back to headword+definition
  // hash so we still don't double-count.
  const seenRids = new Set<string>();

  for (const f of files) {
    if (!f.endsWith('.json')) continue;
    scannedFiles++;
    let entries: any;
    try {
      entries = JSON.parse(fs.readFileSync(path.join(CACHE_DIR, f), 'utf8'));
    } catch {
      continue;
    }
    if (!Array.isArray(entries)) continue;

    for (const e of entries) {
      if (e?.parent_lexicon !== 'BDB Dictionary') continue;
      totalEntries++;
      const dedupeKey =
        e.rid || `${e.headword}::${(e?.content?.senses?.[0]?.definition || '').slice(0, 80)}`;
      if (seenRids.has(dedupeKey)) {
        duplicateEntries++;
        continue;
      }
      seenRids.add(dedupeKey);

      const senses = e?.content?.senses;
      const counter = { n: 0 };
      const flatSenses = collectSenses(senses, counter);
      for (const { definition, index } of flatSenses) {
        if (!POS_DETECT.test(definition)) continue;
        const parsed = parseEntry(e.headword, definition, index, mappings);
        if (parsed) rows.push(parsed);
        else parseFailures++;
      }
    }
  }

  // Sort by Hebrew headword, then by sense order
  rows.sort((a, b) => {
    const c = a.headword.localeCompare(b.headword, 'he');
    return c !== 0 ? c : a.sense_index - b.sense_index;
  });

  // Tally POS distribution for the summary log
  const posCounts: Record<string, number> = {};
  for (const r of rows) posCounts[r.pos_raw] = (posCounts[r.pos_raw] || 0) + 1;

  // For the CSV, drop the redundant "noun proper " prefix from every pos cell
  // — it's the same on every row, so it just adds visual noise. JSON keeps the
  // full string for programmatic consumers.
  const POS_PREFIX = 'noun proper';
  const stripPosPrefix = (pos: string): string => {
    if (pos === POS_PREFIX) return '';
    if (pos.startsWith(POS_PREFIX + ' ')) return pos.slice(POS_PREFIX.length + 1);
    return pos;
  };

  // Excel/Google Sheets treat any cell starting with "=" as a formula, which
  // causes the row to display "#NAME?" or worse, execute the cell content.
  // Defuse by prefixing an apostrophe — the standard CSV-injection mitigation.
  // Only applied at CSV write time; JSON output is unaffected.
  const defuseFormula = (s: string): string => (s.startsWith('=') ? "'" + s : s);

  // CSV-only `row` column: 1-based sequential ID for easy human reference
  // (e.g. "row 412" when discussing the table). The JSON output omits it —
  // consumers there already have array indices.
  const headers = ['row', 'headword', 'sense_index', 'pos', 'etymology', 'definition', 'refs', 'other_refs'];
  const csvLines = [headers.join(',')];
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    csvLines.push(
      [
        String(i + 1),
        csvEscape(r.headword),
        String(r.sense_index),
        csvEscape(stripPosPrefix(r.pos)),
        csvEscape(defuseFormula(r.etymology)),
        csvEscape(defuseFormula(r.definition)),
        csvEscape(r.refs.join('; ')),
        csvEscape(r.other_refs.join('; ')),
      ].join(','),
    );
  }
  fs.writeFileSync(OUT_CSV, csvLines.join('\n') + '\n');
  fs.writeFileSync(OUT_JSON, JSON.stringify(rows, null, 2));

  const uniqueHeadwords = new Set(rows.map((r) => r.headword)).size;
  const totalBibleRefs = rows.reduce((s, r) => s + r.refs.length, 0);
  const totalOtherRefs = rows.reduce((s, r) => s + r.other_refs.length, 0);

  console.log(`Scanned: ${scannedFiles} cache files, ${totalEntries} BDB entries (${duplicateEntries} cross-file duplicates skipped)`);
  console.log(`Matched n.pr. senses: ${rows.length} (${uniqueHeadwords} unique headwords)`);
  console.log(`Parse failures: ${parseFailures}`);
  console.log(`Bible refs: ${totalBibleRefs}; non-Bible (cross-refs): ${totalOtherRefs}`);
  console.log(`POS distribution:`);
  for (const [k, v] of Object.entries(posCounts).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${k.padEnd(16)} ${v}`);
  }
  console.log(`\nCSV  → ${OUT_CSV}`);
  console.log(`JSON → ${OUT_JSON}`);
}

main();
