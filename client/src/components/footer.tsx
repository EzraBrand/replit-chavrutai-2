import { Link } from "wouter";

export function Footer() {
  return (
    <footer className="border-t border-border bg-card mt-12">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 text-sm text-muted-foreground">
          <span>ChavrutAI</span>
          <span className="hidden sm:inline">|</span>
          <span>A project of "Talmud & Tech"</span>
          <span className="hidden sm:inline">|</span>
          <Link 
            href="/about"
            className="hover:text-foreground transition-colors duration-200 underline"
          >
            About
          </Link>
        </div>
      </div>
    </footer>
  );
}