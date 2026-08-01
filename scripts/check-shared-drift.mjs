#!/usr/bin/env node
// Verifies that shared modules duplicated between the web app and API server
// have not drifted. Both artifacts keep copies of these files; if one copy is
// edited without the other, half the site silently shows stale data.
//
// Run from repo root: node scripts/check-shared-drift.mjs
// Exit code 0 = all in sync, 1 = drift detected or a file is missing.

import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const WEB_SHARED = "artifacts/chavrutai/src/shared";
const API_SHARED = "artifacts/api-server/src/shared";

// Relative paths (under both shared dirs) that must stay byte-identical.
const PAIRED_FILES = [
  "bible-books.ts",
  "brand.ts",
  "rambam-data.ts",
  "schema.ts",
  "seo-data.ts",
  "talmud-navigation.ts",
  "tractates.ts",
  "yerushalmi-data.ts",
  "yerushalmi-missing.ts",
  "data/bdb-supplemental-entries.json",
  "data/glossary_v4.json",
  "data/scholarship-works.ts",
  "data/yerushalmi-shapes.json",
];

let failures = 0;

for (const rel of PAIRED_FILES) {
  const webPath = resolve(ROOT, WEB_SHARED, rel);
  const apiPath = resolve(ROOT, API_SHARED, rel);

  let webContent, apiContent;
  try {
    webContent = readFileSync(webPath, "utf8");
  } catch {
    console.error(`MISSING  ${WEB_SHARED}/${rel}`);
    failures++;
    continue;
  }
  try {
    apiContent = readFileSync(apiPath, "utf8");
  } catch {
    console.error(`MISSING  ${API_SHARED}/${rel}`);
    failures++;
    continue;
  }

  if (webContent !== apiContent) {
    console.error(`DRIFT    ${rel} differs between ${WEB_SHARED} and ${API_SHARED}`);
    failures++;
  } else {
    console.log(`OK       ${rel}`);
  }
}

if (failures > 0) {
  console.error(
    `\n${failures} shared file(s) out of sync. Sync the copies (or move the module into a shared lib package) before committing.`
  );
  process.exit(1);
}

console.log(`\nAll ${PAIRED_FILES.length} paired shared files are in sync.`);
