import { useEffect } from "react";
import { TRACTATE_LISTS, MISHNAH_ONLY_TRACTATES } from "@shared/tractates";
import { ALL_BIBLE_BOOKS } from "@shared/bible-books";
import { getMishnahTalmudLocation } from "@shared/mishnah-map";
import { annotateAllTransliterations } from "@shared/transliteration";

// Re-export for backwards-compatibility with existing imports.
// New code should import from `@shared/hebrew-alphabet` directly.
export { HEBREW_ALPHABET } from "@shared/hebrew-alphabet";

export interface DictionaryEntry {
  headword: string;
  rid?: string;
  parent_lexicon: string;
  language_code?: string;
  language_reference?: string;
  content: {
    senses: Array<{
      definition: string;
    }>;
  };
}

export interface AutosuggestSuggestion {
  unvoweled: string;
  voweled: string;
}

export const dictionaryStyles = `
  /* Link styling */
  .dictionary-content a.refLink,
  .dictionary-content a {
    color: #2563eb;
    text-decoration: underline;
    cursor: pointer;
  }
  .dictionary-content a:hover {
    color: #1d4ed8;
    text-decoration: underline;
  }
  .dark .dictionary-content a {
    color: #60a5fa;
  }
  .dark .dictionary-content a:hover {
    color: #93c5fd;
  }

  /* Font styling */
  .dictionary-content {
    font-family: 'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  }
  .dictionary-content span[dir="rtl"] {
    font-family: 'Assistant', -apple-system, BlinkMacSystemFont, sans-serif;
    font-weight: 500;
    font-size: 1.1em;
  }
  .dictionary-content i {
    font-style: italic;
  }

  /* Hebrew letter buttons and search input */
  .font-hebrew {
    font-family: 'Assistant', -apple-system, BlinkMacSystemFont, sans-serif;
  }

  /* Hide native search clear button */
  input[type="search"]::-webkit-search-cancel-button {
    -webkit-appearance: none;
    appearance: none;
  }

  /* Header title */
  .dictionary-header {
    font-family: 'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  }

  /* Bullet list styling */
  .dictionary-bullet-list {
    list-style-type: disc;
    padding-left: 1.25rem;
    margin: 0.25rem 0;
  }
  .dictionary-bullet-list li {
    margin-bottom: 0.15rem;
  }

  /* Expanded abbreviation pills.
     Each abbrev expansion (e.g. "Wellhausen" from "We") is wrapped in this
     span so consecutive expansions ("Wellhausen Nöldeke") are visually
     separated as distinct tokens, and so the reader can see at a glance
     which words come from BDB's abbreviation key vs. its prose. */
  .dict-expanded {
    font-family: ui-monospace, "SFMono-Regular", Menlo, Consolas,
                 "Liberation Mono", "Courier New", monospace;
    font-size: 0.88em;
    background-color: hsl(35, 35%, 91%);
    color: hsl(28, 40%, 22%);
    padding: 0 0.3em;
    border-radius: 0.25em;
    margin: 0 0.08em;
    white-space: nowrap;
    border: 1px solid hsl(35, 25%, 82%);
  }
  .dark .dict-expanded {
    background-color: hsl(35, 12%, 22%);
    color: hsl(35, 30%, 82%);
    border-color: hsl(35, 12%, 30%);
  }
`;

const BAVLI_LINK_RE = new RegExp(
  `https?://(?:www\\.)?sefaria\\.org(?:\\.il)?/(${
    TRACTATE_LISTS["Talmud Bavli"].map(t => t.replace(/\s+/g, '_')).join('|')
  })\\.(\\d+[ab])(?:\\.(\\d+))?`,
  'g'
);

const YERUSHALMI_LINK_RE = /https?:\/\/(?:www\.)?sefaria\.org(?:\.il)?\/Jerusalem_Talmud_([A-Za-z_]+)\.(\d+)\.(\d+)(?:\.(\d+))?/g;

const BIBLE_SLUG_MAP = new Map(
  ALL_BIBLE_BOOKS.map(b => [b.sefaria.replace(/\s+/g, '_'), b.slug])
);

const BIBLE_LINK_RE = new RegExp(
  `https?://(?:www\\.)?sefaria\\.org(?:\\.il)?/(${
    ALL_BIBLE_BOOKS.map(b => b.sefaria.replace(/\s+/g, '_')).join('|')
  })\\.(\\d+)(?:\\.(\\d+))?`,
  'g'
);

