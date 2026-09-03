#!/usr/bin/env node

import { readFile, writeFile } from "node:fs/promises";

const SOURCE_URL =
  "https://www.sefaria.org/api/v3/texts/Jastrow,_List_of_Abbreviations";
const MAPPINGS_PATH =
  "artifacts/chavrutai/src/shared/data/lexicon-mappings/jastrow.json";
const REJECTED_SINGLE_LETTER_KEYS = new Set([
  "a.",
  "c.",
  "r.",
  "S.",
  "s.",
  "w.",
]);

function stripHtml(value) {
  return value
    .replace(/<[^>]+>/g, "")
    .replaceAll("&amp;", "&")
    .replaceAll("&#39;", "'")
    .trim();
}

export function parseSourceList(payload) {
  const version = payload.versions?.find(
    (candidate) =>
      candidate.language === "en" && Array.isArray(candidate.text),
  );
  if (!version) throw new Error("No English Jastrow abbreviation list found");

  const rows = version.text
    .flat(Infinity)
    .filter((value) => typeof value === "string")
    .map(stripHtml)
    .map((line) => {
      const match = line.match(/^(.+?)\s*=\s*(.+)$/);
      return match
        ? { abbreviation: match[1].trim(), sourceExpansion: match[2].trim() }
        : null;
    })
    .filter(Boolean);

  return { versionTitle: version.versionTitle, rows };
}

export function reconcile(rows, mappings) {
  const exactMatches = [];
  const conflicts = [];
  const missing = [];
  const rejected = [];

  for (const row of rows) {
    if (Object.hasOwn(mappings, row.abbreviation)) {
      const bucket =
        mappings[row.abbreviation] === row.sourceExpansion
          ? exactMatches
          : conflicts;
      bucket.push({
        ...row,
        currentExpansion: mappings[row.abbreviation],
      });
    } else if (REJECTED_SINGLE_LETTER_KEYS.has(row.abbreviation)) {
      rejected.push({
        ...row,
        reason: "unsafe single-letter global mapping",
      });
    } else {
      missing.push(row);
    }
  }

  return { exactMatches, conflicts, missing, rejected };
}

function scanCorpus(entries, mappings) {
  const counts = new Map();
  const examples = new Map();
  const abbreviationPattern =
    /(?:\b(?:[A-Z][\p{L}’'ăḥḳʿëê]*|[a-z]{2,})\.)+(?:\s+(?:[A-Z][\p{L}’'ăḥḳʿëê]*|[a-z]{2,})\.)*/gu;

  for (const entry of entries) {
    for (const sense of entry.content?.senses ?? []) {
      const text = stripHtml(sense.definition);
      for (const match of text.matchAll(abbreviationPattern)) {
        const abbreviation = match[0].trim();
        if (Object.hasOwn(mappings, abbreviation)) continue;
        counts.set(abbreviation, (counts.get(abbreviation) ?? 0) + 1);
        if (!examples.has(abbreviation)) {
          examples.set(abbreviation, {
            headword: entry.headword,
            context: text
              .slice(Math.max(0, match.index - 60), match.index + 100)
              .replace(/\s+/g, " "),
          });
        }
      }
    }
  }

  return [...counts]
    .map(([abbreviation, count]) => ({
      abbreviation,
      count,
      example: examples.get(abbreviation),
    }))
    .sort((a, b) => b.count - a.count || a.abbreviation.localeCompare(b.abbreviation));
}

async function main() {
  const outputArg = process.argv.find((arg) => arg.startsWith("--output="));
  const corpusArg = process.argv.find((arg) => arg.startsWith("--corpus="));
  const outputPath = outputArg?.slice("--output=".length);
  const corpusPath = corpusArg?.slice("--corpus=".length);

  const [sourceResponse, mappingText] = await Promise.all([
    fetch(SOURCE_URL),
    readFile(MAPPINGS_PATH, "utf8"),
  ]);
  if (!sourceResponse.ok) {
    throw new Error(`Sefaria request failed: ${sourceResponse.status}`);
  }

  const sourcePayload = await sourceResponse.json();
  const mappingPayload = JSON.parse(mappingText);
  const parsed = parseSourceList(sourcePayload);
  const reconciliation = reconcile(parsed.rows, mappingPayload.mappings);
  const corpusCandidates = corpusPath
    ? scanCorpus(
        JSON.parse(await readFile(corpusPath, "utf8")),
        mappingPayload.mappings,
      )
    : [];

  const report = {
    generatedAt: new Date().toISOString(),
    source: SOURCE_URL,
    sourceVersion: parsed.versionTitle,
    sourceRows: parsed.rows.length,
    mappingCount: Object.keys(mappingPayload.mappings).filter(
      (key) => !key.startsWith("//"),
    ).length,
    counts: {
      exactMatches: reconciliation.exactMatches.length,
      conflicts: reconciliation.conflicts.length,
      missing: reconciliation.missing.length,
      rejected: reconciliation.rejected.length,
      corpusCandidates: corpusCandidates.length,
    },
    ...reconciliation,
    corpusCandidates,
  };

  const serialized = `${JSON.stringify(report, null, 2)}\n`;
  if (outputPath) await writeFile(outputPath, serialized);
  else process.stdout.write(serialized);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}