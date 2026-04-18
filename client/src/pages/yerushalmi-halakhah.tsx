import { useEffect, useMemo, useCallback, useState, useTransition } from "react";
import { useParams, useLocation, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertCircle, ChevronLeft, ChevronRight, ExternalLink as ExternalLinkIcon, Link as LinkIcon, Check } from "lucide-react";
import { HamburgerMenu } from "@/components/navigation/hamburger-menu";
import { BreadcrumbNavigation } from "@/components/navigation/breadcrumb-navigation";
import { Footer } from "@/components/footer";
import { usePreferences } from "@/context/preferences-context";
import { useSEO } from "@/hooks/use-seo";
import { processHebrewText, processEnglishText, linkBibleCitations, replaceTerms } from "@/lib/text-processing";
import { useGazetteerData, TextHighlighter, type HighlightCategory } from "@/lib/gazetteer";
import {
  normalizeYerushalmiTractateName,
  isValidYerushalmiTractate,
  getYerushalmiTractateInfo,
  getYerushalmiTractateSlug,
  YERUSHALMI_HEBREW_NAMES,
  parseChapterHalakhah,
} from "@shared/yerushalmi-data";
import type { TalmudLocation } from "@/types/talmud";
import NotFound from "@/pages/not-found";
import { apiRequest } from "@/lib/queryClient";
import { getYerushalmiHalakhahLinks } from "@/lib/yerushalmi-external-links";

interface YerushalmiHalakhahData {
  tractate: string;
  chapter: number;
  halakhah: number;
  totalChapters: number;
  totalHalakhotInChapter: number;
  hebrewSections: string[];
  englishSections: string[];
  sefariaRef: string;
  sectionRefs?: string[];
}

interface ShapeData {
  shapes: number[][];
}

interface FootnoteEntry {
  num: string;
  noteHtml: string;
}

function convertNoteLinks(html: string): string {
  return html
    // 1. Yerushalmi cross-references → /yerushalmi/{tractate}/{chapter}.{halakhah}#{segment}
    .replace(
      /href="\/Jerusalem_Talmud_([^."]+(?:_[^."]+)*)\.(\d+)(?:\.(\d+))?(?:\.(\d+))?[^"]*"/g,
      (_match, tractate, chapter, halakhah, segment) => {
        const h = halakhah || '1';
        const seg = segment ? `#${segment}` : '';
        return `href="/yerushalmi/${tractate}/${chapter}.${h}${seg}"`;
      }
    )
    // 2. Bavli → /talmud/{tractate}/{daf}
    .replace(
      /href="\/([A-Z][a-zA-Z]+)\.(\d+[ab])[^"]*"/g,
      (_match, tractate, daf) => `href="/talmud/${tractate}/${daf}"`
    )
    // 3. Bible → /bible/{book}/{chapter}#verse
    .replace(
      /href="\/([A-Z][a-zA-Z_]*)\.(\d+)(?![ab])(?:\.(\d+)[\d\-]*)?[^"]*"/g,
      (_match, book, chapter, verse) => verse
        ? `href="/bible/${book}/${chapter}#${verse}"`
        : `href="/bible/${book}/${chapter}"`
    )
    // 4. Any remaining Sefaria relative links → absolute sefaria.org.il
    .replace(/href="(\/(?!(?:yerushalmi|talmud|bible)\/)[^"]+)"/g, (_match, path) => {
      return `href="https://www.sefaria.org.il${path}"`;
    });
}

function splitLineByColons(line: string): string[] {
  const parts = line.split(/(?<!\d): /);
  if (parts.length <= 1) return [line];
  return parts.map((part, i) => (i < parts.length - 1 ? part + ':' : part)).filter(s => s.trim());
}

