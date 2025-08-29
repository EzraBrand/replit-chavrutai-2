import { ExternalLink, ChevronDown, ChevronRight } from "lucide-react";
import { Link } from "wouter";
import { useState, Fragment } from "react";
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
    <div className="overflow-x-auto">
      <table className="w-full border-collapse bg-sepia-50 dark:bg-sepia-900 rounded-lg shadow-sm">
        <thead>
          <tr className="border-b border-sepia-200 dark:border-sepia-700 bg-sepia-100 dark:bg-sepia-800">
            <th className="text-left font-semibold text-sepia-900 dark:text-sepia-100 text-sm p-4 w-20">
              Row #
            </th>
            <th className="text-left font-semibold text-sepia-900 dark:text-sepia-100 text-sm p-4">
              Content
            </th>
            <th className="text-left font-semibold text-sepia-900 dark:text-sepia-100 text-sm p-4 w-40">
              Page Range
            </th>
          </tr>
        </thead>
        <tbody>
          {outline.entries.map((entry) => {
            const isExpanded = selectedEntry === entry.rowNumber;
            const keywords = parseKeywords(entry.keywords);
            
            return (
              <Fragment key={`entry-${entry.rowNumber}`}>
                {/* Main Row */}
                <tr
                  className={`cursor-pointer border-b border-sepia-200 dark:border-sepia-700 transition-all duration-200 ${
                    isExpanded
                      ? 'bg-blue-50 dark:bg-blue-950 hover:bg-blue-75 dark:hover:bg-blue-925'
                      : 'hover:bg-sepia-75 dark:hover:bg-sepia-850'
                  }`}
                  onClick={() => setSelectedEntry(selectedEntry === entry.rowNumber ? null : entry.rowNumber)}
                  data-testid={`table-row-${entry.rowNumber}`}
                >
                  <td className="p-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <span className="font-semibold text-sepia-900 dark:text-sepia-100">
                        {entry.rowNumber}
                      </span>
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-sepia-600 dark:text-sepia-400" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-sepia-600 dark:text-sepia-400" />
                      )}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="text-sepia-900 dark:text-sepia-100 font-medium leading-relaxed">
                      {entry.sectionHeader}
                    </div>
                  </td>
                  <td className="p-4">
                    <Link 
                      href={createTextLink(entry.locationRange, outline.tractate)}
                      className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-semibold underline decoration-dotted underline-offset-2 transition-colors"
                      data-testid={`link-location-table-${entry.rowNumber}`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {entry.locationRange}
                    </Link>
                  </td>
                </tr>

                {/* Expandable Sub-Row */}
                {isExpanded && (
                  <tr className="bg-sepia-25 dark:bg-sepia-950">
                    <td colSpan={3} className="p-0">
                      <div className="px-6 py-4 border-b border-sepia-200 dark:border-sepia-700">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {/* Section Count */}
                          <div>
                            <h4 className="text-sepia-800 dark:text-sepia-200 font-medium text-xs uppercase tracking-wide mb-2">
                              Section Count
                            </h4>
                            <div className="bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200 text-sm px-3 py-2 rounded-md font-medium inline-block">
                              {entry.sectionCount} sections
                            </div>
                          </div>

                          {/* Keywords */}
                          <div>
                            <h4 className="text-sepia-800 dark:text-sepia-200 font-medium text-xs uppercase tracking-wide mb-2">
                              Keywords
                            </h4>
                            <div className="flex flex-wrap gap-1">
                              {keywords.map((keyword, keywordIndex) => (
                                <span 
                                  key={keywordIndex}
                                  className="inline-block bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs px-2 py-1 rounded-full font-medium"
                                  data-testid={`tag-keyword-sub-${keywordIndex}`}
                                >
                                  {keyword}
                                </span>
                              ))}
                            </div>
                          </div>

                          {/* Blog Post URL */}
                          <div>
                            <h4 className="text-sepia-800 dark:text-sepia-200 font-medium text-xs uppercase tracking-wide mb-2">
                              My Blogpost
                            </h4>
                            {entry.blogpostUrl ? (
                              <a 
                                href={entry.blogpostUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 bg-green-600 dark:bg-green-500 text-white px-3 py-2 rounded-md font-medium hover:bg-green-700 dark:hover:bg-green-600 transition-colors text-sm"
                                data-testid={`link-blog-sub-${entry.rowNumber}`}
                              >
                                View Blog <ExternalLink className="h-4 w-4" />
                              </a>
                            ) : (
                              <span className="text-sepia-400 dark:text-sepia-600 text-sm italic">
                                No blog post available
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Macro Sugya (Full Width if Available) */}
                        {entry.macroSugya && (
                          <div className="mt-4 pt-4 border-t border-sepia-200 dark:border-sepia-700">
                            <h4 className="text-sepia-800 dark:text-sepia-200 font-medium text-xs uppercase tracking-wide mb-2">
                              Macro Sugya
                            </h4>
                            <p className="text-sepia-700 dark:text-sepia-300 text-sm leading-relaxed">
                              {entry.macroSugya}
                            </p>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}