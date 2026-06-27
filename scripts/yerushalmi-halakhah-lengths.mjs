#!/usr/bin/env node
// Measure Hebrew word counts for every halakhah in the Yerushalmi.
// Iterates the (tractate, chapter, halakhah) tuples from the shapes
// JSON, fetches each via the local API, caches per-halakhah results
// to disk so the script is resumable, and prints the top/bottom 10
// once every halakhah has been measured.
//
// Usage:
//   (with the dev server running on localhost:5000)
//   node scripts/yerushalmi-halakhah-lengths.mjs
//
// Outputs:
//   scripts/.cache/yerushalmi-lengths/<tractate>__<C>_<H>.json   per-halakhah
//   scripts/yerushalmi-halakhah-lengths.json                      merged results
//   scripts/yerushalmi-halakhah-lengths.txt                       human report

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');
const SHAPES_PATH = path.join(REPO_ROOT, 'shared/data/yerushalmi-shapes.json');
const CACHE_DIR = path.join(__dirname, '.cache/yerushalmi-lengths');
const MERGED_JSON = path.join(__dirname, 'yerushalmi-halakhah-lengths.json');
const REPORT_TXT = path.join(__dirname, 'yerushalmi-halakhah-lengths.txt');

const BASE_URL = process.env.API_BASE || 'http://localhost:5000';
const CONCURRENCY = parseInt(process.env.CONCURRENCY || '4', 10);
const RETRIES = 3;
const RETRY_DELAY_MS = 1500;

fs.mkdirSync(CACHE_DIR, { recursive: true });

const log = (...args) => {
  const ts = new Date().toISOString().replace('T', ' ').replace('Z', '');
  console.log(`[${ts}]`, ...args);
};

// Strip HTML tags & footnote markers, keep text content.
function stripHtml(s) {
  return s
    .replace(/<sup[^>]*>.*?<\/sup>/gis, ' ')
    .replace(/<i[^>]*class="footnote"[^>]*>.*?<\/i>/gis, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&[a-z]+;/gi, ' ');
}

// Count Hebrew words: tokens containing at least one Hebrew letter.
const HEBREW_RE = /[\u0590-\u05FF]/;
function countHebrewWords(sections) {
  let n = 0;
  for (const sec of sections) {
    if (!sec) continue;
    const text = stripHtml(String(sec));
    for (const tok of text.split(/\s+/)) {
      if (tok && HEBREW_RE.test(tok)) n++;
    }
  }
  return n;
}

function tractateFromKey(key) {
  // "Jerusalem_Talmud_Berakhot" -> "Berakhot"
  // "Jerusalem_Talmud_Avodah_Zarah" -> "Avodah Zarah"
  return key.replace(/^Jerusalem_Talmud_/, '').replace(/_/g, ' ');
}

function tractateSlug(displayName) {
  return displayName.replace(/ /g, '_');
}

function cacheKey(tractate, chapter, halakhah) {
  return `${tractateSlug(tractate)}__${chapter}_${halakhah}.json`;
}

function loadCached(tractate, chapter, halakhah) {
  const p = path.join(CACHE_DIR, cacheKey(tractate, chapter, halakhah));
  if (!fs.existsSync(p)) return null;
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch {
    return null;
  }
}

function saveCached(tractate, chapter, halakhah, entry) {
  const p = path.join(CACHE_DIR, cacheKey(tractate, chapter, halakhah));
  fs.writeFileSync(p, JSON.stringify(entry));
}

async function fetchHalakhah(tractate, chapter, halakhah) {
  const url = `${BASE_URL}/api/yerushalmi/${encodeURIComponent(tractateSlug(tractate))}/${chapter}/${halakhah}`;
  let lastErr;
  for (let attempt = 1; attempt <= RETRIES; attempt++) {
    try {
      const r = await fetch(url);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const data = await r.json();
      return data;
    } catch (err) {
      lastErr = err;
      log(`  ! ${tractate} ${chapter}.${halakhah} attempt ${attempt} failed: ${err.message}`);
      if (attempt < RETRIES) await new Promise(res => setTimeout(res, RETRY_DELAY_MS * attempt));
    }
  }
  throw lastErr;
}

function buildJobList(shapes) {
  const jobs = [];
  for (const key of Object.keys(shapes).sort()) {
    const tractate = tractateFromKey(key);
    const chapters = shapes[key]; // number[][]
    for (let c = 0; c < chapters.length; c++) {
      const halakhot = chapters[c];
      for (let h = 0; h < halakhot.length; h++) {
        jobs.push({ tractate, chapter: c + 1, halakhah: h + 1, segments: halakhot[h] });
      }
    }
  }
  return jobs;
}

