/**
 * scan-lexicon-acronyms.ts
 *
 * Walk the headword index for a Sefaria lexicon (BDB or Jastrow), fetch each
 * entry once (cached on disk), strip the HTML, and tally candidate
 * abbreviations that are NOT yet mapped in client/src/data/<lex>-mappings.json.
 *
 * Output:
 *   scripts/<lex>-unmapped-acronyms.txt   — frequency-sorted plain list
 *   scripts/<lex>-unmapped-acronyms.json  — full data with examples per token
 *
 * Cache:
 *   scripts/.cache/<lex>-corpus/<headword>.json
 *
 * Run:
 *   npx tsx scripts/scan-lexicon-acronyms.ts --lexicon=bdb
 *   npx tsx scripts/scan-lexicon-acronyms.ts --lexicon=jastrow --concurrency=10
 *
 * Flags:
 *   --lexicon       Required. "bdb" or "jastrow".
 *   --concurrency   Default 10.
 *   --limit         Only process the first N headwords (for testing).
 *   --min-freq      Min frequency to include in output (default 2).
 *   --top           Limit text output to top N (default 200).
 */

import * as fs from 'fs';
import * as path from 'path';

type LexiconKey = 'bdb' | 'jastrow';
const LEXICON_NAMES: Record<LexiconKey, string> = {
  bdb: 'BDB Dictionary',
  jastrow: 'Jastrow Dictionary',
};

function parseArgs(argv: string[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const a of argv.slice(2)) {
    const m = a.match(/^--([^=]+)(?:=(.*))?$/);
    if (m) out[m[1]] = m[2] ?? 'true';
  }
  return out;
}

function safeFilename(s: string): string {
  return s.replace(/[\\/\0]/g, '_').slice(0, 200);
}

function stripBibleRefLinks(html: string): string {
  return html.replace(/<a[^>]*data-ref[^>]*>[\s\S]*?<\/a>/gi, ' ');
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/&[a-z]+;|&#\d+;/gi, ' ').replace(/\s+/g, ' ');
}

async function fetchEntry(headword: string, cacheDir: string, retries = 2): Promise<any[] | null> {
  const file = path.join(cacheDir, safeFilename(headword) + '.json');
  if (fs.existsSync(file)) {
    try {
      return JSON.parse(fs.readFileSync(file, 'utf8'));
    } catch {
      // corrupt cache; re-fetch
    }
  }
  const url = `https://www.sefaria.org/api/words/${encodeURIComponent(headword)}`;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      fs.writeFileSync(file, JSON.stringify(data));
      return data;
    } catch (err) {
      if (attempt === retries) {
        console.error(`  [fail] ${headword}: ${err instanceof Error ? err.message : err}`);
        return null;
      }
      await new Promise((r) => setTimeout(r, 400 * (attempt + 1)));
    }
  }
  return null;
}

function extractDefinitionsText(entries: any[], lexiconName: string): string {
  const parts: string[] = [];
  for (const entry of entries) {
    if (!entry || entry.parent_lexicon !== lexiconName) continue;
    const senses = entry?.content?.senses;
    if (!Array.isArray(senses)) continue;
    const walk = (s: any) => {
      if (!s) return;
      if (typeof s.definition === 'string') parts.push(s.definition);
      if (Array.isArray(s.senses)) s.senses.forEach(walk);
    };
    senses.forEach(walk);
  }
  return parts.join('\n');
}

const RE_CAP_DOT = /\b[A-Z][a-zA-Z]{0,5}\./g;
const RE_ALLCAPS = /\b[A-Z]{2,}\b/g;
const RE_LC_DOT = /\b[a-z]{1,5}\./g;
// Multi-dot Latin-style abbreviations: n.pr.f., i.e., l.c., D.H.M., etc.
const RE_MULTI_DOT = /\b[a-zA-Z]+(?:\.[a-zA-Z]+){1,3}\.?(?=\s|$|[^a-zA-Z.])/g;

function tally(text: string, freq: Map<string, number>, examples: Map<string, string>) {
  const seen = new Set<string>();
  const record = (tok: string, idx: number, src: string) => {
    seen.add(tok);
    if (!examples.has(tok)) {
      const start = Math.max(0, idx - 30);
      const end = Math.min(src.length, idx + tok.length + 30);
      examples.set(tok, src.slice(start, end).replace(/\s+/g, ' ').trim());
    }
  };
  // Pass 1: multi-dot. Mask matched ranges so single-segment regexes don't double-count.
  let masked = text;
  RE_MULTI_DOT.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = RE_MULTI_DOT.exec(text)) !== null) {
    record(m[0], m.index, text);
    masked = masked.slice(0, m.index) + ' '.repeat(m[0].length) + masked.slice(m.index + m[0].length);
  }
  // Pass 2: single-segment patterns on masked text
  for (const re of [RE_CAP_DOT, RE_ALLCAPS, RE_LC_DOT]) {
    re.lastIndex = 0;
    while ((m = re.exec(masked)) !== null) record(m[0], m.index, masked);
  }
  for (const tok of seen) freq.set(tok, (freq.get(tok) || 0) + 1);
}

