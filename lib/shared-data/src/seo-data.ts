import { normalizeDisplayTractateName, getMishnahTractateInfo } from "./tractates";
import { getYerushalmiTractateInfo } from "./yerushalmi-data";
import { isYerushalmiHalakhahMissing } from "./yerushalmi-missing";
import { getRambamHilchotInfo } from "./rambam-data";
import { getBookBySlug } from "./bible-books";

export interface SEOEntry {
  title: string;
  description: string;
  ogTitle: string;
  ogDescription: string;
  robots: string;
}

export type SEOResult = SEOEntry & { canonical: string };

// ── Static page map ───────────────────────────────────────────────────────────
// Keys are exact pathnames. baseUrl is never stored here — passed at call time.
// All strings are plain text (no HTML entities).

const STATIC_MAP: Record<string, SEOEntry> = {
  "/": {
    title: "Study Talmud Online - Free Digital Platform | Bekiut",
    description:
      "Bekiut \u2014 study the Babylonian Talmud online, free. All 37 tractates with Hebrew-English text, chapter navigation, and modern study tools.",
    ogTitle: "Bekiut - Study Talmud Online Free",
    ogDescription:
      "Bekiut \u2014 study the Babylonian Talmud online, free. All 37 tractates with Hebrew-English text, chapter navigation, and modern study tools.",
    robots: "index, follow",
  },
  "/talmud": {
    title: "Talmud Bavli \u2014 All 37 Tractates | Bekiut",
    description:
      "Study the Babylonian Talmud online, free. Browse all 37 tractates organized by Seder with Hebrew-English text, chapter navigation, and modern study tools.",
    ogTitle: "Talmud Bavli \u2014 All 37 Tractates",
    ogDescription:
      "Browse all 37 tractates of the Babylonian Talmud with Hebrew-English text, chapter navigation, and modern study tools on Bekiut.",
    robots: "index, follow",
  },
  "/bible": {
    title: "Bible (Tanach) - Hebrew & English | Bekiut",
    description:
      "Read the complete Hebrew Bible (Tanach) with Koren Jerusalem Bible English translation. Access all 24 books of the Torah, Nevi'im, and Ketuvim with parallel Hebrew-English text.",
    ogTitle: "Bible (Tanach) - Hebrew & English",
    ogDescription:
      "Read the complete Hebrew Bible with Koren Jerusalem Bible translation.",
    robots: "index, follow",
  },
  "/mishnah": {
    title: "Mishnah - Hebrew & English | Bekiut",
    description:
      "Study the Mishnah online with bilingual Hebrew-English text. Browse 26 tractates not covered by the Babylonian Talmud, organized by Seder.",
    ogTitle: "Mishnah - Hebrew & English | Bekiut",
    ogDescription:
      "Study the Mishnah online with bilingual Hebrew-English text on Bekiut.",
    robots: "index, follow",
  },
  "/yerushalmi": {
    title: "Jerusalem Talmud (Yerushalmi) - Hebrew & English | Bekiut",
    description:
      "Study the Jerusalem Talmud (Talmud Yerushalmi) online with bilingual Hebrew-English text. 39 tractates with the Guggenheimer English translation, organized by Seder.",
    ogTitle:
      "Jerusalem Talmud (Yerushalmi) - Hebrew & English | Bekiut",
    ogDescription:
      "Study the Jerusalem Talmud online with bilingual Hebrew-English text (Guggenheimer translation) on Bekiut.",
    robots: "index, follow",
  },
  "/scholarship": {
    title: "Modern Scholarship on Jewish Texts | Bekiut",
    description:
      "Academic introductions and critical studies of classical Jewish texts. Read Epstein's Introductions to Tanaitic and Amoraic Literature in the original Hebrew.",
    ogTitle: "Modern Scholarship on Jewish Texts | Bekiut",
    ogDescription:
      "Read modern academic scholarship on classical Jewish texts, including Epstein's landmark introductions to Tanaitic and Amoraic literature.",
    robots: "index, follow",
  },
  "/rambam": {
    title: "Mishneh Torah (Rambam) - Complete Text | Bekiut",
    description:
      "Study the Mishneh Torah (Rambam) online with bilingual Hebrew-English text. All 83 Hilchot across 14 books, with the Touger English translation via Sefaria.",
    ogTitle: "Mishneh Torah (Rambam) - Complete Text | Bekiut",
    ogDescription:
      "Study the Mishneh Torah (Rambam) with bilingual Hebrew-English text on Bekiut.",
    robots: "index, follow",
  },
  "/sugya-viewer": {
    title: "Sugya Viewer - Custom Talmud Range | Bekiut",
    description:
      "Read any continuous passage (sugya) across the Babylonian Talmud by selecting a custom range of folios. Ideal for in-depth study of extended discussions.",
    ogTitle: "Sugya Viewer - Custom Talmud Range | Bekiut",
    ogDescription:
      "Read any continuous Talmud passage by selecting a custom range of folios on Bekiut.",
    robots: "index, follow",
  },
  "/suggested-pages": {
    title:
      "Famous Talmud Pages - Essential Teachings & Stories | Bekiut",
    description:
      "Start with the most famous Talmud pages including Hillel's wisdom, Hannah's prayer, and other essential teachings. Perfect introduction for new learners.",
    ogTitle: "Famous Talmud Pages - Essential Teachings & Stories",
    ogDescription:
      "Start with the most famous Talmud pages including Hillel's wisdom, Hannah's prayer, and other essential teachings. Perfect introduction for new learners.",
    robots: "index, follow",
  },
  "/biblical-index": {
    title: "Biblical Citations in the Talmud - Complete Index | Bekiut",
    description:
      "Comprehensive digital index mapping biblical verses to their citations throughout the Babylonian Talmud. Search Torah, Prophets, and Writings references with direct links to Talmudic passages.",
    ogTitle: "Biblical Citations in the Talmud - Complete Index",
    ogDescription:
      "Comprehensive digital index mapping biblical verses to their citations throughout the Babylonian Talmud.",
    robots: "index, follow",
  },
  "/mishnah-map": {
    title: "Mishnah-Talmud Mapping | Bekiut",
    description:
      "Explore the relationship between Mishnah sections and their corresponding Talmudic discussions. Navigate from any Mishnah passage directly to the Gemara that analyzes it.",
    ogTitle: "Mishnah-Talmud Mapping | Bekiut",
    ogDescription:
      "Navigate from any Mishnah passage directly to the Gemara that analyzes it on Bekiut.",
    robots: "index, follow",
  },
  "/blog-posts": {
    title: "Talmud & Tech Blog Posts by Talmud Location | Bekiut",
    description:
      'Blog posts analyzing Talmudic passages, organized by tractate and page location. Click on titles to go to the full articles at the Talmud & Tech Blog, or use location links to jump to the corresponding text in Bekiut.',
    ogTitle: "Talmud & Tech Blog Posts by Talmud Location",
    ogDescription:
      "Blog posts analyzing Talmudic passages, organized by tractate and page location.",
    robots: "index, follow",
  },
  "/jastrow": {
    title:
      "Modernized Jastrow Talmud Dictionary of Hebrew & Aramaic | Bekiut",
    description:
      "Search the comprehensive Jastrow Dictionary of Talmudic Hebrew and Aramaic. Modernized presentation with expanded abbreviations, enhanced readability, and direct term lookup.",
    ogTitle: "Modernized Jastrow Talmud Dictionary of Hebrew & Aramaic",
    ogDescription:
      "Search the comprehensive Jastrow Dictionary of Talmudic Hebrew and Aramaic with modernized presentation and enhanced readability.",
    robots: "index, follow",
  },
  "/bdb": {
    title: "BDB (Brown-Driver-Briggs) Hebrew Bible Dictionary | Bekiut",
    description:
      "Search the Brown-Driver-Briggs (BDB) Hebrew Bible Dictionary. Modernized presentation with expanded abbreviations and direct links to biblical citations on Bekiut.",
    ogTitle: "BDB (Brown-Driver-Briggs) Hebrew Bible Dictionary",
    ogDescription:
      "Search the classic Brown-Driver-Briggs Hebrew Bible Dictionary with modernized presentation and direct biblical-citation links.",
    robots: "index, follow",
  },
  "/jastrow/abbreviations": {
    title: "Jastrow Abbreviations Reference | Bekiut",
    description:
      "Complete list of Jastrow Dictionary abbreviations expanded inline by the Bekiut Jastrow reader: rabbinic source abbreviations, grammatical shorthand, Latin logic phrases, and scholar surnames.",
    ogTitle: "Jastrow Abbreviations Reference",
    ogDescription:
      "Searchable table of every abbreviation expanded inline by the Bekiut Jastrow reader.",
    robots: "index, follow",
  },
  "/talmud/term-replacements": {
    title: "Talmud Term Replacements Reference | Bekiut",
    description:
      "Complete list of inline terminology updates Bekiut applies to the English translation of the Talmud — archaic terms, divine epithets, personal names, Hebrew calendar dates, and more.",
    ogTitle: "Talmud Term Replacements Reference",
    ogDescription:
      "Searchable, categorized table of every terminology update applied to the Talmud's English translation in Bekiut.",
    robots: "index, follow",
  },
  "/bdb/abbreviations": {
    title: "BDB Abbreviations Reference | Bekiut",
    description:
      "Complete list of Brown-Driver-Briggs (BDB) abbreviations expanded inline by the Bekiut BDB reader: scholar surnames, grammatical shorthand, Latin logic phrases, cognate-language tags, biblical book references, and BDB-specific symbols.",
    ogTitle: "BDB Abbreviations Reference",
    ogDescription:
      "Searchable table of every abbreviation expanded inline by the Bekiut BDB reader.",
    robots: "index, follow",
  },
  "/term-index": {
    title: "Talmud Term Index - Names, Places & Key Terms | Bekiut",
    description:
      "Glossary of personal names, place names, and key terms in the Babylonian Talmud. Includes corpus counts, Wikipedia links, Hebrew terms, and biographical data.",
    ogTitle: "Talmud Term Index - Names, Places & Key Terms | Bekiut",
    ogDescription:
      "Glossary of personal names, place names, and key terms in the Babylonian Talmud with corpus counts, Wikipedia links, and biographical data.",
    robots: "index, follow",
  },
  "/search": {
    title: "Search the Talmud & Bible \u2013 Hebrew & English | Bekiut",
    description:
      "Search through the Babylonian Talmud and Hebrew Bible in Hebrew and English. Find any passage, word, or topic across thousands of pages.",
    ogTitle: "Search Talmud & Bible",
    ogDescription:
      "Search through the Babylonian Talmud and Hebrew Bible in Hebrew and English on Bekiut.",
    robots: "index, follow",
  },
  "/about": {
    title:
      "About Bekiut - Free Digital Talmud Learning Platform | Bekiut",
    description:
      "Discover how Bekiut makes Jewish texts accessible with modern technology. Learn about our free bilingual Talmud study platform designed for learners at all levels.",
    ogTitle: "About Bekiut - Free Digital Talmud Learning Platform",
    ogDescription:
      "Discover how Bekiut makes Jewish texts accessible with modern technology. Learn about our free bilingual Talmud study platform designed for learners at all levels.",
    robots: "index, follow",
  },
  "/sitemap": {
    title: "Site Map - Talmud Navigation Guide | Bekiut",
    description:
      "Complete navigation guide to all 37 Talmud tractates organized by traditional Seder structure. Find any page across 5,400+ folios in the Babylonian Talmud.",
    ogTitle: "Site Map - Talmud Navigation Guide",
    ogDescription:
      "Complete navigation guide to all 37 Talmud tractates organized by traditional Seder structure.",
    robots: "index, follow",
  },
  "/contact": {
    title: "Contact | Bekiut",
    description:
      "Contact Bekiut with feedback, suggestions, and corrections. We appreciate all input to improve our digital Talmud study platform.",
    ogTitle: "Contact Bekiut",
    ogDescription:
      "Contact Bekiut with feedback, suggestions, and corrections.",
    robots: "index, follow",
  },
  "/privacy": {
    title:
      "Privacy Policy - Bekiut Talmud Study Platform | Bekiut",
    description:
      "Privacy policy for Bekiut - learn how we handle your data when using our free Talmud study platform.",
    ogTitle: "Privacy Policy - Bekiut Talmud Study Platform",
    ogDescription:
      "Privacy policy for Bekiut - learn how we handle your data when using our free Talmud study platform.",
    robots: "index, follow",
  },
  "/changelog": {
    title: "Changelog | Bekiut",
    description:
      "Recent updates and improvements to Bekiut. Track new features, design enhancements, and user experience improvements for Talmud study.",
    ogTitle: "Changelog - Bekiut Updates",
    ogDescription: "Recent updates and improvements to Bekiut.",
    robots: "index, follow",
  },
};

