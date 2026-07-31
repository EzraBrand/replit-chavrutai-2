import { Link } from "wouter";
import { usePreferences, type Theme } from "@/context/preferences-context";
import { trackEvent } from "@/lib/analytics";

/*
 * Shared site footer — ParchmentScholar design (see DESIGN.md).
 * Muted surface, hairline top border, text links only (no icons),
 * near-square corners, 64rem content column.
 */

const THEMES: { value: Theme; label: string; testid: string }[] = [
  { value: "paper", label: "Paper", testid: "button-theme-paper" },
  { value: "white", label: "White", testid: "button-theme-white" },
  { value: "dark", label: "Dark", testid: "button-theme-dark" },
  { value: "high-contrast", label: "High Contrast", testid: "button-theme-high-contrast" },
];

export function Footer() {
  const { preferences, setTheme } = usePreferences();

  const handleThemeChange = (theme: Theme) => {
    trackEvent('change_preference', 'settings', `theme_${theme}`);
    setTheme(theme);
  };

  return (
    <footer className="border-t border-border bg-muted mt-12 min-h-[280px]">
      <div className="max-w-content mx-auto px-6 py-10">
        {/* Theme Picker */}
        <div className="flex justify-center mb-10">
          <div className="inline-flex items-center border border-border rounded overflow-hidden" data-testid="footer-theme-picker">
            {THEMES.map((t, i) => (
              <button
                key={t.value}
                onClick={() => handleThemeChange(t.value)}
                className={`px-3 py-1.5 text-sm transition-colors ${i > 0 ? 'border-l border-border' : ''} ${
                  preferences.theme === t.value
                    ? 'bg-background text-foreground font-medium'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                }`}
                data-testid={t.testid}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Multi-Column Navigation */}
        <div className="grid grid-cols-[1fr_1.4fr_1fr] gap-4 sm:gap-8 max-w-3xl mx-auto mb-8">
          {/* Column 1: Library */}
          <div>
            <h3 className="font-georgia text-base text-foreground mb-4">Library</h3>
            <nav className="flex flex-col gap-3">
              <Link
                href="/talmud"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
                data-testid="footer-link-library-talmud"
              >
                Babylonian Talmud
              </Link>
              <Link
                href="/bible"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
                data-testid="footer-link-library-bible"
              >
                Tanakh (Hebrew Bible)
              </Link>
              <Link
                href="/mishnah"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
                data-testid="footer-link-library-mishnah"
              >
                Mishnah
              </Link>
              <Link
                href="/yerushalmi"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
                data-testid="footer-link-library-yerushalmi"
              >
                Jerusalem Talmud
              </Link>
              <Link
                href="/rambam"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
                data-testid="footer-link-library-rambam"
              >
                Mishneh Torah (Rambam)
              </Link>
            </nav>
          </div>

          {/* Column 2: Study Resources */}
          <div>
            <h3 className="font-georgia text-base text-foreground mb-4">Study Resources</h3>
            <nav className="flex flex-col gap-3">
              <Link 
                href="/sugya-viewer"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
                data-testid="footer-link-sugya-viewer"
              >
                Sugya Viewer - by Custom Range
              </Link>
              <Link 
                href="/suggested-pages"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
                data-testid="footer-link-suggested-pages"
              >
                Suggested Talmud Pages
              </Link>
              <Link 
                href="/biblical-index"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
                data-testid="footer-link-biblical-index"
              >
                Bible-Talmud Index
              </Link>
              <Link 
                href="/mishnah-map"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
                data-testid="footer-link-mishnah-map"
              >
                Mishnah-Talmud Mapping
              </Link>
              <Link 
                href="/blog-posts"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
                data-testid="footer-link-blog-posts"
              >
                Blog Posts
              </Link>
              <Link 
                href="/jastrow"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
                data-testid="footer-link-jastrow"
              >
                Jastrow Talmud Dictionary
              </Link>
              <Link 
                href="/bdb"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
                data-testid="footer-link-bdb"
              >
                BDB Hebrew Bible Dictionary
              </Link>
              <Link 
                href="/term-index"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
                data-testid="footer-link-term-index"
              >
                Talmud Term Index
              </Link>
              <Link 
                href="/search"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
                data-testid="footer-link-search"
              >
                Search - Bible & Talmud
              </Link>
            </nav>
          </div>

          {/* Column 3: About & Legal */}
          <div>
            <h3 className="font-georgia text-base text-foreground mb-4">About & Legal</h3>
            <nav className="flex flex-col gap-3">
              <Link 
                href="/about"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
                data-testid="footer-link-about"
              >
                About
              </Link>
              <Link 
                href="/sitemap"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
                data-testid="footer-link-sitemap"
              >
                Sitemap
              </Link>
              <Link 
                href="/contact"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
                data-testid="footer-link-contact"
              >
                Contact
              </Link>
              <Link 
                href="/privacy"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
                data-testid="footer-link-privacy"
              >
                Privacy
              </Link>
              <a
                href="https://opensource.org/licenses/MIT"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
                data-testid="footer-link-mit-license"
              >
                MIT License ↗
              </a>
              <Link 
                href="/changelog"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
                data-testid="footer-link-changelog"
              >
                Changelog
              </Link>
              <a 
                href="https://github.com/EzraBrand/chavrutai"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
                data-testid="footer-link-github"
              >
                GitHub ↗
              </a>
              <a
                href="https://x.com/ChavrutAI"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
                data-testid="footer-link-twitter"
              >
                Follow on X ↗
              </a>
              <a
                href="https://www.ezrabrand.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
                data-testid="footer-link-talmud-tech-nav"
              >
                Talmud & Tech ↗
              </a>
            </nav>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-border pt-6">
          <div className="flex flex-col items-center gap-4">
            {/* Branding */}
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Bekiut © {new Date().getFullYear()} by{" "}
                <a 
                  href="https://www.ezrabrand.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-foreground hover:text-primary transition-colors duration-200"
                  data-testid="footer-link-talmud-tech"
                >
                  Talmud & Tech ↗
                </a>
              </p>
            </div>

            {/* Sefaria Attribution */}
            <div className="flex items-center gap-3">
              <a 
                href="https://www.sefaria.org/texts/Talmud"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 hover:opacity-80 transition-opacity duration-200"
                aria-label="Powered by Sefaria - Talmud Library"
                data-testid="footer-link-sefaria"
              >
                <img 
                  src="/powered-by-sefaria.png" 
                  alt="Powered by Sefaria" 
                  className="h-8"
                  width={62}
                  height={32}
                  loading="lazy"
                  decoding="async"
                  data-testid="sefaria-powered-by-image"
                />
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