async function main() {
  const args = parseArgs(process.argv);
  const lex = (args.lexicon || '').toLowerCase() as LexiconKey;
  if (lex !== 'bdb' && lex !== 'jastrow') {
    console.error('--lexicon=bdb|jastrow required');
    process.exit(1);
  }
  const concurrency = Math.max(1, parseInt(args.concurrency || '10', 10));
  const limit = args.limit ? parseInt(args.limit, 10) : 0;
  const minFreq = Math.max(1, parseInt(args['min-freq'] || '2', 10));
  const topN = Math.max(10, parseInt(args.top || '200', 10));

  const lexiconName = LEXICON_NAMES[lex];
  const headwordsPath = path.join(process.cwd(), 'shared/data/lexicon-headwords', `${lex}.json`);
  const mappingsPath = path.join(process.cwd(), `client/src/data/${lex}-mappings.json`);
  const cacheDir = path.join(process.cwd(), 'scripts/.cache', `${lex}-corpus`);
  const outTxt = path.join(process.cwd(), 'scripts', `${lex}-unmapped-acronyms.txt`);
  const outJson = path.join(process.cwd(), 'scripts', `${lex}-unmapped-acronyms.json`);

  fs.mkdirSync(cacheDir, { recursive: true });

  const idx = JSON.parse(fs.readFileSync(headwordsPath, 'utf8'));
  const mappings = JSON.parse(fs.readFileSync(mappingsPath, 'utf8'));
  const mappedKeys = new Set<string>(Object.keys(mappings.mappings || {}));

  let headwords: string[] = idx.headwords || [];
  if (limit > 0) headwords = headwords.slice(0, limit);
  console.log(`Scanning ${headwords.length} ${lexiconName} headwords (concurrency=${concurrency})`);

  const freq = new Map<string, number>();
  const examples = new Map<string, string>();

  let processed = 0;
  let cacheHits = 0;
  let netFetches = 0;
  let failedCount = 0;
  const failedHeadwords: string[] = [];
  const t0 = Date.now();

  // Simple worker pool
  let cursor = 0;
  const worker = async () => {
    while (true) {
      const i = cursor++;
      if (i >= headwords.length) return;
      const hw = headwords[i];
      const cacheFile = path.join(cacheDir, safeFilename(hw) + '.json');
      const wasCached = fs.existsSync(cacheFile);
      const entries = await fetchEntry(hw, cacheDir);
      if (wasCached) cacheHits++;
      else netFetches++;
      if (entries) {
        const text = extractDefinitionsText(entries, lexiconName);
        if (text) {
          const cleaned = stripHtml(stripBibleRefLinks(text));
          tally(cleaned, freq, examples);
        }
      } else {
        failedCount++;
        if (failedHeadwords.length < 50) failedHeadwords.push(hw);
      }
      processed++;
      if (processed % 250 === 0 || processed === headwords.length) {
        const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
        console.log(`  ${processed}/${headwords.length}  cache:${cacheHits} net:${netFetches}  ${elapsed}s`);
      }
    }
  };
  await Promise.all(Array.from({ length: concurrency }, worker));

  // Filter against mapped keys + min freq
  const unmapped: { token: string; count: number; example: string }[] = [];
  for (const [tok, count] of freq.entries()) {
    if (count < minFreq) continue;
    if (mappedKeys.has(tok)) continue;
    unmapped.push({ token: tok, count, example: examples.get(tok) || '' });
  }
  unmapped.sort((a, b) => b.count - a.count || a.token.localeCompare(b.token));

  const top = unmapped.slice(0, topN);
  const failurePct = processed > 0 ? (failedCount / processed) * 100 : 0;
  const txtLines = [
    `# ${lexiconName} — Unmapped abbreviation candidates`,
    `# Scanned ${processed} headwords, mapped keys excluded: ${mappedKeys.size}`,
    `# Failed fetches: ${failedCount} (${failurePct.toFixed(2)}%)`,
    `# Total unique unmapped tokens (freq >= ${minFreq}): ${unmapped.length}`,
    `# Showing top ${top.length}`,
    '',
    ...top.map((u) => `${String(u.count).padStart(6)}  ${u.token.padEnd(14)}  ${u.example}`),
  ];
  fs.writeFileSync(outTxt, txtLines.join('\n') + '\n');
  fs.writeFileSync(
    outJson,
    JSON.stringify(
      {
        lexicon: lexiconName,
        scanned_headwords: processed,
        mapped_keys: mappedKeys.size,
        failed_fetches: failedCount,
        failed_pct: Number(failurePct.toFixed(2)),
        failed_headwords_sample: failedHeadwords,
        total_unmapped_unique: unmapped.length,
        min_freq: minFreq,
        candidates: unmapped,
      },
      null,
      2,
    ),
  );

  console.log(`\nDone in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
  console.log(`  Headwords scanned: ${processed} (${cacheHits} cached, ${netFetches} fetched)`);
  console.log(`  Failed fetches: ${failedCount} (${failurePct.toFixed(2)}%)`);
  console.log(`  Unique unmapped tokens (freq >= ${minFreq}): ${unmapped.length}`);
  console.log(`  Top ${top.length} written to ${outTxt}`);
  console.log(`  Full JSON: ${outJson}`);
  if (failurePct > 0.5) {
    console.warn(
      `\n  ⚠  WARNING: ${failurePct.toFixed(2)}% of headwords failed to fetch — frequency rankings may be skewed. ` +
        `Re-run to retry (cache will preserve all successful fetches).`,
    );
    if (failurePct > 5) process.exitCode = 2;
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
