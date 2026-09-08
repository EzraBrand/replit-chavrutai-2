import { mkdir, readFile, rename, rm, stat, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

export const ENGLISH_VERSION = 'William Davidson Edition - English';
export const HEBREW_VERSION = 'William Davidson Edition - Vocalized Aramaic';
export const LICENSE = 'CC-BY-NC';
export const EXPECTED_PAGE_COUNT = 5350;
const BASE_URL = 'https://storage.googleapis.com/sefaria-export/json/Talmud/Bavli';
const CACHE_DIR = '/tmp/bekiut-talmud-excerpt-source-v1';
const OUTPUT_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '../../artifacts/api-server/src/data/talmud-excerpts');
const MAX_SEGMENTS = 5;
const TARGET_WORDS = 250;

type Side = 'a' | 'b';
type Tractate = {
  name: string;
  folios: number;
  lastSide: Side;
  startFolio?: number;
  startSide?: Side;
};
type Export = {
  title: string;
  versionTitle: string;
  versionSource?: string;
  license: string;
  text: unknown[];
};
type Section = { ref: string; english: string; hebrew: string };
type Exception = { ref: string; reason: string; kind: 'unpopulated' | 'alignment-warning' };
type SourceEvidence = {
  tractate: string;
  apiUrl: string;
  gcsPrefixUrl?: string;
  finding: string;
  versionTitle?: string;
  exportLicense?: string;
  apiLicense?: string;
  firstSegment?: string;
};

const ENTITIES: Record<string, string> = {
  amp: '&', apos: "'", gt: '>', lt: '<', nbsp: ' ', quot: '"',
  ensp: ' ', emsp: ' ', thinsp: ' ', ndash: '–', mdash: '—',
  lsquo: '‘', rsquo: '’', ldquo: '“', rdquo: '”', hellip: '…',
  laquo: '«', raquo: '»', copy: '©', reg: '®', trade: '™',
  eacute: 'é',
};

export function plainText(input: string): string {
  const withoutTags = input
    .replace(/<(?:br|hr)\s*\/?>/gi, ' ')
    .replace(/<\/(?:p|div|li|h[1-6])\s*>/gi, ' ')
    .replace(/<[^>]*>/g, '');
  const decoded = withoutTags.replace(/&(#(?:x[\da-f]+|\d+)|[a-z][\da-z]+);/gi, (entity, key: string) => {
    if (key[0] === '#') {
      const hex = key[1]?.toLowerCase() === 'x';
      const value = Number.parseInt(key.slice(hex ? 2 : 1), hex ? 16 : 10);
      return Number.isFinite(value) && value <= 0x10ffff ? String.fromCodePoint(value) : entity;
    }
    return ENTITIES[key.toLowerCase()] ?? entity;
  });
  const unresolved = decoded.match(/&[a-z][\da-z]+;/i);
  if (unresolved) throw new Error(`Unsupported HTML entity ${unresolved[0]}`);
  return decoded.replace(/\s+/gu, ' ').trim().normalize('NFC');
}

export function exportIndex(folio: number, side: Side): number {
  return (folio - 1) * 2 + (side === 'b' ? 1 : 0);
}

export function enumeratePages(tractate: Tractate): string[] {
  const pages: string[] = [];
  const startFolio = tractate.startFolio ?? 2;
  const startSide = tractate.startSide ?? 'a';
  for (let folio = startFolio; folio <= tractate.folios; folio++) {
    if (folio !== startFolio || startSide === 'a') pages.push(`${folio}a`);
    if (folio !== tractate.folios || tractate.lastSide === 'b') pages.push(`${folio}b`);
  }
  return pages;
}

