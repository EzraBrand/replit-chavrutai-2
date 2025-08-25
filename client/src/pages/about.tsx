import { Link } from "wouter";
import { BreadcrumbNavigation, breadcrumbHelpers } from "@/components/navigation/breadcrumb-navigation";
import { useSEO, generateSEOData } from "@/hooks/use-seo";

export default function About() {
  // Set up SEO
  useSEO(generateSEOData.aboutPage());
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Breadcrumbs */}
          <BreadcrumbNavigation items={breadcrumbHelpers.about()} />
          
          {/* Quick Navigation */}
          <nav className="mb-8 bg-card border border-border rounded-lg p-4" role="navigation" aria-label="Quick navigation">
            <div className="flex flex-wrap gap-4 justify-center">
              <Link 
                href="/"
                className="text-primary hover:text-primary/80 font-medium inline-flex items-center gap-2 transition-colors"
                data-testid="nav-home"
              >
                🏠 Home & Contents
              </Link>
              <Link 
                href="/suggested-pages"
                className="text-primary hover:text-primary/80 font-medium inline-flex items-center gap-2 transition-colors"
                data-testid="nav-suggested"
              >
                📚 Famous Pages
              </Link>
              <Link 
                href="/contents/berakhot"
                className="text-primary hover:text-primary/80 font-medium inline-flex items-center gap-2 transition-colors"
                data-testid="nav-berakhot"
              >
                🙏 Start with Berakhot
              </Link>
              <Link 
                href="/contents/shabbat"
                className="text-primary hover:text-primary/80 font-medium inline-flex items-center gap-2 transition-colors"
                data-testid="nav-shabbat"
              >
                🕯️ Shabbat
              </Link>
            </div>
          </nav>
          
          <div className="bg-card rounded-lg shadow-sm border border-border p-8">
            <h1 className="text-3xl font-bold text-foreground mb-6">About ChavrutAI - Free Digital Talmud Study Platform</h1>
            
            <div className="prose prose-sepia max-w-none">
              <section className="mb-8">
                <h2 className="text-xl font-semibold text-foreground mb-4">Making Talmud Study Accessible to Everyone</h2>
                <p className="text-lg text-muted-foreground leading-relaxed mb-6">
                  ChavrutAI is a free digital platform designed to make the Babylonian Talmud accessible through modern technology and intuitive design. Whether you're a beginner or advanced learner, our platform provides the tools you need to study effectively.
                </p>
                
                <p className="text-muted-foreground leading-relaxed mb-6">
                  The platform features bilingual Hebrew-English text display, hierarchical 
                  navigation, and comprehensive text processing - all completely free for learners worldwide.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold text-foreground mb-4">Why Choose ChavrutAI for Digital Talmud Study?</h2>
                <p className="text-muted-foreground leading-relaxed mb-8">
                  Find out more about this project at{" "}
                  <a 
                    href="https://www.ezrabrand.com/p/chavrutai-talmud-web-app-launch-review"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:text-primary/80 underline transition-colors duration-200"
                  >
                    "ChavrutAI Talmud Web App Launch: Review and Comparison with Similar Platforms"
                  </a>
                </p>
              </section>

              <h2 className="text-2xl font-bold text-foreground mb-4">ChavrutAI Features Overview</h2>
              
              <p className="text-sm text-muted-foreground mb-6 italic">
                (Focusing on aspects that are significantly different from Sefaria's.)
              </p>

              <h3 className="text-xl font-semibold text-foreground mb-3">Display & Navigation Features</h3>
              
              <ol className="list-decimal list-inside space-y-2 mb-6 text-muted-foreground">
                <li>Breadcrumb Navigation: Breadcrumb hierarchy displaying tractate, chapter number and title, and page.</li>
                <li>Previous/Next page controls</li>
                <li>Section Navigation: Individual sections within each page are clickable with direct links to Sefaria, plus a floating navigation widget in the bottom-right corner showing current section position and allowing quick navigation between sections.</li>
                <li>Page Continuation Preview: A preview of the following page's opening section is displayed, helping maintain continuity (and prevent interrupted sentences) across page boundaries.</li>
                <li>Warm color scheme throughout the interface</li>
                <li>User Preferences System: Customizable text size controls (Small, Medium, Large, Extra Large) for both Hebrew and English. Alternative Hebrew font selection and dark mode toggle.</li>
              </ol>

              <h3 className="text-xl font-semibold text-foreground mb-3">Text Processing Features</h3>
              
              <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                <li>Intelligent Hebrew and English Text Splitting: Sophisticated punctuation-based paragraph breaks, to enhance readability</li>
                <li>Term Replacement System: Text processing via a dictionary for more precise terminology</li>
                <li>Ordinal Number Conversion: Automatic conversion of written ordinals to numeric format for enhanced readability. (E.g. "fourth" → "4th", "twenty-ninth" → "29th")</li>
              </ol>

              {/* Contact and Attribution Section */}
              <div className="mt-12 pt-8 border-t border-border">
                <p className="text-muted-foreground leading-relaxed mb-4">
                  ChavrutAI is a project of{" "}
                  <a 
                    href="https://www.ezrabrand.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:text-primary/80 underline transition-colors duration-200"
                  >
                    "Talmud & Tech"
                  </a>
                  . It uses data from Sefaria (not affiliated).
                </p>
                
                <p className="text-muted-foreground leading-relaxed">
                  For questions, comments, or to report an error, please email:{" "}
                  <a 
                    href="mailto:ezra@chavrutai.com"
                    className="text-primary hover:text-primary/80 underline transition-colors duration-200"
                  >
                    ezra@chavrutai.com
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}