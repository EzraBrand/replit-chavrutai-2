/**
 * Client-side search and filtering for blog posts
 */

import { blogPostsOutline } from '@/lib/outline-data';
import type { BlogPostEntry } from '@shared/schema';

/**
 * Get all blog posts
 */
export function getAllBlogPosts(): BlogPostEntry[] {
  return blogPostsOutline.entries;
}

/**
 * Filter blog posts by tractate
 */
export function getBlogPostsByTractate(tractate: string): BlogPostEntry[] {
  if (tractate === 'all') return getAllBlogPosts();
  return blogPostsOutline.entries.filter(
    post => post.tractate.toLowerCase() === tractate.toLowerCase()
  );
}

/**
 * Search blog posts by title or keywords
 */
export function searchBlogPosts(query: string, tractate?: string): BlogPostEntry[] {
  let posts = tractate ? getBlogPostsByTractate(tractate) : getAllBlogPosts();
  
  if (!query.trim()) return posts;
  
  const lowerQuery = query.toLowerCase();
  return posts.filter(post => 
    post.title.toLowerCase().includes(lowerQuery) ||
    post.keywords.toLowerCase().includes(lowerQuery) ||
    post.talmudLocation.toLowerCase().includes(lowerQuery)
  );
}

/**
 * Get unique list of tractates from blog posts, sorted alphabetically
 */
export function getBlogPostTractates(): string[] {
  const tractates = new Set(
    blogPostsOutline.entries.map(post => post.tractate)
  );
  return Array.from(tractates).sort();
}

/**
 * Get posts count by tractate
 */
export function getPostCountByTractate(): Record<string, number> {
  const counts: Record<string, number> = {};
  blogPostsOutline.entries.forEach(post => {
    counts[post.tractate] = (counts[post.tractate] || 0) + 1;
  });
  return counts;
}