const MISHNAH_BAVLI_LINK_RE = new RegExp(
  `https?://(?:www\\.)?sefaria\\.org(?:\\.il)?/Mishnah_(${
    TRACTATE_LISTS["Talmud Bavli"].map(t => t.replace(/\s+/g, '_')).join('|')
  })\\.(\\d+)(?:\\.(\\d+))?`,
  'g'
);

const MISHNAH_ONLY_LIST = Object.values(MISHNAH_ONLY_TRACTATES).flat();
const MISHNAH_SLUG_MAP = new Map(
  MISHNAH_ONLY_LIST.map(t => [t.sefaria, t.name.replace(/\s+/g, '_')])
);

const MISHNAH_LINK_RE = new RegExp(
  `https?://(?:www\\.)?sefaria\\.org(?:\\.il)?/(${
    MISHNAH_ONLY_LIST.map(t => t.sefaria).join('|')
  })\\.(\\d+)(?:\\.(\\d+))?`,
  'g'
);

// BDB cross-reference links (raw, since server-side transformHyperlinks doesn't touch them).
// e.g. <a href="/BDB,_אבה" data-ref="BDB, אבה">II. אבה</a>
const BDB_INTERNAL_LINK_RE = /href="\/BDB,_([^"#?]+)"/g;
// Also handle the (rare) absolute-URL form, in case Sefaria ever returns it.
const BDB_INTERNAL_LINK_ABS_RE = /href="https?:\/\/(?:www\.)?sefaria\.org(?:\.il)?\/BDB,_([^"#?]+)"/g;

// Jastrow cross-reference links. Server-side transformHyperlinks rewrites
// /Jastrow,_X.1 → https://www.sefaria.org/Jastrow%2C_X (absolute), but raw
// forms with other sense suffixes or no suffix can still slip through. The
// absolute form is matched with either "," or URL-encoded "%2C".
const JASTROW_INTERNAL_LINK_RE = /href="\/Jastrow,_([^"#?]+)"/g;
const JASTROW_INTERNAL_LINK_ABS_RE = /href="https?:\/\/(?:www\.)?sefaria\.org(?:\.il)?\/Jastrow(?:,|%2C)_([^"#?]+)"/g;

// Strip any trailing ".1", ".2", etc. sense-suffix from a Jastrow URL slug;
// ChavrutAI's /jastrow?q= takes the bare headword and resolves senses itself.
function stripJastrowSenseSuffix(slug: string): string {
  return slug.replace(/\.\d+$/, '');
}

export function convertSefariaLinksToInternal(html: string): string {
  let result = html;

  BAVLI_LINK_RE.lastIndex = 0;
  result = result.replace(BAVLI_LINK_RE, (_match, tractate, folio, segment) => {
    const path = `/talmud/${tractate}/${folio}`;
    return segment ? `${path}#${segment}` : path;
  });

  YERUSHALMI_LINK_RE.lastIndex = 0;
  result = result.replace(YERUSHALMI_LINK_RE, (_match, tractate, chapter, halakhah, segment) => {
    const h = halakhah || '1';
    const path = `/yerushalmi/${tractate}/${chapter}.${h}`;
    return segment ? `${path}#${segment}` : path;
  });

  MISHNAH_BAVLI_LINK_RE.lastIndex = 0;
  result = result.replace(MISHNAH_BAVLI_LINK_RE, (fullMatch, tractate, chapter, mishnah) => {
    const tractateNormalized = tractate.replace(/_/g, ' ');
    const chapterNum = parseInt(chapter, 10);
    const mishnahNum = mishnah ? parseInt(mishnah, 10) : 1;
    const loc = getMishnahTalmudLocation(tractateNormalized, chapterNum, mishnahNum);
    if (loc) {
      return `/talmud/${tractate}/${loc.daf}#${loc.line}`;
    }
    return fullMatch;
  });

  MISHNAH_LINK_RE.lastIndex = 0;
  result = result.replace(MISHNAH_LINK_RE, (_match, sefariaName, chapter, mishnah) => {
    const slug = MISHNAH_SLUG_MAP.get(sefariaName) || sefariaName.replace('Mishnah_', '');
    const path = `/mishnah/${slug}/${chapter}`;
    return mishnah ? `${path}#${mishnah}` : path;
  });

  BIBLE_LINK_RE.lastIndex = 0;
  result = result.replace(BIBLE_LINK_RE, (_match, book, chapter, verse) => {
    const slug = BIBLE_SLUG_MAP.get(book) || book;
    const path = `/bible/${slug}/${chapter}`;
    return verse ? `${path}#${verse}` : path;
  });

  // Sefaria-absolute Jastrow links → internal /jastrow?q= route.
  // Catches the form produced by server/storage.ts transformHyperlinks
  // (`https://www.sefaria.org/Jastrow%2C_X`) plus the rarer comma form.
  JASTROW_INTERNAL_LINK_ABS_RE.lastIndex = 0;
  result = result.replace(JASTROW_INTERNAL_LINK_ABS_RE, (_m, slug) => {
    const decoded = safeDecode(stripJastrowSenseSuffix(slug));
    return `href="/jastrow?q=${encodeURIComponent(decoded)}"`;
  });

  // Strip target= and rel= attrs from any link we've rewritten to an internal path
  result = result.replace(/<a([^>]*?)href="(\/talmud\/[^"]*|\/yerushalmi\/[^"]*|\/bible\/[^"]*|\/mishnah\/[^"]*|\/bdb[^"]*|\/jastrow[^"]*)"([^>]*?)>/g, (_m, before, href, after) => {
    const cleaned = (before + after).replace(/\s*target="[^"]*"/g, '').replace(/\s*rel="[^"]*"/g, '');
    return `<a${cleaned} href="${href}">`;
  });

  return result;
}