// ── Static lookup ─────────────────────────────────────────────────────────────

export function getStaticSEO(
  pathname: string,
  baseUrl: string,
): SEOResult | null {
  const entry = STATIC_MAP[pathname];
  if (!entry) return null;
  const canonical = pathname === "/" ? `${baseUrl}/` : `${baseUrl}${pathname}`;
  return { ...entry, canonical };
}

// ── Dynamic factory functions ─────────────────────────────────────────────────

export function getTalmudTractateSEO(
  tractate: string,
  baseUrl: string,
): SEOResult {
  const tractateTitle = normalizeDisplayTractateName(tractate);
  return {
    title: `${tractateTitle} Talmud - Complete Chapter Guide | Bekiut`,
    description: `Study ${tractateTitle} tractate chapter by chapter with Hebrew-English text, detailed folio navigation, and traditional commentary access. Free online Talmud learning.`,
    ogTitle: `${tractateTitle} Talmud - Complete Study Guide`,
    ogDescription: `Study ${tractateTitle} tractate chapter by chapter with Hebrew-English text, detailed folio navigation, and traditional commentary access.`,
    canonical: `${baseUrl}/talmud/${tractate}`,
    robots: "index, follow",
  };
}

export function getTalmudFolioSEO(
  tractate: string,
  folio: string,
  baseUrl: string,
): SEOResult {
  const tractateTitle = normalizeDisplayTractateName(tractate);
  const folioUpper = folio.toUpperCase();
  return {
    title: `${tractateTitle} ${folioUpper} \u2013 Hebrew & English Talmud | Bekiut`,
    description: `Study ${tractateTitle} folio ${folioUpper} with parallel Hebrew-English text, traditional commentary, and modern study tools. Free access to Babylonian Talmud online.`,
    ogTitle: `${tractateTitle} ${folioUpper} \u2013 Talmud Study Page`,
    ogDescription: `Study ${tractateTitle} folio ${folioUpper} with parallel Hebrew-English text, traditional commentary, and modern study tools.`,
    canonical: `${baseUrl}/talmud/${tractate}/${folio}`,
    robots: "index, follow",
  };
}

