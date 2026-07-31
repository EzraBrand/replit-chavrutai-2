import { useState, useEffect } from 'react';
import { Link } from "wouter";
import { BlogPostsTable } from "@/components/blog-posts/blog-posts-table";
import { useSEO } from "@/hooks/use-seo";
import { getStaticSEO } from "@shared/seo-data";
import { getBlogPostsData } from "@/lib/outline-data";
import type { BlogPosts } from '@shared/schema';
import { PageShell, PageHeader, PageSection, SectionHeading } from "@/components/layout";

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
    ...getStaticSEO("/blog-posts", window.location.origin)!,
    keywords: 'Talmud & Tech, Talmud blog posts, Jewish learning, Talmudic analysis, Torah study, rabbinical literature',
    structuredData: {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: "Talmud & Tech Blog Posts",
      description: "Blog posts analyzing Talmudic passages, organized by tractate and page location",
      url: `${window.location.origin}/blog-posts`,
      publisher: {
        "@type": "Organization",
        name: "ChavrutAI",
        url: window.location.origin,
      },
    },
  });

  if (loading) {
    return (
      <div className="max-w-content mx-auto px-6 py-12">
        <div className="text-center text-muted-foreground">Loading blog posts...</div>
      </div>
    );
  }

  if (!blogPosts) {
    return (
      <div className="max-w-content mx-auto px-6 py-12">
        <div className="text-center">
          <h2 className="font-georgia text-2xl text-foreground mb-4">
            Blog Posts Not Available
          </h2>
          <p className="text-muted-foreground mb-6">
            The blog posts data could not be loaded at this time.
          </p>
          <Link 
            href="/"
            className="text-primary dark:text-[#5b9fc5] hover:underline"
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
    <PageShell>
      {/* Page title */}
      <PageHeader category="talmud-bavli" title={`"Talmud & Tech" Blog Posts by Talmud Location`}>
        <p className="text-muted-foreground max-w-4xl">
          Blog posts analyzing Talmudic passages, organized by tractate and page location. 
          Click on titles to go to the full articles at the "Talmud &amp; Tech" Blog, 
          or use location links to jump to the corresponding text in ChavrutAI.
        </p>
      </PageHeader>

      {/* Search and Filter Controls */}
      <PageSection>
        <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search blog posts, keywords, or tractates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-input rounded bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                data-testid="input-search"
              />
            </div>
            <select
              value={selectedTractate}
              onChange={(e) => setSelectedTractate(e.target.value)}
              className="px-4 py-2 border border-input rounded bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
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
            <div className="mb-4 text-sm text-muted-foreground">
              Showing {filteredPosts.entries.length} of {blogPosts.totalPosts} blog posts
              {searchTerm && ` matching "${searchTerm}"`}
              {selectedTractate !== 'all' && ` in ${selectedTractate.replace(/_/g, ' ')}`}
            </div>
          )}

          {/* Blog Posts Table */}
          <div className="mb-4">
            <SectionHeading className="mb-2">
              Blog Posts Collection
            </SectionHeading>
            <div className="text-sm text-muted-foreground">
              {filteredPosts.entries.length} posts displayed • Organized by traditional tractate order
            </div>
          </div>

          {filteredPosts.entries.length > 0 ? (
            <BlogPostsTable blogPosts={filteredPosts} />
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">
                No blog posts found matching your search criteria.
              </p>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedTractate('all');
                }}
                className="text-primary dark:text-[#5b9fc5] hover:underline"
                data-testid="button-clear-filters"
              >
                Clear filters
              </button>
            </div>
          )}
      </PageSection>
    </PageShell>
  );
}