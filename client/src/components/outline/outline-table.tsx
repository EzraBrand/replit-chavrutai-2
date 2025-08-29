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
    <div className="overflow-x-auto">
      <table className="w-full border-collapse bg-sepia-50 dark:bg-sepia-900 rounded-lg shadow-sm">
        <thead>
          <tr className="bg-sepia-100 dark:bg-sepia-800">
            <th className="border border-sepia-300 dark:border-sepia-600 p-3 text-left font-semibold text-sepia-900 dark:text-sepia-100">
              Row #
            </th>
            <th className="border border-sepia-300 dark:border-sepia-600 p-3 text-left font-semibold text-sepia-900 dark:text-sepia-100">
              Location Range<br />
              <span className="text-xs font-normal">(page + section)</span>
            </th>
            <th className="border border-sepia-300 dark:border-sepia-600 p-3 text-left font-semibold text-sepia-900 dark:text-sepia-100">
              Section Count
            </th>
            <th className="border border-sepia-300 dark:border-sepia-600 p-3 text-left font-semibold text-sepia-900 dark:text-sepia-100">
              Section Header
            </th>
            <th className="border border-sepia-300 dark:border-sepia-600 p-3 text-left font-semibold text-sepia-900 dark:text-sepia-100">
              Keywords
            </th>
            <th className="border border-sepia-300 dark:border-sepia-600 p-3 text-left font-semibold text-sepia-900 dark:text-sepia-100">
              My Blogposts
            </th>
            <th className="border border-sepia-300 dark:border-sepia-600 p-3 text-left font-semibold text-sepia-900 dark:text-sepia-100">
              Macro Sugya
            </th>
          </tr>
        </thead>
        <tbody>
          {outline.entries.map((entry) => (
            <tr 
              key={entry.rowNumber}
              className="hover:bg-sepia-75 dark:hover:bg-sepia-850 transition-colors"
              data-testid={`outline-row-${entry.rowNumber}`}
            >
              <td className="border border-sepia-300 dark:border-sepia-600 p-3 text-center font-medium text-sepia-800 dark:text-sepia-200">
                {entry.rowNumber}
              </td>
              <td className="border border-sepia-300 dark:border-sepia-600 p-3">
                <Link 
                  href={createTextLink(entry.locationRange, outline.tractate)}
                  className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                  data-testid={`link-location-${entry.rowNumber}`}
                >
                  {entry.locationRange}
                </Link>
              </td>
              <td className="border border-sepia-300 dark:border-sepia-600 p-3 text-center text-sepia-700 dark:text-sepia-300">
                {entry.sectionCount}
              </td>
              <td className="border border-sepia-300 dark:border-sepia-600 p-3 text-sepia-800 dark:text-sepia-200">
                <div className="max-w-md">
                  {entry.sectionHeader}
                </div>
              </td>
              <td className="border border-sepia-300 dark:border-sepia-600 p-3">
                <div className="flex flex-wrap gap-1">
                  {parseKeywords(entry.keywords).map((keyword, index) => (
                    <span 
                      key={index}
                      className="inline-block bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs px-2 py-1 rounded-full"
                      data-testid={`keyword-${entry.rowNumber}-${index}`}
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              </td>
              <td className="border border-sepia-300 dark:border-sepia-600 p-3">
                {entry.blogpostUrl && entry.blogpostUrl.trim() && (
                  <a 
                    href={entry.blogpostUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-green-600 dark:text-green-400 hover:underline flex items-center gap-1 text-sm"
                    data-testid={`blogpost-link-${entry.rowNumber}`}
                  >
                    <span className="truncate max-w-32">{entry.blogpostUrl}</span>
                    <ExternalLink className="h-3 w-3 flex-shrink-0" />
                  </a>
                )}
              </td>
              <td className="border border-sepia-300 dark:border-sepia-600 p-3 text-sepia-700 dark:text-sepia-300">
                <div className="max-w-xs text-sm">
                  {entry.macroSugya}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}