export function getBibleBookSEO(
  bookSlug: string,
  baseUrl: string,
): SEOResult {
  const book = getBookBySlug(bookSlug);
  const bookTitle = book ? book.name : bookSlug.replace(/_/g, " ");
  return {
    title: `${bookTitle} - Hebrew & English Bible | Bekiut`,
    description: `Read all chapters of ${bookTitle} with parallel Hebrew-English text and the Koren Jerusalem Bible translation. Free online Bible study on Bekiut.`,
    ogTitle: `${bookTitle} - Hebrew & English Bible`,
    ogDescription: `Read ${bookTitle} with parallel Hebrew-English text and the Koren Jerusalem Bible translation on Bekiut.`,
    canonical: `${baseUrl}/bible/${bookSlug}`,
    robots: "index, follow",
  };
}

export function getBibleChapterSEO(
  bookSlug: string,
  chapter: string,
  baseUrl: string,
): SEOResult {
  const book = getBookBySlug(bookSlug);
  const bookTitle = book ? book.name : bookSlug.replace(/_/g, " ");
  return {
    title: `${bookTitle} Chapter ${chapter} - Hebrew & English Bible | Bekiut`,
    description: `Read ${bookTitle} Chapter ${chapter} with parallel Hebrew-English text and the Koren Jerusalem Bible translation. Free online Bible study on Bekiut.`,
    ogTitle: `${bookTitle} ${chapter} - Hebrew & English Bible`,
    ogDescription: `Read ${bookTitle} Chapter ${chapter} with parallel Hebrew-English text and the Koren Jerusalem Bible translation on Bekiut.`,
    canonical: `${baseUrl}/bible/${bookSlug}/${chapter}`,
    robots: "index, follow",
  };
}

