import { HamburgerMenu } from "@/components/navigation/hamburger-menu";
import { CenteredBreadcrumbNav } from "@/components/navigation/centered-breadcrumb-nav";
import type { TalmudLocation } from "@/types/talmud";

interface HeaderNavigationProps {
  location: TalmudLocation;
  onLocationChange: (location: TalmudLocation) => void;
  maxWidth?: string;
}

export function HeaderNavigation({ 
  location, 
  onLocationChange,
  maxWidth = "max-w-5xl"
}: HeaderNavigationProps) {
  return (
    <header 
      className="sticky top-0 z-50 bg-card border-b border-border shadow-sm"
      role="banner"
    >
      <div className={`${maxWidth} mx-auto px-4 py-4`}>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center flex-shrink-0">
            <HamburgerMenu onLocationChange={onLocationChange} />
          </div>
          
          <nav 
            className="flex-1 flex items-center justify-center min-w-0"
            aria-label="Breadcrumb navigation"
          >
            <CenteredBreadcrumbNav location={location} onLocationChange={onLocationChange} />
          </nav>
        </div>
      </div>
    </header>
  );
}
