import { isValidTractate, isValidPage, getMishnahTractateInfo } from "./tractates";
import { getYerushalmiTractateInfo } from "./yerushalmi-data";
import { isYerushalmiHalakhahMissing } from "./yerushalmi-missing";
import { getRambamHilchotInfo } from "./rambam-data";
import { getBookBySlug } from "./bible-books";
import { isValidScholarshipWork } from "./data/scholarship-works";
import type { SEOResult } from "./seo-data";

// ── Known application routes ─────────────────────────────────────────────────
// Shared by the api-server crawler path and the chavrutai production web server
// so that unknown content URLs return a real HTTP 404 (instead of a soft 404:
// HTTP 200 with a client-rendered "not found" page).
//
// Philosophy: be strict about content URLs whose parameters we can validate
// against local data (tractate slugs, folio bounds, chapter counts), and
// lenient about parameters we cannot validate locally (dictionary letters,
// scholarship section slugs) — a false 200 is much cheaper than a false 404.

const STATIC_PATHS = new Set<string>([
  "/",
  "/about",
  "/talmud",
  "/bible",
  "/mishnah",
  "/yerushalmi",
  "/rambam",
  "/scholarship",
  "/sugya-viewer",
  "/suggested-pages",
  "/biblical-index",
  "/mishnah-map",
  "/blog-posts",
  "/blog-reader",
  "/jastrow",
  "/jastrow/abbreviations",
  "/jastrow/headwords",
  "/bdb",
  "/bdb-prefix-test",
  "/bdb/abbreviations",
  "/bdb/headwords",
  "/talmud/term-replacements",
  "/term-index",
  "/external-links",
  "/search",
  "/sitemap",
  "/contact",
  "/changelog",
  "/privacy",
  // Legacy paths that 301-redirect (api-server) or client-redirect (SPA).
  // They must not 404 so the redirect can happen.
  "/contents",
  "/dictionary",
]);

// Chapter outlines actually available in the client (see the SPA's
// outline-data module). Keep in sync when new outlines are added.
const AVAILABLE_OUTLINES: ReadonlyArray<{ tractate: string; chapter: number }> = [
  { tractate: "sanhedrin", chapter: 10 },
];

function isPositiveInt(value: string): boolean {
  return /^\d+$/.test(value) && parseInt(value, 10) >= 1;
}

/**
 * Returns true when the pathname corresponds to a page the app can actually
 * serve: a known static route, or a content route whose parameters (tractate,
 * folio, book, chapter, …) exist within the validated bounds of local data.
 *
 * Returns false for everything else — callers should respond with HTTP 404
 * and noindex meta.
 */
