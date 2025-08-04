# ChavrutAI Features Overview

## Display & Navigation Features

1. **Hierarchical Breadcrumb Navigation**
   Multi-level dropdown system for selecting Tractate and Page (Folio) locations. Mobile-responsive design transforms desktop breadcrumbs into accessible sheet overlays on smaller screens.

2. **Bilingual Text Display**
   Side-by-side Hebrew and English text presentation with responsive layout. On mobile devices, content stacks vertically with Hebrew text appearing before English for optimal reading flow.

3. **Traditional Folio Navigation**
   Previous/Next page controls that understand authentic Talmudic folio patterns (2a, 2b, 3a, etc.). Navigation respects exact page counts for all 37 Talmud Bavli tractates based on Vilna edition data.

4. **Sepia Manuscript Theme**
   Complete warm sepia color scheme throughout the interface to evoke traditional paper manuscripts. All components maintain consistent theming while preserving accessibility with proper contrast ratios.

5. **Sticky Header Navigation**
   Header remains accessible at top during scrolling for constant access to navigation controls. Optimized mobile navigation with responsive sizing and always-visible dropdown access.

6. **Contents Page System**
   Comprehensive table of contents organized by traditional Seder structure showing all tractates. Individual tractate pages display authentic chapter data with folio range navigation.

7. **User Preferences System**
   Customizable text size controls (Small, Medium, Large, Extra Large) for both Hebrew and English. Hebrew font selection including Google Fonts integration and dark mode toggle with localStorage persistence.

## Text Processing Features

8. **Intelligent English Text Splitting**
   Advanced punctuation-based paragraph breaks that split on all periods while preserving abbreviations (i.e., e.g., etc.). Bolded commas and colons trigger splits while preserving Bible citations in parentheses.

9. **Ordinal Number Conversion**
   Automatic conversion of written ordinals to numeric format for enhanced readability. Handles compound ordinals like "twenty-ninth" → "29th" and "thirty-seventh" → "37th" with proper processing order.

10. **Quote Pattern Recognition**
    Sophisticated handling of quotation marks to prevent orphaned quotes on separate lines. Supports both straight (") and curly (" ") quote formats with post-processing cleanup.

11. **HTML Formatting Preservation**
    Maintains original text formatting through protected HTML tag processing during text transformation. Bold text, italics, and other markup remain intact through all processing stages.

12. **Term Replacement System**
    Built-in dictionary for standardizing religious and scholarly terminology throughout texts. Ensures consistent presentation of technical terms across different source materials.

## Data & Performance Features

13. **Sefaria API Integration**
    Direct connection to authoritative Jewish text database with intelligent caching strategy. TanStack Query provides efficient data management and reduces redundant API calls.

14. **Schema-Driven Architecture**
    Type-safe data structures using Drizzle ORM schemas with Zod validation for runtime safety. Consistent data flow from external API through internal processing to display components.

15. **SEO Optimization System**
    Dynamic page titles, meta descriptions, and structured JSON-LD markup for enhanced search engine visibility. Clean URL structure with tractate-specific routing and comprehensive sitemap generation.