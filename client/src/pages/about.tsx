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
          
          <div className="mb-8">
            <Link 
              href="/"
              className="text-muted-foreground hover:text-foreground transition-colors duration-200 inline-flex items-center gap-2"
            >
              ← Back to Study
            </Link>
          </div>
          
          <div className="bg-card rounded-lg shadow-sm border border-border p-8">
            <h1 className="text-3xl font-bold text-foreground mb-6">About ChavrutAI</h1>
            
            <div className="prose prose-sepia max-w-none">
              <p className="text-lg text-muted-foreground leading-relaxed mb-6">
                ChavrutAI is a modern digital platform designed to make the Talmud, more accessible through an intuitive interface.
              </p>
              
              <p className="text-muted-foreground leading-relaxed mb-6">
                The platform features bilingual Hebrew-English text display, hierarchical 
                navigation, and comprehensive text processing.
              </p>
              
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
                <li>Intelligent English Text Splitting: Advanced punctuation-based paragraph breaks</li>
                <li>Term Replacement System: Text processing via a dictionary for more precise terminology</li>
                <li>Ordinal Number Conversion: Automatic conversion of written ordinals to numeric format for enhanced readability. (E.g. "fourth" → "4th", "twenty-ninth" → "29th")</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}