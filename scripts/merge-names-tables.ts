#!/usr/bin/env npx tsx
/**
 * Merge Yerushalmi name table with Bavli gazetteer.
 *
 * Bavli source  : scripts/bavli-glossary.csv  (EzraBrand/talmud-nlp-indexer)
 *   Filtered to : categories=names AND talmud_corpus_count>10
 *   Kept cols   : term, talmud_corpus_count, wikipedia_he, hebrew_term, wikidata_id
 *
 * Yerushalmi src: scripts/yerushalmi-names-results.csv
 *
 * Output        : scripts/yerushalmi-bavli-merged.csv
 */

import * as fs   from 'fs';
import * as path from 'path';

// ── CSV helpers ────────────────────────────────────────────────────────────────

function parseCsv(filePath: string): Record<string, string>[] {
  const text = fs.readFileSync(filePath, 'utf-8').replace(/^\uFEFF/, '');
  const lines = text.split('\n');
  const headers = splitCsvLine(lines[0]);
  const rows: Record<string, string>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const vals = splitCsvLine(line);
    const row: Record<string, string> = {};
    headers.forEach((h, j) => { row[h] = vals[j] ?? ''; });
    rows.push(row);
  }
  return rows;
}

function splitCsvLine(line: string): string[] {
  const result: string[] = [];
  let cur = '', inQuote = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (inQuote && line[i + 1] === '"') { cur += '"'; i++; }
      else inQuote = !inQuote;
    } else if (c === ',' && !inQuote) {
      result.push(cur); cur = '';
    } else {
      cur += c;
    }
  }
  result.push(cur);
  return result;
}

