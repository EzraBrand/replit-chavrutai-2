import type { BlogPosts } from '@shared/schema';

interface BlogPostsTableProps {
  blogPosts: BlogPosts;
}

export function BlogPostsTable({ blogPosts }: BlogPostsTableProps) {

  return (
    <div className="overflow-x-auto min-w-0">
      <table className="blog-posts-table w-full border-collapse bg-sepia-50 dark:bg-sepia-900 rounded-lg shadow-sm">
        <thead>
          <tr className="border-b border-sepia-200 dark:border-sepia-700 bg-sepia-100 dark:bg-sepia-800">
            <th className="text-left text-sepia-900 dark:text-sepia-100 text-sm p-3 w-32">
              Talmud Location
            </th>
            <th className="text-left text-sepia-900 dark:text-sepia-100 text-sm p-3">
              Blog Post Title
            </th>
          </tr>
        </thead>
        <tbody>
          {blogPosts.entries.map((entry) => {
            return (
              <tr
                key={entry.rowNumber}
                className="border-b border-sepia-200 dark:border-sepia-700 hover:bg-sepia-75 dark:hover:bg-sepia-850 transition-colors duration-200"
                data-testid={`blog-post-row-${entry.rowNumber}`}
              >
                <td className="p-3">
                  <a 
                    href={entry.caiLink}
                    className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline decoration-dotted underline-offset-2 transition-colors text-sm"
                    data-testid={`link-location-${entry.rowNumber}`}
                  >
                    {entry.talmudLocation}
                  </a>
                </td>
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
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}