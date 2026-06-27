/**
 * filter-lexicon-headwords.ts
 *
 * Filter a `shared/data/lexicon-headwords/<slug>.json` index against the
 * locally-cached Sefaria corpus (scripts/.cache/<slug>-corpus/) to drop
 * "ghost" headwords that Sefaria's completion API listed but whose
 * /api/words/{headword} response contains no entry in the target lexicon.
 *
 * Background: Sefaria's `words/completion/{prefix}/{lexicon}` endpoint
 * advertises ~9k BDB headwords, but a substantial fraction (~42%) cannot
 * actually be retrieved — clicking them in our headword grid produces
 * "no entries found". The cache (built by scan-lexicon-acronyms.ts) holds
 * the ground truth: one file per query, with the actual API response.
 *
 * Run:
 *   npx tsx scripts/filter-lexicon-headwords.ts --lexicon="BDB Dictionary"
 *   npx tsx scripts/filter-lexicon-headwords.ts --lexicon="Jastrow Dictionary"
 *
 * Flags:
 *   --lexicon  Required. Sefaria parent_lexicon name.
 *   --in       Input headword index path (default: shared/data/lexicon-headwords/<slug>.json).
 *   --out      Output path (default: same as --in, overwrites in place).
 *   --cache    Cache dir (default: scripts/.cache/<slug>-corpus).
 *   --dry-run  Print stats without writing the output.
 *
 * Policy: a headword is kept if EITHER (a) its cache file contains at least
 * one entry with parent_lexicon === <lexicon>, OR (b) no cache file exists
 * for that headword at all (we have no evidence it's a ghost, so we keep it
 * to avoid false positives when the cache is incomplete).
 */

import * as fs from 'fs';
import * as path from 'path';

function parseArgs(argv: string[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const a of argv.slice(2)) {
    const m = a.match(/^--([^=]+)(?:=(.*))?$/);
    if (m) out[m[1]] = m[2] ?? 'true';
  }
  return out;
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+dictionary$/i, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

const NIQQUD_RE = /[\u0591-\u05C7]/g;
const FINAL_TO_REGULAR: Record<string, string> = {
  '\u05DA': '\u05DB',
  '\u05DD': '\u05DE',
  '\u05DF': '\u05E0',
  '\u05E3': '\u05E4',
  '\u05E5': '\u05E6',
};
function normalizeHebrew(s: string): string {
  return s.replace(NIQQUD_RE, '').replace(/[\u05DA\u05DD\u05DF\u05E3\u05E5]/g, (c) => FINAL_TO_REGULAR[c] ?? c);
}

// Mirror scan-lexicon-acronyms.ts:safeFilename — must stay in sync so the
// filter resolves the same files the scan script wrote.
function safeFilename(s: string): string {
  return s.replace(/[\\/\0]/g, '_').slice(0, 200);
}

function main() {
  const args = parseArgs(process.argv);
  const lexicon = args.lexicon;
  if (!lexicon) {
    console.error('--lexicon is required (e.g. --lexicon="BDB Dictionary")');
    process.exit(1);
  }
  const slug = slugify(lexicon);
  const inPath = args.in || path.join(process.cwd(), 'shared/data/lexicon-headwords', `${slug}.json`);
  const outPath = args.out || inPath;
  const cacheDir = args.cache || path.join(process.cwd(), 'scripts/.cache', `${slug}-corpus`);
  const dryRun = args['dry-run'] === 'true';

  if (!fs.existsSync(inPath)) {
    console.error(`Input index not found: ${inPath}`);
    process.exit(1);
  }
  if (!fs.existsSync(cacheDir)) {
    console.error(`Cache dir not found: ${cacheDir}`);
    console.error(`Run: npx tsx scripts/scan-lexicon-acronyms.ts --lexicon=${slug}`);
    process.exit(1);
  }

  const indexData = JSON.parse(fs.readFileSync(inPath, 'utf8'));
  const headwords: string[] = indexData.headwords ?? [];
  if (headwords.length === 0) {
    console.error('Input index has no headwords.');
    process.exit(1);
  }

  // Index cache files by exact filename (the scan script writes one file
  // per queried headword: `<headword>.json`).
  const cacheFiles = new Set<string>(fs.readdirSync(cacheDir).filter((f) => f.endsWith('.json')));

  const kept: string[] = [];
  const dropped: string[] = [];
  const noCacheKept: string[] = [];

  for (const hw of headwords) {
    const cacheName = `${safeFilename(hw)}.json`;
    if (!cacheFiles.has(cacheName)) {
      // No cache evidence either way — keep it to avoid false positives.
      kept.push(hw);
      noCacheKept.push(hw);
      continue;
    }
    let parsed: unknown;
    try {
      parsed = JSON.parse(fs.readFileSync(path.join(cacheDir, cacheName), 'utf8'));
    } catch {
      // Corrupt cache file → indeterminate, keep.
      kept.push(hw);
      noCacheKept.push(hw);
      continue;
    }
    if (!Array.isArray(parsed)) {
      // Unexpected payload shape (e.g. an error object) → indeterminate, keep.
      kept.push(hw);
      noCacheKept.push(hw);
      continue;
    }
    const hasEntry = parsed.some((e: any) => e?.parent_lexicon === lexicon);
    if (hasEntry) {
      kept.push(hw);
    } else {
      dropped.push(hw);
    }
  }

  // Recompute per-letter counts using the unvoweled first character.
  const perLetter: Record<string, number> = {};
  for (const hw of kept) {
    const norm = normalizeHebrew(hw);
    const first = norm[0];
    if (!first) continue;
    perLetter[first] = (perLetter[first] || 0) + 1;
  }

  console.log(`Lexicon: ${lexicon}`);
  console.log(`Input headwords:  ${headwords.length}`);
  console.log(`Kept:             ${kept.length} (${dropped.length} ghosts dropped)`);
  console.log(`Of those kept:    ${noCacheKept.length} had no cache evidence either way`);
  if (dropped.length > 0) {
    console.log(`Sample dropped:   ${dropped.slice(0, 10).map((s) => JSON.stringify(s)).join(', ')}`);
  }

  if (dryRun) {
    console.log('Dry run — no file written.');
    return;
  }

  const out = {
    _metadata: {
      ...(indexData._metadata || {}),
      lexicon,
      total_headwords: kept.length,
      per_letter_counts: perLetter,
      filtered_at: new Date().toISOString(),
      filter_source: `scripts/.cache/${slug}-corpus`,
      filter_dropped: dropped.length,
      note:
        'Each headword is a canonical lexicon entry id, suitable as a query for /api/words/{headword}. ' +
        'Filtered against local Sefaria corpus cache to drop "ghost" headwords whose /api/words/ response ' +
        'contains no entry in this lexicon.',
    },
    headwords: kept,
  };

  fs.writeFileSync(outPath, JSON.stringify(out, null, 2));
  const sizeKb = (fs.statSync(outPath).size / 1024).toFixed(1);
  console.log(`Wrote ${kept.length} headwords to ${outPath} (${sizeKb} KB)`);
}

main();
