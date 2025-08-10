import { useEffect } from 'react';

interface SEOData {
  title: string;
  description: string;
  canonical?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogUrl?: string;
  keywords?: string;
  structuredData?: object;
  robots?: string;
  noindex?: boolean;
}

export function useSEO(seoData: SEOData) {
  useEffect(() => {
    // Check server response headers for noindex directive
    const checkServerNoIndex = () => {
      const currentUrl = window.location.pathname;
      // Check if this is a folio page pattern
      if (/^\/tractate\/[^\/]+\/\d+[ab]$/i.test(currentUrl)) {
        return true;
      }
      return false;
    };
    
    // Override noindex if server indicates this should be noindexed
    const serverNoIndex = checkServerNoIndex();
    if (serverNoIndex && !seoData.noindex) {
      seoData = { ...seoData, noindex: true };
    }
    // Update title
    document.title = seoData.title;
    
    // Ensure essential meta tags exist
    const ensureMetaTag = (name: string, content: string, property?: string) => {
      const selector = property ? `meta[property="${name}"]` : `meta[name="${name}"]`;
      let meta = document.querySelector(selector) as HTMLMetaElement;
      
      if (!meta) {
        meta = document.createElement('meta');
        if (property) {
          meta.setAttribute('property', name);
        } else {
          meta.setAttribute('name', name);
        }
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', content);
    };
    
    // Essential viewport and encoding meta tags
    if (!document.querySelector('meta[name="viewport"]')) {
      const viewport = document.createElement('meta');
      viewport.setAttribute('name', 'viewport');
      viewport.setAttribute('content', 'width=device-width, initial-scale=1.0');
      document.head.appendChild(viewport);
    }
    
    if (!document.querySelector('meta[charset]')) {
      const charset = document.createElement('meta');
      charset.setAttribute('charset', 'UTF-8');
      document.head.prepend(charset);
    }

    // Update or create meta tags
    const updateMeta = (name: string, content: string, property?: string) => {
      const selector = property ? `meta[property="${name}"]` : `meta[name="${name}"]`;
      let meta = document.querySelector(selector) as HTMLMetaElement;
      
      if (!meta) {
        meta = document.createElement('meta');
        if (property) {
          meta.setAttribute('property', name);
        } else {
          meta.setAttribute('name', name);
        }
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', content);
    };

    // Update canonical URL
    const updateCanonical = (url: string) => {
      let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
      if (!canonical) {
        canonical = document.createElement('link');
        canonical.setAttribute('rel', 'canonical');
        document.head.appendChild(canonical);
      }
      canonical.setAttribute('href', url);
    };

    // Update structured data
    const updateStructuredData = (data: object) => {
      // Remove existing structured data
      const existing = document.querySelector('script[type="application/ld+json"]');
      if (existing) {
        existing.remove();
      }

      // Add new structured data
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.textContent = JSON.stringify(data);
      document.head.appendChild(script);
    };

    // Apply updates
    updateMeta('description', seoData.description);
    if (seoData.keywords) updateMeta('keywords', seoData.keywords);
    
    // Robots meta tag
    const robotsContent = seoData.noindex 
      ? 'noindex, nofollow' 
      : seoData.robots || 'index, follow';
    updateMeta('robots', robotsContent);
    
    // Open Graph tags
    updateMeta('og:title', seoData.ogTitle || seoData.title, 'property');
    updateMeta('og:description', seoData.ogDescription || seoData.description, 'property');
    updateMeta('og:type', 'article', 'property');
    updateMeta('og:site_name', 'ChavrutAI', 'property');
    updateMeta('og:locale', 'en_US', 'property');
    updateMeta('og:locale:alternate', 'he_IL', 'property');
    updateMeta('og:image', `${window.location.origin}/og-image.svg`, 'property');
    updateMeta('og:image:alt', seoData.ogTitle || seoData.title, 'property');
    updateMeta('og:image:width', '1200', 'property');
    updateMeta('og:image:height', '630', 'property');
    updateMeta('og:image:type', 'image/svg+xml', 'property');
    if (seoData.ogUrl) updateMeta('og:url', seoData.ogUrl, 'property');
    
    // Twitter tags
    updateMeta('twitter:card', 'summary_large_image');
    updateMeta('twitter:title', seoData.ogTitle || seoData.title);
    updateMeta('twitter:description', seoData.ogDescription || seoData.description);
    updateMeta('twitter:image', `${window.location.origin}/og-image.svg`);
    updateMeta('twitter:image:alt', seoData.ogTitle || seoData.title);
    updateMeta('twitter:site', '@ChavrutAI');

    // Canonical URL
    if (seoData.canonical) {
      updateCanonical(seoData.canonical);
    }

    // Structured data
    if (seoData.structuredData) {
      updateStructuredData(seoData.structuredData);
    }
    
    // Add hreflang for Hebrew content support
    const addHreflang = (lang: string, href: string) => {
      let hreflang = document.querySelector(`link[hreflang="${lang}"]`) as HTMLLinkElement;
      if (!hreflang) {
        hreflang = document.createElement('link');
        hreflang.setAttribute('rel', 'alternate');
        hreflang.setAttribute('hreflang', lang);
        document.head.appendChild(hreflang);
      }
      hreflang.setAttribute('href', href);
    };
    
    // Add hreflang tags for Hebrew/English content
    const currentUrl = window.location.href;
    addHreflang('en', currentUrl);
    addHreflang('he', currentUrl);
    addHreflang('x-default', currentUrl);

  }, [seoData]);
}

// Helper function to generate SEO data for different page types
export const generateSEOData = {
  // This is actually for tractate-view pages, should be noindexed
  folioPage: (tractate: string, folio: number, side: 'a' | 'b'): SEOData => ({
    title: `${tractate} ${folio}${side} - Talmud Bavli | ChavrutAI`,
    description: `Study ${tractate} folio ${folio}${side} from the Babylonian Talmud with bilingual Hebrew-English text display. Read, analyze and learn from this classic text on ChavrutAI's digital study platform.`,
    keywords: `Talmud, ${tractate}, folio ${folio}${side}, Jewish texts, Hebrew, Aramaic, study, ChavrutAI, Babylonian Talmud`,
    canonical: `${window.location.origin}/tractate/${tractate.toLowerCase().replace(/\s+/g, '-')}/${folio}${side}`,
    ogTitle: `${tractate} ${folio}${side} - Study Talmud Bavli`,
    ogDescription: `Study ${tractate} folio ${folio}${side} from the Babylonian Talmud with Hebrew-English bilingual text on ChavrutAI.`,
    ogUrl: `${window.location.origin}/tractate/${tractate.toLowerCase().replace(/\s+/g, '-')}/${folio}${side}`,
    noindex: true, // Don't index dynamic content pages
    robots: 'noindex, nofollow', // Explicit robots directive
    structuredData: {
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": `${tractate} ${folio}${side} - Talmud Bavli`,
      "description": `Study ${tractate} folio ${folio}${side} from the Babylonian Talmud with bilingual Hebrew-English text`,
      "url": `${window.location.origin}/tractate/${tractate.toLowerCase().replace(/\s+/g, '-')}/${folio}${side}`,
      "dateModified": new Date().toISOString(),
      "author": {
        "@type": "Organization",
        "name": "ChavrutAI",
        "url": window.location.origin
      },
      "publisher": {
        "@type": "Organization", 
        "name": "ChavrutAI",
        "url": window.location.origin,
        "logo": {
          "@type": "ImageObject",
          "url": `${window.location.origin}/favicon-192x192.png`
        }
      },
      "mainEntity": {
        "@type": "Book",
        "name": `${tractate} - Babylonian Talmud`,
        "alternateName": `${tractate} - תלמוד בבלי`,
        "bookFormat": "EBook",
        "inLanguage": ["he", "en", "arc"],
        "genre": "Religious Text",
        "author": "Talmudic Sages",
        "isPartOf": {
          "@type": "BookSeries",
          "name": "Babylonian Talmud"
        }
      }
    }
  }),

  // Main homepage/contents page
  homePage: (): SEOData => ({
    title: "ChavrutAI - Digital Talmud Study Platform | All Tractates",
    description: "Browse all 37 tractates of the Babylonian Talmud organized by traditional Seder. Start your digital Talmud study journey with ChavrutAI's comprehensive table of contents.",
    keywords: "Talmud Bavli, tractates, contents, Seder, Jewish texts, study guide, ChavrutAI, digital Talmud",
    canonical: `${window.location.origin}/`,
    ogTitle: "ChavrutAI - Digital Talmud Study Platform",
    ogDescription: "Browse all 37 tractates of the Babylonian Talmud organized by traditional Seder on ChavrutAI's digital study platform.",
    ogUrl: `${window.location.origin}/`,
    robots: 'index, follow',
    structuredData: {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "name": "ChavrutAI",
      "description": "Digital platform for studying Jewish texts with modern technology",
      "url": window.location.origin,
      "potentialAction": {
        "@type": "SearchAction",
        "target": `${window.location.origin}/contents/{search_term}`,
        "query-input": "required name=search_term"
      },
      "author": {
        "@type": "Organization",
        "name": "ChavrutAI",
        "url": window.location.origin
      },
      "publisher": {
        "@type": "Organization",
        "name": "ChavrutAI",
        "url": window.location.origin,
        "logo": {
          "@type": "ImageObject",
          "url": `${window.location.origin}/favicon-192x192.png`
        }
      }
    }
  }),

  contentsPage: (): SEOData => ({
    title: "Talmud Bavli Contents - All Tractates | ChavrutAI",
    description: "Browse all 37 tractates of the Babylonian Talmud organized by traditional Seder. Start your digital Talmud study journey with ChavrutAI's comprehensive table of contents.",
    keywords: "Talmud Bavli, tractates, contents, Seder, Jewish texts, study guide, ChavrutAI",
    canonical: `${window.location.origin}/contents`,
    ogTitle: "Talmud Bavli Contents - All Tractates",
    ogDescription: "Browse all 37 tractates of the Babylonian Talmud organized by traditional Seder on ChavrutAI's digital study platform.",
    ogUrl: `${window.location.origin}/contents`,
    structuredData: {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      "name": "Talmud Bavli Contents",
      "description": "Complete table of contents for the Babylonian Talmud",
      "url": `${window.location.origin}/contents`,
      "publisher": {
        "@type": "Organization",
        "name": "ChavrutAI",
        "url": window.location.origin
      },
      "about": {
        "@type": "Book",
        "name": "Babylonian Talmud",
        "alternateName": "Talmud Bavli",
        "inLanguage": ["he", "en", "arc"],
        "genre": "Religious Text"
      }
    }
  }),

  tractatePage: (tractate: string): SEOData => ({
    title: `${tractate} Contents - Chapters & Folios | ChavrutAI`,
    description: `Navigate through ${tractate} tractate with detailed chapter breakdown and folio ranges. Study this Talmudic tractate with ChavrutAI's digital platform.`,
    keywords: `${tractate}, Talmud, chapters, folios, Jewish texts, study, ChavrutAI`,
    canonical: `${window.location.origin}/contents/${tractate.toLowerCase().replace(/\s+/g, '-')}`,
    ogTitle: `${tractate} - Talmud Contents`,
    ogDescription: `Navigate through ${tractate} tractate chapters and folios on ChavrutAI's digital Talmud study platform.`,
    ogUrl: `${window.location.origin}/contents/${tractate.toLowerCase().replace(/\s+/g, '-')}`,
    robots: 'index, follow',
    structuredData: {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      "name": `${tractate} - Talmud Bavli`,
      "description": `Contents and navigation for ${tractate} tractate`,
      "url": `${window.location.origin}/contents/${tractate.toLowerCase()}`,
      "publisher": {
        "@type": "Organization",
        "name": "ChavrutAI",
        "url": window.location.origin
      },
      "isPartOf": {
        "@type": "Book",
        "name": "Babylonian Talmud",
        "alternateName": "Talmud Bavli",
        "inLanguage": ["he", "en", "arc"],
        "genre": "Religious Text"
      }
    }
  }),

  aboutPage: (): SEOData => ({
    title: "About ChavrutAI - Digital Talmud Study Platform",
    description: "Learn about ChavrutAI's mission to make Jewish texts accessible through modern technology. Discover our approach to digital Talmud study with bilingual text display.",
    keywords: "ChavrutAI, about, digital Talmud, Jewish texts, study platform, technology",
    canonical: `${window.location.origin}/about`,
    robots: 'index, follow',
    structuredData: {
      "@context": "https://schema.org",
      "@type": "AboutPage",
      "name": "About ChavrutAI",
      "description": "Information about ChavrutAI digital Talmud study platform",
      "mainEntity": {
        "@type": "Organization",
        "name": "ChavrutAI",
        "description": "Digital platform for studying Jewish texts with modern technology",
        "url": window.location.origin,
        "foundingDate": "2025",
        "sameAs": [
          "https://www.ezrabrand.com/p/designing-chavrutai-building-a-customized"
        ]
      }
    }
  }),

  suggestedPages: (): SEOData => ({
    title: "Suggested Pages - Famous Talmud Folios | ChavrutAI",
    description: "Explore the most famous and significant discussions in the Talmud. Discover foundational teachings, inspiring stories, and profound wisdom from centuries of Jewish learning.",
    keywords: "Talmud highlights, famous folios, Jewish wisdom, Hillel, Hannah, significant teachings, ChavrutAI",
    canonical: `${window.location.origin}/suggested-pages`,
    robots: 'index, follow',
    structuredData: {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      "name": "Suggested Talmud Pages",
      "description": "A curated collection of the most significant and famous pages in the Babylonian Talmud",
      "about": {
        "@type": "Book",
        "name": "Babylonian Talmud",
        "alternateName": "Talmud Bavli",
        "inLanguage": ["he", "en", "arc"],
        "genre": "Religious Text"
      },
      "publisher": {
        "@type": "Organization",
        "name": "ChavrutAI",
        "url": window.location.origin
      }
    }
  })
};