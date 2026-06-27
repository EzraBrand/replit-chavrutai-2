/**
 * fetch-lexicon-headwords.ts
 *
 * Enumerate every headword in a Sefaria lexicon (e.g. "BDB Dictionary",
 * "Jastrow Dictionary") via the public completion API and persist the result
 * as a flat JSON index at shared/data/lexicon-headwords/<slug>.json.
 *
 * The file is committed to source so the BDB reader (and future tooling
 * like acronym scanners) can iterate the corpus without hitting Sefaria
 * 9k+ times on every run.
 *
 * Run:
 *   npx tsx scripts/fetch-lexicon-headwords.ts --lexicon="BDB Dictionary"
 *   npx tsx scripts/fetch-lexicon-headwords.ts --lexicon="Jastrow Dictionary" --alphabet=hebrew-extended
 *
 * Flags:
 *   --lexicon   Required. Sefaria parent_lexicon name.
 *   --alphabet  hebrew-22 (default) | hebrew-extended (adds final-letter forms)
 *   --out       Override output path.
 */

import * as fs from 'fs';
import * as path from 'path';

const HEBREW_22 = ['א','ב','ג','ד','ה','ו','ז','ח','ט','י','כ','ל','מ','נ','ס','ע','פ','צ','ק','ר','ש','ת'];
const HEBREW_EXTENDED = [...HEBREW_22, 'ך','ם','ן','ף','ץ'];

function parseArgs(argv: string[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const a of argv.slice(2)) {
    const m = a.match(/^--([^=]+)(?:=(.*))?$/);
    if (m) out[m[1]] = m[2] ?? 'true';
  }
  return out;
}

function slugify(name: string): string {
  return name.toLowerCase().replace(/\s+dictionary$/i, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

async function fetchHeadwordsForLetter(letter: string, lexicon: string): Promise<string[]> {
  const url = `https://www.sefaria.org/api/words/completion/${encodeURIComponent(letter)}/${encodeURIComponent(lexicon)}?limit=50000`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} for letter ${letter}`);
  const data = await res.json();
  if (!Array.isArray(data)) return [];
  const out: string[] = [];
  for (const row of data) {
    if (!Array.isArray(row) || row.length < 1) continue;
    const hw = row[1] || row[0];
    if (typeof hw === 'string' && hw.length > 0) out.push(hw);
  }
  return out;
}

async function main() {
  const args = parseArgs(process.argv);
  const lexicon = args.lexicon;
  if (!lexicon) {
    console.error('--lexicon is required (e.g. --lexicon="BDB Dictionary")');
    process.exit(1);
  }
  const alphabet = args.alphabet === 'hebrew-extended' ? HEBREW_EXTENDED : HEBREW_22;
  const slug = slugify(lexicon);
  const outPath = args.out || path.join(process.cwd(), 'shared/data/lexicon-headwords', `${slug}.json`);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });

  const t0 = Date.now();
  const seen = new Set<string>();
  const all: string[] = [];
  const perLetter: Record<string, number> = {};

  for (const L of alphabet) {
    const list = await fetchHeadwordsForLetter(L, lexicon);
    let added = 0;
    for (const hw of list) {
      if (seen.has(hw)) continue;
      seen.add(hw);
      all.push(hw);
      added++;
    }
    perLetter[L] = added;
    console.log(`  ${L}: +${added} (running total ${all.length})`);
  }

  const out = {
    _metadata: {
      lexicon,
      source: `https://www.sefaria.org/api/words/completion/{prefix}/${encodeURIComponent(lexicon)}`,
      fetched_at: new Date().toISOString(),
      total_headwords: all.length,
      per_letter_counts: perLetter,
      alphabet,
      note: 'Each headword is a canonical lexicon entry id, suitable as a query for /api/words/{headword}.',
    },
    headwords: all,
  };

  fs.writeFileSync(outPath, JSON.stringify(out, null, 2));
  const sizeKb = (fs.statSync(outPath).size / 1024).toFixed(1);
  console.log(`Wrote ${all.length} headwords to ${outPath} (${sizeKb} KB) in ${((Date.now()-t0)/1000).toFixed(1)}s`);
}

main().catch(e => { console.error(e); process.exit(1); });
