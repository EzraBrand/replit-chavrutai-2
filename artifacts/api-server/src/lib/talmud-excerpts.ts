import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import {
  TRACTATE_LISTS,
  SEDER_TRACTATES,
  getTractateSlug,
} from "@workspace/shared-data/tractates";
import { processHebrewTextCore, replaceTerms } from "@workspace/text-processing";

export interface TalmudExcerptSection {
  ref: string;
  english: string;
  hebrew: string;
}

export interface TalmudExcerptPage {
  ref: string;
  sections: TalmudExcerptSection[];
}

export interface TalmudExcerptSource {
  englishVersion: string;
  hebrewVersion: string;
  license: string;
  englishUrl: string;
  hebrewUrl: string;
  generatedAt: string;
  englishLicense?: string;
  hebrewLicense?: string;
  provenance?: {
    englishVersionSource?: string;
    hebrewVersionSource?: string;
  };
}

interface TalmudExcerptFile {
  schemaVersion: 1;
  tractate: string;
  source: TalmudExcerptSource;
  pages: Record<string, TalmudExcerptPage>;
}

export interface LoadedTalmudExcerpt {
  page: TalmudExcerptPage;
  source: TalmudExcerptSource;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function renderTalmudExcerptHtml(excerpt: LoadedTalmudExcerpt): string | null {
  const articles = excerpt.page.sections.slice(0, 5).flatMap((section) => {
    const english = replaceTerms(section.english).replace(/<[^>]*>/g, "").trim();
    const hebrew = processHebrewTextCore(section.hebrew)
      .replace(/<[^>]*>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    if (!english || !hebrew) return [];
    return [
      `<article data-ref="${escapeHtml(section.ref)}">` +
        `<p lang="he" dir="rtl">${escapeHtml(hebrew)}</p>` +
        `<p lang="en" dir="ltr">${escapeHtml(english)}</p>` +
        `</article>`,
    ];
  }).join("");
  if (!articles) return null;
  return `<section aria-labelledby="talmud-excerpt"><h2 id="talmud-excerpt">Text Excerpt</h2>` +
    articles +
    `<p class="source-attribution">Text data via Sefaria: ` +
    `<a href="${escapeHtml(excerpt.source.englishUrl)}">${escapeHtml(excerpt.source.englishVersion)}</a> and ` +
    `<a href="${escapeHtml(excerpt.source.hebrewUrl)}">${escapeHtml(excerpt.source.hebrewVersion)}</a>, ` +
    `<a href="https://creativecommons.org/licenses/by-nc/" rel="license">${escapeHtml(excerpt.source.license)}</a>` +
    `${excerpt.source.provenance?.englishVersionSource && validHttpsUrl(excerpt.source.provenance.englishVersionSource)
      ? `; edition provenance: <a href="${escapeHtml(excerpt.source.provenance.englishVersionSource)}">Koren</a>`
      : ""}. Display terminology has been modernized for readability.</p></section>`;
}

type Log = Pick<Console, "error">;
type ReadTextFile = (filePath: string, encoding: BufferEncoding) => Promise<string>;

const TRACTATES_BY_SLUG = new Map(
  TRACTATE_LISTS["Talmud Bavli"].map((tractate) => [
    getTractateSlug(tractate),
    tractate,
  ]),
);
interface PageRange {
  folios: number;
  lastSide: "a" | "b";
  startFolio?: number;
  startSide?: "a" | "b";
}

const PAGE_RANGES_BY_SLUG = new Map<string, PageRange>(
  Object.values(SEDER_TRACTATES).flat().map((tractate) => [
    getTractateSlug(tractate.name),
    tractate,
  ] as [string, PageRange]),
);
const FOLIO_PATTERN = /^([1-9]\d{0,2})([ab])$/;

function nonEmptyString(value: unknown): value is string {
  return typeof value === "string" &&
    value.trim().length > 0 &&
    !/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F\uFFFD]/u.test(value);
}

function validHttpsUrl(value: unknown): value is string {
  if (!nonEmptyString(value)) return false;
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

function parseExcerptFile(raw: string, expectedTractate: string): TalmudExcerptFile {
  const value: unknown = JSON.parse(raw);
  if (!value || typeof value !== "object") throw new Error("root must be an object");
  const file = value as Partial<TalmudExcerptFile>;
  if (
    file.schemaVersion !== 1 ||
    file.tractate !== expectedTractate ||
    !file.source ||
    typeof file.source !== "object" ||
    !file.pages ||
    typeof file.pages !== "object" ||
    Array.isArray(file.pages)
  ) {
    throw new Error("invalid excerpt file header");
  }
  const source = file.source as Partial<TalmudExcerptSource>;
  if (
    !nonEmptyString(source.englishVersion) ||
    !nonEmptyString(source.hebrewVersion) ||
    !nonEmptyString(source.license) ||
    !validHttpsUrl(source.englishUrl) ||
    !validHttpsUrl(source.hebrewUrl) ||
    !nonEmptyString(source.generatedAt) ||
    !Number.isFinite(Date.parse(source.generatedAt))
  ) {
    throw new Error("invalid excerpt source metadata");
  }
  if (
    (source.englishLicense !== undefined && !nonEmptyString(source.englishLicense)) ||
    (source.hebrewLicense !== undefined && !nonEmptyString(source.hebrewLicense)) ||
    (source.provenance !== undefined && (
      !source.provenance ||
      typeof source.provenance !== "object" ||
      (source.provenance.englishVersionSource !== undefined && !nonEmptyString(source.provenance.englishVersionSource)) ||
      (source.provenance.hebrewVersionSource !== undefined && !nonEmptyString(source.provenance.hebrewVersionSource))
    ))
  ) throw new Error("invalid optional excerpt provenance");
  return file as TalmudExcerptFile;
}

function defaultDataDir(): string {
  const bundled = path.join(import.meta.dirname, "data", "talmud-excerpts");
  // Direct TypeScript imports in route tests run from src/lib; production
  // bundles run from dist, where the first path is used.
  return existsSync(bundled)
    ? bundled
    : path.join(import.meta.dirname, "..", "data", "talmud-excerpts");
}

function validPage(page: unknown, tractate: string, folio: string): page is TalmudExcerptPage {
  if (!page || typeof page !== "object") return false;
  const candidate = page as Partial<TalmudExcerptPage>;
  if (candidate.ref !== `${tractate} ${folio}` || !Array.isArray(candidate.sections) ||
    candidate.sections.length < 1 || candidate.sections.length > 5) return false;
  return candidate.sections.every((section, index) =>
    !!section &&
    typeof section === "object" &&
    (section as TalmudExcerptSection).ref === `${tractate} ${folio}:${index + 1}` &&
    nonEmptyString((section as TalmudExcerptSection).english) &&
    nonEmptyString((section as TalmudExcerptSection).hebrew)
  );
}

/**
 * Loads approved excerpts from local, server-only generated assets. Only exact
 * canonical tractate slugs can become filenames; user input is never joined
 * directly into a filesystem path.
 */
export class TalmudExcerptLoader {
  private readonly cache = new Map<string, Promise<TalmudExcerptFile>>();

  constructor(
    private readonly dataDir = defaultDataDir(),
    private readonly log: Log = console,
    private readonly readTextFile: ReadTextFile = readFile,
  ) {}

  async get(tractateSlug: string, folio: string): Promise<LoadedTalmudExcerpt | null> {
    const tractate = TRACTATES_BY_SLUG.get(tractateSlug);
    const match = FOLIO_PATTERN.exec(folio);
    if (!tractate || !match) {
      this.log.error(`[talmud-excerpts] Rejected invalid tractate/folio: ${tractateSlug}/${folio}`);
      return null;
    }
    const folioNumber = Number(match[1]);
    const side = match[2] as "a" | "b";
    const range = PAGE_RANGES_BY_SLUG.get(tractateSlug);
    const startFolio = range?.startFolio ?? 2;
    const startSide = range?.startSide ?? "a";
    const inRange = !!range &&
      folioNumber >= startFolio &&
      folioNumber <= range.folios &&
      !(folioNumber === startFolio && side === "a" && startSide === "b") &&
      !(folioNumber === range.folios && side === "b" && range.lastSide === "a");
    if (!inRange) {
      this.log.error(`[talmud-excerpts] Rejected out-of-range page: ${tractateSlug}/${folio}`);
      return null;
    }

    let filePromise = this.cache.get(tractateSlug);
    if (!filePromise) {
      const filePath = path.join(this.dataDir, `${tractateSlug}.json`);
      filePromise = this.readTextFile(filePath, "utf8")
        .then((raw) => parseExcerptFile(raw, tractate))
        .catch((error) => {
          this.cache.delete(tractateSlug);
          throw error;
        });
      this.cache.set(tractateSlug, filePromise);
    }

    try {
      const file = await filePromise;
      const page = file.pages[folio];
      if (!validPage(page, tractate, folio)) {
        this.log.error(`[talmud-excerpts] Missing or invalid page: ${tractateSlug}/${folio}`);
        return null;
      }
      return { page, source: file.source };
    } catch (error) {
      this.log.error(
        `[talmud-excerpts] Failed loading ${tractateSlug}/${folio}: ${error instanceof Error ? error.message : String(error)}`,
      );
      return null;
    }
  }
}

export const talmudExcerptLoader = new TalmudExcerptLoader();