// Rewrite BDB cross-reference hrefs (/BDB,_X) to internal /bdb?q=X links.
// Preserves original anchor text (so "II. אבה" stays as displayed).
function safeDecode(s: string): string {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}
export function convertBdbInternalLinks(html: string): string {
  let result = html;
  BDB_INTERNAL_LINK_RE.lastIndex = 0;
  result = result.replace(BDB_INTERNAL_LINK_RE, (_m, headword) => {
    const decoded = safeDecode(headword);
    return `href="/bdb?q=${encodeURIComponent(decoded)}"`;
  });
  BDB_INTERNAL_LINK_ABS_RE.lastIndex = 0;
  result = result.replace(BDB_INTERNAL_LINK_ABS_RE, (_m, headword) => {
    const decoded = safeDecode(headword);
    return `href="/bdb?q=${encodeURIComponent(decoded)}"`;
  });
  // Strip target/rel from BDB-rewritten links too
  result = result.replace(/<a([^>]*?)href="(\/bdb[^"]*)"([^>]*?)>/g, (_m, before, href, after) => {
    const cleaned = (before + after).replace(/\s*target="[^"]*"/g, '').replace(/\s*rel="[^"]*"/g, '');
    return `<a${cleaned} href="${href}">`;
  });
  return result;
}

// Mirror of convertBdbInternalLinks for Jastrow's raw cross-reference form
// (/Jastrow,_X). The Sefaria-absolute form is handled inside
// convertSefariaLinksToInternal. Sense suffixes (.1, .2, …) are stripped since
// ChavrutAI's /jastrow?q= resolves the headword and shows all senses.
export function convertJastrowInternalLinks(html: string): string {
  let result = html;
  JASTROW_INTERNAL_LINK_RE.lastIndex = 0;
  result = result.replace(JASTROW_INTERNAL_LINK_RE, (_m, slug) => {
    const decoded = safeDecode(stripJastrowSenseSuffix(slug));
    return `href="/jastrow?q=${encodeURIComponent(decoded)}"`;
  });
  // Strip target/rel from Jastrow-rewritten links too
  result = result.replace(/<a([^>]*?)href="(\/jastrow[^"]*)"([^>]*?)>/g, (_m, before, href, after) => {
    const cleaned = (before + after).replace(/\s*target="[^"]*"/g, '').replace(/\s*rel="[^"]*"/g, '');
    return `<a${cleaned} href="${href}">`;
  });
  return result;
}

// Walk text nodes of an HTML fragment and append `[transliteration]` after
// each Greek / Syriac / Arabic run (Greek→Latin, Syriac→Hebrew, Arabic→Latin
// per DIN 31635). HTML-aware so attribute values (hrefs, alts, etc.) are
// never touched. Runs LAST in the render pipeline since other transformers
// produce the final HTML structure. Idempotent — annotateAllTransliterations
// skips runs already followed by `[...]`. SSR-safe (no-op without DOMParser).
// Text nodes inside script/style/textarea are skipped defensively (dictionary
// HTML shouldn't contain those, but better safe than corrupted).
const TRANSLIT_SKIP_PARENT_TAGS = new Set(['SCRIPT', 'STYLE', 'TEXTAREA']);

