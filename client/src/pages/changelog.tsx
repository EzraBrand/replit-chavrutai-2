import { Link } from "wouter";
import { useSEO } from "@/hooks/use-seo";
import { Footer } from "@/components/footer";

export default function Changelog() {
  // SEO optimization
  useSEO({
    title: 'Changelog - ChavrutAI',
    description: 'Recent updates and improvements to ChavrutAI. Track new features, design enhancements, and user experience improvements for Talmud study.',
    keywords: 'ChavrutAI changelog, Talmud app updates, Jewish learning platform updates',
    canonical: `${window.location.origin}/changelog`,
    robots: 'index, follow'
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
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

      <div className="container mx-auto px-4 py-6">
        {/* Page Title */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-sepia-800 dark:text-sepia-200 mb-2">
            Changelog
          </h1>
        
        <p className="text-sepia-600 dark:text-sepia-400 max-w-3xl">
          Recent updates and improvements.
        </p>
      </div>

      {/* Changelog Content */}
      <div className="bg-white dark:bg-sepia-900 rounded-lg shadow-lg p-6 max-w-4xl">
        
        {/* January 2026 */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-sepia-800 dark:text-sepia-200 mb-4 border-b border-sepia-200 dark:border-sepia-700 pb-2">
            January 2026
          </h2>
          
          <div className="space-y-4 text-sepia-700 dark:text-sepia-300">
            <div>
              <h3 className="font-medium text-sepia-800 dark:text-sepia-200 mb-2">Jastrow Dictionary Improvements</h3>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Fixed sense numbering display (1, 2, 3...) that was being cut off from dictionary entries</li>
                <li>Added origin metadata display showing language origins (Biblical Hebrew, Aramaic) and cross-references</li>
                <li>Expanded abbreviation mappings with 10+ new terms (Assyr., frequ., opp., supra, etc.)</li>
              </ul>
            </div>

            <div>
              <h3 className="font-medium text-sepia-800 dark:text-sepia-200 mb-2">Blog Reader on About Page</h3>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Replaced "Latest Posts" widget with expandable blog post reader showing full content</li>
                <li>Added Hebrew RTL text support with automatic detection</li>
                <li>Footnotes display with hover tooltips and click-to-navigate functionality</li>
                <li>Added post numbering (1, 2, 3...) for easier reference</li>
                <li>Expanded posts now show first 3 paragraphs with "Load more of the post..." option</li>
                <li>Shows 5 posts by default with "Load more posts..." to view up to 20 posts</li>
              </ul>
            </div>

            <div>
              <h3 className="font-medium text-sepia-800 dark:text-sepia-200 mb-2">Text Processing Improvements</h3>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Added animal term mappings: "domesticated animals" → "livestock", "non-domesticated" → "wild"</li>
                <li>Added 72 number text to numeral conversions (e.g., "forty million" → "40,000,000")</li>
                <li>Supports large numbers with comma-separated thousands for readability</li>
                <li>Added fractional ordinal conversions (e.g., "one five-hundredth" → "1/500th")</li>
              </ul>
            </div>
          </div>
        </div>

        {/* December 2025 */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-sepia-800 dark:text-sepia-200 mb-4 border-b border-sepia-200 dark:border-sepia-700 pb-2">
            December 2025
          </h2>
          
          <div className="space-y-4 text-sepia-700 dark:text-sepia-300">
            <div>
              <h3 className="font-medium text-sepia-800 dark:text-sepia-200 mb-2">Improved Name Recognition</h3>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Fixed text splitting to keep genealogical phrases like "R' Elazar, son of R' Shimon" on one line</li>
                <li>Compound names with "son of" now highlight as single entries instead of separate name fragments</li>
              </ul>
            </div>

            <div>
              <h3 className="font-medium text-sepia-800 dark:text-sepia-200 mb-2">SEO-Friendly URL Update</h3>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Changed Talmud contents URL from /contents to /talmud for better SEO</li>
                <li>All tractate pages now use /talmud/:tractate instead of /contents/:tractate</li>
                <li>301 redirects automatically preserve rankings and prevent broken links</li>
                <li>Updated sitemap with new canonical URLs</li>
              </ul>
            </div>

            <div>
              <h3 className="font-medium text-sepia-800 dark:text-sepia-200 mb-2">New Homepage</h3>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Redesigned homepage as a minimalist directory showcasing all platform features</li>
                <li>Primary sections for Talmud and Tanakh with equal prominence</li>
                <li>Quick search bar for searching across all texts</li>
                <li>Today's Daf Yomi widget with direct study link</li>
                <li>Famous Talmud Pages section linking to curated suggested readings</li>
                <li>Study Tools grid: Sugya Viewer, Dictionary, Biblical Index, Mishnah Map</li>
                <li>Talmud table of contents accessible at /talmud</li>
              </ul>
            </div>

            <div>
              <h3 className="font-medium text-sepia-800 dark:text-sepia-200 mb-2">Jastrow Dictionary Fix</h3>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Fixed entries being cut off for words with multiple verb forms (e.g., Hiphil/Hif.)</li>
                <li>Nested grammatical forms now display with proper labels showing verb stem and conjugation</li>
              </ul>
            </div>

            <div>
              <h3 className="font-medium text-sepia-800 dark:text-sepia-200 mb-2">Navigation Fixes</h3>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Fixed empty page issue: tractates ending on 'a' side no longer show invalid 'b' pages</li>
                <li>Added support for Tamid's unique page range (25b-33b instead of standard 2a start)</li>
                <li>Navigation buttons now correctly disable at tractate boundaries</li>
                <li>Page dropdowns exclude invalid pages (e.g., Berakhot 64b, Tamid 25a)</li>
                <li>Centralized navigation logic in unified module for consistency across all components</li>
              </ul>
            </div>

            <div>
              <h3 className="font-medium text-sepia-800 dark:text-sepia-200 mb-2">Full-Text Search</h3>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>New search page for searching across Talmud and Bible texts in Hebrew and English</li>
                <li>Filter buttons to show All, Talmud only, or Bible only results</li>
                <li>Autosuggest for common Talmudic concepts as you type</li>
                <li>Search term highlighting in results</li>
                <li>Direct links to specific sections in Talmud pages and specific verses in Bible chapters</li>
                <li>Results filtered to only show texts available in ChavrutAI</li>
              </ul>
            </div>

            <div>
              <h3 className="font-medium text-sepia-800 dark:text-sepia-200 mb-2">External Links on Talmud Pages</h3>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Added external links footer to each Talmud page with links to Sefaria, Al HaTorah, Wikisource, and Daf Yomi</li>
                <li>Added section-level external links next to each section header for direct cross-referencing</li>
                <li>Links open in new tabs for parallel study across platforms</li>
              </ul>
            </div>

            <div>
              <h3 className="font-medium text-sepia-800 dark:text-sepia-200 mb-2">External Links on Bible Pages</h3>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Added verse-level external links (Sefaria, Al HaTorah, Wikisource) next to each verse header</li>
                <li>Added chapter-level external links footer to each Bible chapter page</li>
                <li>Verified Al HaTorah transliterations for all 39 Tanakh books</li>
              </ul>
            </div>

            <div>
              <h3 className="font-medium text-sepia-800 dark:text-sepia-200 mb-2">UI Simplification</h3>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Added link to the article "Biblical Citations in the Talmud: A New Digital Index and Concordance" on the Biblical Index page</li>
                <li>Removed "Study Options" navigation cards from Contents page for cleaner layout</li>
                <li>Removed breadcrumb navigation from Contents and Tractate Contents pages</li>
              </ul>
            </div>

            <div>
              <h3 className="font-medium text-sepia-800 dark:text-sepia-200 mb-2">Consistent Header Navigation</h3>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Added centered logo header to all secondary pages for consistent navigation</li>
                <li>Logo links directly to homepage from Dictionary, About, Sitemap, Contact, Privacy, and more</li>
                <li>Removed redundant "Home" buttons and "Quick Navigation" sections</li>
                <li>Unified sticky header design across the entire site</li>
              </ul>
            </div>

            <div>
              <h3 className="font-medium text-sepia-800 dark:text-sepia-200 mb-2">External Links Page</h3>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Added internal testing page for generating links to external Talmud resources</li>
                <li>URL generators for Sefaria, Al HaTorah, Wikisource Hebrew, and Daf Yomi</li>
                <li>Section-level and page-level link generation with URL previews</li>
                <li>Curated list of related articles about digital Talmud resources</li>
              </ul>
            </div>

            <div>
              <h3 className="font-medium text-sepia-800 dark:text-sepia-200 mb-2">Theme and Font Options</h3>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Added three theme options: Sepia (warm parchment), White (clean standard), Dark (moderate)</li>
                <li>Added English font selection with four options: Inter (default), Roboto, Source Sans 3, Open Sans</li>
                <li>Changed default Hebrew font to "Assistant" for better readability</li>
                <li>Simplified Hebrew font names in the menu (removed "Hebrew" suffix)</li>
              </ul>
            </div>

            <div>
              <h3 className="font-medium text-sepia-800 dark:text-sepia-200 mb-2">About Page</h3>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Comprehensive rewrite with clear overview for new visitors</li>
                <li>Added sections for available texts, navigation, customization, and special features</li>
              </ul>
            </div>

            <div>
              <h3 className="font-medium text-sepia-800 dark:text-sepia-200 mb-2">Performance Optimizations</h3>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Implemented code splitting with lazy loading for 18 routes</li>
                <li>Migrated static assets to public folder for faster direct serving</li>
                <li>Optimized Biblical index data loading with fetch-based approach</li>
                <li>Reduced bundle sizes dramatically (Biblical index from ~1-2MB to 0.6KB)</li>
                <li>Cleaned up 29 unused UI components and 293 npm packages</li>
                <li>Optimized Google Fonts with async loading and reduced weights</li>
                <li>Reduced CSS size to 67KB through dependency cleanup</li>
              </ul>
            </div>

            <div>
              <h3 className="font-medium text-sepia-800 dark:text-sepia-200 mb-2">Loading Experience</h3>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Added skeleton loading component for smoother page transitions</li>
                <li>Implemented React Query caching for Biblical index pages</li>
                <li>Added font preconnect for faster typography loading</li>
                <li>Fixed Cumulative Layout Shift (CLS) issues</li>
              </ul>
            </div>
          </div>
        </div>

        {/* November 2025 */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-sepia-800 dark:text-sepia-200 mb-4 border-b border-sepia-200 dark:border-sepia-700 pb-2">
            November 2025
          </h2>
          
          <div className="space-y-4 text-sepia-700 dark:text-sepia-300">
            <div>
              <h3 className="font-medium text-sepia-800 dark:text-sepia-200 mb-2">New Features</h3>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Launched Sugya Viewer for studying custom text ranges</li>
                <li>Added AI chatbot for text study assistance</li>
                <li>Implemented SEO canonical URL enforcement with server-side redirects</li>
              </ul>
            </div>

            <div>
              <h3 className="font-medium text-sepia-800 dark:text-sepia-200 mb-2">Text Processing Improvements</h3>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Fixed period + end quote splitting (e.g., Cush." now stays together)</li>
                <li>Fixed comma + end quote splitting (e.g., exposition," keeps quotes attached)</li>
                <li>Added support for single quotes in punctuation clusters</li>
                <li>Implemented triple-punctuation cluster handling (e.g., ?'" stays intact)</li>
                <li>Added intelligent comma splitting that preserves numbers (e.g., 600,000)</li>
                <li>Converted HTML line breaks to proper text splits</li>
              </ul>
            </div>
          </div>
        </div>

        {/* September 2025 */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-sepia-800 dark:text-sepia-200 mb-4 border-b border-sepia-200 dark:border-sepia-700 pb-2">
            September 2025
          </h2>
          
          <div className="space-y-4 text-sepia-700 dark:text-sepia-300">
            <div>
              <h3 className="font-medium text-sepia-800 dark:text-sepia-200 mb-2">New Features</h3>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Added detailed chapter outlines for in-depth topic analysis</li>
                <li>Created human-readable sitemap page for easier navigation</li>
                <li>Fixed page scroll behavior - now scrolls to top when navigating</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-medium text-sepia-800 dark:text-sepia-200 mb-2">Design Improvements</h3>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Enhanced folio button sizing and spacing for better readability</li>
                <li>Improved desktop layout with optimized margins</li>
                <li>Better card layouts and spacing on wider screens</li>
              </ul>
            </div>

            <div>
              <h3 className="font-medium text-sepia-800 dark:text-sepia-200 mb-2">User Experience</h3>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Added external link indicators in footer</li>
                <li>Included GitHub repository link for transparency</li>
                <li>Improved text display with italicized chapter names</li>
              </ul>
            </div>
          </div>
        </div>

        {/* August 2025 */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-sepia-800 dark:text-sepia-200 mb-4 border-b border-sepia-200 dark:border-sepia-700 pb-2">
            August 2025
          </h2>
          
          <div className="space-y-4 text-sepia-700 dark:text-sepia-300">
            <div>
              <h3 className="font-medium text-sepia-800 dark:text-sepia-200 mb-2">Core Features</h3>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Launched comprehensive Talmud study interface</li>
                <li>Integrated all 37 tractates of Babylonian Talmud</li>
                <li>Implemented bilingual Hebrew-English text display</li>
                <li>Added traditional sepia manuscript-inspired design</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-medium text-sepia-800 dark:text-sepia-200 mb-2">Navigation System</h3>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Built hierarchical navigation by Seder (traditional order)</li>
                <li>Created intuitive folio-based page navigation</li>
                <li>Added breadcrumb system for location tracking</li>
                <li>Implemented responsive mobile-first design</li>
              </ul>
            </div>

            <div>
              <h3 className="font-medium text-sepia-800 dark:text-sepia-200 mb-2">Study Tools</h3>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Integrated Hebrew term highlighting with 5,385+ terms</li>
                <li>Added customizable text size and Hebrew font options</li>
                <li>Implemented light/dark mode with sepia themes</li>
                <li>Created flexible layout options (side-by-side vs stacked)</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Footer note */}
        <div className="text-center text-sm text-sepia-500 dark:text-sepia-400 pt-6 border-t border-sepia-200 dark:border-sepia-700">
          <p>ChavrutAI is continuously improved to enhance Talmud study experience.</p>
        </div>

      </div>
      </div>

      <Footer />
    </div>
  );
}