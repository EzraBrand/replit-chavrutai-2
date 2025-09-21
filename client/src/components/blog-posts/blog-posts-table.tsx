import { ExternalLink } from "lucide-react";
import type { BlogPosts } from '@shared/schema';

interface BlogPostsTableProps {
  blogPosts: BlogPosts;
}

export function BlogPostsTable({ blogPosts }: BlogPostsTableProps) {
  const parseKeywords = (keywordString: string): string[] => {
    if (!keywordString) return [];
    return keywordString.split(',').map(keyword => keyword.trim()).filter(k => k);
  };

  const formatTractate = (tractate: string): string => {
    // Convert underscore format to display format
    return tractate.replace(/_/g, ' ');
  };

  return (
    <div className="overflow-x-auto min-w-0">
      <table className="blog-posts-table w-full border-collapse bg-sepia-50 dark:bg-sepia-900 rounded-lg shadow-sm">
        <thead>
          <tr className="border-b border-sepia-200 dark:border-sepia-700 bg-sepia-100 dark:bg-sepia-800">
            <th className="text-left text-sepia-900 dark:text-sepia-100 text-sm p-3">
              Blog Post Title
            </th>
            <th className="text-left text-sepia-900 dark:text-sepia-100 text-sm p-3 w-24">
              Tractate
            </th>
            <th className="text-left text-sepia-900 dark:text-sepia-100 text-sm p-3 w-32">
              Location
            </th>
            <th className="text-left text-sepia-900 dark:text-sepia-100 text-sm p-3 w-28">
              Keywords
            </th>
            <th className="text-left text-sepia-900 dark:text-sepia-100 text-sm p-3 w-24">
              Links
            </th>
          </tr>
        </thead>
        <tbody>
          {blogPosts.entries.map((entry) => {
            const keywords = parseKeywords(entry.keywords);
            
            return (
              <tr
                key={entry.rowNumber}
                className="border-b border-sepia-200 dark:border-sepia-700 hover:bg-sepia-75 dark:hover:bg-sepia-850 transition-colors duration-200"
                data-testid={`blog-post-row-${entry.rowNumber}`}
              >
                <td className="p-3">
                  <div className="text-sepia-900 dark:text-sepia-100 leading-relaxed">
                    <a 
                      href={entry.blogUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline decoration-dotted underline-offset-2 transition-colors"
                      data-testid={`link-blog-${entry.rowNumber}`}
                    >
                      {entry.title}
                    </a>
                  </div>
                </td>
                <td className="p-3">
                  <div className="text-sepia-700 dark:text-sepia-300 text-sm font-medium">
                    {formatTractate(entry.tractate)}
                  </div>
                </td>
                <td className="p-3">
                  <a 
                    href={entry.caiLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline decoration-dotted underline-offset-2 transition-colors text-sm"
                    data-testid={`link-location-${entry.rowNumber}`}
                  >
                    {entry.talmudLocation}
                  </a>
                </td>
                <td className="p-3">
                  <div className="flex flex-wrap gap-1">
                    {keywords.slice(0, 3).map((keyword, keywordIndex) => (
                      <span 
                        key={keywordIndex}
                        className="inline-block bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-xs px-2 py-1 rounded-full"
                        data-testid={`tag-keyword-${entry.rowNumber}-${keywordIndex}`}
                      >
                        {keyword}
                      </span>
                    ))}
                    {keywords.length > 3 && (
                      <span className="text-xs text-sepia-500 dark:text-sepia-400">
                        +{keywords.length - 3} more
                      </span>
                    )}
                  </div>
                </td>
                <td className="p-3">
                  <div className="flex gap-2">
                    <a 
                      href={entry.blogUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
                      title="View Blog Post"
                      data-testid={`external-blog-${entry.rowNumber}`}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}