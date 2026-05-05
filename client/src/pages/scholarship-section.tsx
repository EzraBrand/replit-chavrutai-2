import { useState, useEffect, useMemo, useRef } from "react";
import { useRoute, Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Footer } from "@/components/footer";
import { useSEO } from "@/hooks/use-seo";
import { apiRequest } from "@/lib/queryClient";
import { isValidScholarshipWork } from "@shared/data/scholarship-works";
import { usePreferences, type TextSize, type HebrewFont, type Theme } from "@/context/preferences-context";
import { convertSefariaLinksToInternal } from "@/lib/dictionary-format";
import NotFound from "@/pages/not-found";
import { Type, ArrowUp, ChevronLeft, ChevronRight, X } from "lucide-react";

interface SectionData {
  title: string;
  heTitle: string;
  paragraphs: string[];
  prevSection: { slug: string; title: string } | null;
  nextSection: { slug: string; title: string } | null;
}

interface FootnoteEntry {
  id: string;
  num: string;
  noteHtml: string;
  paraIndex: number;
}

interface ProcessedParagraph {
  html: string;
  footnotes: FootnoteEntry[];
}

interface PopoverState {
  id: string;
  html: string;
  top: number;
  left: number;
  showAbove: boolean;
}

const TEXT_SIZE_OPTIONS: { value: TextSize; label: string }[] = [
  { value: "extra-small", label: "Extra Small" },
  { value: "small", label: "Small" },
  { value: "medium", label: "Medium" },
  { value: "large", label: "Large" },
  { value: "extra-large", label: "Extra Large" },
];

const HEBREW_FONT_OPTIONS: { value: HebrewFont; label: string }[] = [
  { value: "assistant", label: "Assistant" },
  { value: "noto-serif-hebrew", label: "Noto Serif Hebrew" },
  { value: "noto-sans-hebrew", label: "Noto Sans Hebrew" },
  { value: "frank-ruehl", label: "Frank Rühl" },
  { value: "david-libre", label: "David Libre" },
  { value: "times", label: "Times New Roman" },
];

const THEME_OPTIONS: { value: Theme; label: string }[] = [
  { value: "white", label: "White" },
  { value: "paper", label: "Paper" },
  { value: "dark", label: "Dark" },
  { value: "high-contrast", label: "High Contrast" },
];

/** Extract <sup class="footnote-marker"> + <i class="footnote"> pairs from HTML.
 *  Replaces each pair with a clickable anchor that links to the footnote list. */
function parseFootnotes(html: string, paraIndex: number): ProcessedParagraph {
  const footnotes: FootnoteEntry[] = [];
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(`<div>${html}</div>`, "text/html");
    const container = doc.body.firstElementChild as HTMLElement;

    const sups = Array.from(
      container.querySelectorAll('sup.footnote-marker, sup[class*="footnote"]')
    );
    for (const sup of sups) {
      const num = sup.textContent?.trim() || "";
      const id = `fn-${paraIndex}-${num}`;
      // Find adjacent <i class="footnote"> sibling
      let sibling: ChildNode | null = sup.nextSibling;
      while (
        sibling &&
        sibling.nodeType === Node.TEXT_NODE &&
        (sibling.textContent || "").trim() === ""
      ) {
        sibling = sibling.nextSibling;
      }
      if (
        sibling &&
        sibling.nodeName === "I" &&
        (sibling as Element).classList.contains("footnote")
      ) {
        footnotes.push({
          id,
          num,
          noteHtml: (sibling as Element).innerHTML,
          paraIndex,
        });
        (sibling as Element).remove();
      }
      // Replace <sup> with a small clickable anchor
      const anchor = doc.createElement("a");
      anchor.href = `#${id}`;
      anchor.className = "scholarship-fn-ref";
      anchor.setAttribute("data-fn-id", id);
      anchor.textContent = num;
      sup.replaceWith(anchor);
    }
    return { html: container.innerHTML, footnotes };
  } catch {
    return { html, footnotes };
  }
}

