import { Link } from "wouter";
import { ExternalLink } from "lucide-react";
import poweredBySefariaPath from "@/assets/powered-by-sefaria.png";

export function Footer() {
  return (
    <footer className="border-t border-border bg-card mt-12">
      <div className="container mx-auto px-4 py-10">
        {/* Multi-Column Navigation */}
        <div className="grid grid-cols-2 gap-4 sm:gap-8 max-w-2xl mx-auto mb-8">
          {/* Column 1: Study Resources */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-4">Study Resources</h3>
            <nav className="flex flex-col gap-3">
              <Link 
                href="/contents"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
                data-testid="footer-link-contents"
              >
                Talmud - Table of Contents
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
                href="/dictionary"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
                data-testid="footer-link-dictionary"
              >
                Jastrow Talmud Dictionary
              </Link>
              <Link 
                href="/bible"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
                data-testid="footer-link-bible"
              >
                Bible - Table of Contents
              </Link>
            </nav>
          </div>

          {/* Column 2: About & Legal */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-4">About & Legal</h3>
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
              <Link 
                href="/changelog"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
                data-testid="footer-link-changelog"
              >
                Changelog
              </Link>
              <a 
                href="https://github.com/EzraBrand/replit-chavrutai-2"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200 inline-flex items-center gap-1"
                data-testid="footer-link-github"
              >
                GitHub
                <ExternalLink size={14} />
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
                ChavrutAI © 2025 by{" "}
                <a 
                  href="https://www.ezrabrand.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-foreground hover:text-primary transition-colors duration-200 inline-flex items-center gap-1"
                  data-testid="footer-link-talmud-tech"
                >
                  Talmud & Tech
                  <ExternalLink size={12} />
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
                data-testid="footer-link-sefaria"
              >
                <img 
                  src={poweredBySefariaPath} 
                  alt="Powered by Sefaria" 
                  className="h-8 w-auto"
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