async function processJob(job) {
  const cached = loadCached(job.tractate, job.chapter, job.halakhah);
  if (cached) return { ...job, ...cached, fromCache: true };
  const data = await fetchHalakhah(job.tractate, job.chapter, job.halakhah);
  const hebrewWords = countHebrewWords(data.hebrewSections || []);
  const englishWords = countHebrewWords.length; // unused, placeholder
  const entry = {
    hebrewWords,
    segments: (data.hebrewSections || []).length,
    sefariaRef: data.sefariaRef,
  };
  saveCached(job.tractate, job.chapter, job.halakhah, entry);
  return { ...job, ...entry, fromCache: false };
}

async function runWithConcurrency(jobs, n, worker) {
  const results = new Array(jobs.length);
  let idx = 0;
  let done = 0;
  const total = jobs.length;
  async function next() {
    while (true) {
      const i = idx++;
      if (i >= jobs.length) return;
      try {
        results[i] = await worker(jobs[i]);
      } catch (err) {
        results[i] = { ...jobs[i], error: err.message };
        log(`  ✗ ${jobs[i].tractate} ${jobs[i].chapter}.${jobs[i].halakhah}: ${err.message}`);
      }
      done++;
      if (done % 25 === 0 || done === total) {
        log(`progress: ${done}/${total}`);
      }
    }
  }
  await Promise.all(Array.from({ length: n }, next));
  return results;
}

function formatRow(r, rank) {
  const ref = `${r.tractate} ${r.chapter}.${r.halakhah}`.padEnd(28);
  const words = String(r.hebrewWords).padStart(6);
  const segs = String(r.segments).padStart(4);
  return `${String(rank).padStart(3)}. ${ref}  ${words} words  ${segs} segs`;
}

(async () => {
  log(`reading shapes from ${SHAPES_PATH}`);
  const shapes = JSON.parse(fs.readFileSync(SHAPES_PATH, 'utf8'));
  const jobs = buildJobList(shapes);
  log(`total halakhot to measure: ${jobs.length}`);
  log(`cache dir: ${CACHE_DIR}`);
  log(`api base:  ${BASE_URL}  (concurrency=${CONCURRENCY})`);

  const t0 = Date.now();
  const results = await runWithConcurrency(jobs, CONCURRENCY, processJob);
  const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
  log(`done in ${elapsed}s`);

  const ok = results.filter(r => typeof r.hebrewWords === 'number');
  const failed = results.filter(r => r.error);
  log(`measured ${ok.length} | failed ${failed.length}`);
  if (failed.length) {
    log('failures:', failed.slice(0, 20).map(f => `${f.tractate} ${f.chapter}.${f.halakhah}`));
    log('rerun the script to retry — successful results are cached.');
  }

  fs.writeFileSync(MERGED_JSON, JSON.stringify(ok, null, 2));
  log(`wrote merged results to ${MERGED_JSON}`);

  const sortedDesc = [...ok].sort((a, b) => b.hebrewWords - a.hebrewWords);
  const sortedAsc = [...ok].sort((a, b) => a.hebrewWords - b.hebrewWords);

  const lines = [];
  lines.push('Yerushalmi halakhot — Hebrew word counts');
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push(`Halakhot measured: ${ok.length}`);
  if (failed.length) lines.push(`Failed: ${failed.length}`);
  lines.push('');
  lines.push('=== Top 10 LONGEST ===');
  sortedDesc.slice(0, 10).forEach((r, i) => lines.push(formatRow(r, i + 1)));
  lines.push('');
  lines.push('=== Top 10 SHORTEST ===');
  sortedAsc.slice(0, 10).forEach((r, i) => lines.push(formatRow(r, i + 1)));
  lines.push('');

  // Quick stats
  const total = ok.reduce((s, r) => s + r.hebrewWords, 0);
  const mean = total / ok.length;
  const median = sortedAsc[Math.floor(ok.length / 2)]?.hebrewWords;
  lines.push('=== Stats ===');
  lines.push(`total Hebrew words: ${total}`);
  lines.push(`mean per halakhah:  ${mean.toFixed(1)}`);
  lines.push(`median:             ${median}`);
  lines.push(`min / max:          ${sortedAsc[0]?.hebrewWords} / ${sortedDesc[0]?.hebrewWords}`);

  const report = lines.join('\n');
  fs.writeFileSync(REPORT_TXT, report);
  log(`wrote report to ${REPORT_TXT}`);
  console.log('\n' + report);
})();
