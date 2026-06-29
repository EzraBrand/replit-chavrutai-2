import express from "express";
import fs from "fs";
import path from "path";
import { storage } from "../storage";
import { normalizeSefariaTractateName, normalizeDisplayTractateName, getTractateSlug } from "../shared/tractates";
import { getMishnahTractateInfo } from "../shared/tractates";
import { getYerushalmiTractateInfo } from "../shared/yerushalmi-data";
import {
  isYerushalmiHalakhahMissing,
  isYerushalmiChapterEmpty,
  findFirstValidHalakhahInChapter,
  findPrevValidYerushalmiHalakhah,
  findNextValidYerushalmiHalakhah,
} from "../shared/yerushalmi-missing";
import { getRambamHilchotInfo, RAMBAM_BOOKS } from "../shared/rambam-data";
import { getBookBySlug } from "../shared/bible-books";
import { getPageSEO } from "../shared/seo-data";

function escapeHtmlAttr(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

const CHAVRUTAI_SAME_AS = [
  "https://github.com/EzraBrand/chavrutai",
  "https://www.ezrabrand.com/",
  "https://x.com/ChavrutAI",
];

function generateServerSideStructuredData(url: string, baseUrl: string): object | null {
  const origin = baseUrl;

  const organizationNode = {
    "@type": "Organization",
    "@id": `${origin}/#organization`,
    name: "ChavrutAI",
    url: origin,
    foundingDate: "2025",
    description: "Free digital platform for studying the Babylonian Talmud with Hebrew-English bilingual text and modern study tools.",
    logo: {
      "@type": "ImageObject",
      url: `${origin}/favicon-192x192.png`,
    },
    sameAs: CHAVRUTAI_SAME_AS,
  };

  if (url === '/' || url === '') {
    return {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "WebSite",
          "@id": `${origin}/#website`,
          name: "ChavrutAI",
          description: "Free digital platform for studying the Babylonian Talmud with Hebrew-English bilingual text and modern study tools.",
          url: origin,
          potentialAction: {
            "@type": "SearchAction",
            target: `${origin}/talmud/{search_term}`,
            "query-input": "required name=search_term",
          },
          publisher: { "@id": `${origin}/#organization` },
        },
        organizationNode,
      ],
    };
  }

  if (url === '/about') {
    return {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "AboutPage",
          "@id": `${origin}/about`,
          name: "About ChavrutAI",
          description: "Information about ChavrutAI digital Talmud study platform",
          url: `${origin}/about`,
          publisher: { "@id": `${origin}/#organization` },
        },
        organizationNode,
      ],
    };
  }

  if (url === '/talmud') {
    return {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "CollectionPage",
          "@id": `${origin}/talmud`,
          name: "Talmud Bavli — All Tractates",
          description: "Complete table of contents for the Babylonian Talmud. All 37 tractates with Hebrew-English text.",
          url: `${origin}/talmud`,
          breadcrumb: {
            "@type": "BreadcrumbList",
            "itemListElement": [
              { "@type": "ListItem", position: 1, name: "Home", item: `${origin}/` },
              { "@type": "ListItem", position: 2, name: "Talmud", item: `${origin}/talmud` },
            ],
          },
          publisher: { "@id": `${origin}/#organization` },
        },
        organizationNode,
      ],
    };
  }

  const tractateMatch = url.match(/^\/talmud\/([^/]+)$/);
  if (tractateMatch) {
    const tractate = tractateMatch[1];
    const tractateTitle = normalizeDisplayTractateName(tractate);
    return {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "CollectionPage",
          "@id": `${origin}/talmud/${tractate}`,
          name: `${tractateTitle} — Babylonian Talmud`,
          description: `Study ${tractateTitle} tractate chapter by chapter with Hebrew-English text on ChavrutAI.`,
          url: `${origin}/talmud/${tractate}`,
          breadcrumb: {
            "@type": "BreadcrumbList",
            "itemListElement": [
              { "@type": "ListItem", position: 1, name: "Home",   item: `${origin}/` },
              { "@type": "ListItem", position: 2, name: "Talmud", item: `${origin}/talmud` },
              { "@type": "ListItem", position: 3, name: tractateTitle, item: `${origin}/talmud/${tractate}` },
            ],
          },
          isPartOf: { "@type": "WebSite", "@id": `${origin}/#website` },
          publisher: { "@id": `${origin}/#organization` },
        },
        organizationNode,
      ],
    };
  }

  if (url === '/biblical-index') {
    return {
      "@context": "https://schema.org",
      "@type": "Dataset",
      name: "Biblical Citations in the Talmud",
      description: "Comprehensive digital index mapping biblical verses to their citations throughout the Babylonian Talmud",
      url: `${origin}/biblical-index`,
      license: "https://opensource.org/licenses/MIT",
      creator: {
        "@type": "Organization",
        name: "ChavrutAI",
        url: origin,
      },
    };
  }

  if (url === '/bible') {
    return {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "CollectionPage",
          "@id": `${origin}/bible`,
          name: "Hebrew Bible (Tanach) — Hebrew & English",
          description: "Read the complete Hebrew Bible with Koren Jerusalem Bible English translation. All 24 books of the Torah, Nevi'im, and Ketuvim.",
          url: `${origin}/bible`,
          breadcrumb: {
            "@type": "BreadcrumbList",
            "itemListElement": [
              { "@type": "ListItem", position: 1, name: "Home", item: `${origin}/` },
              { "@type": "ListItem", position: 2, name: "Bible", item: `${origin}/bible` },
            ],
          },
          publisher: { "@id": `${origin}/#organization` },
        },
        organizationNode,
      ],
    };
  }

  const bibleBookMatch = url.match(/^\/bible\/([^/]+)$/);
  if (bibleBookMatch) {
    const bookSlug = bibleBookMatch[1];
    const book = getBookBySlug(bookSlug);
    const bookTitle = book ? book.name : bookSlug.replace(/_/g, ' ');
    return {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "Book",
          "@id": `${origin}/bible/${bookSlug}`,
          name: `${bookTitle} — Hebrew Bible`,
          url: `${origin}/bible/${bookSlug}`,
          inLanguage: ["he", "en"],
          genre: "Religious Text",
          isPartOf: { "@type": "BookSeries", name: "Hebrew Bible (Tanach)" },
        },
        {
          "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", position: 1, name: "Home", item: `${origin}/` },
            { "@type": "ListItem", position: 2, name: "Bible", item: `${origin}/bible` },
            { "@type": "ListItem", position: 3, name: bookTitle, item: `${origin}/bible/${bookSlug}` },
          ],
        },
        organizationNode,
      ],
    };
  }

  const bibleChapterMatch = url.match(/^\/bible\/([^/]+)\/(\d+)$/);
  if (bibleChapterMatch) {
    const bookSlug = bibleChapterMatch[1];
    const chapter = bibleChapterMatch[2];
    const book = getBookBySlug(bookSlug);
    const bookTitle = book ? book.name : bookSlug.replace(/_/g, ' ');
    return {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "Article",
          "@id": `${origin}/bible/${bookSlug}/${chapter}`,
          headline: `${bookTitle} Chapter ${chapter} — Hebrew & English`,
          description: `Read ${bookTitle} Chapter ${chapter} with parallel Hebrew-English text and the Koren Jerusalem Bible translation.`,
          url: `${origin}/bible/${bookSlug}/${chapter}`,
          author: { "@id": `${origin}/#organization` },
          publisher: { "@id": `${origin}/#organization` },
          isPartOf: {
            "@type": "Book",
            name: `${bookTitle} — Hebrew Bible`,
            isPartOf: { "@type": "BookSeries", name: "Hebrew Bible (Tanach)" },
          },
        },
        {
          "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", position: 1, name: "Home", item: `${origin}/` },
            { "@type": "ListItem", position: 2, name: "Bible", item: `${origin}/bible` },
            { "@type": "ListItem", position: 3, name: bookTitle, item: `${origin}/bible/${bookSlug}` },
            { "@type": "ListItem", position: 4, name: `Chapter ${chapter}`, item: `${origin}/bible/${bookSlug}/${chapter}` },
          ],
        },
        organizationNode,
      ],
    };
  }

  if (url === '/mishnah') {
    return {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "CollectionPage",
          "@id": `${origin}/mishnah`,
          name: "Mishnah — Hebrew & English",
          description: "Study 26 Mishnah tractates not covered by the Babylonian Talmud with bilingual Hebrew-English text.",
          url: `${origin}/mishnah`,
          breadcrumb: {
            "@type": "BreadcrumbList",
            "itemListElement": [
              { "@type": "ListItem", position: 1, name: "Home", item: `${origin}/` },
              { "@type": "ListItem", position: 2, name: "Mishnah", item: `${origin}/mishnah` },
            ],
          },
          publisher: { "@id": `${origin}/#organization` },
        },
        organizationNode,
      ],
    };
  }

  const mishnahTractateMatch = url.match(/^\/mishnah\/([^/]+)$/);
  if (mishnahTractateMatch) {
    const tractateSlug = mishnahTractateMatch[1];
    const tractateInfo = getMishnahTractateInfo(tractateSlug);
    const tractateName = tractateInfo ? tractateInfo.name : tractateSlug.replace(/_/g, ' ');
    return {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "CollectionPage",
          "@id": `${origin}/mishnah/${tractateSlug}`,
          name: `Mishnah ${tractateName}`,
          description: `Study Mishnah ${tractateName} chapter by chapter with bilingual Hebrew-English text.`,
          url: `${origin}/mishnah/${tractateSlug}`,
          isPartOf: { "@type": "WebSite", "@id": `${origin}/#website` },
          publisher: { "@id": `${origin}/#organization` },
        },
        {
          "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", position: 1, name: "Home", item: `${origin}/` },
            { "@type": "ListItem", position: 2, name: "Mishnah", item: `${origin}/mishnah` },
            { "@type": "ListItem", position: 3, name: tractateName, item: `${origin}/mishnah/${tractateSlug}` },
          ],
        },
        organizationNode,
      ],
    };
  }

  const mishnahChapterMatch = url.match(/^\/mishnah\/([^/]+)\/(\d+)$/);
  if (mishnahChapterMatch) {
    const tractateSlug = mishnahChapterMatch[1];
    const chapter = mishnahChapterMatch[2];
    const tractateInfo = getMishnahTractateInfo(tractateSlug);
    const tractateName = tractateInfo ? tractateInfo.name : tractateSlug.replace(/_/g, ' ');
    return {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "Article",
          "@id": `${origin}/mishnah/${tractateSlug}/${chapter}`,
          headline: `Mishnah ${tractateName} Chapter ${chapter}`,
          description: `Study Mishnah ${tractateName} Chapter ${chapter} with parallel Hebrew-English text.`,
          url: `${origin}/mishnah/${tractateSlug}/${chapter}`,
          author: { "@id": `${origin}/#organization` },
          publisher: { "@id": `${origin}/#organization` },
          isPartOf: {
            "@type": "Book",
            name: `Mishnah ${tractateName}`,
            isPartOf: { "@type": "BookSeries", name: "Mishnah" },
          },
        },
        {
          "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", position: 1, name: "Home", item: `${origin}/` },
            { "@type": "ListItem", position: 2, name: "Mishnah", item: `${origin}/mishnah` },
            { "@type": "ListItem", position: 3, name: tractateName, item: `${origin}/mishnah/${tractateSlug}` },
            { "@type": "ListItem", position: 4, name: `Chapter ${chapter}`, item: `${origin}/mishnah/${tractateSlug}/${chapter}` },
          ],
        },
        organizationNode,
      ],
    };
  }

  if (url === '/rambam') {
    return {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "CollectionPage",
          "@id": `${origin}/rambam`,
          name: "Mishneh Torah (Rambam) — Hebrew & English",
          description: "Study all 83 Hilchot of the Mishneh Torah with bilingual Hebrew-English text (Touger translation). 14 books covering all areas of Jewish law.",
          url: `${origin}/rambam`,
          breadcrumb: {
            "@type": "BreadcrumbList",
            "itemListElement": [
              { "@type": "ListItem", position: 1, name: "Home", item: `${origin}/` },
              { "@type": "ListItem", position: 2, name: "Mishneh Torah", item: `${origin}/rambam` },
            ],
          },
          publisher: { "@id": `${origin}/#organization` },
        },
        organizationNode,
      ],
    };
  }

  const rambamHilchotMatch = url.match(/^\/rambam\/([^/]+)$/);
  if (rambamHilchotMatch) {
    const hilchotSlug = rambamHilchotMatch[1];
    const info = getRambamHilchotInfo(hilchotSlug);
    const hilchotName = info ? info.displayName : hilchotSlug.replace(/_/g, ' ');
    return {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "CollectionPage",
          "@id": `${origin}/rambam/${hilchotSlug}`,
          name: `Hilchot ${hilchotName} — Mishneh Torah`,
          description: `Study Hilchot ${hilchotName} chapter by chapter with bilingual Hebrew-English text (Touger translation).`,
          url: `${origin}/rambam/${hilchotSlug}`,
          isPartOf: { "@type": "WebSite", "@id": `${origin}/#website` },
          publisher: { "@id": `${origin}/#organization` },
        },
        {
          "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", position: 1, name: "Home", item: `${origin}/` },
            { "@type": "ListItem", position: 2, name: "Mishneh Torah", item: `${origin}/rambam` },
            { "@type": "ListItem", position: 3, name: hilchotName, item: `${origin}/rambam/${hilchotSlug}` },
          ],
        },
        organizationNode,
      ],
    };
  }

  const rambamChapterMatch = url.match(/^\/rambam\/([^/]+)\/(\d+)$/);
  if (rambamChapterMatch) {
    const hilchotSlug = rambamChapterMatch[1];
    const chapter = rambamChapterMatch[2];
    const info = getRambamHilchotInfo(hilchotSlug);
    const hilchotName = info ? info.displayName : hilchotSlug.replace(/_/g, ' ');
    return {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "Article",
          "@id": `${origin}/rambam/${hilchotSlug}/${chapter}`,
          headline: `${hilchotName} Chapter ${chapter} — Mishneh Torah`,
          description: `Study Hilchot ${hilchotName} Chapter ${chapter} with parallel Hebrew-English text (Touger translation).`,
          url: `${origin}/rambam/${hilchotSlug}/${chapter}`,
          author: { "@id": `${origin}/#organization` },
          publisher: { "@id": `${origin}/#organization` },
          isPartOf: {
            "@type": "Book",
            name: `Hilchot ${hilchotName} — Mishneh Torah`,
            isPartOf: { "@type": "BookSeries", name: "Mishneh Torah" },
          },
        },
        {
          "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", position: 1, name: "Home", item: `${origin}/` },
            { "@type": "ListItem", position: 2, name: "Mishneh Torah", item: `${origin}/rambam` },
            { "@type": "ListItem", position: 3, name: hilchotName, item: `${origin}/rambam/${hilchotSlug}` },
            { "@type": "ListItem", position: 4, name: `Chapter ${chapter}`, item: `${origin}/rambam/${hilchotSlug}/${chapter}` },
          ],
        },
        organizationNode,
      ],
    };
  }

  if (url === '/yerushalmi') {
    return {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "CollectionPage",
          "@id": `${origin}/yerushalmi`,
          name: "Jerusalem Talmud (Yerushalmi) — Hebrew & English",
          description: "Study the Jerusalem Talmud (Talmud Yerushalmi) with bilingual Hebrew-English text. 39 tractates across four Sedarim, with the Guggenheimer English translation.",
          url: `${origin}/yerushalmi`,
          breadcrumb: {
            "@type": "BreadcrumbList",
            "itemListElement": [
              { "@type": "ListItem", position: 1, name: "Home", item: `${origin}/` },
              { "@type": "ListItem", position: 2, name: "Jerusalem Talmud", item: `${origin}/yerushalmi` },
            ],
          },
          publisher: { "@id": `${origin}/#organization` },
        },
        organizationNode,
      ],
    };
  }

  const yerushalmiTractateMatch = url.match(/^\/yerushalmi\/([^/]+)$/);
  if (yerushalmiTractateMatch) {
    const tractateSlug = yerushalmiTractateMatch[1];
    const tractateInfo = getYerushalmiTractateInfo(tractateSlug);
    const tractateName = tractateInfo ? tractateInfo.name : tractateSlug.replace(/_/g, ' ');
    return {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "CollectionPage",
          "@id": `${origin}/yerushalmi/${tractateSlug}`,
          name: `Jerusalem Talmud ${tractateName}`,
          description: `Study Jerusalem Talmud ${tractateName} chapter by chapter with bilingual Hebrew-English text (Guggenheimer translation).`,
          url: `${origin}/yerushalmi/${tractateSlug}`,
          isPartOf: { "@type": "WebSite", "@id": `${origin}/#website` },
          publisher: { "@id": `${origin}/#organization` },
        },
        {
          "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", position: 1, name: "Home", item: `${origin}/` },
            { "@type": "ListItem", position: 2, name: "Jerusalem Talmud", item: `${origin}/yerushalmi` },
            { "@type": "ListItem", position: 3, name: tractateName, item: `${origin}/yerushalmi/${tractateSlug}` },
          ],
        },
        organizationNode,
      ],
    };
  }

  const yerushalmiHalakhahMatch = url.match(/^\/yerushalmi\/([^/]+)\/(\d+)\.(\d+)$/);
  if (yerushalmiHalakhahMatch) {
    const tractateSlug = yerushalmiHalakhahMatch[1];
    const chapter = yerushalmiHalakhahMatch[2];
    const halakhah = yerushalmiHalakhahMatch[3];
    const tractateInfo = getYerushalmiTractateInfo(tractateSlug);
    const tractateName = tractateInfo ? tractateInfo.name : tractateSlug.replace(/_/g, ' ');
    if (tractateInfo && isYerushalmiHalakhahMissing(tractateInfo.name, parseInt(chapter, 10), parseInt(halakhah, 10))) {
      return null;
    }
    return {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "Article",
          "@id": `${origin}/yerushalmi/${tractateSlug}/${chapter}.${halakhah}`,
          headline: `Jerusalem Talmud ${tractateName} ${chapter}:${halakhah}`,
          description: `Study Jerusalem Talmud ${tractateName} Chapter ${chapter} Halakhah ${halakhah} with parallel Hebrew-English text (Guggenheimer translation).`,
          url: `${origin}/yerushalmi/${tractateSlug}/${chapter}.${halakhah}`,
          author: { "@id": `${origin}/#organization` },
          publisher: { "@id": `${origin}/#organization` },
          isPartOf: {
            "@type": "Book",
            name: `Jerusalem Talmud ${tractateName}`,
            isPartOf: { "@type": "BookSeries", name: "Jerusalem Talmud" },
          },
        },
        {
          "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", position: 1, name: "Home", item: `${origin}/` },
            { "@type": "ListItem", position: 2, name: "Jerusalem Talmud", item: `${origin}/yerushalmi` },
            { "@type": "ListItem", position: 3, name: tractateName, item: `${origin}/yerushalmi/${tractateSlug}` },
            { "@type": "ListItem", position: 4, name: `Chapter ${chapter}`, item: `${origin}/yerushalmi/${tractateSlug}/${chapter}.1` },
            { "@type": "ListItem", position: 5, name: `Halakhah ${halakhah}`, item: `${origin}/yerushalmi/${tractateSlug}/${chapter}.${halakhah}` },
          ],
        },
        organizationNode,
      ],
    };
  }

  const folioMatch = url.match(/^\/talmud\/([^/]+)\/(\d+[ab])$/i);
  if (folioMatch) {
    const tractate = folioMatch[1];
    const folio = folioMatch[2].toLowerCase();
    const folioDisplay = folio.toUpperCase();
    const tractateTitle = normalizeDisplayTractateName(tractate);
    return {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "Article",
          "@id": `${origin}/talmud/${tractate}/${folio}`,
          headline: `${tractateTitle} ${folioDisplay} — Talmud Bavli`,
          description: `Study ${tractateTitle} folio ${folioDisplay} from the Babylonian Talmud with parallel Hebrew-English text on ChavrutAI.`,
          url: `${origin}/talmud/${tractate}/${folio}`,
          author: { "@id": `${origin}/#organization` },
          publisher: { "@id": `${origin}/#organization` },
          isPartOf: {
            "@type": "Book",
            name: `${tractateTitle} — Babylonian Talmud`,
            isPartOf: { "@type": "BookSeries", name: "Babylonian Talmud" },
          },
        },
        {
          "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", position: 1, name: "Home",         item: `${origin}/` },
            { "@type": "ListItem", position: 2, name: "Talmud",       item: `${origin}/talmud` },
            { "@type": "ListItem", position: 3, name: tractateTitle,  item: `${origin}/talmud/${tractate}` },
            { "@type": "ListItem", position: 4, name: `${tractateTitle} ${folioDisplay}`, item: `${origin}/talmud/${tractate}/${folio}` },
          ],
        },
        organizationNode,
      ],
    };
  }

  return null;
}