function parseSectionFootnotes(html: string): { cleanedHtml: string; footnotes: FootnoteEntry[] } {
  const footnotes: FootnoteEntry[] = [];

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(`<div>${html}</div>`, 'text/html');
    const container = doc.body.firstElementChild as HTMLElement;

    const sups = Array.from(container.querySelectorAll('sup.footnote-marker, sup[class*="footnote"]'));
    for (const sup of sups) {
      const num = sup.textContent?.trim() || '';
      let sibling = sup.nextSibling;
      while (sibling && sibling.nodeType === Node.TEXT_NODE && (sibling.textContent || '').trim() === '') {
        sibling = sibling.nextSibling;
      }
      if (
        sibling &&
        sibling.nodeName === 'I' &&
        (sibling as Element).classList.contains('footnote')
      ) {
        footnotes.push({ num, noteHtml: convertNoteLinks(replaceTerms((sibling as Element).innerHTML)) });
        sibling.remove();
      }
      const newSup = doc.createElement('sup');
      newSup.className = 'text-[10px] text-blue-500 cursor-pointer hover:text-blue-700 transition-colors';
      newSup.title = `Jump to note ${num}`;
      newSup.setAttribute('data-note-ref', num);
      newSup.textContent = num;
      sup.replaceWith(newSup);
    }

    return { cleanedHtml: container.innerHTML, footnotes };
  } catch {
    return { cleanedHtml: html, footnotes };
  }
}