export function getMishnahTractateSEO(
  tractateSlug: string,
  baseUrl: string,
): SEOResult {
  const info = getMishnahTractateInfo(tractateSlug);
  const tractateName = info ? info.name : tractateSlug.replace(/_/g, " ");
  return {
    title: `Mishnah ${tractateName} - Hebrew & English | Bekiut`,
    description: `Study Mishnah ${tractateName} chapter by chapter with bilingual Hebrew-English text. Free online on Bekiut.`,
    ogTitle: `Mishnah ${tractateName} - Hebrew & English`,
    ogDescription: `Study Mishnah ${tractateName} with Hebrew-English text on Bekiut.`,
    canonical: `${baseUrl}/mishnah/${tractateSlug}`,
    robots: "index, follow",
  };
}

export function getMishnahChapterSEO(
  tractateSlug: string,
  chapter: string,
  baseUrl: string,
): SEOResult {
  const info = getMishnahTractateInfo(tractateSlug);
  const tractateName = info ? info.name : tractateSlug.replace(/_/g, " ");
  return {
    title: `Mishnah ${tractateName} Chapter ${chapter} - Hebrew & English | Bekiut`,
    description: `Study Mishnah ${tractateName} Chapter ${chapter} with parallel Hebrew-English text. Free online Mishnah study on Bekiut.`,
    ogTitle: `Mishnah ${tractateName} ${chapter} - Hebrew & English`,
    ogDescription: `Read Mishnah ${tractateName} Chapter ${chapter} with parallel Hebrew-English text on Bekiut.`,
    canonical: `${baseUrl}/mishnah/${tractateSlug}/${chapter}`,
    robots: "index, follow",
  };
}

