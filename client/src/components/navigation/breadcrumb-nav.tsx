import { useState, useEffect, useRef } from "react";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { TalmudLocation, Chapter, Work } from "@/types/talmud";
import { WORKS } from "@/types/talmud";
import { useQuery } from "@tanstack/react-query";
import { sefariaAPI } from "@/lib/sefaria";

interface BreadcrumbNavProps {
  location: TalmudLocation;
  onLocationChange: (location: TalmudLocation) => void;
}

export function BreadcrumbNav({ location, onLocationChange }: BreadcrumbNavProps) {
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const dropdownRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  // Fetch tractates for current work
  const { data: tractates = [] } = useQuery({
    queryKey: ['/api/tractates', location.work],
    queryFn: () => sefariaAPI.getTractates(location.work),
  });

  // Fetch chapters for current tractate
  const { data: chapters = [] } = useQuery({
    queryKey: ['/api/chapters', location.tractate],
    queryFn: () => sefariaAPI.getChapters(location.tractate),
  });

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (activeDropdown && dropdownRefs.current[activeDropdown]) {
        const dropdown = dropdownRefs.current[activeDropdown];
        if (dropdown && !dropdown.contains(event.target as Node)) {
          setActiveDropdown(null);
        }
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activeDropdown]);

  const toggleDropdown = (dropdownId: string) => {
    setActiveDropdown(activeDropdown === dropdownId ? null : dropdownId);
  };

  const handleWorkChange = (work: Work) => {
    onLocationChange({
      work,
      tractate: "Berakhot", // Default tractate
      chapter: 1,
      folio: 2,
      side: 'a'
    });
    setActiveDropdown(null);
  };

  const handleTractateChange = (tractate: string) => {
    onLocationChange({
      ...location,
      tractate,
      chapter: 1,
      folio: 2,
      side: 'a'
    });
    setActiveDropdown(null);
  };

  const handleChapterChange = (chapter: number) => {
    onLocationChange({
      ...location,
      chapter,
      folio: 2,
      side: 'a'
    });
    setActiveDropdown(null);
  };

  const handlePageChange = (folio: number, side: 'a' | 'b') => {
    onLocationChange({
      ...location,
      folio,
      side
    });
    setActiveDropdown(null);
  };

  // Generate page options for current chapter with expanded ranges
  const generatePageOptions = () => {
    const pages: Array<{ folio: number; side: 'a' | 'b'; label: string }> = [];
    
    // Generate all pages from 2 to 150 to support full range navigation
    for (let folio = 2; folio <= 150; folio++) {
      pages.push({ folio, side: 'a', label: `${folio}a` });
      pages.push({ folio, side: 'b', label: `${folio}b` });
    }
    
    return pages;
  };

  const DropdownButton = ({ 
    id, 
    children, 
    className = "" 
  }: { 
    id: string; 
    children: React.ReactNode;
    className?: string;
  }) => (
    <Button
      variant="ghost"
      className={`flex items-center space-x-1 px-3 py-2 text-talmud-blue hover:bg-sepia-50 rounded transition-colors ${className}`}
      onClick={() => toggleDropdown(id)}
    >
      {children}
      <ChevronDown className="w-3 h-3" />
    </Button>
  );

  const DropdownContent = ({ 
    id, 
    children, 
    className = "left-0" 
  }: { 
    id: string; 
    children: React.ReactNode;
    className?: string;
  }) => (
    <div 
      ref={(el) => dropdownRefs.current[id] = el}
      className={`absolute top-full mt-1 w-56 bg-white border border-sepia-200 rounded-lg shadow-lg z-30 ${
        activeDropdown === id ? 'block' : 'hidden'
      } ${className}`}
    >
      <div className="py-2">
        {children}
      </div>
    </div>
  );

  const DropdownItem = ({ 
    onClick, 
    children, 
    isActive = false 
  }: { 
    onClick: () => void; 
    children: React.ReactNode;
    isActive?: boolean;
  }) => (
    <button
      onClick={onClick}
      className={`block w-full text-left px-4 py-2 hover:bg-sepia-50 text-gray-700 transition-colors ${
        isActive ? 'bg-sepia-100' : ''
      }`}
    >
      {children}
    </button>
  );

  return (
    <nav className="hidden lg:flex items-center space-x-2 bg-white rounded-lg px-4 py-2 shadow-sm border border-sepia-200">
      {/* Work Dropdown */}
      <div className="relative">
        <DropdownButton id="work">
          <span>{location.work}</span>
        </DropdownButton>
        <DropdownContent id="work">
          {WORKS.map((work) => (
            <DropdownItem
              key={work}
              onClick={() => handleWorkChange(work)}
              isActive={location.work === work}
            >
              {work}
            </DropdownItem>
          ))}
        </DropdownContent>
      </div>

      <span className="text-gray-400">›</span>

      {/* Tractate Dropdown */}
      <div className="relative">
        <DropdownButton id="tractate">
          <span>{location.tractate}</span>
        </DropdownButton>
        <DropdownContent id="tractate">
          <div className="max-h-64 overflow-y-auto">
            {tractates.map((tractate) => (
              <DropdownItem
                key={tractate}
                onClick={() => handleTractateChange(tractate)}
                isActive={location.tractate === tractate}
              >
                {tractate}
              </DropdownItem>
            ))}
          </div>
        </DropdownContent>
      </div>

      <span className="text-gray-400">›</span>

      {/* Chapter Dropdown */}
      <div className="relative">
        <DropdownButton id="chapter">
          <span>Chapter {location.chapter}</span>
        </DropdownButton>
        <DropdownContent id="chapter" className="w-64">
          {chapters.map((chapter) => (
            <DropdownItem
              key={chapter.number}
              onClick={() => handleChapterChange(chapter.number)}
              isActive={location.chapter === chapter.number}
            >
              Chapter {chapter.number} ({chapter.folioRange})
            </DropdownItem>
          ))}
        </DropdownContent>
      </div>

      <span className="text-gray-400">›</span>

      {/* Page Dropdown */}
      <div className="relative">
        <DropdownButton id="page">
          <span>{location.folio}{location.side}</span>
        </DropdownButton>
        <DropdownContent id="page" className="right-0 w-32">
          <div className="max-h-64 overflow-y-auto">
            {generatePageOptions().map((page) => (
              <DropdownItem
                key={page.label}
                onClick={() => handlePageChange(page.folio, page.side)}
                isActive={location.folio === page.folio && location.side === page.side}
              >
                {page.label}
              </DropdownItem>
            ))}
          </div>
        </DropdownContent>
      </div>
    </nav>
  );
}