export function isKnownAppPath(rawPathname: string): boolean {
  let pathname: string;
  try {
    pathname = decodeURIComponent(rawPathname);
  } catch {
    return false;
  }
  // Normalize a single trailing slash ("/talmud/" -> "/talmud"); redirect
  // middleware handles canonicalization separately.
  if (pathname.length > 1 && pathname.endsWith("/")) {
    pathname = pathname.slice(0, -1);
  }

  if (STATIC_PATHS.has(pathname)) return true;

  // Talmud folio: /talmud/:tractate/:folio (also legacy /tractate/... redirect)
  let m = pathname.match(/^\/(?:talmud|tractate)\/([^/]+)\/(\d+)([ab])$/i);
  if (m) {
    return isValidPage(m[1], parseInt(m[2], 10), m[3].toLowerCase() as "a" | "b");
  }
  // Any other /talmud/:tractate/:rest shape is invalid
  if (/^\/(?:talmud|tractate)\/[^/]+\/.+$/.test(pathname)) return false;

  // Talmud tractate: /talmud/:tractate ; legacy /contents/:tractate redirect
  m = pathname.match(/^\/(?:talmud|contents)\/([^/]+)$/i);
  if (m) return isValidTractate(m[1]);

  // Chapter outline: /outline/:tractate/:chapter — only chapters with an
  // actual outline dataset are valid (see AVAILABLE_OUTLINES).
  m = pathname.match(/^\/outline\/([^/]+)\/(\d+)$/i);
  if (m) {
    return AVAILABLE_OUTLINES.some(
      (o) => o.tractate === m![1].toLowerCase() && o.chapter === parseInt(m![2], 10),
    );
  }

  // Bible: /bible/:book and /bible/:book/:chapter
  m = pathname.match(/^\/bible\/([^/]+)(?:\/([^/]+))?$/);
  if (m) {
    const book = getBookBySlug(m[1]);
    if (!book) return false;
    if (m[2] === undefined) return true;
    if (!isPositiveInt(m[2])) return false;
    return parseInt(m[2], 10) <= book.chapters;
  }

  // Mishnah: /mishnah/:tractate and /mishnah/:tractate/:chapter
  m = pathname.match(/^\/mishnah\/([^/]+)(?:\/([^/]+))?$/);
  if (m) {
    const info = getMishnahTractateInfo(m[1]);
    if (!info) return false;
    if (m[2] === undefined) return true;
    if (!isPositiveInt(m[2])) return false;
    return parseInt(m[2], 10) <= info.chapters;
  }

  // Yerushalmi: /yerushalmi/:tractate and /yerushalmi/:tractate/:ch.halakhah
  // (bare /yerushalmi/:tractate/:ch redirects to :ch.1 upstream — keep valid)
  m = pathname.match(/^\/yerushalmi\/([^/]+)(?:\/([^/]+))?$/);
  if (m) {
    const info = getYerushalmiTractateInfo(m[1]);
    if (!info) return false;
    if (m[2] === undefined) return true;
    const ch = m[2].match(/^(\d+)(?:\.(\d+))?$/);
    if (!ch) return false;
    const chapter = parseInt(ch[1], 10);
    if (chapter < 1 || chapter > info.chapters) return false;
    if (ch[2] === undefined) {
      // Bare legacy chapter URL: upstream middleware 301s it (to the tractate
      // page when the whole chapter is missing, else to :chapter.1), so it
      // must stay "known" for the redirect to happen.
      return true;
    }
    const halakhah = parseInt(ch[2], 10);
    if (halakhah < 1) return false;
    // Halakhot recorded as having no Yerushalmi text are not content pages.
    return !isYerushalmiHalakhahMissing(info.name, chapter, halakhah);
  }

  // Rambam: /rambam/:hilchot and /rambam/:hilchot/:chapter
  m = pathname.match(/^\/rambam\/([^/]+)(?:\/([^/]+))?$/);
  if (m) {
    const info = getRambamHilchotInfo(m[1]);
    if (!info) return false;
    if (m[2] === undefined) return true;
    if (!isPositiveInt(m[2])) return false;
    return parseInt(m[2], 10) <= info.chapters;
  }

  // Scholarship: /scholarship/:workSlug[/:sectionSlug] — section slugs are
  // sourced remotely, so only the work slug is validated locally.
  m = pathname.match(/^\/scholarship\/([^/]+)(?:\/[^/]+)?$/);
  if (m) return isValidScholarshipWork(m[1]);

  // Dictionary headword browsers: letter params are not validated locally.
  if (/^\/(?:jastrow|bdb)\/headwords\/[^/]+$/.test(pathname)) return true;

  // Biblical index book pages: names are display-format; validated client-side.
  if (/^\/biblical-index\/book\/[^/]+$/.test(pathname)) return true;

  return false;
}

/**
 * SEO meta for HTTP 404 responses. Mirrors the client-side NotFound page and
 * carries noindex so crawlers drop the URL.
 */
export function getNotFoundSEO(pathname: string, baseUrl: string): SEOResult {
  return {
    title: "Page Not Found - Bekiut",
    description:
      "The page you're looking for doesn't exist or has been moved. Return to Bekiut to continue studying Talmud and Jewish texts.",
    ogTitle: "Page Not Found - Bekiut",
    ogDescription:
      "The page you're looking for doesn't exist or has been moved.",
    canonical: `${baseUrl}${pathname}`,
    robots: "noindex, nofollow",
  };
}
