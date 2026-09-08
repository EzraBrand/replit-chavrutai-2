import assert from 'node:assert/strict';
import test from 'node:test';
import { execFile } from 'node:child_process';
import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';
import { alignedExcerpt, enumeratePages, exportIndex, plainText, reviewedGapReason } from './generate-talmud-excerpts.js';

const execFileAsync = promisify(execFile);

test('export index zero represents 1a and Bavli 2a begins at index two', () => {
  assert.equal(exportIndex(1, 'a'), 0);
  assert.equal(exportIndex(1, 'b'), 1);
  assert.equal(exportIndex(2, 'a'), 2);
  assert.equal(exportIndex(10, 'b'), 19);
});

test('navigation boundaries include Tamid 25b but not 25a', () => {
  const pages = enumeratePages({
    name: 'Tamid', folios: 33, lastSide: 'b', startFolio: 25, startSide: 'b',
  });
  assert.equal(pages[0], '25b');
  assert.equal(pages.at(-1), '33b');
  assert.equal(pages.length, 17);
  assert.ok(!pages.includes('25a'));
});

test('HTML is removed, entities decoded, and Unicode normalized', () => {
  assert.equal(plainText('<b>A&amp;B</b>&nbsp;&#x2014; caf&eacute;'), 'A&B — café');
});

test('aligned excerpts preserve positions and stop after reaching word target', () => {
  const long = Array.from({ length: 130 }, () => 'word').join(' ');
  const result = alignedExcerpt('Berakhot', '10a', [`<i>${long}</i>`, long, 'unused'], ['א', 'ב', 'ג']);
  assert.deepEqual(result.sections.map(({ ref }) => ref), ['Berakhot 10a:1', 'Berakhot 10a:2']);
  assert.equal(result.sections[0].english, long);
});

test('missing counterparts are rejected instead of shifted into alignment', () => {
  const result = alignedExcerpt('Berakhot', '10a', ['one', 'two'], ['א']);
  assert.equal(result.sections.length, 1);
  assert.match(result.mismatch!, /segment-count mismatch/);
  const empty = alignedExcerpt('Berakhot', '10a', ['one', 'two'], ['', 'ב']);
  assert.equal(empty.sections.length, 0);
  assert.match(empty.reason!, /Empty counterpart/);
  const laterEmpty = alignedExcerpt('Berakhot', '10a', ['one', 'two'], ['א', '']);
  assert.equal(laterEmpty.sections.length, 1);
  assert.match(laterEmpty.mismatch!, /stopped before empty counterpart/);
});

test('only reviewed source gaps are allowed; operational failures remain fatal', () => {
  assert.match(reviewedGapReason('Menachot', new Error('license'), { license: 'unknown' } as any)!, /Reviewed license gap/);
  assert.match(reviewedGapReason('Niddah', new Error('HTTP 404 Not Found'))!, /Reviewed source gap/);
  assert.equal(reviewedGapReason('Berakhot', new Error('HTTP 500')), null);
  assert.equal(reviewedGapReason('Niddah', new Error('network timeout')), null);
});

test('validator rejects malformed manifests supplied through --dir', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'talmud-excerpt-invalid-'));
  await writeFile(join(directory, 'manifest.json'), '{"schemaVersion":0}');
  await assert.rejects(
    execFileAsync('pnpm', ['--filter', '@workspace/scripts', 'exec', 'tsx', 'src/validate-talmud-excerpts.ts', '--dir', directory],
      { cwd: process.cwd() }),
    /Malformed manifest schema/,
  );
});