function generateServerSideMetaTags(url: string): { title: string; description: string; ogTitle: string; ogDescription: string; canonical: string; robots: string } {
  const baseUrl = process.env.NODE_ENV === 'production' ? 'https://chavrutai.com' : 'http://localhost:5000';
  const urlObj = new URL(url, baseUrl);
  return getPageSEO(urlObj.pathname, urlObj.searchParams, baseUrl);
}
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

async function generateCrawlerBodyContent(urlPath: string, seoData: { title: string; description: string }): Promise<string> {
  const baseUrl = process.env.NODE_ENV === 'production' ? 'https://chavrutai.com' : 'http://localhost:5000';

  function safeSlug(slug: string): string {
    return encodeURIComponent(slug).replace(/%2F/g, '/');
  }

  let heading = '';
  let breadcrumbs = '';
  let body = '';
  let nav = '';

  if (urlPath === '/') {
    heading = 'ChavrutAI — Study Talmud Online';
    body = `<p>${escapeHtml(seoData.description)}</p>`;
    nav = `<nav aria-label="Main navigation"><h2>Explore</h2><ul>` +
      `<li><a href="/talmud">Browse All Tractates</a></li>` +
      `<li><a href="/bible">Hebrew Bible (Tanach)</a></li>` +
      `<li><a href="/suggested-pages">Famous Talmud Pages</a></li>` +
      `<li><a href="/jastrow">Jastrow Talmud Dictionary</a></li>` +
      `<li><a href="/bdb">BDB Hebrew Bible Dictionary</a></li>` +
      `<li><a href="/search">Search</a></li>` +
      `<li><a href="/about">About</a></li>` +
      `</ul></nav>`;
  } else if (urlPath === '/talmud') {
    heading = 'Babylonian Talmud — All Tractates';
    breadcrumbs = `<nav aria-label="Breadcrumb"><a href="/">Home</a> &rsaquo; Talmud</nav>`;
    body = `<p>${escapeHtml(seoData.description)}</p>`;
    const sederNames: Record<string, string> = {
      zeraim: 'Seder Zeraim (Seeds)',
      moed: 'Seder Moed (Festivals)',
      nashim: 'Seder Nashim (Women)',
      nezikin: 'Seder Nezikin (Damages)',
      kodashim: 'Seder Kodashim (Holy Things)',
      tohorot: 'Seder Tohorot (Purities)'
    };
    const { SEDER_TRACTATES } = await import('../shared/tractates');
    nav = '';
    for (const [seder, tractates] of Object.entries(SEDER_TRACTATES)) {
      nav += `<h3>${sederNames[seder] || seder}</h3><ul>`;
      for (const t of tractates) {
        const slug = safeSlug(getTractateSlug(t.name));
        nav += `<li><a href="/talmud/${slug}">${escapeHtml(t.name)}</a> (${t.folios} folios)</li>`;
      }
      nav += `</ul>`;
    }
  } else if (urlPath.match(/^\/talmud\/[^/]+$/)) {
    const tractateSlug = urlPath.split('/')[2];
    const tractateTitle = normalizeDisplayTractateName(tractateSlug);
    const safeTractatePath = safeSlug(tractateSlug);
    const { SEDER_TRACTATES } = await import('../shared/tractates');
    const info = Object.values(SEDER_TRACTATES).flat().find(
      t => getTractateSlug(t.name) === tractateSlug
    );
    heading = `${tractateTitle} — Talmud Tractate`;
    breadcrumbs = `<nav aria-label="Breadcrumb"><a href="/">Home</a> &rsaquo; <a href="/talmud">Talmud</a> &rsaquo; ${escapeHtml(tractateTitle)}</nav>`;
    body = `<p>${escapeHtml(seoData.description)}</p>`;
    if (info) {
      const startFolio = (info as any).startFolio || 2;
      const startSide = (info as any).startSide || 'a';
      nav = `<h3>Folios</h3><ul>`;
      for (let f = startFolio; f <= info.folios; f++) {
        const sides = f === startFolio && startSide === 'b' ? ['b'] :
          f === info.folios ? (info.lastSide === 'a' ? ['a'] : ['a', 'b']) : ['a', 'b'];
        for (const s of sides) {
          nav += `<li><a href="/talmud/${safeTractatePath}/${f}${s}">${escapeHtml(tractateTitle)} ${f}${s.toUpperCase()}</a></li>`;
        }
      }
      nav += `</ul>`;
    }
  } else if (urlPath.match(/^\/talmud\/[^/]+\/\d+[ab]$/)) {
    const parts = urlPath.split('/');
    const tractateSlug = parts[2];
    const folio = parts[3];
    const tractateTitle = normalizeDisplayTractateName(tractateSlug);
    const safeTractatePath = safeSlug(tractateSlug);
    const folioUpper = folio.toUpperCase();
    heading = `${tractateTitle} ${folioUpper}`;
    breadcrumbs = `<nav aria-label="Breadcrumb"><a href="/">Home</a> &rsaquo; <a href="/talmud">Talmud</a> &rsaquo; <a href="/talmud/${safeTractatePath}">${escapeHtml(tractateTitle)}</a> &rsaquo; ${escapeHtml(folioUpper)}</nav>`;
    body = `<p>${escapeHtml(seoData.description)}</p>`;

    try {
      const folioNum = parseInt(folio);
      const side = folio.slice(-1);
      const sefariaName = normalizeSefariaTractateName(tractateSlug);
      const text = await storage.getText('Talmud Bavli', sefariaName, 1, folioNum, side);
      if (text && text.englishSections) {
        const sections = text.englishSections as string[];
        const snippet = sections.slice(0, 5).map(s =>
          typeof s === 'string' ? s.replace(/<[^>]*>/g, '').substring(0, 300) : ''
        ).filter(Boolean);
        if (snippet.length > 0) {
          body += `<div><h2>Text Excerpt</h2>`;
          for (const line of snippet) {
            body += `<p>${escapeHtml(line)}</p>`;
          }
          body += `</div>`;
        }
      }
    } catch {}

    const { SEDER_TRACTATES } = await import('../shared/tractates');
    const tractateInfo = Object.values(SEDER_TRACTATES).flat().find(
      t => getTractateSlug(t.name) === tractateSlug
    );
    const folioNum = parseInt(folio);
    const side = folio.slice(-1);
    const tStartFolio = (tractateInfo as any)?.startFolio || 2;
    const tStartSide = (tractateInfo as any)?.startSide || 'a';
    const tMaxFolio = tractateInfo?.folios;
    const tLastSide = tractateInfo?.lastSide || 'b';

    let prevFolio: string | null = null;
    if (side === 'b') {
      if (folioNum > tStartFolio || tStartSide === 'a') {
        prevFolio = `${folioNum}a`;
      }
    } else {
      if (folioNum > tStartFolio) {
        prevFolio = `${folioNum - 1}b`;
      }
    }

    let nextFolio: string | null = null;
    if (tMaxFolio) {
      if (side === 'a') {
        if (folioNum < tMaxFolio || (folioNum === tMaxFolio && tLastSide === 'b')) {
          nextFolio = `${folioNum}b`;
        }
      } else {
        if (folioNum < tMaxFolio) {
          nextFolio = `${folioNum + 1}a`;
        }
      }
    }

    nav = `<nav aria-label="Page navigation">`;
    if (prevFolio) {
      nav += `<a href="/talmud/${safeTractatePath}/${prevFolio}">&larr; ${escapeHtml(tractateTitle)} ${prevFolio.toUpperCase()}</a> `;
    }
    if (nextFolio) {
      nav += `<a href="/talmud/${safeTractatePath}/${nextFolio}">${escapeHtml(tractateTitle)} ${nextFolio.toUpperCase()} &rarr;</a>`;
    }
    nav += `</nav>`;
  } else if (urlPath === '/bible') {
    heading = 'Hebrew Bible (Tanach)';
    breadcrumbs = `<nav aria-label="Breadcrumb"><a href="/">Home</a> &rsaquo; Bible</nav>`;
    body = `<p>${escapeHtml(seoData.description)}</p>`;
    const { TORAH_BOOKS, NEVIIM_BOOKS, KETUVIM_BOOKS } = await import('../shared/bible-books');
    const sections: [string, any[]][] = [['Torah', TORAH_BOOKS], ["Nevi'im (Prophets)", NEVIIM_BOOKS], ['Ketuvim (Writings)', KETUVIM_BOOKS]];
    nav = '';
    for (const [label, books] of sections) {
      nav += `<h3>${escapeHtml(label)}</h3><ul>`;
      for (const b of books) {
        nav += `<li><a href="/bible/${safeSlug(b.slug)}">${escapeHtml(b.name)} (${escapeHtml(b.hebrew)})</a> — ${b.chapters} chapters</li>`;
      }
      nav += `</ul>`;
    }
  } else if (urlPath.match(/^\/bible\/[^/]+$/)) {
    const bookSlug = urlPath.split('/')[2];
    const book = getBookBySlug(bookSlug);
    const bookTitle = book ? book.name : bookSlug.replace(/_/g, ' ');
    const safeBookPath = safeSlug(bookSlug);
    heading = bookTitle;
    breadcrumbs = `<nav aria-label="Breadcrumb"><a href="/">Home</a> &rsaquo; <a href="/bible">Bible</a> &rsaquo; ${escapeHtml(bookTitle)}</nav>`;
    body = `<p>${escapeHtml(seoData.description)}</p>`;
    if (book) {
      nav = `<h3>Chapters</h3><ul>`;
      for (let c = 1; c <= book.chapters; c++) {
        nav += `<li><a href="/bible/${safeBookPath}/${c}">${escapeHtml(bookTitle)} Chapter ${c}</a></li>`;
      }
      nav += `</ul>`;
    }
  } else if (urlPath.match(/^\/bible\/[^/]+\/\d+$/)) {
    const parts = urlPath.split('/');
    const bookSlug = parts[2];
    const chapter = parts[3];
    const book = getBookBySlug(bookSlug);
    const bookTitle = book ? book.name : bookSlug.replace(/_/g, ' ');
    const safeBookPath = safeSlug(bookSlug);
    heading = `${bookTitle} Chapter ${chapter}`;
    breadcrumbs = `<nav aria-label="Breadcrumb"><a href="/">Home</a> &rsaquo; <a href="/bible">Bible</a> &rsaquo; <a href="/bible/${safeBookPath}">${escapeHtml(bookTitle)}</a> &rsaquo; Chapter ${escapeHtml(chapter)}</nav>`;
    body = `<p>${escapeHtml(seoData.description)}</p>`;

    try {
      const text = await storage.getText('Bible', bookSlug, parseInt(chapter), 0, 'a');
      if (text && text.englishSections) {
        const sections = text.englishSections as string[];
        const snippet = sections.slice(0, 8).map(s =>
          typeof s === 'string' ? s.replace(/<[^>]*>/g, '').substring(0, 300) : ''
        ).filter(Boolean);
        if (snippet.length > 0) {
          body += `<div><h2>Text</h2><ol>`;
          for (const line of snippet) {
            body += `<li>${escapeHtml(line)}</li>`;
          }
          body += `</ol></div>`;
        }
      }
    } catch {}

    const chapterNum = parseInt(chapter);
    nav = `<nav aria-label="Page navigation">`;
    if (chapterNum > 1) {
      nav += `<a href="/bible/${safeBookPath}/${chapterNum - 1}">&larr; Chapter ${chapterNum - 1}</a> `;
    }
    if (book && chapterNum < book.chapters) {
      nav += `<a href="/bible/${safeBookPath}/${chapterNum + 1}">Chapter ${chapterNum + 1} &rarr;</a>`;
    }
    nav += `</nav>`;
  } else if (urlPath === '/rambam') {
    heading = 'Mishneh Torah (Rambam) — All Hilchot';
    breadcrumbs = `<nav aria-label="Breadcrumb"><a href="/">Home</a> &rsaquo; Mishneh Torah</nav>`;
    body = `<p>${escapeHtml(seoData.description)}</p>`;
    nav = '';
    for (const book of RAMBAM_BOOKS) {
      nav += `<h3>${escapeHtml(book.name)}</h3><ul>`;
      for (const h of book.hilchot) {
        nav += `<li><a href="/rambam/${safeSlug(h.slug)}">${escapeHtml(h.displayName)}</a> (${h.chapters} chapters)</li>`;
      }
      nav += `</ul>`;
    }
  } else if (urlPath.match(/^\/rambam\/[^/]+$/)) {
    const hilchotSlug = urlPath.split('/')[2];
    const info = getRambamHilchotInfo(hilchotSlug);
    const hilchotTitle = info ? info.displayName : hilchotSlug.replace(/_/g, ' ');
    const safeHilchot = safeSlug(hilchotSlug);
    heading = `${hilchotTitle} — Mishneh Torah`;
    breadcrumbs = `<nav aria-label="Breadcrumb"><a href="/">Home</a> &rsaquo; <a href="/rambam">Mishneh Torah</a> &rsaquo; ${escapeHtml(hilchotTitle)}</nav>`;
    body = `<p>${escapeHtml(seoData.description)}</p>`;
    if (info) {
      nav = `<h3>Chapters</h3><ul>`;
      for (let c = 1; c <= info.chapters; c++) {
        nav += `<li><a href="/rambam/${safeHilchot}/${c}">${escapeHtml(hilchotTitle)} Chapter ${c}</a></li>`;
      }
      nav += `</ul>`;
    }
  } else if (urlPath.match(/^\/rambam\/[^/]+\/\d+$/)) {
    const parts = urlPath.split('/');
    const hilchotSlug = parts[2];
    const chapter = parseInt(parts[3]);
    const info = getRambamHilchotInfo(hilchotSlug);
    const hilchotTitle = info ? info.displayName : hilchotSlug.replace(/_/g, ' ');
    const safeHilchot = safeSlug(hilchotSlug);
    heading = `${hilchotTitle} Chapter ${chapter} — Mishneh Torah`;
    breadcrumbs = `<nav aria-label="Breadcrumb"><a href="/">Home</a> &rsaquo; <a href="/rambam">Mishneh Torah</a> &rsaquo; <a href="/rambam/${safeHilchot}">${escapeHtml(hilchotTitle)}</a> &rsaquo; Chapter ${chapter}</nav>`;
    body = `<p>${escapeHtml(seoData.description)}</p>`;
    nav = `<nav aria-label="Page navigation">`;
    if (chapter > 1) {
      nav += `<a href="/rambam/${safeHilchot}/${chapter - 1}">&larr; Chapter ${chapter - 1}</a> `;
    }
    if (info && chapter < info.chapters) {
      nav += `<a href="/rambam/${safeHilchot}/${chapter + 1}">Chapter ${chapter + 1} &rarr;</a>`;
    }
    nav += `</nav>`;
  } else if (urlPath === '/yerushalmi') {
    heading = 'Jerusalem Talmud (Talmud Yerushalmi) — All Tractates';
    breadcrumbs = `<nav aria-label="Breadcrumb"><a href="/">Home</a> &rsaquo; Jerusalem Talmud</nav>`;
    body = `<p>${escapeHtml(seoData.description)}</p>`;
    const { YERUSHALMI_TRACTATES, YERUSHALMI_HEBREW_NAMES } = await import('../shared/yerushalmi-data');
    const sederLabels: Record<string, string> = {
      zeraim: 'Seder Zeraim (Seeds)',
      moed: 'Seder Moed (Festivals)',
      nashim: 'Seder Nashim (Women)',
      nezikin: 'Seder Nezikin (Damages)',
    };
    nav = '';
    for (const [sederKey, tractates] of Object.entries(YERUSHALMI_TRACTATES)) {
      nav += `<h3>${escapeHtml(sederLabels[sederKey] || sederKey)}</h3><ul>`;
      for (const t of tractates) {
        const slug = t.name.toLowerCase().replace(/ /g, '-');
        const hebrew = YERUSHALMI_HEBREW_NAMES[t.name] || '';
        nav += `<li><a href="/yerushalmi/${safeSlug(slug)}">${escapeHtml(t.name)}${hebrew ? ` (${escapeHtml(hebrew)})` : ''}</a></li>`;
      }
      nav += `</ul>`;
    }
  } else if (urlPath.match(/^\/yerushalmi\/[^/]+$/)) {
    const tractateSlug = urlPath.split('/')[2];
    const { getYerushalmiTractateInfo } = await import('../shared/yerushalmi-data');
    const info = getYerushalmiTractateInfo(tractateSlug);
    const tractateTitle = info ? info.name : tractateSlug.replace(/_/g, ' ');
    const safeTractate = safeSlug(tractateSlug);
    heading = `${tractateTitle} — Jerusalem Talmud`;
    breadcrumbs = `<nav aria-label="Breadcrumb"><a href="/">Home</a> &rsaquo; <a href="/yerushalmi">Jerusalem Talmud</a> &rsaquo; ${escapeHtml(tractateTitle)}</nav>`;
    body = `<p>${escapeHtml(seoData.description)}</p>`;
    if (info) {
      let chapterShapes: number[][] = [];
      try {
        const fs = await import('fs');
        const path = await import('path');
        const shapesPath = path.join(import.meta.dirname, '..', 'src/shared/data/yerushalmi-shapes.json');
        const shapes: Record<string, number[][]> = JSON.parse(fs.readFileSync(shapesPath, 'utf-8'));
        chapterShapes = shapes[info.sefaria] ?? [];
      } catch {}
      nav = `<h3>Chapters</h3><ul>`;
      for (let c = 1; c <= info.chapters; c++) {
        const firstValid = findFirstValidHalakhahInChapter(info.name, c, chapterShapes);
        if (firstValid === null) continue;
        nav += `<li><a href="/yerushalmi/${safeTractate}/${c}.${firstValid}">${escapeHtml(tractateTitle)} Chapter ${c}</a></li>`;
      }
      nav += `</ul>`;
    }
  } else if (urlPath.match(/^\/yerushalmi\/[^/]+\/\d+\.\d+$/)) {
    const parts = urlPath.split('/');
    const tractateSlug = parts[2];
    const [chapterStr, halakhahStr] = parts[3].split('.');
    const chapterNum = parseInt(chapterStr);
    const halakhahNum = parseInt(halakhahStr);
    const { getYerushalmiTractateInfo } = await import('../shared/yerushalmi-data');
    const info = getYerushalmiTractateInfo(tractateSlug);
    const tractateTitle = info ? info.name : tractateSlug.replace(/_/g, ' ');
    const safeTractate = safeSlug(tractateSlug);

    // Read shape data to know halakhot per chapter (for cross-chapter nav)
    let tractateShapes: number[][] = [];
    try {
      const fs = await import('fs');
      const path = await import('path');
      const shapesPath = path.join(import.meta.dirname, '..', 'src/shared/data/yerushalmi-shapes.json');
      const shapes: Record<string, number[][]> = JSON.parse(fs.readFileSync(shapesPath, 'utf-8'));
      if (info) tractateShapes = shapes[info.sefaria] ?? [];
    } catch {}

    const isMissing = info ? isYerushalmiHalakhahMissing(info.name, chapterNum, halakhahNum) : false;
    const chapterFirstValid = info ? findFirstValidHalakhahInChapter(info.name, chapterNum, tractateShapes) : null;
    const chapterLink = chapterFirstValid !== null
      ? `<a href="/yerushalmi/${safeTractate}/${chapterNum}.${chapterFirstValid}">Chapter ${chapterNum}</a>`
      : `Chapter ${chapterNum}`;

    heading = `${tractateTitle} Chapter ${chapterNum} · Halakhah ${halakhahNum} — Jerusalem Talmud`;
    breadcrumbs = `<nav aria-label="Breadcrumb"><a href="/">Home</a> &rsaquo; <a href="/yerushalmi">Jerusalem Talmud</a> &rsaquo; <a href="/yerushalmi/${safeTractate}">${escapeHtml(tractateTitle)}</a> &rsaquo; ${chapterLink} &rsaquo; Halakhah ${halakhahNum}</nav>`;
    body = isMissing
      ? `<p>This halakhah has no Yerushalmi gemara (Mishnah only or untranslated) and is not part of the Jerusalem Talmud reader.</p>`
      : `<p>${escapeHtml(seoData.description)}</p>`;
    nav = `<nav aria-label="Page navigation">`;
    if (info) {
      const prevTarget = findPrevValidYerushalmiHalakhah(info.name, chapterNum, halakhahNum, tractateShapes);
      const nextTarget = findNextValidYerushalmiHalakhah(info.name, chapterNum, halakhahNum, tractateShapes);
      if (prevTarget) {
        nav += `<a href="/yerushalmi/${safeTractate}/${prevTarget.chapter}.${prevTarget.halakhah}">&larr; ${prevTarget.chapter}:${prevTarget.halakhah}</a> `;
      }
      if (nextTarget) {
        nav += `<a href="/yerushalmi/${safeTractate}/${nextTarget.chapter}.${nextTarget.halakhah}">${nextTarget.chapter}:${nextTarget.halakhah} &rarr;</a>`;
      }
    }
    nav += `</nav>`;
  } else {
    heading = seoData.title.replace(/ \| ChavrutAI$/, '').replace(/ - ChavrutAI$/, '');
    breadcrumbs = `<nav aria-label="Breadcrumb"><a href="/">Home</a> &rsaquo; ${escapeHtml(heading)}</nav>`;
    body = `<p>${escapeHtml(seoData.description)}</p>`;
  }

  return `<div id="crawler-content">` +
    (breadcrumbs ? breadcrumbs : '') +
    `<h1>${escapeHtml(heading)}</h1>` +
    body +
    nav +
    `<footer><p><a href="${escapeHtml(baseUrl)}">ChavrutAI</a> — Free online Talmud and Bible study platform</p></footer>` +
    `</div>`;
}

