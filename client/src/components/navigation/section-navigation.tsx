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

  // Show navigation only if there are multiple sections
  useEffect(() => {
    setIsVisible(totalSections > 1);
  }, [totalSections]);

  // Handle hash changes in URL
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash && hash.startsWith('#section-')) {
        const sectionNumber = parseInt(hash.replace('#section-', ''));
        if (sectionNumber >= 1 && sectionNumber <= totalSections) {
          setActiveSection(sectionNumber);
        }
      }
    };

    // Listen for hash changes
    window.addEventListener('hashchange', handleHashChange);
    
    // Check initial hash
    handleHashChange();

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, [totalSections]);

  // Update active section when prop changes
  useEffect(() => {
    if (currentSection && currentSection !== activeSection) {
      setActiveSection(currentSection);
    }
  }, [currentSection, activeSection]);

  const navigateToSection = (sectionNumber: number) => {
    if (sectionNumber >= 1 && sectionNumber <= totalSections) {
      const newHash = `#section-${sectionNumber}`;
      window.history.pushState(null, '', newHash);
      
      // Scroll to section
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
    <div className="fixed bottom-6 right-6 z-40">
      <div className="bg-card border border-border rounded-lg shadow-lg p-2 flex items-center gap-2">
        {/* Previous Section Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={goToPreviousSection}
          disabled={activeSection <= 1}
          className="h-8 w-8 p-0"
          data-testid="button-previous-section"
          title={`Go to section ${activeSection - 1}`}
        >
          <ChevronUp className="h-3 w-3" />
        </Button>

        {/* Current Section Display */}
        <div className="flex items-center gap-1 px-2 py-1 bg-muted rounded text-sm font-medium min-w-0">
          <Hash className="h-3 w-3 text-muted-foreground" />
          <span className="text-xs" data-testid="text-current-section">
            {activeSection} / {totalSections}
          </span>
        </div>

        {/* Next Section Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={goToNextSection}
          disabled={activeSection >= totalSections}
          className="h-8 w-8 p-0"
          data-testid="button-next-section"
          title={`Go to section ${activeSection + 1}`}
        >
          <ChevronDown className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}