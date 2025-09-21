import { useState, useEffect } from 'react';
import { ArrowLeft, BookOpen, Search } from "lucide-react";
import { Link } from "wouter";
import { BlogPostsTable } from "@/components/blog-posts/blog-posts-table";
import { useSEO } from "@/hooks/use-seo";
import { getBlogPostsData } from "@/lib/outline-data";
import type { BlogPosts } from '@shared/schema';

export default function BlogPostsPage() {
  const [blogPosts, setBlogPosts] = useState<BlogPosts | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTractate, setSelectedTractate] = useState('all');

  useEffect(() => {
    getBlogPostsData()
      .then(data => {
        setBlogPosts(data);
        setLoading(false);
      })
      .catch(error => {
        console.error('Failed to load blog posts:', error);
        setLoading(false);
      });
  }, []);

  // SEO optimization
  useSEO({
    title: '"Talmud & Tech" Blog Posts by Talmud Location | ChavrutAI',
    description: 'Blog posts analyzing Talmudic passages, organized by tractate and page location. Click on titles to go to the full articles at the "Talmud & Tech" Blog, or use location links to jump to the corresponding text in ChavrutAI.',
    keywords: 'Talmud & Tech, Talmud blog posts, Jewish learning, Talmudic analysis, Torah study, rabbinical literature',
    canonical: `${window.location.origin}/blog-posts`,
    robots: 'index, follow'
  });

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-sepia-600 dark:text-sepia-400">Loading blog posts...</p>
        </div>
      </div>
    );
  }

  if (!blogPosts) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="text-center">
          <h2 className="text-2xl text-sepia-800 dark:text-sepia-200 mb-4">
            Blog Posts Not Available
          </h2>
          <p className="text-sepia-600 dark:text-sepia-400 mb-6">
            The blog posts data could not be loaded at this time.
          </p>
          <Link 
            href="/"
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            ← Return to Home
          </Link>
        </div>
      </div>
    );
  }

  // Get unique tractates for filter
  const uniqueTractates = Array.from(new Set(blogPosts.entries.map(entry => entry.tractate))).sort();

  // Filter blog posts based on search and tractate filter
  const filteredPosts = {
    ...blogPosts,
    entries: blogPosts.entries.filter(entry => {
      const matchesSearch = !searchTerm || 
        entry.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.keywords.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.tractate.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesTractate = selectedTractate === 'all' || entry.tractate === selectedTractate;
      
      return matchesSearch && matchesTractate;
    })
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Link 
            href="/"
            className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-2"
            data-testid="link-home"
          >
            <ArrowLeft className="h-4 w-4" />
            Home
          </Link>
        </div>

        <div className="flex items-center gap-3 mb-2">
          <BookOpen className="h-6 w-6 text-sepia-600 dark:text-sepia-400" />
          <h1 className="text-3xl text-sepia-800 dark:text-sepia-200">
            "Talmud & Tech" Blog Posts by Talmud Location
          </h1>
        </div>
        
        <p className="text-sepia-600 dark:text-sepia-400 max-w-4xl mb-6">
          Blog posts analyzing Talmudic passages, organized by tractate and page location. 
          Click on titles to go to the full articles at the "Talmud & Tech" Blog, 
          or use location links to jump to the corresponding text in ChavrutAI.
        </p>

        {/* Search and Filter Controls */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-sepia-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search blog posts, keywords, or tractates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-sepia-300 dark:border-sepia-600 rounded-md bg-white dark:bg-sepia-800 text-sepia-900 dark:text-sepia-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              data-testid="input-search"
            />
          </div>
          <select
            value={selectedTractate}
            onChange={(e) => setSelectedTractate(e.target.value)}
            className="px-4 py-2 border border-sepia-300 dark:border-sepia-600 rounded-md bg-white dark:bg-sepia-800 text-sepia-900 dark:text-sepia-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            data-testid="select-tractate"
          >
            <option value="all">All Tractates ({blogPosts.totalPosts})</option>
            {uniqueTractates.map(tractate => {
              const count = blogPosts.entries.filter(entry => entry.tractate === tractate).length;
              const displayName = tractate.replace(/_/g, ' ');
              return (
                <option key={tractate} value={tractate}>
                  {displayName} ({count})
                </option>
              );
            })}
          </select>
        </div>

        {/* Results Summary */}
        {(searchTerm || selectedTractate !== 'all') && (
          <div className="mb-4 text-sm text-sepia-600 dark:text-sepia-400">
            Showing {filteredPosts.entries.length} of {blogPosts.totalPosts} blog posts
            {searchTerm && ` matching "${searchTerm}"`}
            {selectedTractate !== 'all' && ` in ${selectedTractate.replace(/_/g, ' ')}`}
          </div>
        )}
      </div>

      {/* Blog Posts Table */}
      <div className="bg-white dark:bg-sepia-900 rounded-lg shadow-lg p-6">
        <div className="mb-4">
          <h2 className="text-xl text-sepia-800 dark:text-sepia-200 mb-2">
            Blog Posts Collection
          </h2>
          <div className="text-sm text-sepia-600 dark:text-sepia-400">
            {filteredPosts.entries.length} posts displayed • Organized by traditional tractate order
          </div>
        </div>
        
        {filteredPosts.entries.length > 0 ? (
          <BlogPostsTable blogPosts={filteredPosts} />
        ) : (
          <div className="text-center py-8">
            <p className="text-sepia-600 dark:text-sepia-400 mb-4">
              No blog posts found matching your search criteria.
            </p>
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedTractate('all');
              }}
              className="text-blue-600 dark:text-blue-400 hover:underline"
              data-testid="button-clear-filters"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}