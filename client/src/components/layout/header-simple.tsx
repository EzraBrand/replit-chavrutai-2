import { Link } from "wouter";

interface HeaderSimpleProps {
  maxWidth?: string;
}

export function HeaderSimple({ maxWidth = "max-w-7xl" }: HeaderSimpleProps) {
  return (
    <header className="sticky top-0 z-50 bg-card border-b border-border shadow-sm">
      <div className={`${maxWidth} mx-auto px-4 py-4`}>
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
  );
}