function csvVal(s: string): string {
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function writeCsv(filePath: string, rows: Record<string, string>[], cols: string[]): void {
  const lines = [cols.join(',')];
  for (const r of rows) {
    lines.push(cols.map(c => csvVal(r[c] ?? '')).join(','));
  }
  fs.writeFileSync(filePath, lines.join('\n') + '\n', 'utf-8');
}

// ── Fuzzy match key ────────────────────────────────────────────────────────────

// Map diacritics used in Guggenheimer / academic transliteration to ASCII
const DIACRITIC_MAP: Record<string, string> = {
  'Ḥ':'H','ḥ':'h','Ṭ':'T','ṭ':'t','Ẓ':'Z','ẓ':'z',
  'Ṃ':'M','ṃ':'m','Ā':'A','ā':'a','Ī':'I','ī':'i',
  'Ū':'U','ū':'u','Ō':'O','ō':'o','Ș':'S','ș':'s',
  'ï':'i','Ï':'I','\u0457':'i',  // Cyrillic ї
};

function stripDiacritics(s: string): string {
  // Apply the explicit map first
  s = [...s].map(c => DIACRITIC_MAP[c] ?? c).join('');
  // Then strip any remaining combining diacritics (e.g. ō via compose path)
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').normalize('NFC');
}

// Honorific tokens to remove (only when they're not the sole word)
const HONORIFICS = /\b(?:rabbi|rav|r'|r'|r\.|rabban|rebbi|the)\b/gi;

// Name-form normalization: map Guggenheimer/variant → canonical
const VARIANT_MAP: [RegExp, string][] = [
  // ── Yod-initial names (Guggenheimer uses J/I where others use Y) ───────────
  [/\byohannan\b/g,   'yohanan'],
  [/\bjohanan\b/g,    'yohanan'],
  [/\byochanan\b/g,   'yohanan'],
  [/\bjehudah\b/g,    'yehuda'],
  [/\byehudah\b/g,    'yehuda'],
  [/\bjudah\b/g,      'yehuda'],
  [/\bjannai\b/g,     'yannai'],
  [/\bjehosha\b/g,    'yehoshua'],
  [/\bjoshua\b/g,     'yehoshua'],
  // ── Yose / Yosei ──────────────────────────────────────────────────────────
  [/\byosei\b/g,      'yose'],
  [/\byosy\b/g,       'yose'],
  // ── Eleazar / Elazar ──────────────────────────────────────────────────────
  [/\belazar\b/g,     'eleazar'],
  [/\belieser\b/g,    'eliezer'],
  [/\beleasar\b/g,    'eleazar'],
  // ── Azarya / Azaryah ──────────────────────────────────────────────────────
  [/\bazaryah\b/g,    'azarya'],
  // ── Isaac / Yitzhak ───────────────────────────────────────────────────────
  [/\bisaac\b/g,      'yitzhak'],
  [/\byitzhak\b/g,    'yitzhak'],
  [/\byitzchak\b/g,   'yitzhak'],
  [/\byitshak\b/g,    'yitzhak'],
  // ── Shimon ────────────────────────────────────────────────────────────────
  [/\bsimeon\b/g,     'shimon'],
  [/\bsimon\b/g,      'shimon'],
  // ── Other common variants ─────────────────────────────────────────────────
  [/\bnathan\b/g,     'natan'],
  [/\bshmuel\b/g,     'shmuel'],
  [/\bsamuel\b/g,     'shmuel'],
  [/\bhoshaia\b/g,    'hoshaya'],
  [/\bhoshaiah\b/g,   'hoshaya'],
  [/\boshaiah\b/g,    'hoshaya'],
  [/\bhaninah\b/g,    'hanina'],
  [/\bhananiah\b/g,   'hanina'],
  [/\bhanania\b/g,    'hanina'],
  [/\babahu\b/g,      'abbahu'],
  [/\babbaye\b/g,     'abaye'],
  [/\byona\b/g,       'yona'],
  [/\byonah\b/g,      'yona'],    // Guggenheimer "Yonah" = standard "Yona"
  // ── Guggenheimer-specific transliterations not found in Bavli corpus ───────
  // "Immi" is Guggenheimer's spelling of the common amora "Ammi"
  [/\bimmi\b/g,       'ami'],
  [/\bammi\b/g,       'ami'],
  // "Hila" = standard "Ila" (the amora)
  [/\bhila\b/g,       'ila'],
  // ── bar/ben equivalence ───────────────────────────────────────────────────
  [/\bbar\b/g,        'ben'],
  // NOTE: epithets like "HaNasi", "the Elder", "the Galilean" are intentionally
  // KEPT in the key because they disambiguate different people with the same base
  // name (e.g. "Hillel" ≠ "Hillel the Elder", "Yose" ≠ "Yose the Galilean").
];

// Trivial connector words that should not be the SOLE basis of a subset match
const TRIVIAL = new Set(['ben', 'bar', 'bat', 'the', 'of', 'ha', 'son', 'daughter']);

/**
 * Produce a normalised key for fuzzy matching.
 *
 * Token ORDER IS PRESERVED.  "Yohanan ben Zakkai" and "Zakkai ben Yohanan"
 * must NOT produce the same key — those are different people (father and son).
 * Sorting would collapse them and create false matches.
 *
 * Critical ordering: strip honorifics BEFORE removing apostrophes so that
 * patterns like "r'" and "r'" fire correctly, then do a post-apostrophe
 * pass to clean up any remaining bare "r" token.
 */
function matchKey(raw: string): string {
  let s = stripDiacritics(raw);

  // 1. Lowercase
  s = s.toLowerCase();

  // 2. Strip honorifics FIRST (apostrophes still present so r', r. fire)
  const wo1 = s.replace(HONORIFICS, '').trim();
  if (wo1.length > 0) s = wo1;

  // 3. Remove apostrophes, curly quotes, hyphens, and commas
  s = s.replace(/[''`'\-,]/g, '');

  // 4. Second-pass: remove any bare 'r' that was the body of a stripped honorific
  const wo2 = s.replace(/\br\b/g, '').trim();
  if (wo2.length > 0) s = wo2;

  // 5. Apply variant normalisations
  for (const [re, rep] of VARIANT_MAP) s = s.replace(re, rep);

  // 6. Collapse whitespace and strip
  s = s.replace(/\s+/g, ' ').trim();

  // 7. Return tokens in original order — order encodes parent/child direction
  return s.split(' ').filter(Boolean).join(' ');
}

/**
 * Levenshtein distance between two strings (bounded at maxDist+1 for speed).
 */
function levenshtein(a: string, b: string, maxDist = 4): number {
  if (Math.abs(a.length - b.length) > maxDist) return maxDist + 1;
  const m = a.length, n = b.length;
  const dp: number[] = Array.from({ length: n + 1 }, (_, i) => i);
  for (let i = 1; i <= m; i++) {
    let prev = dp[0]; dp[0] = i;
    for (let j = 1; j <= n; j++) {
      const temp = dp[j];
      dp[j] = a[i-1] === b[j-1] ? prev : 1 + Math.min(prev, dp[j], dp[j-1]);
      prev = temp;
    }
  }
  return dp[n];
}

/**
 * Jaccard similarity on word sets.
 */
function jaccard(a: string, b: string): number {
  const sa = new Set(a.split(' ').filter(Boolean));
  const sb = new Set(b.split(' ').filter(Boolean));
  let inter = 0;
  for (const t of sa) if (sb.has(t)) inter++;
  const union = sa.size + sb.size - inter;
  return union === 0 ? 0 : inter / union;
}

// ── Main ───────────────────────────────────────────────────────────────────────

const SCRIPTS = path.join(import.meta.dirname, '.');

// Load Bavli glossary
const bavliRaw = parseCsv(path.join(SCRIPTS, 'bavli-glossary.csv'));
function bavliCount(r: Record<string, string>): number {
  try { return parseInt(r['talmud_corpus_count'], 10); } catch { return 0; }
}
const bavliNames = bavliRaw.filter(r =>
  r['categories']?.trim().toLowerCase() === 'names' && bavliCount(r) > 10
);

// Build lookup structures
const bavliByKey   = new Map<string, Record<string, string>>();
const bavliEntries = bavliNames.map(r => ({
  row:    r,
  key:    matchKey(r['term']),
  rawKey: stripDiacritics(r['term']).toLowerCase(),
}));

for (const e of bavliEntries) {
  if (!bavliByKey.has(e.key)) bavliByKey.set(e.key, e.row);
}

// Load Yerushalmi table
const yRows = parseCsv(path.join(SCRIPTS, 'yerushalmi-names-results.csv'));

// ── Matching ───────────────────────────────────────────────────────────────────

interface MatchResult {
  bavliTerm:    string;
  bavliCount:   string;
  wikipediaHe:  string;
  hebrewTerm:   string;
  wikidataId:   string;
  matchType:    string;
  matchScore:   number;
  matchNote:    string;
}

const EMPTY: MatchResult = {
  bavliTerm: '', bavliCount: '', wikipediaHe: '', hebrewTerm: '',
  wikidataId: '', matchType: 'none', matchScore: 0, matchNote: '',
};

function pickMatch(bavliRow: Record<string, string>, type: string, score: number, note = ''): MatchResult {
  return {
    bavliTerm:   bavliRow['term'],
    bavliCount:  bavliRow['talmud_corpus_count'],
    wikipediaHe: bavliRow['wikipedia_he'],
    hebrewTerm:  bavliRow['hebrew_term'],
    wikidataId:  bavliRow['wikidata_id'],
    matchType:   type,
    matchScore:  score,
    matchNote:   note,
  };
}

function findMatch(normalizedName: string): MatchResult {
  const key = matchKey(normalizedName);

  // Tier 1: exact key match
  const exact = bavliByKey.get(key);
  if (exact) return pickMatch(exact, 'exact', 100);

  // Tier 2: token-subset — all tokens of the shorter key appear in the longer one.
  // Guard: require at least 1 substantial (non-trivial, len≥3) token in the shared set
  // and that the match covers ≥ 60% of the LARGER key's tokens, to avoid spurious
  // single-connector matches (e.g. "ben hiyya" falsely matching "abun ben hiyya").
  const keyTokens = new Set(key.split(' ').filter(Boolean));
  let bestSubset: Record<string, string> | null = null;
  let bestSubsetScore = 0;
  for (const e of bavliEntries) {
    const eTokens = new Set(e.key.split(' ').filter(Boolean));
    const smaller = keyTokens.size <= eTokens.size ? keyTokens : eTokens;
    const larger  = keyTokens.size <= eTokens.size ? eTokens  : keyTokens;
    // REQUIRE a PROPER subset: the larger must have at least one extra token.
    // Equal-size sets mean reversed names ("Elazar ben Shimon" / "Shimon ben Elazar")
    // which are DIFFERENT people and must never match here.
    if (smaller.size >= larger.size) continue;
    let matches = 0;
    let substantialMatch = 0;
    for (const t of smaller) {
      if (larger.has(t)) {
        matches++;
        if (t.length >= 3 && !TRIVIAL.has(t)) substantialMatch++;
      }
    }
    if (matches === smaller.size && substantialMatch >= 1) {
      const coverage = smaller.size / larger.size;   // how much of larger is covered
      if (coverage >= 0.70) {
        const score = Math.round(70 + 30 * coverage);
        if (score > bestSubsetScore) {
          bestSubsetScore = score;
          bestSubset = e.row;
        }
      }
    }
  }
  if (bestSubset && bestSubsetScore >= 85) {
    return pickMatch(bestSubset, 'token_subset', bestSubsetScore,
      `key="${key}" ⊆ bavli="${matchKey(bestSubset['term'])}"`);
  }

  // Tier 3: Jaccard similarity on key tokens.
  // Skip jaccard=1.0: identical token sets in different order are reversed names
  // ("Elazar ben Shimon" / "Shimon ben Elazar") — different people, not variants.
  // Exact match (Tier 1) would have already caught genuinely identical strings.
  let bestJacc: Record<string, string> | null = null;
  let bestJaccScore = 0;
  for (const e of bavliEntries) {
    const j = jaccard(key, e.key);
    if (j >= 1.0) continue;   // same token set but different order → reversed-name false positive
    if (j > bestJaccScore) { bestJaccScore = j; bestJacc = e.row; }
  }
  if (bestJaccScore >= 0.75 && bestJacc) {
    return pickMatch(bestJacc, 'fuzzy_jaccard', Math.round(bestJaccScore * 100),
      `jaccard=${bestJaccScore.toFixed(2)}`);
  }

  // Tier 4: Levenshtein distance on key — SINGLE-TOKEN keys only (multi-token
  // character distance creates too many spurious cross-person matches).
  // Short keys (< 6 chars): allow lev ≤ 1.  Longer keys: allow lev ≤ 2.
  const keyHasSpaces = key.includes(' ');
  if (!keyHasSpaces) {
    const maxLev = key.length < 6 ? 1 : 2;
    let bestLev: Record<string, string> | null = null;
    let bestLevDist = 99;
    for (const e of bavliEntries) {
      if (e.key.includes(' ')) continue;  // only compare single-token to single-token
      const d = levenshtein(key, e.key, maxLev);
      if (d < bestLevDist) { bestLevDist = d; bestLev = e.row; }
    }
    if (bestLevDist <= maxLev && bestLev) {
      const score = Math.round(60 - bestLevDist * 15);
      return pickMatch(bestLev, 'fuzzy_edit', score,
        `lev=${bestLevDist} key="${key}"→"${matchKey(bestLev['term'])}"`);
    }
  }

  return EMPTY;
}

// ── Group Yerushalmi rows by normalized_name, merge counts, collect variants ───

interface Group {
  normalizedName: string;
  variants: string[];   // raw "name" forms, in CSV order (highest-count first)
  totalCount: number;
}

const groups = new Map<string, Group>();
for (const yr of yRows) {
  const norm  = yr['normalized_name'];
  const count = parseInt(yr['count']) || 0;
  if (!groups.has(norm)) {
    groups.set(norm, { normalizedName: norm, variants: [], totalCount: 0 });
  }
  const g = groups.get(norm)!;
  g.totalCount += count;
  if (!g.variants.includes(yr['name'])) g.variants.push(yr['name']);
}

// ── Build output rows (one per unique normalized_name) ─────────────────────────

// ── Corpus totals for frequency normalisation ──────────────────────────────────
// Yerushalmi total = all occurrences across every normalised name group.
const totalYerushalmi = [...groups.values()].reduce((s, g) => s + g.totalCount, 0);
// Bavli total = all name-occurrences in the filtered Bavli glossary (names, count > 10).
const totalBavli = bavliNames.reduce((s, r) => s + bavliCount(r), 0);

const pct = (n: number, total: number): string =>
  total > 0 ? (n / total * 100).toFixed(4) : '';

const OUTPUT_COLS = [
  'rank', 'normalized_name', 'yerushalmi_count', 'yerushalmi_pct',
  'bavli_term', 'bavli_count', 'bavli_pct',
  'wikipedia_he', 'hebrew_term', 'wikidata_id',
  'match_type', 'match_score', 'match_note',
  'yerushalmi_variant_names',
];

const outRows: Record<string, string>[] = [];

const sortedGroups = [...groups.values()]
  .sort((a, b) => b.totalCount - a.totalCount);

let rank = 1;
for (const g of sortedGroups) {
  const m = findMatch(g.normalizedName);
  const normBavliTerm = m.bavliTerm.replace(/\bRabbi\b/g, "R'");
  const bavliN = m.bavliCount ? parseInt(m.bavliCount) : 0;
  outRows.push({
    rank:                      String(rank++),
    normalized_name:           g.normalizedName,
    yerushalmi_count:          String(g.totalCount),
    yerushalmi_pct:            pct(g.totalCount, totalYerushalmi),
    bavli_term:                normBavliTerm,
    bavli_count:               m.bavliCount,
    bavli_pct:                 m.bavliCount ? pct(bavliN, totalBavli) : '',
    wikipedia_he:              m.wikipediaHe,
    hebrew_term:               m.hebrewTerm,
    wikidata_id:               m.wikidataId,
    match_type:                m.matchType,
    match_score:               String(m.matchScore),
    match_note:                m.matchNote,
    yerushalmi_variant_names:  g.variants.join(' | '),
  });
}

const outPath = path.join(SCRIPTS, 'yerushalmi-bavli-merged.csv');
writeCsv(outPath, outRows, OUTPUT_COLS);
console.log(`Wrote ${outPath}`);

// ── Stats ──────────────────────────────────────────────────────────────────────

const matched   = outRows.filter(r => r['match_type'] !== 'none');
const byType    = new Map<string, number>();
for (const r of outRows) byType.set(r['match_type'], (byType.get(r['match_type']) ?? 0) + 1);

console.log(`\nMatch summary (${outRows.length} Yerushalmi names):`);
for (const [t, n] of [...byType.entries()].sort((a,b) => b[1]-a[1]))
  console.log(`  ${t.padEnd(18)} ${n}`);
console.log(`  ${'─'.repeat(28)}`);
console.log(`  matched            ${matched.length}  (${Math.round(100*matched.length/outRows.length)}%)`);
console.log(`  unmatched          ${outRows.length - matched.length}`);

// Show top 20 exact matches for sanity check
console.log('\nTop 20 exact matches:');
outRows
  .filter(r => r['match_type'] === 'exact')
  .sort((a,b) => parseInt(b['yerushalmi_count']) - parseInt(a['yerushalmi_count']))
  .slice(0, 20)
  .forEach(r =>
    console.log(`  Y:${r['yerushalmi_count'].padStart(5)}  ${r['normalized_name'].padEnd(32)} → ${r['bavli_term']}`)
  );

// Show sample fuzzy matches
console.log('\nSample fuzzy matches (score ≥ 70, Yerushalmi count ≥ 5):');
outRows
  .filter(r => r['match_type'] !== 'exact' && r['match_type'] !== 'none'
            && parseInt(r['match_score']) >= 70
            && parseInt(r['yerushalmi_count']) >= 5)
  .sort((a,b) => parseInt(b['yerushalmi_count']) - parseInt(a['yerushalmi_count']))
  .slice(0, 30)
  .forEach(r =>
    console.log(`  [${r['match_score'].padStart(3)}/${r['match_type']}]  Y:${r['yerushalmi_count'].padStart(5)}  ${r['normalized_name'].padEnd(32)} → ${r['bavli_term']}  ${r['match_note']}`)
  );

// Show unmatched names with count ≥ 5
console.log('\nUnmatched with Yerushalmi count ≥ 5:');
outRows
  .filter(r => r['match_type'] === 'none' && parseInt(r['yerushalmi_count']) >= 5)
  .sort((a,b) => parseInt(b['yerushalmi_count']) - parseInt(a['yerushalmi_count']))
  .slice(0, 30)
  .forEach(r =>
    console.log(`  Y:${r['yerushalmi_count'].padStart(5)}  ${r['normalized_name']}`)
  );