export function getYerushalmiTractateSEO(
  tractateSlug: string,
  baseUrl: string,
): SEOResult {
  const info = getYerushalmiTractateInfo(tractateSlug);
  const tractateName = info ? info.name : tractateSlug.replace(/_/g, " ");
  return {
    title: `Jerusalem Talmud ${tractateName} - Hebrew & English | Bekiut`,
    description: `Study Jerusalem Talmud ${tractateName} chapter by chapter with bilingual Hebrew-English text (Guggenheimer translation). Free online on Bekiut.`,
    ogTitle: `Jerusalem Talmud ${tractateName} - Hebrew & English`,
    ogDescription: `Study Jerusalem Talmud ${tractateName} with Hebrew-English text on Bekiut.`,
    canonical: `${baseUrl}/yerushalmi/${tractateSlug}`,
    robots: "index, follow",
  };
}

export function getYerushalmiHalachahSEO(
  tractateSlug: string,
  chapter: string,
  halakhah: string,
  baseUrl: string,
  isMissing = false,
): SEOResult {
  const info = getYerushalmiTractateInfo(tractateSlug);
  const tractateName = info ? info.name : tractateSlug.replace(/_/g, " ");
  return {
    title: `Jerusalem Talmud ${tractateName} ${chapter}:${halakhah} - Hebrew & English | Bekiut`,
    description: `Study Jerusalem Talmud ${tractateName} Chapter ${chapter} Halakhah ${halakhah} with parallel Hebrew-English text (Guggenheimer translation). Free online on Bekiut.`,
    ogTitle: `Jerusalem Talmud ${tractateName} ${chapter}:${halakhah} - Hebrew & English`,
    ogDescription: `Read Jerusalem Talmud ${tractateName} Chapter ${chapter} Halakhah ${halakhah} with Hebrew-English text (Guggenheimer) on Bekiut.`,
    canonical: `${baseUrl}/yerushalmi/${tractateSlug}/${chapter}.${halakhah}`,
    robots: isMissing ? "noindex, follow" : "index, follow",
  };
}

export function getRambamHilchotSEO(
  hilchotSlug: string,
  baseUrl: string,
): SEOResult {
  const info = getRambamHilchotInfo(hilchotSlug);
  const hilchotName = info ? info.displayName : hilchotSlug.replace(/_/g, " ");
  return {
    title: `${hilchotName} - Mishneh Torah | Bekiut`,
    description: `Study Hilchot ${hilchotName} chapter by chapter with bilingual Hebrew-English text (Touger translation). Free online on Bekiut.`,
    ogTitle: `${hilchotName} - Mishneh Torah`,
    ogDescription: `Study Hilchot ${hilchotName} with Hebrew-English text (Touger) on Bekiut.`,
    canonical: `${baseUrl}/rambam/${hilchotSlug}`,
    robots: "index, follow",
  };
}

export function getRambamChapterSEO(
  hilchotSlug: string,
  chapter: string,
  baseUrl: string,
): SEOResult {
  const info = getRambamHilchotInfo(hilchotSlug);
  const hilchotName = info ? info.displayName : hilchotSlug.replace(/_/g, " ");
  return {
    title: `${hilchotName} Chapter ${chapter} - Mishneh Torah | Bekiut`,
    description: `Study Hilchot ${hilchotName} Chapter ${chapter} with parallel Hebrew-English text (Touger translation). Free online on Bekiut.`,
    ogTitle: `${hilchotName} Chapter ${chapter} - Mishneh Torah`,
    ogDescription: `Read Hilchot ${hilchotName} Chapter ${chapter} with Hebrew-English text on Bekiut.`,
    canonical: `${baseUrl}/rambam/${hilchotSlug}/${chapter}`,
    robots: "index, follow",
  };
}

