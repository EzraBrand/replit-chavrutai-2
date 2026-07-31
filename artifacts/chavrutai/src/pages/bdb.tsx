import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Link } from "wouter";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PageShell, PageHeader } from "@/components/layout/page-shell";
import { useSEO } from "@/hooks/use-seo";
import { getBDBSEO } from "@shared/seo-data";
import { HEBREW_ALPHABET } from "@shared/hebrew-alphabet";
import bdbMappings from "@shared/data/lexicon-mappings/bdb.json";
import {
  dictionaryStyles,
  convertSefariaLinksToInternal,
  convertBdbInternalLinks,
  convertJastrowInternalLinks,
  annotateTransliterationsInHtml,
  convertSupTagsToParens,
  convertBdbSubFrequencyCounts,
  prependBdbCircaMarker,
  splitIntoParagraphsBdb,
  convertSuperscriptLetters,
  expandAbbreviations,
  useDictionaryCopyHandler,
  type DictionaryEntry,
  type AutosuggestSuggestion,
} from "@/lib/dictionary-format";
import { useLexiconIndex, searchHeadwords, findFuzzyMatches } from "@/lib/lexicon-index";

export default function Bdb() {
  const [searchQuery, setSearchQuery] = useState("");
  const [lastSearchedQuery, setLastSearchedQuery] = useState("");
  const [results, setResults] = useState<DictionaryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<AutosuggestSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [splitBySemicolon, setSplitBySemicolon] = useState(true);
  const [openOutlineEntry, setOpenOutlineEntry] = useState<string | null>(null);
  const [activeAnchorId, setActiveAnchorId] = useState<string | null>(null);
  const [outlineExpanded, setOutlineExpanded] = useState<Record<string, boolean>>({});
  const searchInputRef = useRef<HTMLInputElement>(null);
  const initialLoadRef = useRef(false);
  const suppressSuggestionsRef = useRef(false);
  const outlineTriggerRef = useRef<HTMLButtonElement | null>(null);
  const outlineCloseRef = useRef<HTMLButtonElement | null>(null);
  const lexiconIndex = useLexiconIndex("bdb");

  const bdbSEO = getBDBSEO("", searchQuery, window.location.origin);

  useSEO({
    ...bdbSEO,
    structuredData: {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name: "BDB Hebrew Bible Dictionary",
      description: "Brown-Driver-Briggs Hebrew Bible Dictionary with modernized presentation",
      url: `${window.location.origin}/bdb`,
      applicationCategory: "ReferenceApplication",
      operatingSystem: "Web",
      publisher: {
        "@type": "Organization",
        name: "Bekiut",
        url: window.location.origin,
      },
      about: {
        "@type": "Book",
        name: "A Hebrew and English Lexicon of the Old Testament",
        author: [
          { "@type": "Person", name: "Francis Brown" },
          { "@type": "Person", name: "S. R. Driver" },
          { "@type": "Person", name: "Charles A. Briggs" },
        ],
      },
    },
  });

  const updateURLParams = useCallback((params: { q?: string }) => {
    const url = new URL(window.location.href);
    url.searchParams.delete('q');
    url.searchParams.delete('letter');
    if (params.q) url.searchParams.set('q', params.q);
    const newPath = url.pathname + url.search;
    window.history.replaceState(null, '', newPath);
  }, []);

  const handleSearch = useCallback(async (query?: string | unknown) => {
    const q = typeof query === 'string' ? query : searchQuery;
    if (!q.trim()) return;
    setIsLoading(true);
    setLastSearchedQuery(q.trim());
    setOpenOutlineEntry(null);
    setActiveAnchorId(null);
    updateURLParams({ q: q.trim() });
    try {
      const response = await fetch(`/api/bdb/search?query=${encodeURIComponent(q)}`);
      if (!response.ok) throw new Error(`Search failed: ${response.status}`);
      const entries = await response.json();
      const validEntries = Array.isArray(entries) ? entries.filter((entry: DictionaryEntry) =>
        entry && entry.headword && entry.content && Array.isArray(entry.content.senses)
      ) : [];
      setResults(validEntries);
    } catch (error) {
      console.error('BDB: Search error:', error);
      setResults([]);
    }
    setIsLoading(false);
  }, [searchQuery, updateURLParams]);

  // Initial-load + popstate handler. Re-runs the search when the URL's `q`
  // changes via back/forward or our click interceptor below. Legacy `?letter=`
  // URLs redirect to the headword index page (which superseded inline browse).
  useEffect(() => {
    const runFromUrl = () => {
      const params = new URLSearchParams(window.location.search);
      const q = params.get('q');
      const letter = params.get('letter');
      if (q) {
        // Only suppress suggestions if the query actually changes — otherwise
        // setSearchQuery is a no-op, the suggestions effect never runs, and
        // the flag would silently swallow the user's next keystroke.
        setSearchQuery((prev) => {
          if (prev !== q) suppressSuggestionsRef.current = true;
          return q;
        });
        handleSearch(q);
      } else if (letter) {
        window.location.replace(`/bdb/headwords/${encodeURIComponent(letter)}`);
      } else {
        // Bare /bdb (e.g. user popped back past all searches) — clear stale state
        // so the UI matches the URL.
        setSearchQuery("");
        setLastSearchedQuery("");
        setResults([]);
        setSuggestions([]);
        setShowSuggestions(false);
      }
    };

    if (!initialLoadRef.current) {
      initialLoadRef.current = true;
      runFromUrl();
    }

    const onPopState = () => runFromUrl();
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  // Intercept clicks on internal /bdb?... links (e.g. cross-refs in entry HTML)
  // so we can re-run the search without a full page reload. We deliberately
  // skip modifier-key / middle-click / target="_blank" / defaultPrevented
  // events so open-in-new-tab and other browser conventions still work.
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const anchor = (e.target as HTMLElement)?.closest?.('a') as HTMLAnchorElement | null;
      if (!anchor) return;
      if (anchor.target && anchor.target !== '' && anchor.target !== '_self') return;
      const href = anchor.getAttribute('href');
      if (!href || !href.startsWith('/bdb?')) return;
      e.preventDefault();
      window.history.pushState(null, '', href);
      const params = new URLSearchParams(href.split('?')[1] || '');
      const q = params.get('q');
      if (q) {
        setSearchQuery((prev) => {
          if (prev !== q) suppressSuggestionsRef.current = true;
          return q;
        });
        handleSearch(q);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [handleSearch]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch(searchQuery);
      setShowSuggestions(false);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (suppressSuggestionsRef.current) {
        suppressSuggestionsRef.current = false;
        return;
      }
      const q = searchQuery.trim();
      if (!q || !lexiconIndex) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }
      // Don't pop the dropdown open when the input still matches the active
      // search (URL-driven load, post-search state, or async lexiconIndex
      // arriving after a URL load). Suggestions should only appear when the
      // user is actively typing something different from the last search.
      if (q === lastSearchedQuery.trim()) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }
      const matches = searchHeadwords(lexiconIndex, q, 20);
      setSuggestions(matches);
      setShowSuggestions(matches.length > 0);
    }, 80);
    return () => clearTimeout(timeoutId);
  }, [searchQuery, lexiconIndex, lastSearchedQuery]);

  // Anchor ids are `sense-{entryKey}-{senseIdx}[-greek-{L}-{occ}]`. Pull the
  // entryKey out so the floating hamburger can target whichever entry the
  // user is currently reading. BDB rids ("BDB02413") never contain hyphens
  // and fallback keys are bare indexes, so a single non-greedy match works.
  const activeEntryKey = useMemo(() => {
    if (!activeAnchorId) return null;
    const m = activeAnchorId.match(/^sense-(.+?)-\d+/);
    return m?.[1] ?? null;
  }, [activeAnchorId]);

  const didYouMean = useMemo(() => {
    if (!lexiconIndex || results.length > 0 || !lastSearchedQuery || isLoading) return [];
    return findFuzzyMatches(lexiconIndex, lastSearchedQuery, 5);
  }, [lexiconIndex, results, lastSearchedQuery, isLoading]);

  const handleSuggestionClick = (suggestion: AutosuggestSuggestion) => {
    suppressSuggestionsRef.current = true;
    setSearchQuery(suggestion.voweled);
    setShowSuggestions(false);
    handleSearch(suggestion.voweled);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchInputRef.current && !searchInputRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useDictionaryCopyHandler('main.max-w-4xl', [results]);

  // Scroll-spy: track which sense (or Greek sub-marker) is currently in view
  // so the outline overlay can highlight the user's location. We observe every
  // anchor target — top-level sense containers and every wrapped Greek-marker
  // span — and pick the topmost intersecting element inside a band that runs
  // from just under the sticky header down to ~40% of the viewport.
  useEffect(() => {
    if (!results.length) return;
    const targets = Array.from(
      document.querySelectorAll<HTMLElement>('[id^="sense-"]')
    );
    if (!targets.length) return;

    const visible = new Map<Element, number>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) visible.set(e.target, e.boundingClientRect.top);
          else visible.delete(e.target);
        }
        if (visible.size === 0) {
          setActiveAnchorId(null);
          return;
        }
        let topEl: Element | null = null;
        let topY = Infinity;
        visible.forEach((y, el) => {
          if (y < topY) { topY = y; topEl = el; }
        });
        if (topEl) setActiveAnchorId((topEl as HTMLElement).id);
      },
      { rootMargin: '-80px 0px -60% 0px', threshold: 0 }
    );
    targets.forEach((t) => observer.observe(t));
    return () => observer.disconnect();
  }, [results, splitBySemicolon]);

  // Close the outline overlay on Escape, move focus into the panel when it
  // opens (the close button is the first focusable target), and restore focus
  // to the hamburger trigger when the panel closes so keyboard users don't
  // lose their place.
  useEffect(() => {
    if (!openOutlineEntry) {
      outlineTriggerRef.current?.focus();
      outlineTriggerRef.current = null;
      return;
    }
    outlineCloseRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenOutlineEntry(null);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [openOutlineEntry]);

  // Build a hierarchical outline from an entry's senses. BDB uses a 4-level
  // structure inside long entries:
  //   level 0 — verbal stems (Qal, Niph., Pi., Pu., Hiph., Hoph., Hithp., …)
  //   level 1 — Roman-numeral super-sections (I., II., III., …)
  //   level 2 — Arabic-numeral sections (1., 2., 3., …)
  //   level 3 — letter sub-sections (a., b., c., …)
  // Each sense's definition starts with a <strong>…</strong> tag carrying the
  // label. We classify it, pull a short label from any following <em>…</em>
  // (or the first short prose phrase), and normalize levels so the shallowest
  // level present renders flush-left.
  const VERBAL_STEM_RE = /^(Qal|Niph(?:al)?|Pi(?:el)?|Pu(?:al)?|Hiph(?:il)?|Hoph(?:al)?|Hithp(?:ael)?|Po(?:el|al|lel|lal)?|Pilp(?:el)?|Hithpalp(?:el)?|Hithpol(?:el|al)?|Hithpoel|Pulal)\.?$/;
  // Canonical Roman numerals I–X (covers all realistic BDB sub-section depths).
  // Stricter than [IVX]+ so we don't accept malformed strings like IIX or VX.
  const ROMAN_RE = /^(I{1,3}|IV|V|VI{0,3}|IX|X)$/;

  type OutlineItem = { rawLevel: number; level: number; marker: string; label: string; index: number; anchorId: string };

  // Greek lowercase letters BDB uses for the deepest sub-marker level inside a
  // single sense's prose (α., β., γ., δ., ε., ζ., η., θ., …). They appear inline
  // between semicolons, not in <strong> tags, so we detect them on the plain
  // text and inject anchor IDs in renderDefinition.
  const GREEK_LETTERS = 'αβγδεζηθικλμνξοπρστυφχψω';
  // Greek sub-markers may be preceded by whitespace, end-of-tag, an opening
  // paren, a semicolon, or a dash/colon (BDB commonly writes "relations:—α.").
  // BDB uses two surface forms for the same marker: bare "α." (with period)
  // and parenthesised "(α)" (no period, e.g. in entries like הָלַךְ). Capture
  // the trailer so wrapGreekMarkers can keep the ")" outside the span.
  const GREEK_MARKER_RE = new RegExp(`(^|[\\s;(>—–:\\-])([${GREEK_LETTERS}])(\\.|\\))`, 'g');

  const classifyMarker = (raw: string): { level: number; marker: string } | null => {
    const trimmed = raw.trim();
    const noPeriod = trimmed.replace(/\.$/, '');
    // Stems take precedence so a hypothetical short stem isn't misread as Roman/letter.
    if (VERBAL_STEM_RE.test(trimmed)) return { level: 0, marker: trimmed };
    if (ROMAN_RE.test(noPeriod)) return { level: 1, marker: trimmed };
    if (/^\d+$/.test(noPeriod)) return { level: 2, marker: trimmed };
    if (/^[a-z]$/.test(noPeriod)) return { level: 3, marker: trimmed };
    return null;
  };

  // Extract a short, readable label for an outline row from the text that
  // follows the leading <strong>…</strong>. Prefer the first <em>…</em>; fall
  // back to the first ~50 chars of plain text (stop at sentence punctuation).
  // Abbreviations are expanded (e.g. "lit." → "literally") and any pill markup
  // is stripped so the label stays plain.
  const extractLabel = (tail: string): string => {
    const em = tail.match(/^\s*<em>([^<]+)<\/em>/);
    let label = '';
    if (em) {
      label = em[1];
    } else {
      const plain = tail.replace(/<[^>]+>/g, '').trim();
      const m = plain.match(/^[^:;—]{1,60}/);
      if (m) label = m[0];
    }
    label = label.replace(/\s+/g, ' ').trim().replace(/[,;.\s]+$/, '');
    if (!label) return '';
    // Expand abbreviations, then strip the pill spans expandAbbreviations adds.
    const expanded = expandAbbreviations(label, bdbMappings.mappings)
      .replace(/<span class="dict-expanded">([^<]*)<\/span>/g, '$1');
    return expanded;
  };

  const buildOutline = (senses: { definition: string }[], entryKey: string): OutlineItem[] | null => {
    const raw: OutlineItem[] = [];
    senses.forEach((sense, i) => {
      // Match up to two adjacent leading <strong>…</strong> tags. BDB occasionally
      // collapses a parent + child marker into one sense, e.g. "<strong>5.</strong>
      // <strong>a.</strong> …" — we want to treat that as the deeper (letter) level
      // so the following b., c. items align under it.
      const m = sense.definition.match(/^\s*<strong>\s*([^<]{1,15}?)\s*<\/strong>(?:\s*<strong>\s*([^<]{1,15}?)\s*<\/strong>)?([\s\S]*)$/);
      if (!m) return;
      const first = classifyMarker(m[1]);
      const second = m[2] ? classifyMarker(m[2]) : null;
      let cls: { level: number; marker: string } | null;
      if (first && second) {
        // Combine both into a compound label (e.g. "5.a.") and use the deeper level.
        cls = {
          level: Math.max(first.level, second.level),
          marker: `${first.marker.replace(/\.$/, '')}.${second.marker}`,
        };
      } else {
        cls = first;
      }
      if (!cls) return;
      raw.push({
        rawLevel: cls.level,
        level: cls.level,
        marker: cls.marker,
        label: extractLabel(m[3] || ''),
        index: i,
        anchorId: `sense-${entryKey}-${i}`,
      });

      // Scan the rest of the sense's prose for inline Greek-letter sub-markers
      // (α., β., γ., …). Strip HTML to plain text so we don't match inside
      // attribute values, then walk matches in order. The label for each Greek
      // row is the short phrase that follows up to the next ";" or Greek marker.
      const plain = sense.definition.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
      GREEK_MARKER_RE.lastIndex = 0;
      let gm: RegExpExecArray | null;
      const greekRows: OutlineItem[] = [];
      // Track per-letter occurrence index within this sense, since BDB reuses
      // α./β./γ. across multiple sub-sub-sections within a single sense.
      const occCount: Record<string, number> = {};
      while ((gm = GREEK_MARKER_RE.exec(plain)) !== null) {
        const letter = gm[2];
        const occ = (occCount[letter] = (occCount[letter] ?? -1) + 1);
        const after = plain.slice(gm.index + gm[0].length);
        const stop = after.search(new RegExp(`;|[${GREEK_LETTERS}]\\.`));
        const phrase = (stop >= 0 ? after.slice(0, stop) : after.slice(0, 60)).trim();
        greekRows.push({
          rawLevel: 4,
          level: 4,
          marker: `${letter}.`,
          label: extractLabel(phrase),
          index: i,
          anchorId: `sense-${entryKey}-${i}-greek-${letter}-${occ}`,
        });
      }
      raw.push(...greekRows);
    });
    if (raw.length < 2) return null;
    // Normalize so the shallowest level present renders flush-left.
    const minLevel = Math.min(...raw.map(r => r.rawLevel));
    return raw.map(r => ({ ...r, level: r.rawLevel - minLevel }));
  };

  // Pipeline: split on long-dash only (no bullet-point splitting for BDB),
  // then convert <sup> citations to inline parens, then cross-refs, Bible/Talmud
  // refs, formatting, and abbreviation expansion. Greek transliteration runs last.
  // Wrap inline Greek-letter markers (α., β., γ., …) in <span id=…> so the
  // outline can deep-link to them. This MUST run before the rest of the
  // pipeline because annotateTransliterationsInHtml inserts " [a]" between
  // "α" and "." (it transliterates Greek runs of length 1 too), which would
  // otherwise break the contiguous "letter+period" match here. Running first
  // is safe: later pipeline steps don't touch single Greek letters, and the
  // injected <span> wraps the marker so the transliterator can still annotate
  // the Greek letter inside the span without changing its id.
  const wrapGreekMarkers = (html: string, idPrefix: string): string => {
    // Per-letter occurrence counter so each α./β./γ./… in the sense gets a
    // unique anchor ID matching the one buildOutline generated.
    const occCount: Record<string, number> = {};
    return html.replace(GREEK_MARKER_RE, (_match, lead: string, letter: string, trailer: string) => {
      const occ = (occCount[letter] = (occCount[letter] ?? -1) + 1);
      const id = `${idPrefix}-greek-${letter}-${occ}`;
      // For "α." form, wrap letter + period together. For "(α)" form, wrap
      // just the letter and leave the closing paren outside the span so the
      // visible text still reads "(α)".
      if (trailer === '.') {
        return `${lead}<span id="${id}" class="scroll-mt-20">${letter}.</span>`;
      }
      return `${lead}<span id="${id}" class="scroll-mt-20">${letter}</span>)`;
    });
  };

  const renderDefinition = (
    definition: string,
    idPrefix: string,
    isFirstSense: boolean = false,
  ): string => {
    // Restore the leading "c." (circa) frequency marker that Sefaria's API
    // strips, and convert <sub>NNNN</sub> occurrence counts into inline
    // "(NNNN times)" parentheticals. Both run on the raw input before any
    // other transform so downstream stages (paragraph splitting, semicolon
    // sub-splitting, abbreviation expansion) see the rewritten text.
    let prepared = convertBdbSubFrequencyCounts(definition);
    if (isFirstSense) {
      prepared = prependBdbCircaMarker(prepared);
    }
    return annotateTransliterationsInHtml(
      convertSefariaLinksToInternal(
        convertJastrowInternalLinks(
          convertBdbInternalLinks(
            expandAbbreviations(
              convertSuperscriptLetters(
                convertSupTagsToParens(
                  splitIntoParagraphsBdb(
                    wrapGreekMarkers(prepared, idPrefix),
                    splitBySemicolon,
                  )
                )
              ),
              bdbMappings.mappings
            )
          )
        )
      )
    );
  };

  return (
    <PageShell mainClassName="max-w-4xl">
        <style dangerouslySetInnerHTML={{ __html: dictionaryStyles }} />

        <PageHeader category="tanakh" className="pt-10 pb-3" title="BDB Hebrew Bible Dictionary">
          <p className="text-sm text-muted-foreground">
            Brown, Driver, and Briggs — A Hebrew and English Lexicon of the Old Testament (1906)
          </p>
        </PageHeader>

        <div className="mb-6">
          <button
            type="button"
            onClick={() => setShowAbout((v) => !v)}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
            data-testid="button-about-toggle"
            aria-expanded={showAbout}
          >
            {showAbout ? "▲" : "▼"} About this dictionary
          </button>

          {showAbout && (
            <div className="mt-2 border-t border-border" data-testid="about-panel">
              <div className="pt-4 text-sm text-foreground space-y-3">
                <p>
                  <strong>BDB</strong> is shorthand for Francis Brown, S. R. Driver, and Charles
                  Briggs's <em>A Hebrew and English Lexicon of the Old Testament</em> (Oxford, 1906),
                  the standard scholarly dictionary for biblical Hebrew. It covers every Hebrew root
                  in the Tanakh. This reader pulls live entries from Sefaria's{" "}
                  <code className="text-xs bg-muted px-1 rounded">/api/words</code> endpoint and renders
                  them with a modernized presentation layer.
                </p>
                <p className="font-medium">What this reader adds on top of the raw text:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>
                    <strong>Inline abbreviation expansion.</strong> A wide variety of abbreviations
                    are replaced inline. Categories include grammatical shorthand
                    (<em>Pf.</em>, <em>Impf.</em>, <em>cstr.</em>, <em>abs.</em>), Latin logic
                    (<em>l.c.</em>, <em>c. acc.</em>, <em>i.q.</em>), cognate-language tags
                    (<em>Ar.</em>, <em>Aram.</em>, <em>Akk.</em>, <em>Ugar.</em>), scholar surnames
                    (<em>Dl</em> = Delitzsch, <em>Lag</em> = Lagarde, <em>We</em> = Wellhausen,{" "}
                    <em>Hpt</em> = Haupt), and symbols (<em>√</em> = verbal root, <em>𝔊</em> =
                    Septuagint, <em>𝔐</em> = Masoretic).
                  </li>
                  <li>
                    <strong>Bible citations as live links.</strong> BDB's compact references like{" "}
                    <em>Nu 21:30</em> or <em>Je 7:18</em> are expanded to <em>Numbers 21:30</em> /{" "}
                    <em>Jeremiah 7:18</em> and link directly to the corresponding chapter in the
                    Bekiut Bible reader.
                  </li>
                  <li>
                    <strong>Superscript and footnote markers inlined.</strong> BDB's tiny{" "}
                    <code className="text-xs bg-muted px-1 rounded">&lt;sup&gt;</code> qualifications
                    are converted to readable parentheticals.
                  </li>
                  <li>
                    <strong>Browse by Hebrew letter.</strong> Each letter button shows a per-letter
                    headword count and goes straight to the full filtered headword index for that
                    letter (5,250 entries total).
                  </li>
                  <li>
                    <strong>Cognate-script transliteration.</strong> Greek, Arabic, Syriac, and
                    Ethiopic (Ge'ez) runs are annotated inline with transliterations (Greek,
                    Arabic, and Ethiopic into Latin characters; Syriac into Hebrew characters), to
                    make the entries accessible to a wider audience.
                  </li>
                  <li>
                    <strong>Expanded abbreviations as monospace pills.</strong> Every inline
                    expansion is rendered in a small monospace pill, so consecutive expansions
                    (e.g. "Wellhausen Nöldeke") read as two distinct authority tags rather than
                    running together, and you can see at a glance which words came from the
                    original abbreviated text.
                  </li>
                </ul>
                <p className="text-xs mt-2">
                  <a
                    href="/bdb/abbreviations"
                    className="text-primary hover:underline"
                    data-testid="link-abbreviations"
                  >
                    Browse the full abbreviations reference →
                  </a>
                </p>
                <p className="text-xs mt-2">
                  <a
                    href="https://www.ezrabrand.com/p/chavrutai-modernized-bdb-bible"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    Read more about this feature →
                  </a>
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="mb-8">
          <div className="flex gap-3 mb-6">
            <div className="relative flex-1" ref={searchInputRef}>
              <Input
                type="search"
                placeholder="Search Hebrew"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                onFocus={() => {
                  if (suggestions.length > 0) setShowSuggestions(true);
                }}
                className="pr-9 font-hebrew"
                data-testid="input-search"
                disabled={isLoading}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setSuggestions([]);
                    setShowSuggestions(false);
                    (searchInputRef.current?.querySelector('input[type="search"]') as HTMLInputElement)?.focus();
                  }}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground z-10 text-lg leading-none"
                  aria-label="Clear search"
                >
                  ×
                </button>
              )}

              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded shadow-lg z-50 max-h-60 overflow-y-auto">
                  {suggestions.map((suggestion, index) => (
                    <div
                      key={index}
                      data-testid={`suggestion-${index}`}
                      className="px-4 py-3 hover:bg-secondary cursor-pointer border-b last:border-b-0 flex justify-between items-center"
                      onClick={() => handleSuggestionClick(suggestion)}
                    >
                      <span className="font-hebrew text-lg" dir="rtl">{suggestion.voweled}</span>
                      {suggestion.voweled !== suggestion.unvoweled && (
                        <span className="text-muted-foreground text-sm font-hebrew" dir="rtl">{suggestion.unvoweled}</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <Button onClick={handleSearch} data-testid="button-search" disabled={isLoading || !searchQuery.trim()}>
              {isLoading ? "Searching…" : "Search"}
            </Button>
          </div>
        </div>

        <div className="mb-8 border-t border-border pt-8">
          <h2 className="font-georgia text-xl text-foreground mb-4">Browse by Letter</h2>
          <div className="grid grid-cols-8 sm:grid-cols-12 gap-2">
            {HEBREW_ALPHABET.map((letter) => {
              const count = lexiconIndex?.perLetterCounts[letter];
              return (
                <Link
                  key={letter}
                  href={`/bdb/headwords/${encodeURIComponent(letter)}`}
                  data-testid={`button-letter-${letter}`}
                  className="h-12 inline-flex flex-col items-center justify-center gap-0 rounded border border-border text-lg font-hebrew hover:bg-secondary"
                >
                  <span className="leading-none">{letter}</span>
                  {count !== undefined && (
                    <span className="text-[10px] tabular-nums leading-none mt-0.5 opacity-70">
                      {count.toLocaleString()}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>

        {(isLoading || lastSearchedQuery) && (
        <div className="border-t border-border pt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-georgia text-xl text-foreground">Dictionary Entries</h2>
            <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer select-none">
              <input
                type="checkbox"
                checked={splitBySemicolon}
                onChange={(e) => setSplitBySemicolon(e.target.checked)}
                className="accent-primary"
              />
              Split by semicolons
            </label>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <span className="text-muted-foreground">Loading entries...</span>
            </div>
          ) : results.length === 0 ? (
            <div className="border border-border rounded p-8 text-center">
              <p className="text-muted-foreground">No entries found. Try a different search term or browse by letter.</p>
              {didYouMean.length > 0 && (
                <div className="mt-6 max-w-md mx-auto">
                  <p className="text-sm text-muted-foreground mb-2">Did you mean:</p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {didYouMean.map((m, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => { setSearchQuery(m.voweled); handleSearch(m.voweled); }}
                        className="font-hebrew text-base px-3 py-1 rounded border border-border hover:bg-secondary text-primary"
                        data-testid={`fuzzy-${i}`}
                        dir="rtl"
                      >
                        {m.voweled}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {results.map((entry, index) => {
                const entryKey = entry.rid || `${index}`;
                const outline = buildOutline(entry.content.senses, entryKey);
                // By default show only the two shallowest distinct rawLevels (the
                // "top-level + sub-items" view). Deeper levels — typically letter
                // sub-sections (a./b./…) and inline Greek markers (α./β./…) — are
                // collapsed behind a toggle so long entries (e.g. הָלַךְ) stay scannable.
                const uniqueLevels = outline ? Array.from(new Set(outline.map(o => o.rawLevel))).sort((a, b) => a - b) : [];
                const visibleLevels = new Set(uniqueLevels.slice(0, 2));
                const isOutlineExpanded = !!outlineExpanded[entryKey];
                const visibleOutline = outline
                  ? (isOutlineExpanded ? outline : outline.filter(o => visibleLevels.has(o.rawLevel)))
                  : null;
                const hiddenCount = outline ? outline.length - (visibleOutline?.length ?? 0) : 0;
                return (
                <div key={entry.rid || index} className="pb-4 border-b border-border last:border-b-0" data-testid={`entry-${entry.rid || index}`} data-entry-key={entryKey}>
                  <div className="flex items-start gap-4">
                    <h3 className="text-lg font-bold font-hebrew min-w-fit">
                      <a
                        href={`https://www.sefaria.org.il/BDB%2C_${encodeURIComponent(entry.headword)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                        title="View this entry on Sefaria"
                      >
                        {entry.headword}
                      </a>
                    </h3>
                    <div className="text-foreground flex-1 prose prose-sm max-w-none min-w-0">
                      {outline && (
                        <nav
                          aria-label="Sense outline"
                          className="mb-3 not-prose text-sm text-muted-foreground border-l-2 border-border pl-3"
                          data-testid={`outline-${entryKey}`}
                        >
                          <ol className="list-none p-0 m-0 space-y-0.5">
                            {(visibleOutline ?? []).map((item, oi) => {
                              const isActive = item.anchorId === activeAnchorId;
                              return (
                              <li
                                key={`${item.anchorId}-${oi}`}
                                className="leading-snug"
                                style={{ paddingLeft: `${item.level * 1.1}rem` }}
                              >
                                <a
                                  href={`#${item.anchorId}`}
                                  onClick={(e) => {
                                    e.preventDefault();
                                    const el = document.getElementById(item.anchorId);
                                    if (el) {
                                      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                      history.replaceState(null, '', `#${item.anchorId}`);
                                    }
                                  }}
                                  className={`hover:underline ${isActive ? 'text-foreground font-semibold' : 'text-primary'}`}
                                >
                                  <span className={`tabular-nums ${item.rawLevel <= 1 ? 'font-semibold' : ''}`}>
                                    {/^[a-z]\.?$/.test(item.marker) ? item.marker : item.marker.replace(/\.$/, '') + '.'}
                                  </span>
                                  {item.label && <span className="italic ml-1">{item.label}</span>}
                                </a>
                              </li>
                              );
                            })}
                          </ol>
                          {(hiddenCount > 0 || isOutlineExpanded) && (
                            <button
                              type="button"
                              onClick={() => setOutlineExpanded(prev => ({ ...prev, [entryKey]: !isOutlineExpanded }))}
                              className="mt-1 text-xs text-primary hover:underline"
                              data-testid={`outline-toggle-${entryKey}`}
                              aria-expanded={isOutlineExpanded}
                              aria-controls={`outline-${entryKey}`}
                            >
                              {isOutlineExpanded ? 'Hide nested items' : `Show nested items (${hiddenCount} more)`}
                            </button>
                          )}
                        </nav>
                      )}
                      {(() => {
                        // Pre-classify every sense so we can mark the first
                        // occurrence of each section level as "bdb-section-first".
                        // We can't rely on CSS :first-child because the outline
                        // <nav> renders before the senses inside the same parent.
                        const classifications = entry.content.senses.map(sense => {
                          const leadMatch = sense.definition.match(/^\s*<strong>\s*([^<]{1,15}?)\s*<\/strong>/);
                          return leadMatch ? classifyMarker(leadMatch[1]) : null;
                        });
                        const seenLevels = new Set<number>();
                        return entry.content.senses.map((sense, senseIndex) => {
                          const senseId = `sense-${entryKey}-${senseIndex}`;
                          const cls = classifications[senseIndex];
                          let levelClass = '';
                          if (cls) {
                            levelClass = `bdb-section-level-${cls.level}`;
                            if (!seenLevels.has(cls.level)) {
                              levelClass += ' bdb-section-first';
                              seenLevels.add(cls.level);
                            }
                          }
                          return (
                            <div
                              key={senseIndex}
                              id={senseId}
                              className={`mb-2 last:mb-0 dictionary-content scroll-mt-20 ${levelClass}`}
                              dangerouslySetInnerHTML={{ __html: renderDefinition(sense.definition, senseId, senseIndex === 0) }}
                            />
                          );
                        });
                      })()}
                    </div>
                  </div>
                  {outline && openOutlineEntry === entryKey && (
                    <>
                      <div
                        className="fixed inset-0 z-40 bg-black/10"
                        onClick={() => setOpenOutlineEntry(null)}
                        aria-hidden="true"
                      />
                      <div
                        className="fixed top-20 left-4 z-50 w-80 max-w-[calc(100vw-2rem)] max-h-[75vh] overflow-y-auto bg-card border border-border rounded-md shadow-lg"
                        role="dialog"
                        aria-modal="true"
                        aria-label="Entry outline"
                        data-testid={`outline-panel-${entryKey}`}
                      >
                        <div className="flex items-center justify-between px-3 py-2 border-b border-border sticky top-0 bg-card">
                          <span className="text-sm font-semibold">
                            Outline · <span className="font-hebrew">{entry.headword}</span>
                          </span>
                          <button
                            ref={outlineCloseRef}
                            type="button"
                            onClick={() => setOpenOutlineEntry(null)}
                            className="p-1 rounded hover:bg-secondary text-muted-foreground hover:text-foreground text-lg leading-none"
                            aria-label="Close outline"
                          >
                            ×
                          </button>
                        </div>
                        <ol className="list-none p-2 m-0 space-y-0.5 text-sm">
                          {(visibleOutline ?? []).map((item, oi) => {
                            const isActive = item.anchorId === activeAnchorId;
                            return (
                              <li
                                key={`panel-${item.anchorId}-${oi}`}
                                className="leading-snug"
                                style={{ paddingLeft: `${item.level * 1.1}rem` }}
                              >
                                <a
                                  href={`#${item.anchorId}`}
                                  onClick={(e) => {
                                    e.preventDefault();
                                    const el = document.getElementById(item.anchorId);
                                    if (el) {
                                      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                      history.replaceState(null, '', `#${item.anchorId}`);
                                    }
                                  }}
                                  className={`block rounded px-1.5 py-0.5 hover:bg-secondary ${isActive ? 'bg-secondary text-foreground font-semibold' : 'text-muted-foreground'}`}
                                  aria-current={isActive ? 'location' : undefined}
                                >
                                  <span className="tabular-nums">
                                    {/^[a-z]\.?$/.test(item.marker) ? item.marker : item.marker.replace(/\.$/, '') + '.'}
                                  </span>
                                  {item.label && <span className="italic ml-1">{item.label}</span>}
                                </a>
                              </li>
                            );
                          })}
                        </ol>
                        {(hiddenCount > 0 || isOutlineExpanded) && (
                          <div className="px-2 pb-2">
                            <button
                              type="button"
                              onClick={() => setOutlineExpanded(prev => ({ ...prev, [entryKey]: !isOutlineExpanded }))}
                              className="text-xs text-primary hover:underline"
                              data-testid={`outline-panel-toggle-${entryKey}`}
                              aria-expanded={isOutlineExpanded}
                              aria-controls={`outline-panel-${entryKey}`}
                            >
                              {isOutlineExpanded ? 'Hide nested items' : `Show nested items (${hiddenCount} more)`}
                            </button>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
                );
              })}
              {/* Floating hamburger — visible while results are on screen so
                  the outline stays reachable even when the entry header has
                  scrolled off. Targets the entry whose section is currently
                  in view, falling back to the first entry. */}
              {(() => {
                const firstKey = results[0]?.rid || (results.length ? '0' : null);
                const targetKey = activeEntryKey ?? firstKey;
                if (!targetKey) return null;
                const targetEntry = results.find((e, i) => (e.rid || `${i}`) === targetKey);
                if (!targetEntry || !buildOutline(targetEntry.content.senses, targetKey)) return null;
                const isOpen = openOutlineEntry === targetKey;
                return (
                  <button
                    type="button"
                    onClick={(e) => {
                      if (!isOpen) outlineTriggerRef.current = e.currentTarget;
                      setOpenOutlineEntry(isOpen ? null : targetKey);
                    }}
                    className="fixed top-20 left-4 z-40 px-2 py-1.5 rounded bg-card border border-border shadow-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors text-lg leading-none"
                    title="Show outline"
                    aria-label="Show outline"
                    aria-expanded={isOpen}
                    data-testid={`outline-toggle-floating`}
                  >
                    ☰
                  </button>
                );
              })()}
            </div>
          )}
        </div>
        )}
    </PageShell>
  );
}
