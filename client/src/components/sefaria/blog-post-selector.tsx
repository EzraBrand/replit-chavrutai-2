import { useState, useMemo } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ExternalLink, BookOpen } from "lucide-react";
import { 
  searchBlogPosts, 
  getBlogPostTractates, 
  getPostCountByTractate 
} from "@/lib/blog-post-search";
import { formatLocationDisplay } from "@/lib/blog-post-utils";
import type { BlogPostEntry } from "@shared/schema";

interface BlogPostSelectorProps {
  onSelectPost: (location: string, blogUrl: string) => void;
}

export function BlogPostSelector({ onSelectPost }: BlogPostSelectorProps) {
  const [selectedTractate, setSelectedTractate] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedPost, setSelectedPost] = useState<BlogPostEntry | null>(null);

  const tractates = useMemo(() => getBlogPostTractates(), []);
  const postCounts = useMemo(() => getPostCountByTractate(), []);

  const filteredPosts = useMemo(() => {
    return searchBlogPosts(searchQuery, selectedTractate);
  }, [searchQuery, selectedTractate]);

  const handleSelectPost = (post: BlogPostEntry) => {
    setSelectedPost(post);
    onSelectPost(post.talmudLocation, post.blogUrl);
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="tractate-filter">Filter by Tractate</Label>
          <Select 
            value={selectedTractate} 
            onValueChange={setSelectedTractate}
          >
            <SelectTrigger id="tractate-filter" data-testid="select-tractate-filter">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" data-testid="option-tractate-all">
                All Tractates ({filteredPosts.length})
              </SelectItem>
              {tractates.map((tractate) => (
                <SelectItem 
                  key={tractate} 
                  value={tractate}
                  data-testid={`option-tractate-${tractate}`}
                >
                  {tractate} ({postCounts[tractate] || 0})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="search-posts">Search Posts</Label>
          <Input
            id="search-posts"
            placeholder="Type to filter by title or keywords..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            data-testid="input-search-posts"
          />
        </div>
      </div>

      {/* Results count */}
      <div className="text-sm text-gray-600">
        Showing {filteredPosts.length} post{filteredPosts.length !== 1 ? 's' : ''}
      </div>

      {/* Blog Post List */}
      <ScrollArea className="h-[400px] border rounded-md">
        <div className="p-4 space-y-2">
          {filteredPosts.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              No blog posts found matching your criteria
            </div>
          ) : (
            filteredPosts.map((post) => (
              <Card
                key={post.rowNumber}
                className={`cursor-pointer transition-colors hover:bg-gray-50 ${
                  selectedPost?.rowNumber === post.rowNumber 
                    ? 'border-blue-500 bg-blue-50' 
                    : ''
                }`}
                onClick={() => handleSelectPost(post)}
                data-testid={`card-post-${post.rowNumber}`}
              >
                <CardContent className="py-3 px-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm mb-1 line-clamp-2">
                        {post.title}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <BookOpen className="h-3 w-3 flex-shrink-0" />
                        <span className="font-mono">
                          {formatLocationDisplay(post.talmudLocation)}
                        </span>
                      </div>
                    </div>
                    <ExternalLink className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </ScrollArea>

      {/* Selected Post Info */}
      {selectedPost && (
        <Alert className="bg-blue-50 border-blue-200" data-testid="alert-selected-post">
          <AlertDescription>
            <div className="space-y-1">
              <div>
                <strong>Selected:</strong> {selectedPost.title}
              </div>
              <div>
                <strong>Location:</strong>{' '}
                <span className="font-mono text-sm">
                  {selectedPost.talmudLocation}
                </span>
              </div>
              <div>
                <a
                  href={selectedPost.blogUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 underline inline-flex items-center gap-1"
                  data-testid="link-blog-post"
                >
                  Read Blog Post
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
