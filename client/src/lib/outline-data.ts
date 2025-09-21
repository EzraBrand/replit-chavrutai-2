import type { ChapterOutline, BlogPosts } from '@shared/schema';
import sanhedrinOutlineData from '../../../talmud-data/outlines/sanhedrin-10.json';
import blogPostsData from '../../../talmud-data/outlines/blog-posts.json';

/**
 * Sanhedrin Chapter 10 outline data loaded from JSON file
 */
export const sanhedrin10Outline: ChapterOutline = sanhedrinOutlineData;

/**
 * Blog posts data loaded from JSON file
 */
export const blogPostsOutline: BlogPosts = blogPostsData;

/**
 * Get outline data for Sanhedrin Chapter 10 (Perek Chelek)
 * Now loads from JSON file in talmud-data/outlines/
 */
export async function getSanhedrin10Outline(): Promise<ChapterOutline | null> {
  return sanhedrin10Outline;
}

/**
 * Get blog posts data
 * Loads from JSON file in talmud-data/outlines/
 */
export async function getBlogPostsData(): Promise<BlogPosts | null> {
  return blogPostsOutline;
}