export function alignedExcerpt(
  tractate: string,
  page: string,
  englishPage: unknown,
  hebrewPage: unknown,
): { sections: Section[]; reason?: string; mismatch?: string } {
  if (!Array.isArray(englishPage) || !Array.isArray(hebrewPage)) {
    return { sections: [], reason: 'The requested page is absent from one or both explicit editions.' };
  }
  let mismatch = englishPage.length === hebrewPage.length
    ? undefined
    : `Upstream segment-count mismatch (English ${englishPage.length}, Hebrew ${hebrewPage.length}).`;
  const sections: Section[] = [];
  let words = 0;
  for (let index = 0; index < Math.min(MAX_SEGMENTS, englishPage.length, hebrewPage.length); index++) {
    if (typeof englishPage[index] !== 'string' || typeof hebrewPage[index] !== 'string') {
      if (!sections.length) return { sections: [], reason: `Unalignable segment at position ${index + 1}.`, mismatch };
      mismatch ??= `Excerpt stopped before unalignable segment ${index + 1}.`;
      break;
    }
    const english = plainText(englishPage[index]);
    const hebrew = plainText(hebrewPage[index]);
    if (!english || !hebrew) {
      if (!sections.length) return { sections: [], reason: `Empty counterpart at segment ${index + 1}.`, mismatch };
      mismatch ??= `Excerpt stopped before empty counterpart at segment ${index + 1}.`;
      break;
    }
    sections.push({ ref: `${tractate} ${page}:${index + 1}`, english, hebrew });
    words += english.split(/\s+/u).length;
    if (words >= TARGET_WORDS) break;
  }
  if (!sections.length) return { sections: [], reason: 'No complete aligned leading segments.', mismatch };
  return { sections, mismatch };
}

export function reviewedGapReason(tractate: string, error: unknown, hebrew?: Export): string | null {
  if ((tractate === 'Menachot' || tractate === 'Chullin') && hebrew?.license === 'unknown') {
    return 'Reviewed license gap: explicit William Davidson Edition - Vocalized Aramaic export and targeted API both report license unknown.';
  }
  if (tractate === 'Niddah' && String(error).includes('HTTP 404')) {
    return 'Reviewed source gap: the explicit Niddah GCS export is absent; targeted API has no English Davidson counterpart.';
  }
  return null;
}

function sourceUrl(seder: string, title: string, language: 'English' | 'Hebrew', version: string): string {
  return [BASE_URL, `Seder ${seder[0].toUpperCase()}${seder.slice(1)}`, title, language, `${version}.json`]
    .map((part, index) => index === 0 ? part : encodeURIComponent(part))
    .join('/');
}

async function fetchWithRetry(url: string, destination: string): Promise<Export> {
  try {
    return JSON.parse(await readFile(destination, 'utf8')) as Export;
  } catch {
    // Missing or invalid cache entries are downloaded again.
  }
  let lastError: unknown;
  for (let attempt = 1; attempt <= 4; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60_000);
    try {
      const response = await fetch(url, { signal: controller.signal });
      if (!response.ok) throw new Error(`HTTP ${response.status} ${response.statusText}`);
      const body = await response.text();
      const parsed = JSON.parse(body) as Export;
      await mkdir(dirname(destination), { recursive: true });
      const temporary = `${destination}.${process.pid}.tmp`;
      await writeFile(temporary, body);
      await rename(temporary, destination);
      return parsed;
    } catch (error) {
      lastError = error;
      if (attempt < 4) await new Promise((done) => setTimeout(done, 500 * 2 ** (attempt - 1)));
    } finally {
      clearTimeout(timeout);
    }
  }
  throw new Error(`Failed to download ${url}: ${String(lastError)}`);
}

function verifyExport(data: Export, title: string, version: string): void {
  if (data.title !== title) throw new Error(`Expected title ${title}, received ${data.title}`);
  if (data.versionTitle !== version) throw new Error(`Expected edition ${version}, received ${data.versionTitle}`);
  if (data.license !== LICENSE) throw new Error(`Expected ${LICENSE} license for ${title}/${version}, received ${data.license}`);
  if (!Array.isArray(data.text)) throw new Error(`Missing text array for ${title}/${version}`);
}

async function atomicJson(path: string, value: unknown): Promise<void> {
  const temporary = `${path}.${process.pid}.tmp`;
  await writeFile(temporary, `${JSON.stringify(value)}\n`);
  await rename(temporary, path);
}

async function loadTractates(): Promise<Array<{ seder: string; tractate: Tractate }>> {
  // The non-literal URL keeps scripts' rootDir narrow while loading the shared source of truth at runtime.
  const moduleUrl = new URL('../../lib/shared-data/src/' + 'tractates.ts', import.meta.url).href;
  const { SEDER_TRACTATES } = await import(moduleUrl) as {
    SEDER_TRACTATES: Record<string, readonly Tractate[]>;
  };
  return Object.entries(SEDER_TRACTATES).flatMap(([seder, tractates]) =>
    tractates.map((tractate) => ({ seder, tractate })));
}

