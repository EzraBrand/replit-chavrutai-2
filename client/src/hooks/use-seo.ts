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
}

export function useSEO(seoData: SEOData) {
  useEffect(() => {
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
    
    // Open Graph tags
    updateMeta('og:title', seoData.ogTitle || seoData.title, 'property');
    updateMeta('og:description', seoData.ogDescription || seoData.description, 'property');
    updateMeta('og:type', 'article', 'property');
    updateMeta('og:site_name', 'ChavrutAI', 'property');
    updateMeta('og:locale', 'en_US', 'property');
    if (seoData.ogUrl) updateMeta('og:url', seoData.ogUrl, 'property');
    
    // Twitter tags
    updateMeta('twitter:card', 'summary');
    updateMeta('twitter:title', seoData.ogTitle || seoData.title);
    updateMeta('twitter:description', seoData.ogDescription || seoData.description);
    updateMeta('twitter:site', '@ChavrutAI');

    // Canonical URL
    if (seoData.canonical) {
      updateCanonical(seoData.canonical);
    }

    // Structured data
    if (seoData.structuredData) {
      updateStructuredData(seoData.structuredData);
    }

  }, [seoData]);
}

// Helper function to generate SEO data for different page types
export const generateSEOData = {
  homePage: (tractate: string, folio: number, side: 'a' | 'b'): SEOData => ({
    title: `${tractate} ${folio}${side} - Talmud Bavli | ChavrutAI`,
    description: `Study ${tractate} folio ${folio}${side} from the Babylonian Talmud with bilingual Hebrew-English text display. Read, analyze and learn from this classic text on ChavrutAI's digital study platform.`,
    keywords: `Talmud, ${tractate}, folio ${folio}${side}, Jewish texts, Hebrew, Aramaic, study, ChavrutAI, Babylonian Talmud`,
    canonical: `${window.location.origin}/tractate/${tractate.toLowerCase().replace(/\s+/g, '-')}/${folio}${side}`,
    ogTitle: `${tractate} ${folio}${side} - Study Talmud Bavli`,
    ogDescription: `Study ${tractate} folio ${folio}${side} from the Babylonian Talmud with Hebrew-English bilingual text on ChavrutAI.`,
    ogUrl: `${window.location.origin}/tractate/${tractate.toLowerCase().replace(/\s+/g, '-')}/${folio}${side}`,
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

  contentsPage: (): SEOData => ({
    title: "Talmud Bavli Contents - All Tractates | ChavrutAI",
    description: "Browse all 37 tractates of the Babylonian Talmud organized by traditional Seder. Start your digital Talmud study journey with ChavrutAI's comprehensive table of contents.",
    keywords: "Talmud Bavli, tractates, contents, Seder, Jewish texts, study guide, ChavrutAI",
    canonical: `${window.location.origin}/`,
    ogTitle: "Talmud Bavli Contents - All Tractates",
    ogDescription: "Browse all 37 tractates of the Babylonian Talmud organized by traditional Seder on ChavrutAI's digital study platform.",
    ogUrl: `${window.location.origin}/`,
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
    canonical: `${window.location.origin}/contents/${tractate.toLowerCase()}`,
    ogTitle: `${tractate} - Talmud Contents`,
    ogDescription: `Navigate through ${tractate} tractate chapters and folios on ChavrutAI's digital Talmud study platform.`,
    ogUrl: `${window.location.origin}/contents/${tractate.toLowerCase()}`,
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
    structuredData: {
      "@context": "https://schema.org",
      "@type": "AboutPage",
      "name": "About ChavrutAI",
      "description": "Information about ChavrutAI digital Talmud study platform"
    }
  }),

  suggestedPages: (): SEOData => ({
    title: "Suggested Pages - Famous Talmud Folios | ChavrutAI",
    description: "Explore the most famous and significant discussions in the Talmud. Discover foundational teachings, inspiring stories, and profound wisdom from centuries of Jewish learning.",
    keywords: "Talmud highlights, famous folios, Jewish wisdom, Hillel, Hannah, significant teachings, ChavrutAI",
    canonical: `${window.location.origin}/suggested-pages`,
    structuredData: {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      "name": "Suggested Talmud Pages",
      "description": "A curated collection of the most significant and famous pages in the Babylonian Talmud",
      "about": {
        "@type": "Book",
        "name": "Babylonian Talmud",
        "alternateName": "Talmud Bavli",
        "inLanguage": ["he", "en"],
        "genre": "Religious Text"
      }
    }
  })
};