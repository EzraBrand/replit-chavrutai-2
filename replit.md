# ChavrutAI - Talmud Study Interface

## Overview

ChavrutAI is a modern web application designed to make Jewish texts, particularly the Talmud, more accessible through a digital interface. The application provides bilingual (Hebrew/English) text display with intuitive navigation through complex religious texts, following traditional study patterns while leveraging modern web technologies.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript for type safety and modern development practices
- **UI Framework**: shadcn/ui components built on Radix UI primitives for accessibility and consistent design
- **Styling**: Tailwind CSS with custom sepia color palette to evoke traditional paper manuscripts
- **State Management**: TanStack Query for server state management and caching
- **Routing**: Wouter for lightweight client-side routing
- **Build Tool**: Vite for fast development and optimized production builds

### Backend Architecture
- **Runtime**: Node.js with Express.js server
- **Language**: TypeScript throughout the full stack
- **API Design**: RESTful endpoints following conventional patterns
- **Data Storage**: In-memory storage with plans for PostgreSQL integration via Drizzle ORM
- **External Integration**: Sefaria API for sourcing Jewish text content

### Design Philosophy
The interface honors traditional Talmud layout while adapting for digital consumption. The sepia color scheme and typography choices reflect the aesthetic of ancient manuscripts, creating familiarity for traditional learners while remaining accessible to modern users.

## Key Components

### Navigation System
- **Hierarchical Breadcrumb Navigation**: Multi-level dropdowns for Work → Tractate → Chapter → Folio selection
- **Mobile-First Design**: Responsive navigation that adapts from desktop breadcrumbs to mobile sheet overlays
- **Page Navigation**: Previous/Next controls that understand Talmudic folio patterns (2a, 2b, 3a, etc.)

### Text Display
- **Bilingual Layout**: Side-by-side Hebrew and English text presentation
- **Responsive Design**: Stacks vertically on mobile devices while maintaining readability
- **Typography**: Custom font choices optimized for both Hebrew and English text rendering

### Data Management
- **Schema-Driven**: Drizzle ORM schemas define the structure for texts, users, and bookmarks
- **Type Safety**: Zod schemas ensure runtime validation matching database schemas
- **Caching Strategy**: TanStack Query provides intelligent caching of text data to reduce API calls

## Data Flow

1. **User Navigation**: User selects location through hierarchical navigation components
2. **Local Check**: System first checks in-memory storage for requested text
3. **External Fetch**: If not found locally, fetches from Sefaria API
4. **Data Transformation**: Processes API response into standardized internal format
5. **Storage**: Saves transformed data to local storage for future requests
6. **Display**: Renders bilingual text through specialized display components

### Text Location System
The application uses a structured location system:
- **Work**: Bible, Mishnah, Talmud Yerushalmi, or Talmud Bavli
- **Tractate**: Specific tractate within the chosen work
- **Chapter**: Chapter number within the tractate
- **Folio**: Page number in traditional Talmudic notation
- **Side**: 'a' or 'b' representing front and back of folio pages

## External Dependencies

### Core Dependencies
- **Sefaria API**: Primary source for Jewish text content
- **Neon Database**: PostgreSQL-compatible serverless database (configured but not yet active)
- **Radix UI**: Accessibility-first primitive components
- **TanStack Query**: Server state management and caching

### Development Tools
- **Drizzle Kit**: Database migrations and schema management
- **ESBuild**: Fast JavaScript bundling for production
- **TSX**: TypeScript execution for development server

## Deployment Strategy

### Development Environment
- **Dev Server**: TSX runs the TypeScript server directly for hot reloading
- **Frontend**: Vite dev server with HMR (Hot Module Replacement)
- **Database**: In-memory storage for rapid development iteration

### Production Build
- **Frontend**: Vite builds optimized static assets
- **Backend**: ESBuild bundles server code into single executable
- **Database**: Ready for PostgreSQL connection via environment variables
- **Deployment**: Static frontend with Node.js server backend

### Database Migration Strategy
The application is architected to seamlessly transition from in-memory storage to PostgreSQL:
- Drizzle schemas are already defined for production database structure
- Current in-memory storage implements the same interface as the planned database layer
- Database URL configuration is prepared but optional for development

The system prioritizes rapid development and easy deployment while maintaining a clear path to production-scale data persistence.

## Recent Changes: Latest modifications with dates

### January 31, 2025 - UI Simplification and Accurate Folio Implementation
- **Simplified Navigation**: Removed Work and Chapter dropdowns, keeping only Tractate and Page selections for cleaner UI
- **Accurate Folio Ranges**: Implemented exact page counts for all 37 Talmud Bavli tractates based on Vilna edition data
  - Examples: Berakhot (64 pages), Shabbat (157 pages), Bava Batra (176 pages), Tamid (8 pages)
  - Replaced flat 150-page limit with tractate-specific maximums
