import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronUp, ChevronDown, Hash } from "lucide-react";

interface SectionNavigationProps {
  totalSections: number;
  currentSection?: number;
  onSectionChange?: (section: number) => void;
}

export function SectionNavigation({ totalSections, currentSection, onSectionChange }: SectionNavigationProps) {
  const [activeSection, setActiveSection] = useState<number>(currentSection || 1);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(totalSections > 1);
  }, [totalSections]);

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash && hash.startsWith('#section-')) {
        const sectionNumber = parseInt(hash.replace('#section-', ''));
        if (sectionNumber >= 1 && sectionNumber <= totalSections) {
          setActiveSection(sectionNumber);
        }
      } else {
        setActiveSection(1);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    handleHashChange();

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, [totalSections]);

  useEffect(() => {
    if (currentSection) {
      setActiveSection(currentSection);
    }
  }, [currentSection]);

  const navigateToSection = (sectionNumber: number) => {
    if (sectionNumber >= 1 && sectionNumber <= totalSections) {
      const newHash = `#section-${sectionNumber}`;
      window.history.pushState(null, '', window.location.pathname + window.location.search + newHash);
      
      const sectionElement = document.getElementById(`section-${sectionNumber}`);
      if (sectionElement) {
        const headerOffset = 100;
        const elementPosition = sectionElement.offsetTop;
        const offsetPosition = elementPosition - headerOffset;
        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
      }
      
      setActiveSection(sectionNumber);
      onSectionChange?.(sectionNumber);
    }
  };

  const goToPreviousSection = () => {
    if (activeSection > 1) {
      navigateToSection(activeSection - 1);
    }
  };

  const goToNextSection = () => {
    if (activeSection < totalSections) {
      navigateToSection(activeSection + 1);
    }
  };

  if (!isVisible) return null;

  return (
    <nav 
      className="fixed bottom-6 right-6 z-40"
      role="navigation"
      aria-label="Section navigation"
    >
      <div className="bg-card border border-border rounded-lg shadow-lg p-2 flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={goToPreviousSection}
          disabled={activeSection <= 1}
          className="h-8 w-8 p-0"
          data-testid="button-previous-section"
          aria-label={`Go to previous section (${activeSection - 1} of ${totalSections})`}
          aria-disabled={activeSection <= 1}
        >
          <ChevronUp className="h-3 w-3" aria-hidden="true" />
        </Button>

        <div 
          className="flex items-center gap-1 px-2 py-1 bg-muted rounded text-sm font-medium min-w-0"
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          <Hash className="h-3 w-3 text-muted-foreground" aria-hidden="true" />
          <span 
            className="text-xs" 
            data-testid="text-current-section"
            aria-label={`Currently viewing section ${activeSection} of ${totalSections}`}
          >
            {activeSection} / {totalSections}
          </span>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={goToNextSection}
          disabled={activeSection >= totalSections}
          className="h-8 w-8 p-0"
          data-testid="button-next-section"
          aria-label={`Go to next section (${activeSection + 1} of ${totalSections})`}
          aria-disabled={activeSection >= totalSections}
        >
          <ChevronDown className="h-3 w-3" aria-hidden="true" />
        </Button>
      </div>
    </nav>
  );
}