export function getJastrowSEO(
  letter: string,
  query: string,
  baseUrl: string,
): SEOResult {
  if (letter) {
    return {
      title: `Jastrow Dictionary - Letter ${letter} | Bekiut`,
      description: `Browse Jastrow Dictionary entries starting with ${letter}. Comprehensive Talmudic Hebrew and Aramaic dictionary with modernized presentation.`,
      ogTitle: `Jastrow Dictionary - Letter ${letter}`,
      ogDescription: `Browse Jastrow Dictionary entries starting with ${letter}. Talmudic Hebrew and Aramaic with modernized presentation.`,
      canonical: `${baseUrl}/jastrow?letter=${encodeURIComponent(letter)}`,
      robots: "index, follow",
    };
  }
  if (query) {
    return {
      title: `"${query}" - Jastrow Dictionary | Bekiut`,
      description: `Jastrow Dictionary results for "${query}". Comprehensive Talmudic Hebrew and Aramaic dictionary with modernized presentation.`,
      ogTitle: `"${query}" - Jastrow Dictionary`,
      ogDescription: `Jastrow Dictionary results for "${query}". Talmudic Hebrew and Aramaic with modernized presentation.`,
      canonical: `${baseUrl}/jastrow`,
      robots: "index, follow",
    };
  }
  return { ...STATIC_MAP["/jastrow"], canonical: `${baseUrl}/jastrow` };
}

export function getBDBSEO(
  letter: string,
  query: string,
  baseUrl: string,
): SEOResult {
  if (letter) {
    return {
      title: `BDB Hebrew Bible Dictionary - Letter ${letter} | Bekiut`,
      description: `Browse Brown-Driver-Briggs (BDB) Hebrew Bible Dictionary entries starting with ${letter}. Classic biblical Hebrew lexicon with modernized presentation.`,
      ogTitle: `BDB Hebrew Bible Dictionary - Letter ${letter}`,
      ogDescription: `Browse Brown-Driver-Briggs (BDB) Hebrew Bible Dictionary entries starting with ${letter}.`,
      canonical: `${baseUrl}/bdb?letter=${encodeURIComponent(letter)}`,
      robots: "index, follow",
    };
  }
  if (query) {
    return {
      title: `"${query}" - BDB Hebrew Bible Dictionary | Bekiut`,
      description: `BDB Hebrew Bible Dictionary results for "${query}". Brown-Driver-Briggs biblical Hebrew lexicon with modernized presentation.`,
      ogTitle: `"${query}" - BDB Hebrew Bible Dictionary`,
      ogDescription: `BDB Hebrew Bible Dictionary results for "${query}".`,
      canonical: `${baseUrl}/bdb`,
      robots: "index, follow",
    };
  }
  return { ...STATIC_MAP["/bdb"], canonical: `${baseUrl}/bdb` };
}

const LEXICON_SEO_META: Record<
  "jastrow" | "bdb",
  { shortName: string; longName: string; blurb: string }
> = {
  jastrow: {
    shortName: "Jastrow Dictionary",
    longName: "Jastrow Dictionary of Talmudic Hebrew & Aramaic",
    blurb:
      "Talmudic Hebrew and Aramaic dictionary with modernized presentation and expanded abbreviations",
  },
  bdb: {
    shortName: "BDB Hebrew Bible Dictionary",
    longName: "Brown-Driver-Briggs (BDB) Hebrew Bible Dictionary",
    blurb:
      "classic biblical Hebrew lexicon with modernized presentation and expanded abbreviations",
  },
};

export function getHeadwordsSEO(
  lexicon: "jastrow" | "bdb",
  baseUrl: string,
): SEOResult {
  const meta = LEXICON_SEO_META[lexicon];
  return {
    title: `${meta.shortName} Headwords - Browse by Hebrew Letter | Bekiut`,
    description: `Browse all headwords in the ${meta.longName}, organized alphabetically by Hebrew letter. A ${meta.blurb}, free on Bekiut.`,
    ogTitle: `${meta.shortName} Headwords - Browse by Hebrew Letter`,
    ogDescription: `Browse all headwords in the ${meta.longName}, organized alphabetically by Hebrew letter.`,
    canonical: `${baseUrl}/${lexicon}/headwords`,
    robots: "index, follow",
  };
}

