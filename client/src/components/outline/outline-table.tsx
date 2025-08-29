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
    <div>
      {/* Clean Badge Layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {outline.entries.map((entry) => (
          <div
            key={entry.rowNumber}
            className={`group relative cursor-pointer transition-all duration-200 ${
              selectedEntry === entry.rowNumber 
                ? 'ring-2 ring-blue-500 ring-opacity-50' 
                : ''
            }`}
            onClick={() => setSelectedEntry(selectedEntry === entry.rowNumber ? null : entry.rowNumber)}
            data-testid={`badge-entry-${entry.rowNumber}`}
          >
            <div className="bg-sepia-50 dark:bg-sepia-900 border border-sepia-200 dark:border-sepia-700 rounded-lg p-4 hover:shadow-md hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-200">
              {/* Location Badge */}
              <div className="flex items-center justify-between mb-2">
                <Link 
                  href={createTextLink(entry.locationRange, outline.tractate)}
                  className="bg-blue-600 dark:bg-blue-500 text-white px-3 py-1 rounded-md font-semibold text-sm hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
                  data-testid={`link-location-badge-${entry.rowNumber}`}
                  onClick={(e) => e.stopPropagation()}
                >
                  {entry.locationRange}
                </Link>
                <span className="text-sepia-500 dark:text-sepia-400 text-xs">
                  #{entry.rowNumber}
                </span>
              </div>

              {/* Topic Preview */}
              <div className="text-sepia-800 dark:text-sepia-200 text-sm leading-relaxed">
                {entry.sectionHeader.length > 60 ? `${entry.sectionHeader.substring(0, 60)}...` : entry.sectionHeader}
              </div>

              {/* Section Count Indicator */}
              <div className="flex items-center justify-between mt-3">
                <span className="text-xs text-sepia-600 dark:text-sepia-400">
                  {entry.sectionCount} sections
                </span>
                {entry.blogpostUrl && (
                  <a 
                    href={entry.blogpostUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 text-xs"
                    data-testid={`link-blog-badge-${entry.rowNumber}`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    Blog ↗
                  </a>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Selected Entry Details */}
      {selectedEntry && (
        <div className="mt-6 p-6 bg-sepia-25 dark:bg-sepia-950 border border-sepia-200 dark:border-sepia-700 rounded-lg">
          {(() => {
            const entry = outline.entries.find(e => e.rowNumber === selectedEntry);
            if (!entry) return null;
            
            const keywords = parseKeywords(entry.keywords);
            
            return (
              <div>
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="bg-blue-600 dark:bg-blue-500 text-white text-sm font-semibold px-3 py-1 rounded-md">
                      #{entry.rowNumber}
                    </span>
                    <Link 
                      href={createTextLink(entry.locationRange, outline.tractate)}
                      className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-semibold underline decoration-dotted underline-offset-2 transition-colors"
                      data-testid={`link-location-detail-${entry.rowNumber}`}
                    >
                      {entry.locationRange}
                    </Link>
                    <span className="bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200 text-xs px-2 py-1 rounded">
                      {entry.sectionCount} sections
                    </span>
                  </div>
                  <button 
                    onClick={() => setSelectedEntry(null)}
                    className="text-sepia-500 dark:text-sepia-400 hover:text-sepia-700 dark:hover:text-sepia-200 text-sm"
                  >
                    ✕
                  </button>
                </div>

                {/* Full Topic Description */}
                <div className="mb-4">
                  <h3 className="text-sepia-900 dark:text-sepia-100 font-semibold text-lg leading-relaxed mb-2">
                    {entry.sectionHeader}
                  </h3>
                </div>

                {/* Keywords */}
                <div className="mb-4">
                  <h4 className="text-sepia-800 dark:text-sepia-200 font-medium text-sm uppercase tracking-wide mb-3">
                    Keywords & Concepts
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {keywords.map((keyword, keywordIndex) => (
                      <span 
                        key={keywordIndex}
                        className="inline-block bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-sm px-3 py-2 rounded-full font-medium"
                        data-testid={`tag-keyword-detail-${keywordIndex}`}
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Additional Info & Actions */}
                <div className="flex flex-col sm:flex-row gap-4 justify-between items-start">
                  {/* Macro Sugya */}
                  {entry.macroSugya && (
                    <div className="flex-1">
                      <h4 className="text-sepia-800 dark:text-sepia-200 font-medium text-sm uppercase tracking-wide mb-2">
                        Macro Sugya
                      </h4>
                      <p className="text-sepia-700 dark:text-sepia-300 text-sm">
                        {entry.macroSugya}
                      </p>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-3 flex-shrink-0">
                    {entry.blogpostUrl && (
                      <a 
                        href={entry.blogpostUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 bg-green-600 dark:bg-green-500 text-white px-4 py-2 rounded-md font-medium hover:bg-green-700 dark:hover:bg-green-600 transition-colors text-sm"
                        data-testid={`link-blog-detail-${entry.rowNumber}`}
                      >
                        Blog Post <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                    <Link 
                      href={createTextLink(entry.locationRange, outline.tractate)}
                      className="inline-flex items-center gap-2 bg-blue-600 dark:bg-blue-500 text-white px-4 py-2 rounded-md font-medium hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors text-sm"
                      data-testid={`button-read-section-${entry.rowNumber}`}
                    >
                      <BookOpen className="h-4 w-4" />
                      Read Section
                    </Link>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}