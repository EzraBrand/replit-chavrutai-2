import { ExternalLink, ChevronDown, ChevronRight } from "lucide-react";
import { Link } from "wouter";
import { useState } from "react";
import type { ChapterOutline } from '@shared/schema';

interface OutlineTableProps {
  outline: ChapterOutline;
}

export function OutlineTable({ outline }: OutlineTableProps) {
  const [expandedCards, setExpandedCards] = useState<Set<number>>(new Set());

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

  const toggleExpanded = (rowNumber: number) => {
    setExpandedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(rowNumber)) {
        newSet.delete(rowNumber);
      } else {
        newSet.add(rowNumber);
      }
      return newSet;
    });
  };

  return (
    <div className="space-y-3">
      {outline.entries.map((entry) => {
        const isExpanded = expandedCards.has(entry.rowNumber);
        const keywords = parseKeywords(entry.keywords);
        
        return (
          <div 
            key={entry.rowNumber}
            className="bg-sepia-50 dark:bg-sepia-900 border border-sepia-200 dark:border-sepia-700 rounded-lg shadow-sm transition-all duration-200 hover:shadow-md"
          >
            {/* Primary View - Always Visible */}
            <div 
              className="p-4 cursor-pointer"
              onClick={() => toggleExpanded(entry.rowNumber)}
              data-testid={`accordion-header-${entry.rowNumber}`}
            >
              <div className="flex items-start justify-between">
                {/* Left Side: Core Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    {/* Row Number */}
                    <span className="bg-sepia-200 dark:bg-sepia-800 text-sepia-900 dark:text-sepia-100 text-sm font-semibold px-2 py-1 rounded flex-shrink-0">
                      #{entry.rowNumber}
                    </span>
                    
                    {/* Location Link */}
                    <Link 
                      href={createTextLink(entry.locationRange, outline.tractate)}
                      className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium underline decoration-dotted underline-offset-2 transition-colors text-sm flex-shrink-0"
                      data-testid={`link-location-${entry.rowNumber}`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {entry.locationRange}
                    </Link>

                    {/* Section Count */}
                    <span className="bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200 text-xs px-2 py-1 rounded flex-shrink-0">
                      {entry.sectionCount} sections
                    </span>
                  </div>
                  
                  {/* Condensed Topic Title */}
                  <h3 className="text-sepia-900 dark:text-sepia-100 font-medium text-base leading-normal pr-4">
                    {entry.sectionHeader.length > 80 ? `${entry.sectionHeader.substring(0, 80)}...` : entry.sectionHeader}
                  </h3>
                  
                  {/* Preview Keywords (first 2) */}
                  <div className="flex gap-2 mt-2">
                    {keywords.slice(0, 2).map((keyword, keywordIndex) => (
                      <span 
                        key={keywordIndex}
                        className="inline-block bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs px-2 py-1 rounded-full font-medium"
                        data-testid={`tag-keyword-preview-${keywordIndex}`}
                      >
                        {keyword}
                      </span>
                    ))}
                    {keywords.length > 2 && (
                      <span className="text-xs text-sepia-500 dark:text-sepia-400 px-2 py-1">
                        +{keywords.length - 2} more
                      </span>
                    )}
                  </div>
                </div>

                {/* Right Side: Expand Button */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {entry.blogpostUrl && (
                    <a 
                      href={entry.blogpostUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 text-sm font-medium underline decoration-dotted underline-offset-2 transition-colors"
                      data-testid={`link-blog-${entry.rowNumber}`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      Blog ↗
                    </a>
                  )}
                  {isExpanded ? (
                    <ChevronDown className="h-5 w-5 text-sepia-600 dark:text-sepia-400" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-sepia-600 dark:text-sepia-400" />
                  )}
                </div>
              </div>
            </div>

            {/* Expanded View - Conditional */}
            {isExpanded && (
              <div className="border-t border-sepia-200 dark:border-sepia-700 p-4 bg-sepia-25 dark:bg-sepia-950">
                {/* Full Section Header */}
                <div className="mb-4">
                  <h4 className="text-sepia-800 dark:text-sepia-200 font-medium text-sm uppercase tracking-wide mb-2">
                    Full Topic Description
                  </h4>
                  <p className="text-sepia-900 dark:text-sepia-100 text-base leading-relaxed">
                    {entry.sectionHeader}
                  </p>
                </div>

                {/* All Keywords */}
                <div className="mb-4">
                  <h4 className="text-sepia-800 dark:text-sepia-200 font-medium text-sm uppercase tracking-wide mb-2">
                    Keywords & Concepts
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {keywords.map((keyword, keywordIndex) => (
                      <span 
                        key={keywordIndex}
                        className="inline-block bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-sm px-3 py-1 rounded-full font-medium"
                        data-testid={`tag-keyword-expanded-${keywordIndex}`}
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Additional Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Macro Sugya */}
                  {entry.macroSugya && (
                    <div>
                      <h4 className="text-sepia-800 dark:text-sepia-200 font-medium text-sm uppercase tracking-wide mb-2">
                        Macro Sugya
                      </h4>
                      <p className="text-sepia-700 dark:text-sepia-300 text-sm">
                        {entry.macroSugya}
                      </p>
                    </div>
                  )}

                  {/* Blog Link */}
                  {entry.blogpostUrl && (
                    <div>
                      <h4 className="text-sepia-800 dark:text-sepia-200 font-medium text-sm uppercase tracking-wide mb-2">
                        Related Blog Post
                      </h4>
                      <a 
                        href={entry.blogpostUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 font-medium underline decoration-dotted underline-offset-2 transition-colors flex items-center gap-1"
                        data-testid={`link-blog-expanded-${entry.rowNumber}`}
                      >
                        View Blog Post <ExternalLink className="h-4 w-4" />
                      </a>
                    </div>
                  )}
                </div>

                {/* Quick Navigation */}
                <div className="mt-4 pt-3 border-t border-sepia-200 dark:border-sepia-700">
                  <Link 
                    href={createTextLink(entry.locationRange, outline.tractate)}
                    className="inline-flex items-center gap-2 bg-blue-600 dark:bg-blue-500 text-white px-4 py-2 rounded-md font-medium hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
                    data-testid={`button-navigate-${entry.rowNumber}`}
                  >
                    📖 Read This Section
                  </Link>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}