function isCrawlerRequest(userAgent: string): boolean {
  const crawlerPatterns = [
    /googlebot/i,
    /bingbot/i,
    /slurp/i,
    /duckduckbot/i,
    /baiduspider/i,
    /yandexbot/i,
    /facebookexternalhit/i,
    /twitterbot/i,
    /linkedinbot/i,
    /whatsapp/i,
    /telegrambot/i,
    /applebot/i,
    /crawler/i,
    /spider/i,
    /bot/i
  ];
  
  return crawlerPatterns.some(pattern => pattern.test(userAgent));
}

async function servePageWithMeta(req: express.Request, res: express.Response, next: express.NextFunction): Promise<void> {
  try {
    const userAgent = req.get('User-Agent') || '';
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    if (!isCrawlerRequest(userAgent)) {
      return next();
    }
    
    const isAssetRequest = req.path.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$/i);
    if (isAssetRequest) {
      return next();
    }
    
    // In dev this file is at server/routes/seo.ts, so the source template
    // lives two directories up at <repo>/client/index.html.
    // In production the server is bundled and `import.meta.dirname` resolves
    // to the bundle directory; the built template sits at
    // <bundleDir>/public/index.html (mirroring serveStatic in server/vite.ts).
    const devTemplate = path.resolve(import.meta.dirname, "..", "..", "client", "index.html");
    const prodTemplate = path.resolve(import.meta.dirname, "public", "index.html");
    const clientTemplate = isDevelopment ? devTemplate : prodTemplate;

    let template = await fs.promises.readFile(clientTemplate, "utf-8");
    
    const seoData = generateServerSideMetaTags(req.originalUrl);
    
    template = template
      .replace(
        /<title>.*?<\/title>/,
        `<title>${escapeHtmlAttr(seoData.title)}</title>`
      )
      .replace(
        /<meta name="description" content=".*?"/,
        `<meta name="description" content="${escapeHtmlAttr(seoData.description)}"`
      )
      .replace(
        /<meta property="og:title" content=".*?"/,
        `<meta property="og:title" content="${escapeHtmlAttr(seoData.ogTitle)}"`
      )
      .replace(
        /<meta property="og:description" content=".*?"/,
        `<meta property="og:description" content="${escapeHtmlAttr(seoData.ogDescription)}"`
      )
      .replace(
        /<meta property="og:url" content=".*?"/,
        `<meta property="og:url" content="${escapeHtmlAttr(seoData.canonical)}"`
      )
      .replace(
        /<meta name="robots" content=".*?"/,
        `<meta name="robots" content="${seoData.robots}"`
      );
    
    if (template.includes('<link rel="canonical"')) {
      template = template.replace(
        /<link rel="canonical" href=".*?" \/>/,
        `<link rel="canonical" href="${seoData.canonical}" />`
      );
    } else {
      template = template.replace(
        '</head>',
        `  <link rel="canonical" href="${seoData.canonical}" />\n  </head>`
      );
    }

    const baseUrl = process.env.NODE_ENV === 'production' ? 'https://chavrutai.com' : 'http://localhost:5000';
    const structuredData = generateServerSideStructuredData(req.path, baseUrl);
    if (structuredData) {
      const jsonLdScript = `  <script type="application/ld+json">\n${JSON.stringify(structuredData, null, 2)}\n  </script>\n  </head>`;
      if (template.includes('application/ld+json')) {
        template = template.replace(
          /<script type="application\/ld\+json">[\s\S]*?<\/script>/,
          `<script type="application/ld+json">\n${JSON.stringify(structuredData, null, 2)}\n  </script>`
        );
      } else {
        template = template.replace('</head>', jsonLdScript);
      }
    }

    const crawlerContent = await generateCrawlerBodyContent(req.path, seoData);
    template = template.replace(
      '<div id="root"></div>',
      `${crawlerContent}\n    <div id="root"></div>`
    );
    
    res.status(200).set({ "Content-Type": "text/html" }).end(template);
  } catch (error) {
    console.error('Error serving page with meta:', error);
    next(error);
  }
}

export function shouldNoIndex(url: string): boolean {
  return false;
}

// Computes the crawler-only enhancement payload (JSON-LD structured data and
// pre-rendered body content) for a given URL path. The frontend's production
// server calls this over HTTP (GET /api/seo/enhance) to enrich its own
// index.html template for crawlers, keeping all Sefaria/storage-backed logic in
// the api-server. Core meta tags are computed independently on the frontend via
// the shared getPageSEO, so they survive even if this enhancement is unavailable.
export async function renderSeoEnhancement(
  originalUrl: string,
): Promise<{ structuredData: object | null; bodyContent: string }> {
  const baseUrl =
    process.env.NODE_ENV === "production"
      ? "https://chavrutai.com"
      : "http://localhost:5000";
  const urlObj = new URL(originalUrl, baseUrl);
  const seoData = generateServerSideMetaTags(originalUrl);
  const structuredData = generateServerSideStructuredData(urlObj.pathname, baseUrl);
  const bodyContent = await generateCrawlerBodyContent(urlObj.pathname, seoData);
  return { structuredData, bodyContent };
}

export { servePageWithMeta };
