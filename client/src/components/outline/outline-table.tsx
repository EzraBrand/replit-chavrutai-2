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
    <div className="overflow-x-auto min-w-0">
      <table className="outline-table w-full border-collapse bg-sepia-50 dark:bg-sepia-900 rounded-lg shadow-sm">
        <thead>
          <tr className="border-b border-sepia-200 dark:border-sepia-700 bg-sepia-100 dark:bg-sepia-800">
            <th className="text-left text-sepia-900 dark:text-sepia-100 text-sm p-3">
              Content
            </th>
            <th className="text-left text-sepia-900 dark:text-sepia-100 text-sm p-3 w-28">
              Keywords
            </th>
            <th className="text-left text-sepia-900 dark:text-sepia-100 text-sm p-3 w-32">
              Page Range
            </th>
          </tr>
        </thead>
        <tbody>
          {outline.entries.map((entry) => {
            const keywords = parseKeywords(entry.keywords);
            
            return (
              <tr
                key={entry.rowNumber}
                className="border-b border-sepia-200 dark:border-sepia-700 hover:bg-sepia-75 dark:hover:bg-sepia-850 transition-colors duration-200"
                data-testid={`table-row-${entry.rowNumber}`}
              >
                <td className="p-3">
                  <div className="text-sepia-900 dark:text-sepia-100 leading-relaxed">
                    {entry.sectionHeader}
                  </div>
                </td>
                <td className="p-3">
                  <div className="flex flex-wrap gap-1">
                    {keywords.map((keyword, keywordIndex) => (
                      <span 
                        key={keywordIndex}
                        className="inline-block bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs px-2 py-1 rounded-full"
                        data-testid={`tag-keyword-${entry.rowNumber}-${keywordIndex}`}
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="p-3">
                  <Link 
                    href={createTextLink(entry.locationRange, outline.tractate)}
                    className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline decoration-dotted underline-offset-2 transition-colors"
                    data-testid={`link-location-${entry.rowNumber}`}
                  >
                    {entry.locationRange}
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}