export default function YerushalmiHalakhah() {
  const { tractate, chapterHalakhah } = useParams<{ tractate: string; chapterHalakhah: string }>();
  const [, setLocation] = useLocation();
  const { preferences } = usePreferences();
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [expandedNotes, setExpandedNotes] = useState<Set<number>>(new Set());

  const tractateDisplayName = tractate ? normalizeYerushalmiTractateName(tractate) : null;
  const parsed = chapterHalakhah ? parseChapterHalakhah(chapterHalakhah) : null;
  const chapterNum = parsed?.chapter ?? NaN;
  const halakhahNum = parsed?.halakhah ?? NaN;
  const tractateInfo = tractateDisplayName ? getYerushalmiTractateInfo(tractateDisplayName) : null;

  const isInvalidTractate = tractate && !isValidYerushalmiTractate(tractate);
  const isInvalidChapterHalakhah = !parsed || (tractateInfo && (chapterNum < 1 || chapterNum > tractateInfo.chapters));

  const hebrewName = tractateDisplayName ? (YERUSHALMI_HEBREW_NAMES[tractateDisplayName] || tractateDisplayName) : "";
  const tractateSlug = tractateDisplayName ? getYerushalmiTractateSlug(tractateDisplayName) : "";

  // Legacy hash redirect: if URL is .1 with hash like "#H-S" (H>=1, S>=1), translate to /T/C.H#S
  // (For H=1, stay on the same page and just normalize the hash to "#S".)
  useEffect(() => {
    if (!tractateSlug || isNaN(chapterNum) || isNaN(halakhahNum)) return;
    if (halakhahNum !== 1) return;
    const hash = window.location.hash;
    const m = /^#(\d+)-(\d+)$/.exec(hash);
    if (!m) return;
    const h = parseInt(m[1], 10);
    const s = parseInt(m[2], 10);
    if (!h || !s) return;
    if (h === 1) {
      window.history.replaceState(null, '', `${window.location.pathname}#${s}`);
      const el = document.getElementById(String(s));
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    setLocation(`/yerushalmi/${tractateSlug}/${chapterNum}.${h}#${s}`, { replace: true });
  }, [tractateSlug, chapterNum, halakhahNum, setLocation]);

  useSEO({
    title: tractateDisplayName && !isNaN(chapterNum) && !isNaN(halakhahNum)
      ? `Jerusalem Talmud ${tractateDisplayName} ${chapterNum}:${halakhahNum} - Hebrew & English | ChavrutAI`
      : "Jerusalem Talmud | ChavrutAI",
    description: tractateDisplayName && !isNaN(chapterNum) && !isNaN(halakhahNum)
      ? `Study Jerusalem Talmud ${tractateDisplayName} Chapter ${chapterNum} Halakhah ${halakhahNum} with parallel Hebrew-English text (Guggenheimer translation). Free on ChavrutAI.`
      : "Study the Jerusalem Talmud with Hebrew-English text on ChavrutAI.",
    canonical: tractateDisplayName && !isNaN(chapterNum) && !isNaN(halakhahNum)
      ? `${window.location.origin}/yerushalmi/${tractateSlug}/${chapterNum}.${halakhahNum}`
      : `${window.location.origin}/yerushalmi`,
    robots: "index, follow",
  });

  const { data: gazetteerData } = useGazetteerData(preferences.highlighting.enabled);

  const enabledCategories = useMemo((): HighlightCategory[] => {
    if (!preferences.highlighting.enabled) return [];
    const cats: HighlightCategory[] = [];
    if (preferences.highlighting.concepts) cats.push('concept');
    if (preferences.highlighting.names) cats.push('name');
    if (preferences.highlighting.places) cats.push('place');
    return cats;
  }, [preferences.highlighting.enabled, preferences.highlighting.concepts, preferences.highlighting.names, preferences.highlighting.places]);

  const highlighter = useMemo(() => {
    if (!gazetteerData || enabledCategories.length === 0) return null;
    return new TextHighlighter(gazetteerData);
  }, [gazetteerData, enabledCategories]);

  const [, startTransition] = useTransition();
  const [deferredCategories, setDeferredCategories] = useState<HighlightCategory[]>([]);

  useEffect(() => {
    if (enabledCategories.length === 0) {
      setDeferredCategories([]);
    } else {
      startTransition(() => setDeferredCategories(enabledCategories));
    }
  }, [enabledCategories]);

  const applyHighlighting = useCallback((inputText: string): string => {
    if (!highlighter || deferredCategories.length === 0) return inputText;
    try {
      return highlighter.applyHighlighting(inputText, deferredCategories);
    } catch {
      return inputText;
    }
  }, [highlighter, deferredCategories]);

  const { data: textData, isLoading, error, refetch } = useQuery<YerushalmiHalakhahData>({
    queryKey: ['/api/yerushalmi', tractateSlug, chapterNum, halakhahNum],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/yerushalmi/${encodeURIComponent(tractateSlug)}/${chapterNum}/${halakhahNum}`);
      return response.json();
    },
    enabled: !isInvalidTractate && !isInvalidChapterHalakhah && !!tractateDisplayName && !isNaN(chapterNum) && !isNaN(halakhahNum),
  });

  // Fetch shape for cross-chapter navigation
  const { data: shapeData } = useQuery<ShapeData>({
    queryKey: ['/api/yerushalmi', tractateSlug, 'shape'],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/yerushalmi/${encodeURIComponent(tractateSlug)}/shape`);
      return response.json();
    },
    enabled: !!tractateSlug,
    staleTime: Infinity,
  });

  const processedSections = useMemo(() => {
    if (!textData) return [];
    const maxSections = Math.max(textData.hebrewSections.length, textData.englishSections.length);
    return Array.from({ length: maxSections }, (_, index) => {
      const hebrewSection = textData.hebrewSections[index] || '';
      const englishSection = textData.englishSections[index] || '';
      if (!hebrewSection.trim() && !englishSection.trim()) return null;

      const { cleanedHtml: rawCleanedHtml, footnotes: sectionFootnotes } = parseSectionFootnotes(englishSection);
      const cleanedHtml = convertNoteLinks(rawCleanedHtml);

      const englishLines = cleanedHtml.trim()
        ? processEnglishText(cleanedHtml).split('\n').flatMap((line: string) => splitLineByColons(line)).filter((line: string) => line.trim()).map((line: string) => applyHighlighting(linkBibleCitations(line.trim())))
        : [];

      const hebrewLines = hebrewSection.trim()
        ? processHebrewText(hebrewSection).split('\n').filter((line: string) => line.trim()).map((line: string) => applyHighlighting(line.trim()))
        : [];

      return { englishLines, sectionFootnotes, hebrewLines };
    });
  }, [textData, applyHighlighting]);

  // Cross-chapter prev/next navigation
  const { prevHref, nextHref, prevLabel, nextLabel } = useMemo(() => {
    if (!tractateSlug || isNaN(chapterNum) || isNaN(halakhahNum) || !tractateInfo) {
      return { prevHref: null as string | null, nextHref: null as string | null, prevLabel: '', nextLabel: '' };
    }
    const shapes = shapeData?.shapes ?? [];
    const halakhotInCurrent = textData?.totalHalakhotInChapter ?? shapes[chapterNum - 1]?.length ?? 0;

    let prev: string | null = null;
    let prevLbl = '';
    if (halakhahNum > 1) {
      prev = `/yerushalmi/${tractateSlug}/${chapterNum}.${halakhahNum - 1}`;
      prevLbl = `${chapterNum}:${halakhahNum - 1}`;
    } else if (chapterNum > 1) {
      const prevChCount = shapes[chapterNum - 2]?.length ?? 0;
      if (prevChCount > 0) {
        prev = `/yerushalmi/${tractateSlug}/${chapterNum - 1}.${prevChCount}`;
        prevLbl = `${chapterNum - 1}:${prevChCount}`;
      }
    }

    let next: string | null = null;
    let nextLbl = '';
    if (halakhotInCurrent > 0 && halakhahNum < halakhotInCurrent) {
      next = `/yerushalmi/${tractateSlug}/${chapterNum}.${halakhahNum + 1}`;
      nextLbl = `${chapterNum}:${halakhahNum + 1}`;
    } else if (chapterNum < tractateInfo.chapters) {
      next = `/yerushalmi/${tractateSlug}/${chapterNum + 1}.1`;
      nextLbl = `${chapterNum + 1}:1`;
    }

    return { prevHref: prev, nextHref: next, prevLabel: prevLbl, nextLabel: nextLbl };
  }, [tractateSlug, chapterNum, halakhahNum, tractateInfo, shapeData, textData]);

  const handleLocationChange = (_newLocation: TalmudLocation) => {
    setLocation('/');
  };

  const toggleNotes = (sectionIndex: number) => {
    setExpandedNotes(prev => {
      const next = new Set(prev);
      if (next.has(sectionIndex)) next.delete(sectionIndex);
      else next.add(sectionIndex);
      return next;
    });
  };

  const copySectionUrl = (s: number) => {
    const key = `${s}`;
    const url = `${window.location.origin}${window.location.pathname}#${key}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedSection(key);
      setTimeout(() => setCopiedSection(null), 2000);
    });
  };

  // Scroll to hash anchor (#N) after data loads
  useEffect(() => {
    const hash = window.location.hash;
    if (hash && /^#\d+$/.test(hash)) {
      const id = hash.slice(1);
      setTimeout(() => {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [textData]);

  useEffect(() => {
    const container = document.querySelector('.bg-card.rounded-lg.shadow-sm.border.border-border.p-6');
    if (!container) return;

    const handleCopy = (e: ClipboardEvent) => {
      const selection = window.getSelection();
      if (!selection || !selection.rangeCount) return;

      const range = selection.getRangeAt(0);
      const fragment = range.cloneContents();
      const tempDiv = document.createElement('div');
      tempDiv.appendChild(fragment);

      const removeExternalLinkArrow = (element: HTMLElement): void => {
        const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null);
        const updates: { node: Text; newValue: string }[] = [];
        let node: Node | null;
        while ((node = walker.nextNode())) {
          if (node.nodeType === Node.TEXT_NODE && node.textContent) {
            const cleaned = node.textContent.replace(/↗/g, '').trim();
            if (cleaned !== node.textContent.trim()) {
              updates.push({ node: node as Text, newValue: cleaned });
            }
          }
        }
        updates.forEach(({ node: n, newValue }) => { n.textContent = newValue; });
      };

      removeExternalLinkArrow(tempDiv);

      const sectionLinks = tempDiv.querySelectorAll('[data-testid^="link-sefaria-section-"]');
      sectionLinks.forEach(link => {
        const parent = link.parentElement;
        if (parent) parent.remove();
      });

      const sectionBadges = tempDiv.querySelectorAll('.bg-secondary.text-secondary-foreground');
      sectionBadges.forEach(badge => {
        const headerRow = badge.closest('.flex.items-center.justify-center');
        if (headerRow) headerRow.remove();
      });

      tempDiv.querySelectorAll('.mt-4.pt-3.border-t').forEach(el => el.remove());
      tempDiv.querySelectorAll('sup[data-note-ref]').forEach(el => el.remove());

      const textDisplays = tempDiv.querySelectorAll('.text-display');
      textDisplays.forEach(display => {
        const englishCol = display.querySelector('.lg\\:order-1');
        const hebrewCol = display.querySelector('.lg\\:order-2');
        if (englishCol && hebrewCol && englishCol.parentNode === hebrewCol.parentNode) {
          const parent = englishCol.parentNode;
          if (parent && parent.contains(hebrewCol) && parent.contains(englishCol)) {
            const hebrewClone = hebrewCol.cloneNode(true);
            parent.insertBefore(hebrewClone, englishCol);
            parent.removeChild(hebrewCol);
          }
        }
      });

      const stripFormatting = (element: HTMLElement): string => {
        const allowedTags = ['strong', 'b', 'i', 'em', 'p', 'div', 'br', 'span', 'a', 'sup', 'sub', 'small'];
        const walker = document.createTreeWalker(element, NodeFilter.SHOW_ELEMENT, null);
        const nodesToProcess: Element[] = [];
        let wNode: Node | null;
        while ((wNode = walker.nextNode())) nodesToProcess.push(wNode as Element);

        nodesToProcess.forEach(n => {
          const tagName = n.tagName.toLowerCase();
          if (!allowedTags.includes(tagName)) {
            const parent = n.parentNode;
            if (!parent) return;
            while (n.firstChild) parent.insertBefore(n.firstChild, n);
            parent.removeChild(n);
          } else {
            const el = n as HTMLElement;
            const attrsToKeep = ['dir', 'style', 'href', 'target', 'rel', 'class'];
            const attrsToRemove: string[] = [];
            for (let i = 0; i < el.attributes.length; i++) {
              const attrName = el.attributes[i].name;
              if (!attrsToKeep.includes(attrName) && !attrName.startsWith('data-')) {
                attrsToRemove.push(attrName);
              }
            }
            attrsToRemove.forEach(attr => el.removeAttribute(attr));

            const styleUpdates: Record<string, string> = {};
            if (tagName === 'strong' || tagName === 'b') styleUpdates['font-weight'] = 'bold';
            if (tagName === 'em' || tagName === 'i') styleUpdates['font-style'] = 'italic';

            const isHebrew = (el.hasAttribute('dir') && el.getAttribute('dir') === 'rtl') ||
                            el.classList.contains('hebrew-text') ||
                            el.closest('.hebrew-text');
            if (isHebrew) {
              styleUpdates['direction'] = 'rtl';
              styleUpdates['font-weight'] = 'bold';
            }

            if (Object.keys(styleUpdates).length > 0) {
              const currentStyle = el.getAttribute('style') || '';
              const existing = currentStyle.split(';').filter(s => s.trim()).reduce((acc, s) => {
                const [key, value] = s.split(':').map(x => x.trim());
                if (key && value && !styleUpdates.hasOwnProperty(key)) acc[key] = value;
                return acc;
              }, {} as Record<string, string>);
              const merged = { ...existing, ...styleUpdates };
              el.setAttribute('style', Object.entries(merged).map(([k, v]) => `${k}: ${v}`).join('; '));
            }
          }
        });
        return element.innerHTML;
      };

      const cleanHTML = stripFormatting(tempDiv);

      const getPlainText = (element: HTMLElement, isRoot = true): string => {
        let text = '';
        element.childNodes.forEach(node => {
          if (node.nodeType === Node.TEXT_NODE) {
            text += node.textContent;
          } else if (node.nodeType === Node.ELEMENT_NODE) {
            const el = node as HTMLElement;
            const tag = el.tagName.toLowerCase();
            if (tag === 'br') text += '\n';
            else if (tag === 'p' || tag === 'div') text += getPlainText(el, false) + '\n';
            else text += getPlainText(el, false);
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
    return () => container.removeEventListener('copy', handleCopy as EventListener);
  }, [textData]);

  if (isInvalidTractate || isInvalidChapterHalakhah) {
    return <NotFound />;
  }

  if (!tractateDisplayName || isNaN(chapterNum) || isNaN(halakhahNum)) {
    return <NotFound />;
  }

  const getHebrewFontClass = () => `hebrew-font-${preferences.hebrewFont}`;

  const segmentJumpTargets = processedSections
    .map((section, index) => ({ section, s: index + 1 }))
    .filter(({ section }) => section !== null);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-card border-b border-border shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center flex-shrink-0">
              <HamburgerMenu onLocationChange={handleLocationChange} />
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              {nextHref && (
                <Link href={nextHref}>
                  <Button variant="outline" size="sm" className="flex items-center gap-1 px-2 py-2">
                    <ChevronLeft className="w-3 h-3" />
                    <span className="text-xs">Next ({nextLabel})</span>
                  </Button>
                </Link>
              )}
            </div>

            <div className="flex-1 flex items-center justify-center min-w-0">
              <div className="text-center">
                <Link href={`/yerushalmi/${tractateSlug}`} className="text-sm font-semibold text-primary hover:underline">
                  {tractateDisplayName}
                </Link>
                <div className="text-xs text-muted-foreground">
                  Chapter {chapterNum} · Halakhah {halakhahNum}
                  {textData ? ` of ${textData.totalHalakhotInChapter}` : ''}
                </div>
                <div className="text-xs text-muted-foreground/70">Jerusalem Talmud</div>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              {prevHref && (
                <Link href={prevHref}>
                  <Button variant="outline" size="sm" className="flex items-center gap-1 px-2 py-2">
                    <span className="text-xs">Previous ({prevLabel})</span>
                    <ChevronRight className="w-3 h-3" />
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className={`max-w-4xl mx-auto px-4 py-6 text-size-${preferences.textSize} hebrew-font-${preferences.hebrewFont} english-font-${preferences.englishFont} layout-${preferences.layout}`}>
        <h1 className="sr-only">Jerusalem Talmud {tractateDisplayName} Chapter {chapterNum} Halakhah {halakhahNum}</h1>

        <BreadcrumbNavigation
          items={[
            { label: "Jerusalem Talmud", href: "/yerushalmi" },
            { label: tractateDisplayName, href: `/yerushalmi/${tractateSlug}` },
            { label: `Chapter ${chapterNum}`, href: `/yerushalmi/${tractateSlug}/${chapterNum}.1` },
            { label: `Halakhah ${halakhahNum}` },
          ]}
        />

        {error && (
          <Alert className="mb-6 border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Failed to load text. Please try again.
              <Button variant="outline" size="sm" onClick={() => refetch()} className="ml-2">
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {isLoading && (
          <div className="space-y-4 mb-6">
            <div className="h-4 bg-muted rounded animate-pulse"></div>
            <div className="h-4 bg-muted rounded animate-pulse w-3/4"></div>
            <div className="h-4 bg-muted rounded animate-pulse w-1/2"></div>
          </div>
        )}

        {textData && !isLoading && (
          <div className="space-y-6">
            {segmentJumpTargets.length > 1 && (
              <>
                <p className="text-center text-xs text-muted-foreground mb-1">Jump to section:</p>
                <div className="flex flex-wrap gap-2 justify-center py-3">
                  {segmentJumpTargets.map(({ s }) => (
                    <a
                      key={s}
                      href={`#${s}`}
                      className="inline-flex items-center justify-center min-w-[2.25rem] h-9 px-2 rounded text-sm font-medium bg-secondary text-secondary-foreground hover:bg-secondary/70 transition-colors"
                      title={`Jump to section ${s}`}
                    >
                      {s}
                    </a>
                  ))}
                </div>
              </>
            )}

            <div className="bg-card rounded-lg shadow-sm border border-border p-6">
              <div
                onClick={(e) => {
                  const target = e.target as HTMLElement;
                  if (target.tagName !== 'SUP' || !target.dataset.noteRef) return;
                  const num = target.dataset.noteRef;
                  const segDiv = target.closest('[data-segment-index]') as HTMLElement | null;
                  if (!segDiv) return;
                  const sectionIndex = parseInt(segDiv.dataset.segmentIndex || '0', 10);
                  setExpandedNotes(prev => new Set([...prev, sectionIndex]));
                  setTimeout(() => {
                    const noteEl = document.getElementById(`note-${sectionIndex}-${num}`);
                    if (noteEl) noteEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }, 50);
                }}
              >
                <div className="space-y-8">
                  {processedSections.map((section, index) => {
                    if (!section) return null;
                    const s = index + 1;
                    const sectionRef = textData.sectionRefs?.[index];
                    const sefariaUrl = sectionRef
                      ? `https://www.sefaria.org.il/${sectionRef}`
                      : `https://www.sefaria.org.il/${textData.sefariaRef.replace(/ /g, '_')}`;
                    const sectionKey = `${s}`;

                    return (
                      <div
                        key={index}
                        id={sectionKey}
                        data-segment-index={index}
                        className="border-b border-border/50 pb-6 last:border-b-0 last:pb-0 scroll-mt-24"
                      >
                        <div className="flex items-center justify-center gap-3 mb-4">
                          <span className="bg-secondary text-secondary-foreground px-3 py-1 rounded-full text-sm font-semibold font-mono">
                            section {s}
                          </span>
                          <button
                            onClick={() => copySectionUrl(s)}
                            className="text-muted-foreground hover:text-foreground text-sm flex items-center gap-1 transition-colors"
                            title={`Copy link to section ${s}`}
                          >
                            {copiedSection === sectionKey ? (
                              <>
                                <Check className="w-3 h-3 text-green-500" />
                                <span className="text-green-500 text-xs">Copied!</span>
                              </>
                            ) : (
                              <LinkIcon className="w-3 h-3" />
                            )}
                          </button>
                          <span className="w-px h-4 bg-border" />
                          <a
                            href={sefariaUrl}
                            target="_blank"
                            rel="nofollow noopener noreferrer"
                            className="text-blue-600 dark:text-blue-400 hover:underline text-sm flex items-center gap-1"
                            title={`View ${chapterNum}:${halakhahNum}:${s} on Sefaria`}
                          >
                            Sefaria
                            <ExternalLinkIcon className="w-3 h-3" />
                          </a>
                        </div>

                        <div className="yerushalmi-text-display text-display flex flex-col lg:flex-row gap-6">
                          <div className="text-column space-y-3 lg:order-1">
                            {section.englishLines.length > 0 ? (
                              <div className="english-text text-foreground space-y-1.5">
                                {section.englishLines.map((line, lineIndex) => (
                                  <div
                                    key={lineIndex}
                                    dangerouslySetInnerHTML={{ __html: line }}
                                  />
                                ))}
                              </div>
                            ) : (
                              <p className="text-xs text-muted-foreground italic">English translation not available.</p>
                            )}
                          </div>

                          <div className="text-column space-y-3 lg:order-2">
                            {section.hebrewLines.length > 0 ? (
                              <div className={`hebrew-text text-foreground ${getHebrewFontClass()} space-y-3`}>
                                {section.hebrewLines.map((line, lineIndex) => (
                                  <div key={lineIndex}>
                                    <p className="leading-relaxed">
                                      <span dangerouslySetInnerHTML={{ __html: line }} />
                                    </p>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-xs text-muted-foreground italic text-right" dir="rtl">טקסט עברי אינו זמין.</p>
                            )}
                          </div>
                        </div>

                        {section.sectionFootnotes.length > 0 && (
                          <div className="mt-4 pt-3 border-t border-border/40">
                            <button
                              onClick={() => toggleNotes(index)}
                              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                            >
                              <span>{expandedNotes.has(index) ? '▼' : '▶'}</span>
                              {expandedNotes.has(index)
                                ? 'Hide notes'
                                : `Notes (${section.sectionFootnotes.length})`}
                            </button>
                            {expandedNotes.has(index) && (
                              <div className="mt-3 space-y-2 text-sm text-muted-foreground max-w-prose">
                                {section.sectionFootnotes.map((fn, fnIdx) => (
                                  <div key={fnIdx} id={`note-${index}-${fn.num}`} className="flex gap-2 scroll-mt-24">
                                    <sup className="text-[10px] leading-5 flex-shrink-0 font-medium">{fn.num}</sup>
                                    <span dangerouslySetInnerHTML={{ __html: fn.noteHtml }} />
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mt-8 pt-6 border-t border-border">
          <div className="flex justify-between items-center">
            {nextHref ? (
              <Link href={nextHref}>
                <Button variant="outline" className="flex items-center space-x-2 px-6 py-3">
                  <ChevronLeft className="w-4 h-4 text-primary" />
                  <span className="text-primary font-medium">
                    Next ({nextLabel})
                  </span>
                </Button>
              </Link>
            ) : (
              <div />
            )}
            {prevHref ? (
              <Link href={prevHref}>
                <Button variant="outline" className="flex items-center space-x-2 px-6 py-3">
                  <span className="text-primary font-medium">
                    Previous ({prevLabel})
                  </span>
                  <ChevronRight className="w-4 h-4 text-primary" />
                </Button>
              </Link>
            ) : (
              <div />
            )}
          </div>
        </div>

        {textData && tractateDisplayName && (
          <div className="mt-8 pt-6 border-t border-border" data-testid="external-links-footer">
            <div className="flex flex-wrap items-center gap-4">
              <span className="text-lg font-semibold text-foreground">External Links:</span>
              {getYerushalmiHalakhahLinks(tractateDisplayName, chapterNum, halakhahNum, textData.sefariaRef).map((link) => (
                <a
                  key={link.name}
                  href={link.url}
                  target="_blank"
                  rel="nofollow noopener noreferrer"
                  className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                  title={link.description}
                >
                  {link.name}
                  <ExternalLinkIcon className="w-3.5 h-3.5" />
                </a>
              ))}
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
