import { Link } from "wouter";
import { BreadcrumbNavigation, breadcrumbHelpers } from "@/components/navigation/breadcrumb-navigation";
import { Footer } from "@/components/footer";
import { useSEO, generateSEOData } from "@/hooks/use-seo";

export default function About() {
  useSEO(generateSEOData.aboutPage());
  
  return (
    <div className="min-h-screen bg-background">
      {/* Centered Logo Header */}
      <header className="sticky top-0 z-50 bg-card border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-center">
            <Link 
              href="/"
              className="flex items-center space-x-2 flex-shrink-0 hover:opacity-80 transition-opacity duration-200"
              data-testid="header-logo-link"
            >
              <div className="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden">
                <img 
                  src="/images/hebrew-book-icon.png" 
                  alt="ChavrutAI Logo" 
                  className="w-10 h-10 object-cover"
                />
              </div>
              <div className="text-xl font-semibold text-primary font-roboto">ChavrutAI</div>
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <BreadcrumbNavigation items={breadcrumbHelpers.about()} />
          
          <div className="bg-card rounded-lg shadow-sm border border-border p-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">About ChavrutAI</h1>
            <p className="text-lg text-muted-foreground mb-8">
              A free platform for studying classical Jewish texts in Hebrew and English
            </p>
            
            <div className="space-y-10">
              <section>
                <h2 className="text-xl font-semibold text-foreground mb-4">
                  What is ChavrutAI?
                </h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  ChavrutAI is a free website for studying the Babylonian Talmud and Tanakh (Hebrew Bible). 
                  It displays Hebrew text alongside English translation, making these classical texts accessible 
                  to learners at all levels.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  Whether you're new to Talmud study or an experienced 
                  learner, ChavrutAI provides a clean, distraction-free reading experience.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-4">
                  Available Texts
                </h2>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-secondary/30 rounded-lg p-4">
                    <h3 className="font-medium text-foreground mb-2">Babylonian Talmud</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      All 37 tractates with standard page numbering based on the standard printed edition. 
                      Navigate by Seder (order), tractate, chapter, or individual page.
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
                    <h3 className="font-medium text-foreground mb-2">Tanakh (Hebrew Bible)</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      Torah, Prophets, and Writings with chapter-by-chapter navigation. 
                      Each book includes Hebrew text with English translation.
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
                    <h3 className="font-medium text-foreground mb-1">Navigation</h3>
                    <p className="text-sm leading-relaxed">
                      Use the menu (hamburger icon) in the top-left corner to access the table of contents 
                      and customize your reading preferences. On any text page, use the Previous/Next buttons 
                      to move between pages, or click the floating widget in the bottom-right to jump between sections.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground mb-1">Breadcrumbs</h3>
                    <p className="text-sm leading-relaxed">
                      At the top of each page, breadcrumbs show your current location (e.g., Berakhot &gt; Chapter 1 &gt; 2a).
                    </p>
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground mb-1">Section Links</h3>
                    <p className="text-sm leading-relaxed">
                      Click any section number to open that passage directly on Sefaria for additional 
                      commentaries and resources.
                    </p>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-4">Customization Options</h2>
                <p className="text-sm text-muted-foreground mb-4">
                  Access these settings from the menu (hamburger icon) in the top-left corner.
                </p>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-medium text-foreground text-sm">Themes</h3>
                    <p className="text-xs text-muted-foreground">
                      Choose Sepia (warm parchment), White (clean), or Dark mode
                    </p>
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground text-sm">Text Size</h3>
                    <p className="text-xs text-muted-foreground">
                      Five sizes from Extra Small to Extra Large
                    </p>
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground text-sm">Fonts</h3>
                    <p className="text-xs text-muted-foreground">
                      Multiple Hebrew fonts (Assistant, Noto Sans, etc.) and English fonts (Inter, Roboto, etc.)
                    </p>
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground text-sm">Layout</h3>
                    <p className="text-xs text-muted-foreground">
                      Side-by-side (Hebrew and English in columns) or Stacked view
                    </p>
                  </div>
                  <div className="sm:col-span-2">
                    <h3 className="font-medium text-foreground text-sm">Term Highlighting</h3>
                    <p className="text-xs text-muted-foreground">
                      Highlight key concepts, names of rabbis, and place names in the Hebrew text (over 5,000 terms)
                    </p>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-4">Special Features</h2>
                <ul className="space-y-3 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-foreground font-bold">•</span>
                    <span className="text-sm">
                      <strong className="text-foreground">Page Continuation:</strong> Each Talmud page shows a preview of the next page's opening, 
                      so sentences that continue across pages aren't interrupted.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-foreground font-bold">•</span>
                    <span className="text-sm">
                      <strong className="text-foreground">Sugya Viewer:</strong> Study specific text ranges by entering Talmud references 
                      (e.g., "Berakhot 2a-5b") or Sefaria URLs.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-foreground font-bold">•</span>
                    <span className="text-sm">
                      <strong className="text-foreground">Famous Pages:</strong> Explore a curated list of well-known Talmudic passages 
                      as starting points for study.
                    </span>
                  </li>
                </ul>
              </section>

              <section className="pt-6 border-t border-border">
                <h2 className="text-xl font-semibold text-foreground mb-4">About This Project</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  ChavrutAI is a project of{" "}
                  <a 
                    href="https://www.ezrabrand.com/"
                    className="text-blue-600 hover:text-blue-800 underline"
                  >
                    Talmud & Tech
                  </a>
                  . Text content is sourced from the Sefaria library (ChavrutAI is not affiliated with Sefaria).
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
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}