export function annotateTransliterationsInHtml(html: string): string {
  if (typeof window === 'undefined' || typeof DOMParser === 'undefined') {
    return html;
  }
  try {
    const doc = new DOMParser().parseFromString(`<div id="__translit_root__">${html}</div>`, 'text/html');
    const root = doc.getElementById('__translit_root__');
    if (!root) return html;
    const walker = doc.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const updates: { node: Text; value: string }[] = [];
    let n: Node | null;
    while ((n = walker.nextNode())) {
      const t = n as Text;
      const parentTag = t.parentElement?.tagName;
      if (parentTag && TRANSLIT_SKIP_PARENT_TAGS.has(parentTag)) continue;
      const orig = t.nodeValue || '';
      const annotated = annotateAllTransliterations(orig);
      if (annotated !== orig) updates.push({ node: t, value: annotated });
    }
    if (updates.length === 0) return html;
    for (const u of updates) u.node.nodeValue = u.value;
    return root.innerHTML;
  } catch {
    return html;
  }
}

// Split text into paragraphs by long dash while preserving HTML structure
export function splitIntoParagraphs(text: string) {
  const dashPatterns = ['—', '–', '&mdash;', '&#8212;', '&#x2014;'];
  let foundDash = '';
  for (const dash of dashPatterns) {
    if (text.includes(dash)) {
      foundDash = dash;
      break;
    }
  }
  if (!foundDash) return text;
  const parts = text.split(foundDash).filter(part => part.trim().length > 0);
  if (parts.length <= 1) return text;
  return parts.map(part => `<p class="mb-4">${part.trim()}</p>`).join('');
}

// Group citation-style ". <a>...</a>" runs into bullet lists, but skip dictionary-self-lookup links
// (Jastrow / BDB cross-refs) so we don't bullet a "v. <a href="/Jastrow,_X">X</a>" cross-ref.
export function splitByPeriodAndLink(
  text: string,
  excludeHrefSubstrings: string[] = ['Jastrow', 'BDB']
) {
  const pattern = /(\.\)\s*|\.\s+)(<a\s[^>]*href="([^"]*)"[^>]*>)/g;
  const matches: { index: number; fullMatch: string; periodPart: string; linkTag: string; href: string }[] = [];
  let m;
  while ((m = pattern.exec(text)) !== null) {
    const href = m[3] || '';
    const isExcluded = excludeHrefSubstrings.some(sub => href.includes(sub));
    if (!isExcluded) {
      matches.push({ index: m.index, fullMatch: m[0], periodPart: m[1], linkTag: m[2], href });
    }
  }
  if (matches.length === 0) return text;

  const segments: string[] = [];
  let lastEnd = 0;
  for (const match of matches) {
    const beforeEnd = match.index + match.periodPart.length;
    segments.push(text.substring(lastEnd, beforeEnd));
    lastEnd = beforeEnd;
  }
  segments.push(text.substring(lastEnd));

  const leadingProse = segments[0];
  const bulletItems = segments.slice(1).filter(s => s.trim().length > 0);
  if (bulletItems.length === 0) return text;

  const listHtml = bulletItems.map(item => `<li>${item.trim()}</li>`).join('');
  return `${leadingProse}<ul class="dictionary-bullet-list">${listHtml}</ul>`;
}

export function convertSuperscriptLetters(text: string) {
  const superscriptMap: Record<string, string> = {
    'ᵃ': 'a', 'ᵇ': 'b', 'ᶜ': 'c', 'ᵈ': 'd', 'ᵉ': 'e',
    'ᶠ': 'f', 'ᵍ': 'g', 'ʰ': 'h', 'ⁱ': 'i', 'ʲ': 'j',
    'ᵏ': 'k', 'ˡ': 'l', 'ᵐ': 'm', 'ⁿ': 'n', 'ᵒ': 'o',
    'ᵖ': 'p', 'ʳ': 'r', 'ˢ': 's', 'ᵗ': 't', 'ᵘ': 'u',
    'ᵛ': 'v', 'ʷ': 'w', 'ˣ': 'x', 'ʸ': 'y', 'ᶻ': 'z'
  };
  let result = text;
  for (const [superscript, normal] of Object.entries(superscriptMap)) {
    result = result.split(superscript).join(normal);
  }
  return result;
}

