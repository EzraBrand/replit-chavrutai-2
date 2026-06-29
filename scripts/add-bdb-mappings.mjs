#!/usr/bin/env node
/**
 * Append new BDB abbreviation mappings to
 * artifacts/chavrutai/src/shared/data/lexicon-mappings/bdb.json
 * (the single, frontend-only source of truth). Run from the repo root.
 *
 * Usage:
 *   node scripts/add-bdb-mappings.mjs '<json-object-of-mappings>' [YYYY-MM-DD]
 *
 * Example:
 *   node scripts/add-bdb-mappings.mjs '{"Identif.":"Identification","nisi":"unless"}'
 *
 * Behaviour:
 *   - Locates the `// ── END ──` sentinel line via regex (dash count is not hardcoded).
 *   - If a `// ── REVIEW BATCH (<date>) ──` block already exists, appends to it;
 *     otherwise creates a new dated batch block immediately before END.
 *   - Preserves the file's existing line-ending style line-by-line.
 *   - Skips keys already present in the file and warns about them.
 *   - Validates the result with JSON.parse before writing.
 */
import fs from 'node:fs';
import path from 'node:path';

const FILE = 'artifacts/chavrutai/src/shared/data/lexicon-mappings/bdb.json';

function today() {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
}

function jsonStringifyKey(s) { return JSON.stringify(s); }

function main() {
  const [, , rawJson, dateArg] = process.argv;
  if (!rawJson) {
    console.error('Usage: node scripts/add-bdb-mappings.mjs \'{"abbr":"expansion",...}\' [YYYY-MM-DD]');
    process.exit(2);
  }
  const date = dateArg || today();
  const mappings = JSON.parse(rawJson);
  const entries = Object.entries(mappings);
  if (!entries.length) { console.error('No mappings provided.'); process.exit(2); }

  const buf = fs.readFileSync(FILE);
  const text = buf.toString('utf8');

  // Detect file's predominant EOL and the EOL just before END.
  const endLineRe = /^[ \t]*"\/\/ \u2500\u2500 END [\u2500 ]*": "",?\s*$/m;
  const endMatch = text.match(endLineRe);
  if (!endMatch) { console.error('Could not locate "// ── END ──" sentinel line.'); process.exit(1); }
  const endIdx = endMatch.index;

  // Find EOL that precedes END line (so we can match the source file's per-line style).
  const before = text.slice(0, endIdx);
  const eolBeforeEnd = before.endsWith('\r\n') ? '\r\n' : '\n';

  // Existing keys (warn on duplicates).
  const existing = new Set();
  for (const m of text.matchAll(/^\s*"([^"\\]+)":\s*"/gm)) existing.add(m[1]);

  const filtered = entries.filter(([k]) => {
    if (existing.has(k)) { console.warn(`SKIP (already present): ${k}`); return false; }
    return true;
  });
  if (!filtered.length) { console.error('All keys already present; nothing to add.'); process.exit(0); }

  // Check whether a batch block for `date` already exists.
  const batchRe = new RegExp(`^[ \\t]*"// \\u2500\\u2500 REVIEW BATCH \\(${date}\\)[\\u2500 ]*": "",?\\s*$`, 'm');
  const hasBatch = batchRe.test(text);

  const indent = '    ';
  const lines = [];
  if (!hasBatch) {
    lines.push(`${indent}"// \u2500\u2500 REVIEW BATCH (${date}) \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500": "",`);
  }
  for (const [k, v] of filtered) {
    lines.push(`${indent}${jsonStringifyKey(k)}: ${jsonStringifyKey(v)},`);
  }
  const insertion = lines.join(eolBeforeEnd) + eolBeforeEnd;

  // Insert at the start of the END line (preserving its original EOL).
  const newText = text.slice(0, endIdx) + insertion + text.slice(endIdx);

  // Validate JSON before writing.
  try { JSON.parse(newText); } catch (e) {
    console.error('Resulting file is not valid JSON:', e.message);
    process.exit(1);
  }
  fs.writeFileSync(FILE, newText);
  console.log(`Added ${filtered.length} mapping(s) to ${path.basename(FILE)} under batch ${date}.`);
  for (const [k, v] of filtered) console.log(`  + ${k} → ${v}`);
}

main();