- **Enhanced Navigation Logic**: Updated page dropdowns and next/previous navigation to respect tractate boundaries
- **Code Organization**: Created shared utility (`tractate-ranges.ts`) for consistent folio data across components
- **Chapter References Removed**: Eliminated chapter mentions from UI to match simplified navigation design
- **Mobile Text Ordering**: Fixed mobile layout so Hebrew text appears before English in each section
- **Complete Sepia Theme**: Implemented light sepia theme throughout entire UI, replacing all white backgrounds
  - Updated CSS variables for warm manuscript-like colors (light sepia backgrounds, dark brown text)
  - Applied sepia theme to all components: navigation, text display, alerts, mobile sheets, page controls
  - Maintained accessibility with proper contrast ratios while achieving traditional manuscript aesthetic
- **Comprehensive Text Processing**: Enhanced English text processing with ordinal conversions and formatting preservation
  - Added ordinal number conversion for numbers 3+ ("twenty-ninth" → "29th", "thirty-seventh" → "37th")
  - Fixed compound ordinal processing order to prevent partial replacements ("twenty-9th" bug)
  - Improved HTML formatting preservation during text splitting and line breaks
- **Footer and About Page**: Added project attribution and information page
  - Footer includes Sefaria data attribution, "Talmud & Tech" credit, and About link
  - About page with project description and link to detailed blog post
- **Sticky Navigation Enhancement**: Improved navigation UX for better accessibility
  - Made header navigation sticky at top when scrolling for constant access to controls
  - Moved navigation dropdowns from mobile hamburger menu to always-visible top position
  - Optimized mobile navigation with responsive sizing and spacing
- **Updated Branding and Icons**: Enhanced visual identity with custom Hebrew-themed imagery
  - Replaced favicon with ChavrutAI logo featuring Hebrew "תלמוד" text in open book design
  - Updated header logo from generic book icon to custom Tav (ת) book icon with warm golden background
  - Maintained consistent sepia theme while incorporating distinctive Hebrew lettering for brand recognition

### February 3, 2025 - User Preferences System
- **Comprehensive Preferences System**: Added user customization options in hamburger menu
  - Text size controls (Small, Medium, Large, Extra Large) for both Hebrew and English text
  - Hebrew font selection with proper Google Fonts integration (Calibri, Times New Roman, Noto Sans Hebrew, Frank Ruhl Libre)
  - Dark mode toggle with automatic theme switching and localStorage persistence
- **Preferences Context**: Created React context with localStorage integration for preference persistence
- **Dynamic CSS Classes**: Implemented responsive text sizing and font switching through CSS classes
- **Font Integration**: Added Google Fonts imports for Noto Sans Hebrew and Frank Ruhl Libre to ensure proper Hebrew font rendering

### February 3, 2025 - Contents System and Naming Consistency
- **Contents Page System**: Built comprehensive table of contents with traditional Seder organization showing all 37 Talmud Bavli tractates
- **Individual Tractate Pages**: Created detailed tractate contents pages with authentic chapter data and folio range navigation  
- **Naming Standardization**: Implemented full consistency across all tractate names throughout application
  - Removed apostrophes: "Mo'ed Katan" → "Moed Katan", "Ta'anit" → "Taanit", "Shevu'ot" → "Shevuot", "Me'ilah" → "Meilah"
  - Updated shared constants, Seder organization, API mappings, and chapter data for complete consistency
  - Created URL-to-Sefaria normalization system to handle case conversions for external API calls
- **Navigation Bug Fixes**: Fixed critical URL parameter reading issues that prevented proper navigation from Contents pages to main text view
- **TypeScript Error Resolution**: Fixed type assertion issues with tractate name lookups using proper keyof type casting

### February 3, 2025 - Comprehensive SEO Optimization
- **Dynamic Page Titles & Meta Tags**: Implemented specific, descriptive titles for each page (e.g., "Berakhot 2a - Talmud Bavli | ChavrutAI")
- **Clean URL Structure**: Migrated from query parameters `/?tractate=Berakhot&folio=2` to SEO-friendly URLs `/tractate/berakhot/2a`
- **Structured Data Implementation**: Added JSON-LD markup for religious texts, educational content, and breadcrumbs to enhance search engine understanding
- **SEO Hook System**: Created reusable `useSEO` hook for dynamic head management across all pages with consistent meta descriptions and canonical URLs
- **Search Engine Optimization**: Added robots.txt and auto-generated XML sitemap with strategic folio page coverage
- **Tractate Name Normalization**: Fixed case consistency bug in hamburger menu suggestions to ensure proper URL generation
- **Comprehensive Breadcrumb Navigation**: Implemented breadcrumb navigation system across all main pages (Contents, Tractate View, Tractate Contents, About) with proper hierarchy and accessibility
- **Homepage Architecture Change**: Set Contents page as the new homepage (root "/" route) while maintaining backward compatibility with "/contents" route
- **Strategic Sitemap Optimization**: Redesigned sitemap focusing on key entry points rather than exhaustive coverage - includes all tractate contents pages, first folio (2a) of each tractate, and 15+ famous/significant folios with educational value (Hillel stories, ethical discussions, foundational laws)
- **Enhanced Robots.txt**: Added crawl delays (1-2 seconds) to respect Sefaria API limits, blocked API endpoints from indexing, and optimized for major search engines