// Replace <sup>...</sup> wrappers with " (...)" so citation refs render as
// inline parenthetical notes instead of tiny superscript text. Inner HTML
// (links, italics, etc.) is preserved verbatim. Browser whitespace collapsing
// handles any double space that results from the leading space.
export function convertSupTagsToParens(html: string): string {
  return html.replace(/<sup>([\s\S]*?)<\/sup>/g, ' ($1)');
}

// Generic abbreviation expansion that takes a mappings dict.
// Preserves HTML tags (only replaces text outside of `<...>`). Each expansion
// is emitted as `<span class="dict-expanded">…</span>` so consecutive
// expansions (e.g. "We Nö" → "Wellhausen Nöldeke") render as visually
// distinct monospace pills rather than blending into a phrase.
//
// Implementation note: we replace into sentinel-bracketed text first
// (\x01…\x02), then convert sentinels to <span> tags in a single final pass.
// This prevents later iterations from matching inside the class attribute of
// a span we just inserted, and keeps the existing `(?![^<]*>)` "skip inside
// HTML tags" guard sound (sentinels aren't HTML brackets).
export function expandAbbreviations(text: string, mappings: Record<string, string>) {
  let result = text;
  const sortedMappings = Object.entries(mappings).sort(([a], [b]) => b.length - a.length);
  const OPEN = '\x01';
  const CLOSE = '\x02';

  for (const [abbreviation, expansion] of sortedMappings) {
    let pattern: RegExp;
    if (abbreviation === '&c.') {
      pattern = new RegExp('&c\\.(?![^<]*>)', 'g');
    } else if (abbreviation.includes(' ')) {
      const escaped = abbreviation.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      pattern = new RegExp(`${escaped}(?![^<]*>)`, 'g');
    } else if (abbreviation.endsWith('.')) {
      const escaped = abbreviation.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      pattern = new RegExp(`\\b${escaped}(?![^<]*>)`, 'g');
    } else {
      const escaped = abbreviation.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      // \b only fires between \w and \W. When the abbreviation edge is itself a
      // non-word character (symbols like √, 𝔊, 𝔗) \b never matches, so fall
      // back to a negative lookaround for word chars on that side.
      const left = /^\w/.test(abbreviation) ? '\\b' : '(?<![A-Za-z0-9_])';
      const right = /\w$/.test(abbreviation) ? '\\b' : '(?![A-Za-z0-9_])';
      pattern = new RegExp(`${left}${escaped}${right}(?![^<]*>)`, 'g');
    }
    // Skip if this abbreviation would match inside an already-wrapped sentinel
    // region (between OPEN and CLOSE). The sentinel chars are not word
    // characters, so a `\b` won't help; instead, replace with a callback that
    // peeks at the surrounding text.
    result = result.replace(pattern, (match, offset: number, full: string) => {
      // If we're already between OPEN and CLOSE (no CLOSE since the last OPEN
      // at or before this offset), leave the match alone.
      const before = full.lastIndexOf(OPEN, offset);
      if (before !== -1) {
        const close = full.indexOf(CLOSE, before);
        if (close === -1 || close > offset) return match;
      }
      return `${OPEN}${expansion}${CLOSE}`;
    });
  }

  // Convert sentinels to span pills in one final pass.
  return result
    .replace(new RegExp(`${OPEN}([^${CLOSE}]*)${CLOSE}`, 'g'),
             '<span class="dict-expanded">$1</span>');
}

