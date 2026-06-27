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
    title: "Study Talmud Online - Free Digital Platform | ChavrutAI",
    description:
      "ChavrutAI \u2014 study the Babylonian Talmud online, free. All 37 tractates with Hebrew-English text, chapter navigation, and modern study tools.",
    ogTitle: "ChavrutAI - Study Talmud Online Free",
    ogDescription:
      "ChavrutAI \u2014 study the Babylonian Talmud online, free. All 37 tractates with Hebrew-English text, chapter navigation, and modern study tools.",
    robots: "index, follow",
  },
  "/talmud": {
    title: "Talmud Bavli \u2014 All 37 Tractates | ChavrutAI",
    description:
      "Study the Babylonian Talmud online, free. Browse all 37 tractates organized by Seder with Hebrew-English text, chapter navigation, and modern study tools.",
    ogTitle: "Talmud Bavli \u2014 All 37 Tractates",
    ogDescription:
      "Browse all 37 tractates of the Babylonian Talmud with Hebrew-English text, chapter navigation, and modern study tools on ChavrutAI.",
    robots: "index, follow",
  },
  "/bible": {
    title: "Bible (Tanach) - Hebrew & English | ChavrutAI",
    description:
      "Read the complete Hebrew Bible (Tanach) with Koren Jerusalem Bible English translation. Access all 24 books of the Torah, Nevi'im, and Ketuvim with parallel Hebrew-English text.",
    ogTitle: "Bible (Tanach) - Hebrew & English",
    ogDescription:
      "Read the complete Hebrew Bible with Koren Jerusalem Bible translation.",
    robots: "index, follow",
  },
  "/mishnah": {
    title: "Mishnah - Hebrew & English | ChavrutAI",
    description:
      "Study the Mishnah online with bilingual Hebrew-English text. Browse 26 tractates not covered by the Babylonian Talmud, organized by Seder.",
    ogTitle: "Mishnah - Hebrew & English | ChavrutAI",
    ogDescription:
      "Study the Mishnah online with bilingual Hebrew-English text on ChavrutAI.",
    robots: "index, follow",
  },
  "/yerushalmi": {
    title: "Jerusalem Talmud (Yerushalmi) - Hebrew & English | ChavrutAI",
    description:
      "Study the Jerusalem Talmud (Talmud Yerushalmi) online with bilingual Hebrew-English text. 39 tractates with the Guggenheimer English translation, organized by Seder.",
    ogTitle:
      "Jerusalem Talmud (Yerushalmi) - Hebrew & English | ChavrutAI",
    ogDescription:
      "Study the Jerusalem Talmud online with bilingual Hebrew-English text (Guggenheimer translation) on ChavrutAI.",
    robots: "index, follow",
  },
  "/scholarship": {
    title: "Modern Scholarship on Jewish Texts | ChavrutAI",
    description:
      "Academic introductions and critical studies of classical Jewish texts. Read Epstein's Introductions to Tanaitic and Amoraic Literature in the original Hebrew.",
    ogTitle: "Modern Scholarship on Jewish Texts | ChavrutAI",
    ogDescription:
      "Read modern academic scholarship on classical Jewish texts, including Epstein's landmark introductions to Tanaitic and Amoraic literature.",
    robots: "index, follow",
  },
  "/rambam": {
    title: "Mishneh Torah (Rambam) - Complete Text | ChavrutAI",
    description:
      "Study the Mishneh Torah (Rambam) online with bilingual Hebrew-English text. All 83 Hilchot across 14 books, with the Touger English translation via Sefaria.",
    ogTitle: "Mishneh Torah (Rambam) - Complete Text | ChavrutAI",
    ogDescription:
      "Study the Mishneh Torah (Rambam) with bilingual Hebrew-English text on ChavrutAI.",
    robots: "index, follow",
  },
  "/sugya-viewer": {
    title: "Sugya Viewer - Custom Talmud Range | ChavrutAI",
    description:
      "Read any continuous passage (sugya) across the Babylonian Talmud by selecting a custom range of folios. Ideal for in-depth study of extended discussions.",
    ogTitle: "Sugya Viewer - Custom Talmud Range | ChavrutAI",
    ogDescription:
      "Read any continuous Talmud passage by selecting a custom range of folios on ChavrutAI.",
    robots: "index, follow",
  },
  "/suggested-pages": {
    title:
      "Famous Talmud Pages - Essential Teachings & Stories | ChavrutAI",
    description:
      "Start with the most famous Talmud pages including Hillel's wisdom, Hannah's prayer, and other essential teachings. Perfect introduction for new learners.",
    ogTitle: "Famous Talmud Pages - Essential Teachings & Stories",
    ogDescription:
      "Start with the most famous Talmud pages including Hillel's wisdom, Hannah's prayer, and other essential teachings. Perfect introduction for new learners.",
    robots: "index, follow",
  },
  "/biblical-index": {
    title: "Biblical Citations in the Talmud - Complete Index | ChavrutAI",
    description:
      "Comprehensive digital index mapping biblical verses to their citations throughout the Babylonian Talmud. Search Torah, Prophets, and Writings references with direct links to Talmudic passages.",
    ogTitle: "Biblical Citations in the Talmud - Complete Index",
    ogDescription:
      "Comprehensive digital index mapping biblical verses to their citations throughout the Babylonian Talmud.",
    robots: "index, follow",
  },
  "/mishnah-map": {
    title: "Mishnah-Talmud Mapping | ChavrutAI",
    description:
      "Explore the relationship between Mishnah sections and their corresponding Talmudic discussions. Navigate from any Mishnah passage directly to the Gemara that analyzes it.",
    ogTitle: "Mishnah-Talmud Mapping | ChavrutAI",
    ogDescription:
      "Navigate from any Mishnah passage directly to the Gemara that analyzes it on ChavrutAI.",
    robots: "index, follow",
  },
  "/blog-posts": {
    title: "Talmud & Tech Blog Posts by Talmud Location | ChavrutAI",
    description:
      'Blog posts analyzing Talmudic passages, organized by tractate and page location. Click on titles to go to the full articles at the Talmud & Tech Blog, or use location links to jump to the corresponding text in ChavrutAI.',
    ogTitle: "Talmud & Tech Blog Posts by Talmud Location",
    ogDescription:
      "Blog posts analyzing Talmudic passages, organized by tractate and page location.",
    robots: "index, follow",
  },
  "/jastrow": {
    title:
      "Modernized Jastrow Talmud Dictionary of Hebrew & Aramaic | ChavrutAI",
    description:
      "Search the comprehensive Jastrow Dictionary of Talmudic Hebrew and Aramaic. Modernized presentation with expanded abbreviations, enhanced readability, and direct term lookup.",
    ogTitle: "Modernized Jastrow Talmud Dictionary of Hebrew & Aramaic",
    ogDescription:
      "Search the comprehensive Jastrow Dictionary of Talmudic Hebrew and Aramaic with modernized presentation and enhanced readability.",
    robots: "index, follow",
  },
  "/bdb": {
    title: "BDB (Brown-Driver-Briggs) Hebrew Bible Dictionary | ChavrutAI",
    description:
      "Search the Brown-Driver-Briggs (BDB) Hebrew Bible Dictionary. Modernized presentation with expanded abbreviations and direct links to biblical citations on ChavrutAI.",
    ogTitle: "BDB (Brown-Driver-Briggs) Hebrew Bible Dictionary",
    ogDescription:
      "Search the classic Brown-Driver-Briggs Hebrew Bible Dictionary with modernized presentation and direct biblical-citation links.",
    robots: "index, follow",
  },
  "/jastrow/abbreviations": {
    title: "Jastrow Abbreviations Reference | ChavrutAI",
    description:
      "Complete list of Jastrow Dictionary abbreviations expanded inline by the ChavrutAI Jastrow reader: rabbinic source abbreviations, grammatical shorthand, Latin logic phrases, and scholar surnames.",
    ogTitle: "Jastrow Abbreviations Reference",
    ogDescription:
      "Searchable table of every abbreviation expanded inline by the ChavrutAI Jastrow reader.",
    robots: "index, follow",
  },
  "/talmud/term-replacements": {
    title: "Talmud Term Replacements Reference | ChavrutAI",
    description:
      "Complete list of inline terminology updates ChavrutAI applies to the English translation of the Talmud — archaic terms, divine epithets, personal names, Hebrew calendar dates, and more.",
    ogTitle: "Talmud Term Replacements Reference",
    ogDescription:
      "Searchable, categorized table of every terminology update applied to the Talmud's English translation in ChavrutAI.",
    robots: "index, follow",
  },
  "/bdb/abbreviations": {
    title: "BDB Abbreviations Reference | ChavrutAI",
    description:
      "Complete list of Brown-Driver-Briggs (BDB) abbreviations expanded inline by the ChavrutAI BDB reader: scholar surnames, grammatical shorthand, Latin logic phrases, cognate-language tags, biblical book references, and BDB-specific symbols.",
    ogTitle: "BDB Abbreviations Reference",
    ogDescription:
      "Searchable table of every abbreviation expanded inline by the ChavrutAI BDB reader.",
    robots: "index, follow",
  },
  "/term-index": {
    title: "Talmud Term Index - Names, Places & Key Terms | ChavrutAI",
    description:
      "Glossary of personal names, place names, and key terms in the Babylonian Talmud. Includes corpus counts, Wikipedia links, Hebrew terms, and biographical data.",
    ogTitle: "Talmud Term Index - Names, Places & Key Terms | ChavrutAI",
    ogDescription:
      "Glossary of personal names, place names, and key terms in the Babylonian Talmud with corpus counts, Wikipedia links, and biographical data.",
    robots: "index, follow",
  },
  "/search": {
    title: "Search the Talmud & Bible \u2013 Hebrew & English | ChavrutAI",
    description:
      "Search through the Babylonian Talmud and Hebrew Bible in Hebrew and English. Find any passage, word, or topic across thousands of pages.",
    ogTitle: "Search Talmud & Bible",
    ogDescription:
      "Search through the Babylonian Talmud and Hebrew Bible in Hebrew and English on ChavrutAI.",
    robots: "index, follow",
  },
  "/about": {
    title:
      "About ChavrutAI - Free Digital Talmud Learning Platform | ChavrutAI",
    description:
      "Discover how ChavrutAI makes Jewish texts accessible with modern technology. Learn about our free bilingual Talmud study platform designed for learners at all levels.",
    ogTitle: "About ChavrutAI - Free Digital Talmud Learning Platform",
    ogDescription:
      "Discover how ChavrutAI makes Jewish texts accessible with modern technology. Learn about our free bilingual Talmud study platform designed for learners at all levels.",
    robots: "index, follow",
  },
  "/sitemap": {
    title: "Site Map - Talmud Navigation Guide | ChavrutAI",
    description:
      "Complete navigation guide to all 37 Talmud tractates organized by traditional Seder structure. Find any page across 5,400+ folios in the Babylonian Talmud.",
    ogTitle: "Site Map - Talmud Navigation Guide",
    ogDescription:
      "Complete navigation guide to all 37 Talmud tractates organized by traditional Seder structure.",
    robots: "index, follow",
  },
  "/contact": {
    title: "Contact | ChavrutAI",
    description:
      "Contact ChavrutAI with feedback, suggestions, and corrections. We appreciate all input to improve our digital Talmud study platform.",
    ogTitle: "Contact ChavrutAI",
    ogDescription:
      "Contact ChavrutAI with feedback, suggestions, and corrections.",
    robots: "index, follow",
  },
  "/privacy": {
    title:
      "Privacy Policy - ChavrutAI Talmud Study Platform | ChavrutAI",
    description:
      "Privacy policy for ChavrutAI - learn how we handle your data when using our free Talmud study platform.",
    ogTitle: "Privacy Policy - ChavrutAI Talmud Study Platform",
    ogDescription:
      "Privacy policy for ChavrutAI - learn how we handle your data when using our free Talmud study platform.",
    robots: "index, follow",
  },
  "/changelog": {
    title: "Changelog | ChavrutAI",
    description:
      "Recent updates and improvements to ChavrutAI. Track new features, design enhancements, and user experience improvements for Talmud study.",
    ogTitle: "Changelog - ChavrutAI Updates",
    ogDescription: "Recent updates and improvements to ChavrutAI.",
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
    title: `${tractateTitle} Talmud - Complete Chapter Guide | ChavrutAI`,
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
    title: `${tractateTitle} ${folioUpper} \u2013 Hebrew & English Talmud | ChavrutAI`,
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
    title: `${bookTitle} - Hebrew & English Bible | ChavrutAI`,
    description: `Read all chapters of ${bookTitle} with parallel Hebrew-English text and the Koren Jerusalem Bible translation. Free online Bible study on ChavrutAI.`,
    ogTitle: `${bookTitle} - Hebrew & English Bible`,
    ogDescription: `Read ${bookTitle} with parallel Hebrew-English text and the Koren Jerusalem Bible translation on ChavrutAI.`,
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
    title: `${bookTitle} Chapter ${chapter} - Hebrew & English Bible | ChavrutAI`,
    description: `Read ${bookTitle} Chapter ${chapter} with parallel Hebrew-English text and the Koren Jerusalem Bible translation. Free online Bible study on ChavrutAI.`,
    ogTitle: `${bookTitle} ${chapter} - Hebrew & English Bible`,
    ogDescription: `Read ${bookTitle} Chapter ${chapter} with parallel Hebrew-English text and the Koren Jerusalem Bible translation on ChavrutAI.`,
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
    title: `Mishnah ${tractateName} - Hebrew & English | ChavrutAI`,
    description: `Study Mishnah ${tractateName} chapter by chapter with bilingual Hebrew-English text. Free online on ChavrutAI.`,
    ogTitle: `Mishnah ${tractateName} - Hebrew & English`,
    ogDescription: `Study Mishnah ${tractateName} with Hebrew-English text on ChavrutAI.`,
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
    title: `Mishnah ${tractateName} Chapter ${chapter} - Hebrew & English | ChavrutAI`,
    description: `Study Mishnah ${tractateName} Chapter ${chapter} with parallel Hebrew-English text. Free online Mishnah study on ChavrutAI.`,
    ogTitle: `Mishnah ${tractateName} ${chapter} - Hebrew & English`,
    ogDescription: `Read Mishnah ${tractateName} Chapter ${chapter} with parallel Hebrew-English text on ChavrutAI.`,
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
    title: `Jerusalem Talmud ${tractateName} - Hebrew & English | ChavrutAI`,
    description: `Study Jerusalem Talmud ${tractateName} chapter by chapter with bilingual Hebrew-English text (Guggenheimer translation). Free online on ChavrutAI.`,
    ogTitle: `Jerusalem Talmud ${tractateName} - Hebrew & English`,
    ogDescription: `Study Jerusalem Talmud ${tractateName} with Hebrew-English text on ChavrutAI.`,
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
    title: `Jerusalem Talmud ${tractateName} ${chapter}:${halakhah} - Hebrew & English | ChavrutAI`,
    description: `Study Jerusalem Talmud ${tractateName} Chapter ${chapter} Halakhah ${halakhah} with parallel Hebrew-English text (Guggenheimer translation). Free online on ChavrutAI.`,
    ogTitle: `Jerusalem Talmud ${tractateName} ${chapter}:${halakhah} - Hebrew & English`,
    ogDescription: `Read Jerusalem Talmud ${tractateName} Chapter ${chapter} Halakhah ${halakhah} with Hebrew-English text (Guggenheimer) on ChavrutAI.`,
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
    title: `${hilchotName} - Mishneh Torah | ChavrutAI`,
    description: `Study Hilchot ${hilchotName} chapter by chapter with bilingual Hebrew-English text (Touger translation). Free online on ChavrutAI.`,
    ogTitle: `${hilchotName} - Mishneh Torah`,
    ogDescription: `Study Hilchot ${hilchotName} with Hebrew-English text (Touger) on ChavrutAI.`,
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
    title: `${hilchotName} Chapter ${chapter} - Mishneh Torah | ChavrutAI`,
    description: `Study Hilchot ${hilchotName} Chapter ${chapter} with parallel Hebrew-English text (Touger translation). Free online on ChavrutAI.`,
    ogTitle: `${hilchotName} Chapter ${chapter} - Mishneh Torah`,
    ogDescription: `Read Hilchot ${hilchotName} Chapter ${chapter} with Hebrew-English text on ChavrutAI.`,
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
      title: `Jastrow Dictionary - Letter ${letter} | ChavrutAI`,
      description: `Browse Jastrow Dictionary entries starting with ${letter}. Comprehensive Talmudic Hebrew and Aramaic dictionary with modernized presentation.`,
      ogTitle: `Jastrow Dictionary - Letter ${letter}`,
      ogDescription: `Browse Jastrow Dictionary entries starting with ${letter}. Talmudic Hebrew and Aramaic with modernized presentation.`,
      canonical: `${baseUrl}/jastrow?letter=${encodeURIComponent(letter)}`,
      robots: "index, follow",
    };
  }
  if (query) {
    return {
      title: `"${query}" - Jastrow Dictionary | ChavrutAI`,
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
      title: `BDB Hebrew Bible Dictionary - Letter ${letter} | ChavrutAI`,
      description: `Browse Brown-Driver-Briggs (BDB) Hebrew Bible Dictionary entries starting with ${letter}. Classic biblical Hebrew lexicon with modernized presentation.`,
      ogTitle: `BDB Hebrew Bible Dictionary - Letter ${letter}`,
      ogDescription: `Browse Brown-Driver-Briggs (BDB) Hebrew Bible Dictionary entries starting with ${letter}.`,
      canonical: `${baseUrl}/bdb?letter=${encodeURIComponent(letter)}`,
      robots: "index, follow",
    };
  }
  if (query) {
    return {
      title: `"${query}" - BDB Hebrew Bible Dictionary | ChavrutAI`,
      description: `BDB Hebrew Bible Dictionary results for "${query}". Brown-Driver-Briggs biblical Hebrew lexicon with modernized presentation.`,
      ogTitle: `"${query}" - BDB Hebrew Bible Dictionary`,
      ogDescription: `BDB Hebrew Bible Dictionary results for "${query}".`,
      canonical: `${baseUrl}/bdb`,
      robots: "index, follow",
    };
  }
  return { ...STATIC_MAP["/bdb"], canonical: `${baseUrl}/bdb` };
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
      title: `Search results for "${query}" in ${typeLabel} | ChavrutAI`,
      description: `Search results for "${query}" in the ${typeLabel}. Find passages, explore Hebrew and English text, and study with ChavrutAI.`,
      ogTitle: `Search: "${query}" \u2013 ${typeLabel}`,
      ogDescription: `Search results for "${query}" in the ${typeLabel} on ChavrutAI.`,
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
