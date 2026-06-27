import fs from 'fs';
import path from 'path';

interface BlogPost {
  id: string;
  title: string;
  subtitle: string;
  tractate: string;
  location: string;
  keywords: string[];
  blogUrl: string;
  caiLink: string;
  publishDate: string;
  contentText: string;
  contentHtml: string;
  excerpt: string;
  wordCount: number;
}

interface BlogPostsData {
  version: string;
  generated: string;
  totalPosts: number;
  posts: BlogPost[];
}

interface SearchOptions {
  tractate?: string;
  location?: string;
  keywords?: string[];
  limit?: number;
}

interface SearchResult {
  id: string;
  title: string;
  tractate: string;
  location: string;
  blogUrl: string;
  excerpt: string;
  relevanceScore: number;
}

export class BlogPostSearch {
  private posts: BlogPost[];
  
  constructor() {
    const dataPath = path.join(process.cwd(), 'public', 'data', 'blog-posts-full.json');
    const data: BlogPostsData = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
    this.posts = data.posts;
  }
  
  search(options: SearchOptions): SearchResult[] {
    let results = [...this.posts];
    const scores = new Map<string, number>();
    
    results.forEach(post => scores.set(post.id, 0));
    
    // Filter and score by tractate
    if (options.tractate) {
      const tractateFilter = options.tractate.toLowerCase();
      results = results.filter(p => {
        const matches = p.tractate.toLowerCase() === tractateFilter;
        if (matches) {
          scores.set(p.id, (scores.get(p.id) || 0) + 10);
        }
        return matches;
      });
    }
    
    // Score by location match
    if (options.location) {
      results.forEach(p => {
        if (this.locationMatches(p.location, options.location!)) {
          scores.set(p.id, (scores.get(p.id) || 0) + 20);
        }
      });
    }
    
    // Score by keywords
    if (options.keywords && options.keywords.length > 0) {
      results.forEach(p => {
        const keywordScore = this.calculateKeywordScore(p, options.keywords!);
        if (keywordScore > 0) {
          scores.set(p.id, (scores.get(p.id) || 0) + keywordScore);
        }
      });
    }
    
    // Sort by relevance score
    results.sort((a, b) => {
      const scoreA = scores.get(a.id) || 0;
      const scoreB = scores.get(b.id) || 0;
      return scoreB - scoreA;
    });
    
    // Apply limit
    const limit = options.limit || 5;
    results = results.slice(0, limit);
    
    // Map to SearchResult
    return results.map(p => ({
      id: p.id,
      title: p.title,
      tractate: p.tractate,
      location: p.location,
      blogUrl: p.blogUrl,
      excerpt: p.excerpt,
      relevanceScore: scores.get(p.id) || 0
    }));
  }
  
  getPostById(postId: string): BlogPost | null {
    return this.posts.find(p => p.id === postId) || null;
  }
  
  private locationMatches(postLocation: string, searchLocation: string): boolean {
    // Normalize locations for comparison
    const normalize = (loc: string) => loc.toLowerCase().replace(/\s+/g, '');
    const normalizedPost = normalize(postLocation);
    const normalizedSearch = normalize(searchLocation);
    
    // Extract page numbers for fuzzy matching
    const extractPage = (loc: string): string | null => {
      const match = loc.match(/(\d+[ab])/i);
      return match ? match[1].toLowerCase() : null;
    };
    
    const postPage = extractPage(postLocation);
    const searchPage = extractPage(searchLocation);
    
    // Exact match
    if (normalizedPost.includes(normalizedSearch) || normalizedSearch.includes(normalizedPost)) {
      return true;
    }
    
    // Page match
    if (postPage && searchPage && postPage === searchPage) {
      return true;
    }
    
    return false;
  }
  
  private calculateKeywordScore(post: BlogPost, keywords: string[]): number {
    let score = 0;
    const searchText = `${post.title} ${post.subtitle} ${post.contentText}`.toLowerCase();
    
    keywords.forEach(keyword => {
      const lowerKeyword = keyword.toLowerCase();
      
      // Title match (high score)
      if (post.title.toLowerCase().includes(lowerKeyword)) {
        score += 5;
      }
      
      // Keyword array match (medium score)
      if (post.keywords.some(k => k.toLowerCase().includes(lowerKeyword))) {
        score += 3;
      }
      
      // Content match (low score)
      const contentMatches = (searchText.match(new RegExp(lowerKeyword, 'gi')) || []).length;
      score += Math.min(contentMatches, 5);
    });
    
    return score;
  }
}

// Singleton instance
let searchInstance: BlogPostSearch | null = null;

export function getBlogPostSearch(): BlogPostSearch {
  if (!searchInstance) {
    searchInstance = new BlogPostSearch();
  }
  return searchInstance;
}
