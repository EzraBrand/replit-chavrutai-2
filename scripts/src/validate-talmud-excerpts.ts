import { readFile, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import { EXPECTED_PAGE_COUNT, enumeratePages } from './generate-talmud-excerpts.js';

type Tractate = {
  name: string;
  folios: number;
  lastSide: 'a' | 'b';
  startFolio?: number;
  startSide?: 'a' | 'b';
};

const defaultDataDir = resolve(dirname(fileURLToPath(import.meta.url)), '../../artifacts/api-server/src/data/talmud-excerpts');
const dirFlag = process.argv.indexOf('--dir');
const DATA_DIR = dirFlag < 0 ? defaultDataDir : resolve(process.argv[dirFlag + 1] ?? (() => { throw new Error('--dir requires a path'); })());

function validText(value: string): boolean {
  return !value.includes('\uFFFD') && !/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/u.test(value);
}

async function main(): Promise<void> {
  const moduleUrl = new URL('../../lib/shared-data/src/' + 'tractates.ts', import.meta.url).href;
  const { SEDER_TRACTATES } = await import(moduleUrl) as {
    SEDER_TRACTATES: Record<string, readonly Tractate[]>;
  };
  const tractates = Object.values(SEDER_TRACTATES).flat();
  const expectedRefs = tractates.flatMap((tractate) =>
    enumeratePages(tractate).map((page) => `${tractate.name} ${page}`));
  if (expectedRefs.length !== EXPECTED_PAGE_COUNT) throw new Error(`Expected ${EXPECTED_PAGE_COUNT} routes, got ${expectedRefs.length}`);

  const manifest = JSON.parse(await readFile(join(DATA_DIR, 'manifest.json'), 'utf8')) as {
    schemaVersion: number; generatedAt: string; tractateCount: number; pageCount: number; expectedPageCount: number; totalBytes: number;
    exceptions: Array<{ ref: string; reason: string; kind: 'unpopulated' | 'alignment-warning' }>;
  };
  if (manifest.schemaVersion !== 1 || !Number.isFinite(Date.parse(manifest.generatedAt))) throw new Error('Malformed manifest schema or generatedAt');
  const populated = new Set<string>();
  let measuredBytes = 0;
  for (const tractate of tractates) {
    const path = join(DATA_DIR, `${tractate.name.replace(/\s+/g, '_')}.json`);
    let raw: string;
    try {
      raw = await readFile(path, 'utf8');
    } catch (error) {
      const allExplained = enumeratePages(tractate).every((page) =>
        manifest.exceptions.some(({ ref, kind }) => ref === `${tractate.name} ${page}` && kind === 'unpopulated'));
      if (allExplained) continue;
      throw error;
    }
    const data = JSON.parse(raw) as {
      schemaVersion: number;
      tractate: string;
      source: { englishVersion: string; hebrewVersion: string; license: string; englishLicense: string; hebrewLicense: string; englishUrl: string; hebrewUrl: string; generatedAt: string; provenance: { englishVersionSource?: string; hebrewVersionSource?: string } };
      pages: Record<string, { ref: string; sections: Array<{ ref: string; english: string; hebrew: string }> }>;
    };
    if (data.schemaVersion !== 1 || data.tractate !== tractate.name || data.source.license !== 'CC-BY-NC' ||
        data.source.englishVersion !== 'William Davidson Edition - English' ||
        data.source.hebrewVersion !== 'William Davidson Edition - Vocalized Aramaic' ||
        data.source.englishLicense !== 'CC-BY-NC' || data.source.hebrewLicense !== 'CC-BY-NC' ||
        !data.source.englishUrl.startsWith('https://storage.googleapis.com/sefaria-export/') ||
        !data.source.hebrewUrl.startsWith('https://storage.googleapis.com/sefaria-export/') ||
        !data.source.englishUrl.endsWith('/English/William%20Davidson%20Edition%20-%20English.json') ||
        !data.source.hebrewUrl.endsWith('/Hebrew/William%20Davidson%20Edition%20-%20Vocalized%20Aramaic.json') ||
        !Number.isFinite(Date.parse(data.source.generatedAt)) ||
        !data.source.provenance.englishVersionSource || !data.source.provenance.hebrewVersionSource) {
      throw new Error(`Invalid metadata in ${path}`);
    }
    for (const [page, excerpt] of Object.entries(data.pages)) {
      const expectedRef = `${tractate.name} ${page}`;
      if (excerpt.ref !== expectedRef || !expectedRefs.includes(expectedRef)) throw new Error(`Unexpected ref ${excerpt.ref}`);
      if (!excerpt.sections.length || excerpt.sections.length > 5) throw new Error(`Invalid section count at ${expectedRef}`);
      excerpt.sections.forEach((section, index) => {
        if (section.ref !== `${expectedRef}:${index + 1}` || !section.english || !section.hebrew ||
            !validText(section.english) || !validText(section.hebrew)) {
          throw new Error(`Invalid aligned section at ${expectedRef}:${index + 1}`);
        }
        if (/<[^>]*>|&[a-z#][^;]*;/i.test(section.english + section.hebrew)) {
          throw new Error(`HTML remains at ${expectedRef}:${index + 1}`);
        }
      });
      populated.add(expectedRef);
    }
    measuredBytes += (await stat(path)).size;
  }
  const missing = expectedRefs.filter((ref) => !populated.has(ref));
  const expectedGaps = new Map<string, string>();
  for (const tractate of tractates.filter((t) => t.name === 'Menachot' || t.name === 'Chullin')) {
    for (const page of enumeratePages(tractate)) expectedGaps.set(`${tractate.name} ${page}`, 'Reviewed license gap: explicit William Davidson Edition - Vocalized Aramaic export and targeted API both report license unknown.');
  }
  const niddah = tractates.find((t) => t.name === 'Niddah')!;
  for (const page of enumeratePages(niddah)) expectedGaps.set(`Niddah ${page}`, 'Reviewed source gap: the explicit Niddah GCS export is absent; targeted API has no English Davidson counterpart.');
  expectedGaps.set('Nazir 33b', 'Reviewed source gap: both explicit edition arrays are empty and targeted API has no text.');
  if (missing.length !== expectedGaps.size || missing.some((ref) => !expectedGaps.has(ref))) throw new Error('Unapproved missing-page set');
  const unpopulated = manifest.exceptions.filter((entry) => entry.kind === 'unpopulated');
  if (unpopulated.length !== expectedGaps.size || unpopulated.some((entry) => expectedGaps.get(entry.ref) !== entry.reason)) {
    throw new Error('Manifest unpopulated exceptions differ from reviewed allowlist');
  }
  if (manifest.tractateCount !== 37 || manifest.pageCount !== populated.size ||
      manifest.expectedPageCount !== EXPECTED_PAGE_COUNT || manifest.totalBytes !== measuredBytes) {
    throw new Error('Manifest counts or byte measurement do not match generated files');
  }
  console.log(`Validated ${populated.size}/${EXPECTED_PAGE_COUNT} populated pages; ${missing.length} missing pages; ${measuredBytes} bytes`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});