export function getHeadwordsLetterSEO(
  lexicon: "jastrow" | "bdb",
  letter: string,
  baseUrl: string,
): SEOResult {
  const meta = LEXICON_SEO_META[lexicon];
  return {
    title: `${meta.shortName} Headwords - Letter ${letter} | Bekiut`,
    description: `All headwords beginning with the Hebrew letter ${letter} in the ${meta.longName}. Each headword links to the full entry with definitions and citations.`,
    ogTitle: `${meta.shortName} Headwords - Letter ${letter}`,
    ogDescription: `All headwords beginning with the Hebrew letter ${letter} in the ${meta.longName}.`,
    canonical: `${baseUrl}/${lexicon}/headwords/${encodeURIComponent(letter)}`,
    robots: "index, follow",
  };
}

export function getBiblicalIndexBookSEO(
  bookSlug: string,
  baseUrl: string,
): SEOResult {
  // Biblical-index slugs are derived from the index's display names (e.g.
  // "1_samuel", "leviticus_part1") and don't always match bible-book slugs,
  // so fall back to title-casing the slug when no book record matches.
  const book = getBookBySlug(bookSlug);
  const bookTitle = book
    ? book.name
    : bookSlug
        .replace(/_/g, " ")
        .replace(/\b([a-z])/g, (_, c: string) => c.toUpperCase())
        .replace(/\bPart(\d+)\b/gi, "Part $1");
  return {
    title: `${bookTitle} - Biblical Citations in the Talmud | Bekiut`,
    description: `Every verse from ${bookTitle} cited in the Babylonian Talmud, organized by chapter and verse, with links to the citing Talmud folio pages. Free on Bekiut.`,
    ogTitle: `${bookTitle} - Biblical Citations in the Talmud`,
    ogDescription: `Every verse from ${bookTitle} cited in the Babylonian Talmud, with links to the citing folio pages.`,
    canonical: `${baseUrl}/biblical-index/book/${encodeURIComponent(bookSlug)}`,
    robots: "index, follow",
  };
}

export function getSearchSEO(
  query: string,
  type: string,
  baseUrl: string,
): SEOResult {
  if (query) {
    const typeLabel =
      type === "bible"
        ? "Bible"
        : type === "talmud"
          ? "Talmud"
          : "Talmud & Bible";
    return {
      title: `Search results for "${query}" in ${typeLabel} | Bekiut`,
      description: `Search results for "${query}" in the ${typeLabel}. Find passages, explore Hebrew and English text, and study with Bekiut.`,
      ogTitle: `Search: "${query}" \u2013 ${typeLabel}`,
      ogDescription: `Search results for "${query}" in the ${typeLabel} on Bekiut.`,
      canonical: `${baseUrl}/search`,
      robots: "noindex, follow",
    };
  }
  return { ...STATIC_MAP["/search"], canonical: `${baseUrl}/search` };
}

// ── Main dispatch — used by server ────────────────────────────────────────────
// Client pages import individual factory functions directly instead.

