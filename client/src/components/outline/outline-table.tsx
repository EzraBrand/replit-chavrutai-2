import { ExternalLink } from "lucide-react";
import { Link } from "wouter";
import type { ChapterOutline } from '@shared/schema';

interface OutlineTableProps {
  outline: ChapterOutline;
}

export function OutlineTable({ outline }: OutlineTableProps) {
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
    <div className="space-y-4">
      {/* Desktop Table View (lg and up) */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full border-collapse bg-sepia-50 dark:bg-sepia-900 rounded-lg shadow-sm">
          <thead>
            <tr className="border-b border-sepia-200 dark:border-sepia-700 bg-sepia-100 dark:bg-sepia-800">
              <th className="p-3 text-left font-semibold text-sepia-900 dark:text-sepia-100 text-sm w-16">Row #</th>
              <th className="p-3 text-left font-semibold text-sepia-900 dark:text-sepia-100 text-sm w-32">Location<br/><span className="text-xs font-normal text-sepia-600 dark:text-sepia-400">(page:section)</span></th>
              <th className="p-3 text-left font-semibold text-sepia-900 dark:text-sepia-100 text-sm w-20">Count</th>
              <th className="p-3 text-left font-semibold text-sepia-900 dark:text-sepia-100 text-sm">Topic</th>
              <th className="p-3 text-left font-semibold text-sepia-900 dark:text-sepia-100 text-sm w-48">Keywords</th>
              <th className="p-3 text-left font-semibold text-sepia-900 dark:text-sepia-100 text-sm w-20">Links</th>
            </tr>
          </thead>
          <tbody>
            {outline.entries.map((entry, index) => (
              <tr key={index} className="border-b border-sepia-200 dark:border-sepia-700 hover:bg-sepia-75 dark:hover:bg-sepia-850 transition-colors">
                <td className="p-3 text-sm font-medium text-sepia-900 dark:text-sepia-100 text-center">{entry.rowNumber}</td>
                <td className="p-3 text-sm">
                  <Link 
                    href={createTextLink(entry.locationRange, outline.tractate)}
                    className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium underline decoration-dotted underline-offset-2 transition-colors"
                    data-testid={`link-location-${entry.rowNumber}`}
                  >
                    {entry.locationRange}
                  </Link>
                </td>
                <td className="p-3 text-sm text-sepia-700 dark:text-sepia-300 text-center">{entry.sectionCount}</td>
                <td className="p-3 text-sm text-sepia-800 dark:text-sepia-200 leading-normal">{entry.sectionHeader}</td>
                <td className="p-3">
                  <div className="flex flex-wrap gap-1">
                    {parseKeywords(entry.keywords).slice(0, 3).map((keyword, keywordIndex) => (
                      <span 
                        key={keywordIndex}
                        className="inline-block bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs px-2 py-1 rounded-full font-medium"
                        data-testid={`tag-keyword-${keywordIndex}`}
                      >
                        {keyword}
                      </span>
                    ))}
                    {parseKeywords(entry.keywords).length > 3 && (
                      <span className="text-xs text-sepia-500 dark:text-sepia-400">+{parseKeywords(entry.keywords).length - 3}</span>
                    )}
                  </div>
                </td>
                <td className="p-3 text-sm">
                  {entry.blogpostUrl ? (
                    <a 
                      href={entry.blogpostUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 font-medium underline decoration-dotted underline-offset-2 transition-colors"
                      data-testid={`link-blog-${entry.rowNumber}`}
                    >
                      Blog ↗
                    </a>
                  ) : (
                    <span className="text-sepia-400 dark:text-sepia-600 text-xs">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile/Tablet Card View (lg and below) */}
      <div className="block lg:hidden space-y-4">
        {outline.entries.map((entry, index) => (
          <div 
            key={index} 
            className="bg-sepia-50 dark:bg-sepia-900 border border-sepia-200 dark:border-sepia-700 rounded-lg p-4 shadow-sm"
          >
            {/* Header Row */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="bg-sepia-200 dark:bg-sepia-800 text-sepia-900 dark:text-sepia-100 text-xs font-semibold px-2 py-1 rounded">
                  #{entry.rowNumber}
                </span>
                <span className="bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200 text-xs px-2 py-1 rounded">
                  {entry.sectionCount} sections
                </span>
              </div>
              {entry.blogpostUrl && (
                <a 
                  href={entry.blogpostUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 text-sm font-medium underline decoration-dotted underline-offset-2 transition-colors"
                  data-testid={`link-blog-mobile-${entry.rowNumber}`}
                >
                  Blog ↗
                </a>
              )}
            </div>

            {/* Location Link */}
            <div className="mb-3">
              <Link 
                href={createTextLink(entry.locationRange, outline.tractate)}
                className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium underline decoration-dotted underline-offset-2 transition-colors text-sm"
                data-testid={`link-location-mobile-${entry.rowNumber}`}
              >
                📜 {entry.locationRange}
              </Link>
            </div>

            {/* Section Header */}
            <h3 className="text-sepia-900 dark:text-sepia-100 font-medium text-base leading-normal mb-3">
              {entry.sectionHeader}
            </h3>

            {/* Keywords */}
            <div className="flex flex-wrap gap-2">
              {parseKeywords(entry.keywords).map((keyword, keywordIndex) => (
                <span 
                  key={keywordIndex}
                  className="inline-block bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-sm px-3 py-1 rounded-full font-medium"
                  data-testid={`tag-keyword-mobile-${keywordIndex}`}
                >
                  {keyword}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}