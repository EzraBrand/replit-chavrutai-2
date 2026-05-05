import { useState, useEffect } from "react";
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
import NotFound from "@/pages/not-found";
import { Type, ArrowUp, ChevronLeft, ChevronRight } from "lucide-react";

interface SectionData {
  title: string;
  heTitle: string;
  paragraphs: string[];
  prevSection: { slug: string; title: string } | null;
  nextSection: { slug: string; title: string } | null;
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

  return (
    <div className="min-h-screen bg-background">
      {/* ── Header ── */}
      <header className="sticky top-0 z-50 bg-card border-b border-border shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-3 relative">
          <div className="flex items-center">
            {/* Left spacer (mirrors button width) */}
            <div className="w-32 flex-shrink-0" />

            {/* Center: logo */}
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

            {/* Right: Display settings */}
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
        className={`max-w-2xl mx-auto px-4 py-10 text-size-${preferences.textSize} hebrew-font-${preferences.hebrewFont} scholarship-prose`}
      >
        {/* Breadcrumb */}
        <nav className="text-sm text-muted-foreground mb-8">
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
          <div className="space-y-6">
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
          <Alert variant="destructive" className="mb-6">
            <AlertDescription className="flex items-center justify-between">
              <span>Failed to load this section.</span>
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {data && (
          <>
            {/* Section heading */}
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-foreground mb-1 leading-tight">{data.title}</h1>
              <div
                className="text-lg text-muted-foreground hebrew-text"
                style={{ direction: "rtl", textAlign: "right" }}
              >
                {data.heTitle}
              </div>
            </div>

            {/* Paragraph jump anchors */}
            {data.paragraphs.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-8">
                {data.paragraphs.map((_, i) => (
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

            {/* Hebrew prose — single column RTL */}
            <div className="space-y-5">
              {data.paragraphs.map((para, i) => (
                <div
                  key={i}
                  id={`p${i + 1}`}
                  className="scroll-mt-20 flex gap-4 items-start"
                >
                  <span className="text-xs text-muted-foreground/40 mt-1.5 w-5 text-right flex-shrink-0 select-none">
                    {i + 1}
                  </span>
                  <p
                    className="flex-1 text-foreground hebrew-text"
                    style={{ direction: "rtl", textAlign: "right", lineHeight }}
                    dangerouslySetInnerHTML={{ __html: para }}
                  />
                </div>
              ))}
            </div>

            {data.paragraphs.length === 0 && (
              <p className="text-muted-foreground text-sm italic">No text available for this section.</p>
            )}

            {/* Prev / Next navigation — RTL order: right=back, left=forward */}
            <div className="border-t border-border mt-12 pt-6 flex items-center justify-between gap-4">
              {/* LEFT = next (forward in RTL) */}
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

              {/* RIGHT = previous (back in RTL) */}
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

      {/* Back to top */}
      {showBackToTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-8 right-6 z-50 bg-primary text-primary-foreground rounded-full p-3 shadow-lg hover:opacity-90 transition-opacity"
          aria-label="Back to top"
        >
          <ArrowUp className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}
