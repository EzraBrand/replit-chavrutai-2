import { useRoute, Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Footer } from "@/components/footer";
import { useSEO } from "@/hooks/use-seo";
import { apiRequest } from "@/lib/queryClient";
import { isValidScholarshipWork } from "@shared/data/scholarship-works";
import { usePreferences } from "@/context/preferences-context";
import NotFound from "@/pages/not-found";

interface SectionData {
  title: string;
  heTitle: string;
  paragraphs: string[];
  prevSection: { slug: string; title: string } | null;
  nextSection: { slug: string; title: string } | null;
}

export default function ScholarshipSection() {
  const [match, params] = useRoute("/scholarship/:workSlug/:sectionSlug");
  const [, setLocation] = useLocation();
  const workSlug = params?.workSlug || "";
  const sectionSlug = params?.sectionSlug || "";
  const { preferences } = usePreferences();

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

  const hebrewFontClass = `hebrew-font-${preferences.hebrewFont}`;
  const textSizeClass = `text-size-${preferences.textSize}`;

  const workTitle =
    workSlug === "introductions-tanaitic"
      ? "Introductions to Tanaitic Literature"
      : "Introductions to Amoraic Literature";

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-card border-b border-border shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-center">
            <Link
              href="/"
              className="flex items-center space-x-2 flex-shrink-0 hover:opacity-80 transition-opacity duration-200"
            >
              <div className="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden">
                <img src="/hebrew-book-icon.png" alt="ChavrutAI Logo" className="w-10 h-10 object-cover" />
              </div>
              <div className="text-xl font-semibold text-primary font-roboto">ChavrutAI</div>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-10">
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
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-6 bg-muted animate-pulse rounded" style={{ width: `${85 + Math.random() * 15}%` }} />
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
              <h1 className="text-2xl font-bold text-foreground mb-2 leading-tight">{data.title}</h1>
              <div
                className={`text-xl text-muted-foreground font-serif ${hebrewFontClass}`}
                style={{ direction: "rtl", textAlign: "right" }}
              >
                {data.heTitle}
              </div>
            </div>

            {/* Jump anchors */}
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

            {/* Hebrew prose paragraphs */}
            <div className={`space-y-6 ${textSizeClass}`}>
              {data.paragraphs.map((para, i) => (
                <div
                  key={i}
                  id={`p${i + 1}`}
                  className="scroll-mt-20 flex gap-4 items-start"
                >
                  <span className="text-xs text-muted-foreground/50 mt-2 w-5 text-right flex-shrink-0 select-none">
                    {i + 1}
                  </span>
                  <p
                    className={`flex-1 leading-loose text-foreground font-serif ${hebrewFontClass}`}
                    style={{ direction: "rtl", textAlign: "right" }}
                    dangerouslySetInnerHTML={{ __html: para }}
                  />
                </div>
              ))}
            </div>

            {data.paragraphs.length === 0 && (
              <p className="text-muted-foreground text-sm italic">No text available for this section.</p>
            )}

            {/* Prev / Next navigation */}
            <div className="border-t border-border mt-12 pt-6 flex items-center justify-between">
              {data.prevSection ? (
                <button
                  className="text-sm text-primary hover:underline flex items-center gap-1"
                  onClick={() => setLocation(`/scholarship/${workSlug}/${data.prevSection!.slug}`)}
                >
                  ← {data.prevSection.title}
                </button>
              ) : (
                <Link href={`/scholarship/${workSlug}`} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  ← Table of Contents
                </Link>
              )}

              <a
                href={`https://www.sefaria.org.il/${encodeURIComponent(workSlug === "introductions-tanaitic" ? "Introductions_to_Tanaitic_Literature" : "Introductions_to_Amoraic_Literature")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-muted-foreground hover:text-primary transition-colors"
              >
                Sefaria source
              </a>

              {data.nextSection ? (
                <button
                  className="text-sm text-primary hover:underline flex items-center gap-1"
                  onClick={() => setLocation(`/scholarship/${workSlug}/${data.nextSection!.slug}`)}
                >
                  {data.nextSection.title} →
                </button>
              ) : (
                <Link href={`/scholarship/${workSlug}`} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Table of Contents →
                </Link>
              )}
            </div>
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}