/** Rewrite Sefaria hrefs → internal ChavrutAI routes; add target/rel to remaining external links. */
function processLinks(html: string): string {
  let result = convertSefariaLinksToInternal(html);
  result = result.replace(
    /<a([^>]*?)href="(https?:\/\/[^"]+)"([^>]*?)>/g,
    (_m, before, href, after) => {
      const attrs = before + after;
      const hasTarget = /target=/.test(attrs);
      if (!hasTarget) {
        return `<a${attrs} href="${href}" target="_blank" rel="noopener noreferrer">`;
      }
      return `<a${attrs} href="${href}">`;
    }
  );
  return result;
}

export default function ScholarshipSection() {
  const [match, params] = useRoute("/scholarship/:workSlug/:sectionSlug");
  const [, setLocation] = useLocation();
  const workSlug = params?.workSlug || "";
  const sectionSlug = params?.sectionSlug || "";
  const { preferences, setTextSize, setHebrewFont, setTheme } = usePreferences();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [readingProgress, setReadingProgress] = useState(0);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [lineHeight, setLineHeight] = useState<number>(() => {
    const stored = localStorage.getItem("scholarship-line-height");
    return stored ? parseFloat(stored) : 1.8;
  });
  const [notesExpanded, setNotesExpanded] = useState(false);
  const [activePopover, setActivePopover] = useState<PopoverState | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem("scholarship-line-height", String(lineHeight));
  }, [lineHeight]);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      setReadingProgress(docHeight > 0 ? Math.min(100, (scrollTop / docHeight) * 100) : 0);
      setShowBackToTop(scrollTop > 400);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close popover on outside click or Escape
  useEffect(() => {
    if (!activePopover) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setActivePopover(null);
    };
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        !target.closest(".fn-popover") &&
        !target.closest(".scholarship-fn-ref")
      ) {
        setActivePopover(null);
      }
    };
    document.addEventListener("keydown", handleKey);
    document.addEventListener("mousedown", handleClick, true);
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.removeEventListener("mousedown", handleClick, true);
    };
  }, [activePopover]);

  const { data, isLoading, error, refetch } = useQuery<SectionData>({
    queryKey: ["/api/scholarship", workSlug, "section", sectionSlug],
    queryFn: async () => {
      const res = await apiRequest(
        "GET",
        `/api/scholarship/${encodeURIComponent(workSlug)}/section?sectionSlug=${encodeURIComponent(sectionSlug)}`
      );
      if (!res.ok) throw new Error("Failed to load section");
      return res.json();
    },
    enabled: !!workSlug && !!sectionSlug && isValidScholarshipWork(workSlug),
    staleTime: 0,
  });

  // Process paragraphs: extract footnotes + rewrite links (memoised on data)
  const processedData = useMemo(() => {
    if (!data) return null;
    const allFootnotes: FootnoteEntry[] = [];
    const paragraphs = data.paragraphs.map((para, i) => {
      const withLinks = processLinks(para);
      const { html, footnotes } = parseFootnotes(withLinks, i);
      allFootnotes.push(...footnotes);
      return html;
    });
    const footnotesByPara = new Map<number, FootnoteEntry[]>();
    for (const fn of allFootnotes) {
      const arr = footnotesByPara.get(fn.paraIndex) || [];
      arr.push(fn);
      footnotesByPara.set(fn.paraIndex, arr);
    }
    return { paragraphs, footnotes: allFootnotes, footnotesByPara };
  }, [data]);

  useSEO(
    data
      ? {
          title: `${data.title} — ${workSlug === "introductions-tanaitic" ? "Introductions to Tanaitic Literature" : "Introductions to Amoraic Literature"} | ChavrutAI`,
          description: `Read ${data.title} from the modern scholarship collection on ChavrutAI.`,
          canonical: `${window.location.origin}/scholarship/${workSlug}/${sectionSlug}`,
        }
      : {
          title: "Modern Scholarship | ChavrutAI",
          description: "Academic scholarship on classical Jewish texts.",
          canonical: `${window.location.origin}/scholarship/${workSlug}/${sectionSlug}`,
        }
  );

  if (!match || !isValidScholarshipWork(workSlug)) return <NotFound />;

  const workTitle =
    workSlug === "introductions-tanaitic"
      ? "Introductions to Tanaitic Literature"
      : "Introductions to Amoraic Literature";

  /** Click delegation: internal links use wouter, footnote anchors open popover. */
  const handleContentClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const anchor = (e.target as HTMLElement).closest("a");
    if (!anchor) return;
    const href = anchor.getAttribute("href");
    if (!href) return;
    // Internal ChavrutAI route
    if (href.startsWith("/") && !href.startsWith("//")) {
      e.preventDefault();
      setLocation(href);
      return;
    }
    // Footnote reference anchor (#fn-...) → show popover
    if (href.startsWith("#fn-")) {
      e.preventDefault();
      const fnId = href.slice(1);
      // Toggle off if already open
      if (activePopover?.id === fnId) {
        setActivePopover(null);
        return;
      }
      const fn = processedData?.footnotes.find((f) => f.id === fnId);
      if (fn) {
        const rect = anchor.getBoundingClientRect();
        const POPOVER_W = 320;
        const POPOVER_H_ESTIMATE = 130;
        const spaceBelow = window.innerHeight - rect.bottom;
        const showAbove = spaceBelow < POPOVER_H_ESTIMATE && rect.top > POPOVER_H_ESTIMATE;
        const left = Math.max(8, Math.min(rect.left - POPOVER_W / 2 + rect.width / 2, window.innerWidth - POPOVER_W - 8));
        const top = showAbove ? rect.top - POPOVER_H_ESTIMATE - 8 : rect.bottom + 6;
        setActivePopover({ id: fnId, html: fn.noteHtml, top, left, showAbove });
      }
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* ── Header ── */}
      <header className="sticky top-0 z-50 bg-card border-b border-border shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-3 relative">
          <div className="flex items-center">
            <div className="w-32 flex-shrink-0" />
            <div className="flex-1 flex justify-center">
              <Link
                href="/"
                className="flex items-center space-x-2 hover:opacity-80 transition-opacity duration-200"
              >
                <div className="w-9 h-9 rounded-full flex items-center justify-center overflow-hidden">
                  <img src="/hebrew-book-icon.png" alt="ChavrutAI Logo" className="w-9 h-9 object-cover" />
                </div>
                <div className="text-lg font-semibold text-primary font-roboto">ChavrutAI</div>
              </Link>
            </div>
            <div className="w-32 flex-shrink-0 flex justify-end">
              <Sheet open={settingsOpen} onOpenChange={setSettingsOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 border-primary/40 text-primary hover:bg-primary/5 font-medium"
                  >
                    <Type className="w-4 h-4" />
                    Display
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-72">
                  <SheetHeader>
                    <SheetTitle className="text-left">Display Settings</SheetTitle>
                  </SheetHeader>
                  <div className="pt-6 space-y-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Theme</label>
                      <div className="grid grid-cols-2 gap-2">
                        {THEME_OPTIONS.map((o) => (
                          <button
                            key={o.value}
                            onClick={() => setTheme(o.value)}
                            className={`text-sm px-3 py-2 rounded border transition-colors ${
                              preferences.theme === o.value
                                ? "border-primary bg-primary/10 text-primary font-medium"
                                : "border-border hover:border-primary/50 text-foreground"
                            }`}
                          >
                            {o.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <Separator />
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Text Size</label>
                      <Select value={preferences.textSize} onValueChange={(v) => setTextSize(v as TextSize)}>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TEXT_SIZE_OPTIONS.map((o) => (
                            <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Separator />
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-foreground">Line Spacing</label>
                        <span className="text-sm text-muted-foreground tabular-nums">{lineHeight.toFixed(1)}×</span>
                      </div>
                      <input
                        type="range"
                        min={1.4}
                        max={2.8}
                        step={0.2}
                        value={lineHeight}
                        onChange={(e) => setLineHeight(parseFloat(e.target.value))}
                        className="w-full accent-primary cursor-pointer"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Tight</span>
                        <span>Loose</span>
                      </div>
                    </div>
                    <Separator />
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Hebrew Font</label>
                      <Select value={preferences.hebrewFont} onValueChange={(v) => setHebrewFont(v as HebrewFont)}>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {HEBREW_FONT_OPTIONS.map((o) => (
                            <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
        {/* Reading progress bar */}
        <div
          className="absolute bottom-0 left-0 h-0.5 bg-primary transition-[width] duration-75"
          style={{ width: `${readingProgress}%` }}
        />
      </header>

      <main
        className={`max-w-2xl xl:max-w-5xl mx-auto px-4 py-10 text-size-${preferences.textSize} hebrew-font-${preferences.hebrewFont} scholarship-prose`}
      >
        {/* Breadcrumb */}
        <nav className="text-sm text-muted-foreground mb-8 max-w-2xl">
          <Link href="/" className="hover:text-primary transition-colors">Home</Link>
          <span className="mx-2">›</span>
          <Link href="/scholarship" className="hover:text-primary transition-colors">Modern Scholarship</Link>
          <span className="mx-2">›</span>
          <Link href={`/scholarship/${workSlug}`} className="hover:text-primary transition-colors">
            {workTitle}
          </Link>
          {data && (
            <>
              <span className="mx-2">›</span>
              <span className="text-foreground">{data.title}</span>
            </>
          )}
        </nav>

        {isLoading && (
          <div className="space-y-6 max-w-2xl">
            <div className="h-8 w-2/3 bg-muted animate-pulse rounded" />
            <div className="h-6 w-1/2 bg-muted animate-pulse rounded" />
            <div className="mt-8 space-y-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-5 bg-muted animate-pulse rounded" style={{ width: `${78 + (i % 3) * 7}%` }} />
              ))}
            </div>
          </div>
        )}

        {error && (
          <Alert variant="destructive" className="mb-6 max-w-2xl">
            <AlertDescription className="flex items-center justify-between">
              <span>Failed to load this section.</span>
              <Button variant="outline" size="sm" onClick={() => refetch()}>Retry</Button>
            </AlertDescription>
          </Alert>
        )}

        {data && processedData && (
          <>
            {/* Section heading */}
            <div className="mb-8 max-w-2xl">
              <h1 className="text-2xl font-bold text-foreground mb-1 leading-tight">{data.title}</h1>
              <div className="text-lg text-muted-foreground hebrew-text" style={{ direction: "rtl", textAlign: "right" }}>
                {data.heTitle}
              </div>
            </div>

            {/* Paragraph jump anchors */}
            {processedData.paragraphs.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-8 max-w-2xl">
                {processedData.paragraphs.map((_, i) => (
                  <a
                    key={i}
                    href={`#p${i + 1}`}
                    className="text-xs text-primary border border-border rounded px-2 py-1 hover:bg-secondary transition-colors duration-100"
                  >
                    {i + 1}
                  </a>
                ))}
              </div>
            )}

            {/* Hebrew prose — with margin notes on xl */}
            <div className="space-y-5" onClick={handleContentClick}>
              {processedData.paragraphs.map((html, i) => {
                const paraFns = processedData.footnotesByPara.get(i) || [];
                return (
                  <div
                    key={i}
                    id={`p${i + 1}`}
                    className="scroll-mt-20 xl:grid xl:grid-cols-[minmax(0,1fr)_220px] xl:gap-6 xl:items-start"
                  >
                    {/* Paragraph text */}
                    <div className="flex gap-4 items-start">
                      <span className="text-xs text-muted-foreground/40 mt-1.5 w-5 text-right flex-shrink-0 select-none">
                        {i + 1}
                      </span>
                      <p
                        className="flex-1 text-foreground hebrew-text"
                        style={{ direction: "rtl", textAlign: "right", lineHeight }}
                        dangerouslySetInnerHTML={{ __html: html }}
                      />
                    </div>

                    {/* Margin notes — desktop only */}
                    {paraFns.length > 0 ? (
                      <div className="hidden xl:block border-r border-border/40 pr-4 space-y-2 pt-0.5">
                        {paraFns.map((fn) => (
                          <div
                            key={fn.id}
                            id={fn.id}
                            className={`flex gap-1.5 items-baseline transition-colors duration-150 rounded px-1 -mx-1 ${
                              activePopover?.id === fn.id ? "bg-primary/8" : ""
                            }`}
                          >
                            <span className="text-[10px] font-semibold text-primary/60 flex-shrink-0 mt-0.5">
                              {fn.num}
                            </span>
                            <span
                              className="text-[11px] leading-snug text-muted-foreground/80 hebrew-text scholarship-footnotes"
                              style={{ direction: "rtl" }}
                              dangerouslySetInnerHTML={{ __html: fn.noteHtml }}
                            />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="hidden xl:block" />
                    )}
                  </div>
                );
              })}
            </div>

            {processedData.paragraphs.length === 0 && (
              <p className="text-muted-foreground text-sm italic">No text available for this section.</p>
            )}

            {/* Bottom footnotes list — shown on mobile only (margin notes handle desktop) */}
            {processedData.footnotes.length > 0 && (
              <div className="mt-10 pt-5 border-t border-border/60 xl:hidden max-w-2xl">
                <button
                  onClick={() => setNotesExpanded((v) => !v)}
                  className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors mb-3"
                >
                  <span>{notesExpanded ? "▼" : "▶"}</span>
                  {notesExpanded
                    ? "Hide Notes"
                    : `Notes (${processedData.footnotes.length})`}
                </button>
                {notesExpanded && (
                  <div
                    className="space-y-3 text-sm text-muted-foreground scholarship-footnotes"
                    style={{ direction: "rtl" }}
                    onClick={handleContentClick}
                  >
                    {processedData.footnotes.map((fn) => (
                      <div key={fn.id} id={fn.id} className="flex gap-2 scroll-mt-20 items-baseline">
                        <a
                          href={`#p${fn.paraIndex + 1}`}
                          className="text-[10px] font-medium text-primary hover:underline flex-shrink-0"
                        >
                          {fn.num}
                        </a>
                        <span dangerouslySetInnerHTML={{ __html: fn.noteHtml }} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Prev / Next — RTL: right = back, left = forward */}
            <div className="border-t border-border mt-12 pt-6 flex items-center justify-between gap-4 max-w-2xl">
              {data.nextSection ? (
                <button
                  className="text-sm text-primary hover:underline flex items-center gap-1"
                  onClick={() => setLocation(`/scholarship/${workSlug}/${data.nextSection!.slug}`)}
                >
                  <ChevronLeft className="w-4 h-4 flex-shrink-0" />
                  {data.nextSection.title}
                </button>
              ) : (
                <Link href={`/scholarship/${workSlug}`} className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">
                  <ChevronLeft className="w-4 h-4 flex-shrink-0" />
                  Table of Contents
                </Link>
              )}

              <a
                href="https://www.sefaria.org.il/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-muted-foreground/50 hover:text-primary transition-colors flex-shrink-0"
              >
                Sefaria
              </a>

              {data.prevSection ? (
                <button
                  className="text-sm text-primary hover:underline flex items-center gap-1 text-right"
                  onClick={() => setLocation(`/scholarship/${workSlug}/${data.prevSection!.slug}`)}
                >
                  {data.prevSection.title}
                  <ChevronRight className="w-4 h-4 flex-shrink-0" />
                </button>
              ) : (
                <Link href={`/scholarship/${workSlug}`} className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">
                  Table of Contents
                  <ChevronRight className="w-4 h-4 flex-shrink-0" />
                </Link>
              )}
            </div>
          </>
        )}
      </main>

      <Footer />

      {showBackToTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-8 right-6 z-50 bg-primary text-primary-foreground rounded-full p-3 shadow-lg hover:opacity-90 transition-opacity"
          aria-label="Back to top"
        >
          <ArrowUp className="w-5 h-5" />
        </button>
      )}

      {/* Footnote popover — appears on all screen sizes when clicking a reference */}
      {activePopover && (
        <div
          ref={popoverRef}
          className={`fn-popover fixed z-[200] bg-card border border-border rounded-xl shadow-2xl p-4 scholarship-footnotes hebrew-font-${preferences.hebrewFont}`}
          style={{
            top: activePopover.top,
            left: activePopover.left,
            width: 320,
            maxWidth: "calc(100vw - 16px)",
          }}
        >
          {/* Arrow indicator */}
          <div
            className={`absolute left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-card border-border rotate-45 ${
              activePopover.showAbove
                ? "bottom-[-5px] border-b border-r"
                : "top-[-5px] border-t border-l"
            }`}
          />
          <div className="flex items-start justify-between gap-2 mb-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
              Note
            </span>
            <button
              onClick={() => setActivePopover(null)}
              className="text-muted-foreground/50 hover:text-foreground transition-colors flex-shrink-0 -mt-0.5"
              aria-label="Close note"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <div
            className="text-sm text-foreground leading-relaxed hebrew-text scholarship-footnotes"
            style={{ direction: "rtl", textAlign: "right" }}
            dangerouslySetInnerHTML={{ __html: activePopover.html }}
          />
        </div>
      )}
    </div>
  );
}
