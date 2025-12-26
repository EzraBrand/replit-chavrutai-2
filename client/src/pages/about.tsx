import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { SharedLayout } from "@/components/layout";
import { useSEO, generateSEOData } from "@/hooks/use-seo";
import { ExternalLink, Rss, BookOpen } from "lucide-react";

interface DafYomiData {
  titleEn: string;
  titleHe: string;
  ref: string;
  url: string;
  date: string;
}

interface RssFeedItem {
  title: string;
  link: string;
  pubDate: string;
  description: string;
}

export default function About() {
  useSEO(generateSEOData.aboutPage());

  const { data: rssFeed, isLoading: rssLoading } = useQuery<{
    items: RssFeedItem[];
  }>({
    queryKey: ["/api/rss-feed"],
  });

  const { data: dafYomi, isLoading: dafLoading } = useQuery<DafYomiData>({
    queryKey: ["/api/daf-yomi"],
  });

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <SharedLayout variant="simple" mainMaxWidth="container">
      <div className="max-w-4xl mx-auto">
        <div className="bg-card rounded-lg shadow-sm border border-border p-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            About ChavrutAI
          </h1>
          <p className="text-lg text-muted-foreground mb-8">
            A free platform for studying classical Jewish texts in Hebrew and
            English
          </p>

          <div className="space-y-10">
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">
                What is ChavrutAI?
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                ChavrutAI is a free website for studying the Babylonian Talmud
                and Tanakh (Hebrew Bible). It displays Hebrew text alongside
                English translation, making these classical texts accessible to
                learners at all levels.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Whether you're new to Talmud study or an experienced learner,
                ChavrutAI provides a clean, distraction-free reading experience.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">
                Available Texts
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-secondary/30 rounded-lg p-4">
                  <h3 className="font-medium text-foreground mb-2">
                    Babylonian Talmud
                  </h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    All 37 tractates with standard page numbering based on the
                    standard printed edition. Navigate by Seder (order),
                    tractate, chapter, or individual page.
                  </p>
                  <Link
                    href="/contents"
                    className="text-blue-600 hover:text-blue-800 underline text-sm font-medium"
                    data-testid="link-talmud-contents"
                  >
                    Browse Talmud Contents
                  </Link>
                </div>
                <div className="bg-secondary/30 rounded-lg p-4">
                  <h3 className="font-medium text-foreground mb-2">
                    Tanakh (Hebrew Bible)
                  </h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Torah, Prophets, and Writings with chapter-by-chapter
                    navigation. Each book includes Hebrew text with English
                    translation.
                  </p>
                  <Link
                    href="/bible"
                    className="text-blue-600 hover:text-blue-800 underline text-sm font-medium"
                    data-testid="link-tanakh-contents"
                  >
                    Browse Tanakh Contents
                  </Link>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">
                How to Use
              </h2>
              <div className="space-y-4 text-muted-foreground">
                <div>
                  <h3 className="font-medium text-foreground mb-1">
                    Navigation
                  </h3>
                  <p className="text-sm leading-relaxed">
                    Use the menu (hamburger icon) in the top-left corner to
                    access the table of contents and customize your reading
                    preferences. On any text page, use the Previous/Next buttons
                    to move between pages, or click the floating widget in the
                    bottom-right to jump between sections.
                  </p>
                </div>
                <div>
                  <h3 className="font-medium text-foreground mb-1">
                    Breadcrumbs
                  </h3>
                  <p className="text-sm leading-relaxed">
                    At the top of each page, breadcrumbs show your current
                    location (e.g., Berakhot &gt; Chapter 1 &gt; 2a).
                  </p>
                </div>
                <div>
                  <h3 className="font-medium text-foreground mb-1">
                    Section Links
                  </h3>
                  <p className="text-sm leading-relaxed">
                    Click any section number to open that passage directly on
                    Sefaria for additional commentaries and resources.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">
                Customization Options
              </h2>
              <p className="text-muted-foreground mb-4">
                Access these settings from the menu (hamburger icon) in the
                top-left corner.
              </p>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium text-foreground">
                    Themes
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Choose Paper (warm parchment), White (clean), Dark, or High
                    Contrast mode
                  </p>
                </div>
                <div>
                  <h3 className="font-medium text-foreground">
                    Text Size
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Five sizes from Extra Small to Extra Large
                  </p>
                </div>
                <div>
                  <h3 className="font-medium text-foreground">Fonts</h3>
                  <p className="text-sm text-muted-foreground">
                    Multiple Hebrew fonts (Assistant, Noto Sans, etc.) and
                    English fonts (Inter, Roboto, etc.)
                  </p>
                </div>
                <div>
                  <h3 className="font-medium text-foreground">
                    Layout
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Side-by-side (Hebrew and English in columns) or Stacked view
                  </p>
                </div>
                <div className="sm:col-span-2">
                  <h3 className="font-medium text-foreground">
                    Term Highlighting
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Highlight key concepts, names of rabbis, and place names in
                    the Hebrew text (over 5,000 terms)
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">
                Special Features
              </h2>
              <ul className="space-y-3 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-foreground font-bold">•</span>
                  <span className="text-sm">
                    <strong className="text-foreground">
                      Page Continuation:
                    </strong>{" "}
                    Each Talmud page shows a preview of the next page's opening,
                    so sentences that continue across pages aren't interrupted.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-foreground font-bold">•</span>
                  <span className="text-sm">
                    <strong className="text-foreground">Sugya Viewer:</strong>{" "}
                    Study specific text ranges by entering Talmud references
                    (e.g., "Berakhot 2a-5b") or Sefaria URLs.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-foreground font-bold">•</span>
                  <span className="text-sm">
                    <strong className="text-foreground">Famous Pages:</strong>{" "}
                    Explore a curated list of well-known Talmudic passages as
                    starting points for study.
                  </span>
                </li>
              </ul>
            </section>

            <section className="pt-6 border-t border-border">
              <h2 className="text-xl font-semibold text-foreground mb-4">
                About This Project
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                ChavrutAI is a project of{" "}
                <a
                  href="https://www.ezrabrand.com/"
                  className="text-blue-600 hover:text-blue-800 underline"
                >
                  Talmud & Tech
                </a>
                . Text content is sourced from the Sefaria library (ChavrutAI is
                not affiliated with Sefaria).
              </p>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Learn more about ChavrutAI in this article:{" "}
                <a
                  href="https://www.ezrabrand.com/p/chavrutai-talmud-web-app-launch-review"
                  className="text-blue-600 hover:text-blue-800 underline"
                >
                  ChavrutAI Launch Review
                </a>
              </p>
              <p className="text-muted-foreground leading-relaxed">
                For questions, feedback, or to report an issue:{" "}
                <a
                  href="mailto:ezra@chavrutai.com"
                  className="text-blue-600 hover:text-blue-800 underline"
                >
                  ezra@chavrutai.com
                </a>
              </p>
            </section>

            <section className="pt-6 border-t border-border">
              <h2 className="text-xl font-semibold text-foreground mb-4">
                Stay Updated
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-6">
                Subscribe to the{" "}
                <a
                  href="https://www.ezrabrand.com/"
                  className="text-blue-600 hover:text-blue-800 underline"
                >
                  Talmud & Tech
                </a>{" "}
                blog for updates on ChavrutAI and analyses of Talmud and other
                Jewish classical texts:
              </p>
              <div className="flex justify-center">
                <iframe
                  src="https://www.ezrabrand.com/embed"
                  width="480"
                  height="320"
                  style={{ border: "1px solid #EEE", background: "white" }}
                  frameBorder="0"
                  scrolling="no"
                  data-testid="subscribe-iframe"
                ></iframe>
              </div>

              <div className="mt-8">
                <h3 className="text-lg font-medium text-foreground mb-4 flex items-center gap-2">
                  <Rss className="w-5 h-5 text-orange-500" />
                  Latest Posts
                </h3>
                {rssLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="animate-pulse bg-secondary/50 rounded-lg p-4"
                      >
                        <div className="h-4 bg-secondary rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-secondary rounded w-1/4"></div>
                      </div>
                    ))}
                  </div>
                ) : rssFeed?.items && rssFeed.items.length > 0 ? (
                  <div className="space-y-3" data-testid="rss-feed-list">
                    {rssFeed.items.map((item, index) => (
                      <a
                        key={index}
                        href={item.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block bg-secondary/30 hover:bg-secondary/50 rounded-lg p-4 transition-colors"
                        data-testid={`rss-item-${index}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-medium text-foreground text-sm leading-snug">
                            {item.title}
                          </h4>
                          <ExternalLink className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDate(item.pubDate)}
                        </p>
                      </a>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No posts available.
                  </p>
                )}
              </div>
            </section>

            <section className="pt-6 border-t border-border">
              <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-blue-600" />
                Today's Daf Yomi
              </h2>
              {dafLoading ? (
                <div className="animate-pulse bg-secondary/50 rounded-lg p-6">
                  <div className="h-6 bg-secondary rounded w-1/2 mb-3"></div>
                  <div className="h-4 bg-secondary rounded w-1/3"></div>
                </div>
              ) : dafYomi ? (
                <div className="bg-secondary/30 rounded-lg p-6" data-testid="daf-yomi-widget">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <p className="text-2xl font-semibold text-foreground mb-1" data-testid="daf-yomi-title-en">
                        {dafYomi.titleEn}
                      </p>
                      <p className="text-xl text-muted-foreground font-hebrew" dir="rtl" data-testid="daf-yomi-title-he">
                        {dafYomi.titleHe}
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <Link
                        href={`/talmud/${dafYomi.url.replace(".", "/").replace(/(\d+)([ab])$/, "$1/$2")}`}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                        data-testid="daf-yomi-study-link"
                      >
                        Study Here
                      </Link>
                      <a
                        href={`https://www.sefaria.org/${dafYomi.url}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 border border-border hover:bg-secondary rounded-lg font-medium transition-colors"
                        data-testid="daf-yomi-sefaria-link"
                      >
                        View on Sefaria
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground">
                  Unable to load today's daf.
                </p>
              )}
            </section>
          </div>
        </div>
      </div>
    </SharedLayout>
  );
}
