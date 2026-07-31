import { Link } from "wouter";

/*
 * Shared site header — ParchmentScholar design (see DESIGN.md).
 * Matches the homepage nav: logo + "ChavrutAI" in navy on the left,
 * muted text links on the right, hairline bottom border, 64rem column.
 */

interface HeaderSimpleProps {
  maxWidth?: string;
}

export function HeaderSimple({ maxWidth = "max-w-content" }: HeaderSimpleProps) {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background">
      <div className={`${maxWidth} mx-auto px-6 py-4 flex items-center justify-between`}>
        <Link
          href="/"
          className="flex items-center gap-2"
          data-testid="header-logo-link"
        >
          <img
            src="/hebrew-book-icon.png"
            alt="ChavrutAI logo"
            className="w-8 h-8 object-cover"
            width={32}
            height={32}
          />
          <span className="text-xl font-semibold text-primary dark:text-[#5b9fc5]">
            ChavrutAI
          </span>
        </Link>
        <nav className="flex items-center gap-4 sm:gap-6 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-foreground" data-testid="nav-link-library">Library</Link>
          <Link href="/search" className="hover:text-foreground" data-testid="nav-link-search">Search</Link>
          <Link href="/about" className="hover:text-foreground hidden sm:inline" data-testid="nav-link-about">About ChavrutAI</Link>
        </nav>
      </div>
    </header>
  );
}
