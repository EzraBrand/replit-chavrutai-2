import { useQuery } from "@tanstack/react-query";
import { SharedLayout } from "@/components/layout";
import { ExternalLink, Calendar, User, ChevronDown, ChevronUp } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import DOMPurify from "dompurify";

interface BlogPostFull {
  title: string;
  link: string;
  pubDate: string;
  description: string;
  content: string;
  author: string;
}

function isMainlyHebrew(text: string): boolean {
  const cleanText = text.replace(/[\s\d.,;:!?'"()\[\]{}<>\/\\@#$%^&*+=\-_|~`…]/g, '');
  if (cleanText.length === 0) return false;
  const hebrewChars = (cleanText.match(/[\u0590-\u05FF]/g) || []).length;
  return hebrewChars / cleanText.length > 0.5;
}

function isEllipsisOrPunctuation(text: string): boolean {
  const cleaned = text.trim();
  return /^[\[\]\.…\s"'״״]+$/.test(cleaned) && cleaned.length > 0;
}

function applyRtlToHebrewElements(container: HTMLElement) {
  const blockElements = Array.from(container.querySelectorAll('p, li, h1, h2, h3, h4, h5, h6, blockquote, div'));
  
  let lastWasHebrew = false;
  
  blockElements.forEach((el) => {
    const text = el.textContent || '';
    const htmlEl = el as HTMLElement;
    
    if (isMainlyHebrew(text)) {
      htmlEl.setAttribute('dir', 'rtl');
      htmlEl.style.textAlign = 'right';
      lastWasHebrew = true;
    } else if (isEllipsisOrPunctuation(text) && lastWasHebrew) {
      htmlEl.setAttribute('dir', 'rtl');
      htmlEl.style.textAlign = 'right';
      htmlEl.style.fontStyle = 'normal';
    } else {
      lastWasHebrew = false;
    }
  });
}

export default function BlogReader() {
  const [expandedPosts, setExpandedPosts] = useState<Set<number>>(new Set([0]));
  const contentRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  const { data: rssFeed, isLoading, error } = useQuery<{
    items: BlogPostFull[];
  }>({
    queryKey: ["/api/rss-feed-full"],
  });

  useEffect(() => {
    contentRefs.current.forEach((ref, index) => {
      if (ref && expandedPosts.has(index)) {
        applyRtlToHebrewElements(ref);
      }
    });
  }, [expandedPosts, rssFeed]);

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const togglePost = (index: number) => {
    setExpandedPosts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const sanitizeHtml = (html: string) => {
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'a', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'img', 'figure', 'figcaption', 'div', 'span'],
      ALLOWED_ATTR: ['href', 'src', 'alt', 'class', 'target', 'rel', 'dir', 'style'],
    });
  };

  const setContentRef = (index: number) => (el: HTMLDivElement | null) => {
    if (el) {
      contentRefs.current.set(index, el);
      applyRtlToHebrewElements(el);
    } else {
      contentRefs.current.delete(index);
    }
  };

  return (
    <SharedLayout variant="simple" mainMaxWidth="container">
      <div className="max-w-4xl mx-auto">
        <div className="bg-card rounded-lg shadow-sm border border-border p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Talmud & Tech Blog
            </h1>
            <p className="text-lg text-muted-foreground">
              Latest posts from{" "}
              <a
                href="https://www.ezrabrand.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 underline"
              >
                ezrabrand.com
              </a>
            </p>
          </div>

          {isLoading && (
            <div className="space-y-6">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="animate-pulse border border-border rounded-lg p-6"
                >
                  <div className="h-6 bg-secondary rounded w-3/4 mb-4"></div>
                  <div className="h-4 bg-secondary rounded w-1/4 mb-4"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-secondary rounded w-full"></div>
                    <div className="h-4 bg-secondary rounded w-full"></div>
                    <div className="h-4 bg-secondary rounded w-2/3"></div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {error && (
            <div className="text-center py-12">
              <p className="text-destructive mb-4">Failed to load blog posts</p>
              <a
                href="https://www.ezrabrand.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 underline"
              >
                Visit the blog directly
              </a>
            </div>
          )}

          {rssFeed?.items && rssFeed.items.length > 0 && (
            <div className="space-y-6">
              {rssFeed.items.map((post, index) => (
                <article
                  key={index}
                  className="border border-border rounded-lg overflow-hidden"
                >
                  <button
                    onClick={() => togglePost(index)}
                    className="w-full text-left p-6 bg-secondary/30 hover:bg-secondary/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h2 className="text-xl font-semibold text-foreground mb-2">
                          {post.title}
                        </h2>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {formatDate(post.pubDate)}
                          </span>
                          {post.author && (
                            <span className="flex items-center gap-1">
                              <User className="w-4 h-4" />
                              {post.author}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <a
                          href={post.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 hover:bg-secondary rounded-md"
                          onClick={(e) => e.stopPropagation()}
                          title="Open in new tab"
                        >
                          <ExternalLink className="w-5 h-5 text-muted-foreground" />
                        </a>
                        {expandedPosts.has(index) ? (
                          <ChevronUp className="w-5 h-5 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                  </button>

                  {expandedPosts.has(index) && (
                    <div className="p-6 border-t border-border">
                      <div
                        ref={setContentRef(index)}
                        className="prose prose-sm dark:prose-invert max-w-none
                          prose-headings:text-foreground prose-headings:font-semibold
                          prose-p:text-muted-foreground prose-p:leading-relaxed
                          prose-a:text-blue-600 hover:prose-a:text-blue-800 prose-a:underline
                          prose-strong:text-foreground
                          prose-blockquote:border-l-primary prose-blockquote:text-muted-foreground
                          prose-li:text-muted-foreground
                          prose-img:rounded-lg prose-img:max-w-full prose-img:h-auto"
                        dangerouslySetInnerHTML={{
                          __html: sanitizeHtml(post.content),
                        }}
                      />
                      <div className="mt-6 pt-4 border-t border-border">
                        <a
                          href={post.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium"
                        >
                          Read on ezrabrand.com
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}

          {rssFeed?.items && rssFeed.items.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No blog posts available</p>
            </div>
          )}
        </div>
      </div>
    </SharedLayout>
  );
}
