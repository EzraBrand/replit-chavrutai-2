import { ExternalLink, BookOpen } from "lucide-react";
import { Link } from "wouter";
import { useState } from "react";
import type { ChapterOutline } from '@shared/schema';

interface OutlineTableProps {
  outline: ChapterOutline;
}

export function OutlineTable({ outline }: OutlineTableProps) {
  const [selectedEntry, setSelectedEntry] = useState<number | null>(null);

  const parseKeywords = (keywordString: string): string[] => {
    return keywordString.split(',').map(keyword => keyword.trim());
  };

  const createTextLink = (locationRange: string, tractate: string) => {
    // Convert "90a:15 - 90a:17" to link to page with specific section anchor
    const [startLocation] = locationRange.split(' - ');
    const [page, section] = startLocation.split(':');
    
    // Create link with section anchor: /tractate/sanhedrin/90a#section-15
    return `/tractate/${tractate.toLowerCase()}/${page}${section ? `#section-${section}` : ''}`;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main List Area */}
      <div className="lg:col-span-2 space-y-2">
        <h3 className="text-sepia-800 dark:text-sepia-200 font-semibold text-lg mb-4">Chapter Outline</h3>
        
        {outline.entries.map((entry) => (
          <div
            key={entry.rowNumber}
            className={`cursor-pointer rounded-lg p-4 border transition-all duration-200 ${
              selectedEntry === entry.rowNumber
                ? 'bg-blue-50 dark:bg-blue-950 border-blue-300 dark:border-blue-600 shadow-sm'
                : 'bg-sepia-50 dark:bg-sepia-900 border-sepia-200 dark:border-sepia-700 hover:bg-sepia-75 dark:hover:bg-sepia-850 hover:border-sepia-300 dark:hover:border-sepia-600'
            }`}
            onClick={() => setSelectedEntry(selectedEntry === entry.rowNumber ? null : entry.rowNumber)}
            data-testid={`list-entry-${entry.rowNumber}`}
          >
            {/* Entry Header */}
            <div className="flex items-start gap-3">
              {/* Row Number */}
              <span className="flex-shrink-0 bg-sepia-200 dark:bg-sepia-800 text-sepia-900 dark:text-sepia-100 text-sm font-semibold px-2 py-1 rounded">
                #{entry.rowNumber}
              </span>
              
              {/* Main Content */}
              <div className="flex-1 min-w-0">
                {/* Location Link */}
                <div className="mb-2">
                  <Link 
                    href={createTextLink(entry.locationRange, outline.tractate)}
                    className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-semibold underline decoration-dotted underline-offset-2 transition-colors"
                    data-testid={`link-location-list-${entry.rowNumber}`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {entry.locationRange}
                  </Link>
                  <span className="ml-2 text-sepia-500 dark:text-sepia-400 text-sm">
                    ({entry.sectionCount} sections)
                  </span>
                </div>
                
                {/* Topic Title */}
                <h4 className="text-sepia-900 dark:text-sepia-100 font-medium text-base leading-normal">
                  {entry.sectionHeader}
                </h4>
              </div>
              
              {/* Selection Indicator */}
              {selectedEntry === entry.rowNumber && (
                <div className="flex-shrink-0 text-blue-600 dark:text-blue-400">
                  <BookOpen className="h-5 w-5" />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Sidebar Details Panel */}
      <div className="lg:col-span-1">
        {selectedEntry ? (
          <div className="sticky top-6">
            {(() => {
              const entry = outline.entries.find(e => e.rowNumber === selectedEntry);
              if (!entry) return null;
              
              const keywords = parseKeywords(entry.keywords);
              
              return (
                <div className="bg-sepia-25 dark:bg-sepia-950 border border-sepia-200 dark:border-sepia-700 rounded-lg p-5 shadow-sm">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-4 pb-3 border-b border-sepia-200 dark:border-sepia-700">
                    <h3 className="text-sepia-900 dark:text-sepia-100 font-semibold text-lg">
                      Details
                    </h3>
                    <button 
                      onClick={() => setSelectedEntry(null)}
                      className="text-sepia-500 dark:text-sepia-400 hover:text-sepia-700 dark:hover:text-sepia-200 transition-colors"
                      data-testid={`button-close-details-${entry.rowNumber}`}
                    >
                      ✕
                    </button>
                  </div>

                  {/* Location & Stats */}
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="bg-blue-600 dark:bg-blue-500 text-white text-sm font-semibold px-3 py-1 rounded-md">
                        Entry #{entry.rowNumber}
                      </span>
                      <span className="bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200 text-xs px-2 py-1 rounded">
                        {entry.sectionCount} sections
                      </span>
                    </div>
                    <Link 
                      href={createTextLink(entry.locationRange, outline.tractate)}
                      className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-semibold underline decoration-dotted underline-offset-2 transition-colors text-lg"
                      data-testid={`link-location-sidebar-${entry.rowNumber}`}
                    >
                      {entry.locationRange}
                    </Link>
                  </div>

                  {/* Full Topic */}
                  <div className="mb-5">
                    <h4 className="text-sepia-800 dark:text-sepia-200 font-medium text-sm uppercase tracking-wide mb-2">
                      Topic
                    </h4>
                    <p className="text-sepia-900 dark:text-sepia-100 text-base leading-relaxed">
                      {entry.sectionHeader}
                    </p>
                  </div>

                  {/* Keywords */}
                  <div className="mb-5">
                    <h4 className="text-sepia-800 dark:text-sepia-200 font-medium text-sm uppercase tracking-wide mb-3">
                      Keywords & Concepts
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {keywords.map((keyword, keywordIndex) => (
                        <span 
                          key={keywordIndex}
                          className="inline-block bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-sm px-3 py-1 rounded-full font-medium"
                          data-testid={`tag-keyword-sidebar-${keywordIndex}`}
                        >
                          {keyword}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Macro Sugya */}
                  {entry.macroSugya && (
                    <div className="mb-5">
                      <h4 className="text-sepia-800 dark:text-sepia-200 font-medium text-sm uppercase tracking-wide mb-2">
                        Macro Sugya
                      </h4>
                      <p className="text-sepia-700 dark:text-sepia-300 text-sm leading-relaxed">
                        {entry.macroSugya}
                      </p>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="space-y-3">
                    <Link 
                      href={createTextLink(entry.locationRange, outline.tractate)}
                      className="w-full inline-flex items-center justify-center gap-2 bg-blue-600 dark:bg-blue-500 text-white px-4 py-3 rounded-md font-medium hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
                      data-testid={`button-read-sidebar-${entry.rowNumber}`}
                    >
                      <BookOpen className="h-5 w-5" />
                      Read This Section
                    </Link>
                    
                    {entry.blogpostUrl && (
                      <a 
                        href={entry.blogpostUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full inline-flex items-center justify-center gap-2 bg-green-600 dark:bg-green-500 text-white px-4 py-3 rounded-md font-medium hover:bg-green-700 dark:hover:bg-green-600 transition-colors"
                        data-testid={`link-blog-sidebar-${entry.rowNumber}`}
                      >
                        View Blog Post <ExternalLink className="h-5 w-5" />
                      </a>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        ) : (
          <div className="sticky top-6 bg-sepia-50 dark:bg-sepia-900 border border-sepia-200 dark:border-sepia-700 rounded-lg p-6 text-center">
            <div className="text-sepia-400 dark:text-sepia-500 mb-2">
              <BookOpen className="h-8 w-8 mx-auto mb-3 opacity-50" />
            </div>
            <h3 className="text-sepia-700 dark:text-sepia-300 font-medium mb-2">
              Select an Entry
            </h3>
            <p className="text-sepia-500 dark:text-sepia-400 text-sm">
              Click on any topic from the list to see detailed information, keywords, and navigation options.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}