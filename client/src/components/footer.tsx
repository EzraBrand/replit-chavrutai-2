import { Link } from "wouter";
import { ExternalLink } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border bg-card mt-12">
      <div className="container mx-auto px-4 py-6">
        {/* Navigation Links */}
        <div className="flex flex-wrap justify-center gap-4 mb-4 text-sm">
          <Link 
            href="/"
            className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors duration-200"
            data-testid="footer-link-home"
          >
            Home
          </Link>
          <Link 
            href="/contents"
            className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors duration-200"
            data-testid="footer-link-contents"
          >
            All Tractates
          </Link>
          <Link 
            href="/outline/sanhedrin/10"
            className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors duration-200"
            data-testid="footer-link-sanhedrin-outline"
          >
            Sanhedrin Outline
          </Link>
          <Link 
            href="/about"
            className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors duration-200"
            data-testid="footer-link-about"
          >
            About
          </Link>
          <Link 
            href="/sitemap"
            className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors duration-200"
            data-testid="footer-link-sitemap"
          >
            Sitemap
          </Link>
          <Link 
            href="/changelog"
            className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors duration-200"
            data-testid="footer-link-changelog"
          >
            Changelog
          </Link>
          <Link 
            href="/contact"
            className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors duration-200"
            data-testid="footer-link-contact"
          >
            Contact
          </Link>
          <a 
            href="https://github.com/EzraBrand/replit-chavrutai-2"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors duration-200 flex items-center gap-1"
            data-testid="footer-link-github"
          >
            GitHub
            <ExternalLink size={12} />
          </a>
        </div>

        {/* Project Info */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 text-sm text-muted-foreground">
          <span>ChavrutAI</span>
          <span className="hidden sm:inline">|</span>
          <span>Uses data from Sefaria (not affiliated)</span>
          <span className="hidden sm:inline">|</span>
          <span>A project of <a 
            href="https://www.ezrabrand.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors duration-200 inline-flex items-center gap-1"
            data-testid="footer-link-talmud-tech"
          >
            "Talmud & Tech"
            <ExternalLink size={12} />
          </a></span>
        </div>
      </div>
    </footer>
  );
}