async function mapConcurrent<T>(items: T[], concurrency: number, work: (item: T) => Promise<void>): Promise<void> {
  let cursor = 0;
  await Promise.all(Array.from({ length: concurrency }, async () => {
    while (cursor < items.length) {
      const item = items[cursor++];
      await work(item);
    }
  }));
}

export async function generate(): Promise<void> {
  const started = Date.now();
  const generatedAt = new Date().toISOString();
  const entries = await loadTractates();
  const expected = entries.reduce((total, { tractate }) => total + enumeratePages(tractate).length, 0);
  if (entries.length !== 37 || expected !== EXPECTED_PAGE_COUNT) {
    throw new Error(`Shared navigation contract changed: ${entries.length} tractates, ${expected} pages`);
  }
  await mkdir(CACHE_DIR, { recursive: true });
  const exceptions: Exception[] = [];
  const sourceEvidence: SourceEvidence[] = [];
  let pageCount = 0;
  const staged = new Map<string, { english: Export; hebrew: Export; englishUrl: string; hebrewUrl: string }>();
  const operationalFailures: string[] = [];

  // Download and validate every source before changing a single artifact.
  await mapConcurrent(entries, 4, async ({ seder, tractate }) => {
    const englishUrl = sourceUrl(seder, tractate.name, 'English', ENGLISH_VERSION);
    const hebrewUrl = sourceUrl(seder, tractate.name, 'Hebrew', HEBREW_VERSION);
    const cacheBase = tractate.name.replace(/\s+/g, '_');
    let english: Export | undefined;
    let hebrew: Export | undefined;
    try {
      [english, hebrew] = await Promise.all([
        fetchWithRetry(englishUrl, join(CACHE_DIR, `${cacheBase}.en.json`)),
        fetchWithRetry(hebrewUrl, join(CACHE_DIR, `${cacheBase}.he.json`)),
      ]);
      verifyExport(english, tractate.name, ENGLISH_VERSION);
      verifyExport(hebrew, tractate.name, HEBREW_VERSION);
    } catch (error) {
      const available = [english, hebrew].filter((value): value is Export =>
        value !== undefined && value.license !== LICENSE);
      for (const source of available) {
        const firstPage = source.text[2];
        sourceEvidence.push({
          tractate: tractate.name,
          apiUrl: `https://www.sefaria.org/api/v3/texts/${tractate.name.replace(/\s+/g, '.')}.2a`,
          finding: 'Explicit export was rejected because its metadata did not meet the required CC-BY-NC provenance check.',
          versionTitle: source.versionTitle,
          exportLicense: source.license,
          apiLicense: source.license,
          firstSegment: Array.isArray(firstPage) && typeof firstPage[0] === 'string' ? firstPage[0] : undefined,
        });
      }
      const reason = reviewedGapReason(tractate.name, error, hebrew);
      if (!reason) {
        operationalFailures.push(`${tractate.name}: ${String(error)}`);
        return;
      }
      for (const page of enumeratePages(tractate)) {
        exceptions.push({ ref: `${tractate.name} ${page}`, reason, kind: 'unpopulated' });
      }
      console.error(`${tractate.name}: ${String(error)}`);
      return;
    }
    staged.set(tractate.name, { english, hebrew, englishUrl, hebrewUrl });
  });
  if (operationalFailures.length) {
    throw new Error(`Operational source failure; existing artifacts were preserved:\n${operationalFailures.join('\n')}`);
  }
  await mkdir(OUTPUT_DIR, { recursive: true });

  await mapConcurrent(entries, 4, async ({ tractate }) => {
    const source = staged.get(tractate.name);
    if (!source) return;
    const { english, hebrew, englishUrl, hebrewUrl } = source;
    const cacheBase = tractate.name.replace(/\s+/g, '_');
    const pages: Record<string, { ref: string; sections: Section[] }> = {};
    for (const page of enumeratePages(tractate)) {
      const match = /^(\d+)([ab])$/.exec(page)!;
      const index = exportIndex(Number(match[1]), match[2] as Side);
      try {
        const excerpt = alignedExcerpt(tractate.name, page, english.text[index], hebrew.text[index]);
        if (!excerpt.sections.length) {
          const reviewedNazirGap = tractate.name === 'Nazir' && page === '33b' && excerpt.reason === 'No complete aligned leading segments.';
          if (!reviewedNazirGap) throw new Error(`Unreviewed missing excerpt ${tractate.name} ${page}: ${excerpt.reason}`);
          exceptions.push({
            ref: `${tractate.name} ${page}`,
            reason: 'Reviewed source gap: both explicit edition arrays are empty and targeted API has no text.',
            kind: 'unpopulated',
          });
          continue;
        }
        pages[page] = { ref: `${tractate.name} ${page}`, sections: excerpt.sections };
        pageCount++;
        if (excerpt.mismatch) exceptions.push({ ref: `${tractate.name} ${page}`, reason: excerpt.mismatch, kind: 'alignment-warning' });
      } catch (error) {
        throw new Error(`Invalid excerpt ${tractate.name} ${page}: ${String(error)}`);
      }
    }
    const output = {
      schemaVersion: 1,
      tractate: tractate.name,
      source: {
        englishVersion: ENGLISH_VERSION,
        hebrewVersion: HEBREW_VERSION,
        license: LICENSE,
        englishLicense: english.license,
        hebrewLicense: hebrew.license,
        provenance: {
          englishVersionSource: english.versionSource,
          hebrewVersionSource: hebrew.versionSource,
        },
        englishUrl,
        hebrewUrl,
        generatedAt,
      },
      pages,
    };
    await atomicJson(join(OUTPUT_DIR, `${cacheBase}.json`), output);
    console.log(`${tractate.name}: ${Object.keys(pages).length}/${enumeratePages(tractate).length} pages`);
  });

  const validNames = new Set(entries.map(({ tractate }) => `${tractate.name.replace(/\s+/g, '_')}.json`));
  for (const name of await (await import('node:fs/promises')).readdir(OUTPUT_DIR)) {
    if (name.endsWith('.json') && name !== 'manifest.json' && !validNames.has(name)) {
      await rm(join(OUTPUT_DIR, name));
    }
  }
  exceptions.sort((a, b) => a.ref.localeCompare(b.ref) || a.reason.localeCompare(b.reason));
  // These results come from the deliberately small provenance checks made while
  // preparing this snapshot, not from a bulk live-API text download.
  sourceEvidence.push(
    {
      tractate: 'Niddah',
      apiUrl: 'https://www.sefaria.org/api/v3/texts/Niddah.2a',
      gcsPrefixUrl: 'https://storage.googleapis.com/storage/v1/b/sefaria-export/o?prefix=json%2FTalmud%2FBavli%2FSeder%20Tohorot%2FNiddah%2F',
      finding: 'The GCS Niddah prefix listed no objects. The targeted live API response supplied only the Hebrew Davidson version, so no English or Hebrew export fallback was used.',
      versionTitle: HEBREW_VERSION,
      apiLicense: LICENSE,
      firstSegment: "מַתְנִי' <strong><big>שַׁמַּאי</big></strong> אוֹמֵר: כׇּל הַנָּשִׁים דַּיָּין שְׁעָתָן. הִלֵּל אוֹמֵר: מִפְּקִידָה לִפְקִידָה, וַאֲפִילּוּ לְיָמִים הַרְבֵּה.",
    },
    {
      tractate: 'Nazir',
      apiUrl: 'https://www.sefaria.org/api/v3/texts/Nazir.33b',
      finding: 'Both explicit export arrays at index 65 are empty and the targeted live API returned 404 (“We have no text for Nazir 33b.”); no artificial excerpt was created.',
    },
  );
  sourceEvidence.sort((a, b) => a.tractate.localeCompare(b.tractate));
  let totalBytes = 0;
  for (const name of validNames) {
    try { totalBytes += (await stat(join(OUTPUT_DIR, name))).size; } catch { /* failed editions have no file */ }
  }
  await atomicJson(join(OUTPUT_DIR, 'manifest.json'), {
    schemaVersion: 1,
    generatedAt,
    tractateCount: entries.length,
    pageCount,
    expectedPageCount: EXPECTED_PAGE_COUNT,
    totalBytes,
    exceptions,
    sourceEvidence,
  });
  console.log(`Generated ${pageCount}/${EXPECTED_PAGE_COUNT} pages, ${totalBytes} bytes in ${((Date.now() - started) / 1000).toFixed(1)}s`);
}

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : '';
if (invokedPath === fileURLToPath(import.meta.url)) {
  generate().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}