// Copy-paste handler that preserves formatting (bold, italic, RTL) and rewrites
// internal hrefs to absolute chavrutai.com URLs. Attaches to `containerSelector`.
export function useDictionaryCopyHandler(containerSelector: string, deps: any[]) {
  useEffect(() => {
    const container = document.querySelector(containerSelector);
    if (!container) return;

    const handleCopy = (e: ClipboardEvent) => {
      const selection = window.getSelection();
      if (!selection || !selection.rangeCount) return;

      const range = selection.getRangeAt(0);
      const fragment = range.cloneContents();

      const tempDiv = document.createElement('div');
      tempDiv.appendChild(fragment);

      // Remove the external link arrow symbol (↗) from the copy
      const removeExternalLinkArrow = (element: HTMLElement): void => {
        const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null);
        const textNodesToUpdate: { node: Text; newValue: string }[] = [];
        let node: Node | null;
        while ((node = walker.nextNode())) {
          if (node.nodeType === Node.TEXT_NODE && node.textContent) {
            const cleaned = node.textContent.replace(/↗/g, '').trim();
            if (cleaned !== node.textContent.trim()) {
              textNodesToUpdate.push({ node: node as Text, newValue: cleaned });
            }
          }
        }
        textNodesToUpdate.forEach(({ node, newValue }) => {
          node.textContent = newValue;
        });
      };

      removeExternalLinkArrow(tempDiv);

      const links = tempDiv.querySelectorAll('a[href]');
      links.forEach(link => {
        const href = link.getAttribute('href');
        if (href && href.startsWith('/')) {
          link.setAttribute('href', `https://chavrutai.com${href}`);
        }
      });

      const stripFormattingExcept = (element: HTMLElement): string => {
        const allowedTags = ['strong', 'b', 'i', 'em', 'p', 'div', 'br', 'span', 'a', 'sup', 'sub', 'small', 'ul', 'li'];
        const walker = document.createTreeWalker(element, NodeFilter.SHOW_ELEMENT, null);
        const nodesToProcess: Element[] = [];
        let node: Node | null;
        while ((node = walker.nextNode())) {
          nodesToProcess.push(node as Element);
        }

        nodesToProcess.forEach(node => {
          const tagName = node.tagName.toLowerCase();
          if (!allowedTags.includes(tagName)) {
            const parent = node.parentNode;
            if (!parent) return;
            while (node.firstChild) {
              parent.insertBefore(node.firstChild, node);
            }
            parent.removeChild(node);
          } else {
            const el = node as HTMLElement;
            const attrsToKeep = ['dir', 'style', 'href', 'target', 'rel', 'class'];
            const attrsToRemove: string[] = [];
            for (let i = 0; i < el.attributes.length; i++) {
              const attrName = el.attributes[i].name;
              const isDataAttr = attrName.startsWith('data-');
              if (!attrsToKeep.includes(attrName) && !isDataAttr) {
                attrsToRemove.push(attrName);
              }
            }
            attrsToRemove.forEach(attr => el.removeAttribute(attr));

            const currentStyle = el.getAttribute('style') || '';
            const styleUpdates: Record<string, string> = {};
            if (tagName === 'strong' || tagName === 'b') {
              styleUpdates['font-weight'] = 'bold';
            }
            if (tagName === 'em' || tagName === 'i') {
              styleUpdates['font-style'] = 'italic';
            }
            const isHebrew = (el.hasAttribute('dir') && el.getAttribute('dir') === 'rtl') ||
                            el.classList.contains('font-hebrew') ||
                            el.closest('.font-hebrew');
            if (isHebrew) {
              styleUpdates['direction'] = 'rtl';
              styleUpdates['font-weight'] = 'bold';
            }
            if (Object.keys(styleUpdates).length > 0) {
              const existingStyles = currentStyle.split(';')
                .filter(s => s.trim())
                .reduce((acc, style) => {
                  const [key, value] = style.split(':').map(s => s.trim());
                  if (key && value && !styleUpdates.hasOwnProperty(key)) {
                    acc[key] = value;
                  }
                  return acc;
                }, {} as Record<string, string>);
              const mergedStyles = { ...existingStyles, ...styleUpdates };
              const newStyle = Object.entries(mergedStyles)
                .map(([key, value]) => `${key}: ${value}`)
                .join('; ');
              el.setAttribute('style', newStyle);
            }
          }
        });
        return element.innerHTML;
      };

      const cleanHTML = stripFormattingExcept(tempDiv);

      const getPlainText = (element: HTMLElement, isRoot = true): string => {
        let text = '';
        element.childNodes.forEach(node => {
          if (node.nodeType === Node.TEXT_NODE) {
            text += node.textContent;
          } else if (node.nodeType === Node.ELEMENT_NODE) {
            const el = node as HTMLElement;
            const tag = el.tagName.toLowerCase();
            if (tag === 'br') {
              text += '\n';
            } else if (tag === 'li') {
              text += '• ' + getPlainText(el, false) + '\n';
            } else if (tag === 'ul') {
              text += getPlainText(el, false);
            } else if (tag === 'p' || tag === 'div') {
              text += getPlainText(el, false) + '\n';
            } else {
              text += getPlainText(el, false);
            }
          }
        });
        return isRoot ? text.trimEnd() : text;
      };

      const plainText = getPlainText(tempDiv);

      if (e.clipboardData) {
        e.clipboardData.setData('text/html', cleanHTML);
        e.clipboardData.setData('text/plain', plainText);
        e.preventDefault();
      }
    };

    container.addEventListener('copy', handleCopy as EventListener);
    return () => {
      container.removeEventListener('copy', handleCopy as EventListener);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