export function getPageSEO(
  pathname: string,
  searchParams: URLSearchParams,
  baseUrl: string,
): SEOResult {
  // Param-dependent pages must be checked before the static lookup
  if (pathname === "/search") {
    return getSearchSEO(
      searchParams.get("q") || "",
      searchParams.get("type") || "",
      baseUrl,
    );
  }
  if (pathname === "/jastrow") {
    return getJastrowSEO(
      searchParams.get("letter") || "",
      searchParams.get("q") || "",
      baseUrl,
    );
  }
  if (pathname === "/bdb") {
    return getBDBSEO(
      searchParams.get("letter") || "",
      searchParams.get("q") || "",
      baseUrl,
    );
  }

  // Static pages
  const staticResult = getStaticSEO(pathname, baseUrl);
  if (staticResult) return staticResult;

  // Headword browser letter page: /jastrow/headwords/:letter, /bdb/headwords/:letter
  const headwordsLetterMatch = pathname.match(
    /^\/(jastrow|bdb)\/headwords\/([^/]+)$/,
  );
  if (headwordsLetterMatch)
    return getHeadwordsLetterSEO(
      headwordsLetterMatch[1] as "jastrow" | "bdb",
      decodeURIComponent(headwordsLetterMatch[2]),
      baseUrl,
    );

  // Headword browser index: /jastrow/headwords, /bdb/headwords
  const headwordsMatch = pathname.match(/^\/(jastrow|bdb)\/headwords$/);
  if (headwordsMatch)
    return getHeadwordsSEO(headwordsMatch[1] as "jastrow" | "bdb", baseUrl);

  // Biblical index book: /biblical-index/book/:name
  const biblicalIndexBookMatch = pathname.match(
    /^\/biblical-index\/book\/([^/]+)$/,
  );
  if (biblicalIndexBookMatch)
    return getBiblicalIndexBookSEO(
      decodeURIComponent(biblicalIndexBookMatch[1]),
      baseUrl,
    );

  // Talmud folio: /talmud/:tractate/:folio
  const folioMatch = pathname.match(/^\/talmud\/([^/]+)\/(\d+[ab])$/);
  if (folioMatch) return getTalmudFolioSEO(folioMatch[1], folioMatch[2], baseUrl);

  // Talmud tractate: /talmud/:tractate
  const tractateMatch = pathname.match(/^\/talmud\/([^/]+)$/);
  if (tractateMatch) return getTalmudTractateSEO(tractateMatch[1], baseUrl);

  // Bible chapter: /bible/:book/:chapter
  const bibleChapterMatch = pathname.match(/^\/bible\/([^/]+)\/(\d+)$/);
  if (bibleChapterMatch)
    return getBibleChapterSEO(bibleChapterMatch[1], bibleChapterMatch[2], baseUrl);

  // Bible book: /bible/:book
  const bibleBookMatch = pathname.match(/^\/bible\/([^/]+)$/);
  if (bibleBookMatch) return getBibleBookSEO(bibleBookMatch[1], baseUrl);

  // Mishnah chapter: /mishnah/:tractate/:chapter
  const mishnahChapterMatch = pathname.match(/^\/mishnah\/([^/]+)\/(\d+)$/);
  if (mishnahChapterMatch)
    return getMishnahChapterSEO(
      mishnahChapterMatch[1],
      mishnahChapterMatch[2],
      baseUrl,
    );

  // Mishnah tractate: /mishnah/:tractate
  const mishnahTractateMatch = pathname.match(/^\/mishnah\/([^/]+)$/);
  if (mishnahTractateMatch)
    return getMishnahTractateSEO(mishnahTractateMatch[1], baseUrl);

  // Yerushalmi halakhah: /yerushalmi/:tractate/:ch.halakhah
  const yerushalmiHalachahMatch = pathname.match(
    /^\/yerushalmi\/([^/]+)\/(\d+)\.(\d+)$/,
  );
  if (yerushalmiHalachahMatch) {
    const [, tractateSlug, chapter, halakhah] = yerushalmiHalachahMatch;
    const info = getYerushalmiTractateInfo(tractateSlug);
    const missing = info
      ? isYerushalmiHalakhahMissing(
          info.name,
          parseInt(chapter, 10),
          parseInt(halakhah, 10),
        )
      : false;
    return getYerushalmiHalachahSEO(
      tractateSlug,
      chapter,
      halakhah,
      baseUrl,
      missing,
    );
  }

  // Yerushalmi tractate: /yerushalmi/:tractate
  const yerushalmiTractateMatch = pathname.match(/^\/yerushalmi\/([^/]+)$/);
  if (yerushalmiTractateMatch)
    return getYerushalmiTractateSEO(yerushalmiTractateMatch[1], baseUrl);

  // Rambam chapter: /rambam/:hilchot/:chapter
  const rambamChapterMatch = pathname.match(/^\/rambam\/([^/]+)\/(\d+)$/);
  if (rambamChapterMatch)
    return getRambamChapterSEO(
      rambamChapterMatch[1],
      rambamChapterMatch[2],
      baseUrl,
    );

  // Rambam hilchot: /rambam/:hilchot
  const rambamHilchotMatch = pathname.match(/^\/rambam\/([^/]+)$/);
  if (rambamHilchotMatch)
    return getRambamHilchotSEO(rambamHilchotMatch[1], baseUrl);

  // Fallback: homepage defaults
  return getStaticSEO("/", baseUrl)!;
}
