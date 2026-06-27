import DOMPurify from 'dompurify';

/**
 * Sanitize HTML content to prevent XSS attacks while preserving safe formatting
 * Allows only specific tags that are safe for biblical citation content
 */
export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['b', 'i', 'strong', 'em', 'sup', 'sub'],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true,
    RETURN_DOM: false,
    RETURN_DOM_FRAGMENT: false,
    RETURN_DOM_IMPORT: false,
    SANITIZE_DOM: true,
  });
}

/**
 * Sanitize HTML content and ensure external links are safe
 * Used for content that may contain links
 */
export function sanitizeHtmlWithLinks(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['b', 'i', 'strong', 'em', 'sup', 'sub', 'a'],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
    KEEP_CONTENT: true,
    RETURN_DOM: false,
    RETURN_DOM_FRAGMENT: false,
    RETURN_DOM_IMPORT: false,
    SANITIZE_DOM: true,
    ADD_ATTR: ['target', 'rel'],
    HOOK_AFTER_SANITIZE: function(node) {
      // Ensure all external links have proper security attributes
      if (node.nodeType === 1) { // Element node
        const element = node as Element;
        if (element.tagName === 'A') {
          element.setAttribute('target', '_blank');
          element.setAttribute('rel', 'noopener noreferrer');
        }
      }
    }
  });
}