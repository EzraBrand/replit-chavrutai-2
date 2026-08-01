#!/usr/bin/env node
/**
 * Drift check for duplicated shared text-processing sources.
 *
 * The English text-processing pipeline exists in TWO copies:
 *   - artifacts/chavrutai/src/shared/...   (browser)
 *   - artifacts/api-server/src/shared/...  (server pre-processes Talmud English)
 *
 * A rule added to only one copy silently fails in production. This script
 * fails (exit 1) when any of the paired files differ, so it can run as a
 * CI/validation step.
 */
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const PAIRED_FILES = [
  'src/shared/text-processing.ts',
  'src/shared/number-parser.ts',
  'src/shared/term-replacements-schema.ts',
  'src/shared/data/term-replacements.json',
];

const A = 'artifacts/chavrutai';
const B = 'artifacts/api-server';

let failed = false;
for (const rel of PAIRED_FILES) {
  const pathA = resolve(root, A, rel);
  const pathB = resolve(root, B, rel);
  let a, b;
  try {
    a = readFileSync(pathA, 'utf8');
  } catch {
    console.error(`MISSING: ${A}/${rel}`);
    failed = true;
    continue;
  }
  try {
    b = readFileSync(pathB, 'utf8');
  } catch {
    console.error(`MISSING: ${B}/${rel}`);
    failed = true;
    continue;
  }
  if (a !== b) {
    console.error(`DRIFT: ${rel} differs between ${A} and ${B}`);
    // Show a compact line-level diff hint
    const la = a.split('\n');
    const lb = b.split('\n');
    const max = Math.max(la.length, lb.length);
    let shown = 0;
    for (let i = 0; i < max && shown < 10; i++) {
      if (la[i] !== lb[i]) {
        console.error(`  line ${i + 1}:`);
        console.error(`    ${A}: ${la[i] ?? '<missing>'}`.slice(0, 200));
        console.error(`    ${B}: ${lb[i] ?? '<missing>'}`.slice(0, 200));
        shown++;
      }
    }
    failed = true;
  } else {
    console.log(`OK: ${rel}`);
  }
}

if (failed) {
  console.error(
    '\nShared text-processing copies have drifted. Apply the same change to BOTH ' +
      `${A}/src/shared/ and ${B}/src/shared/ (see .agents/skills/number-parsing/SKILL.md).`
  );
  process.exit(1);
}
console.log('All shared text-processing copies are in sync.');
