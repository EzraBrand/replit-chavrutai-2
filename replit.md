# ChavrutAI - Talmud Study Interface

## Overview
ChavrutAI is a modern web application designed to make Jewish texts, particularly the Talmud, more accessible through a digital interface. It provides bilingual (Hebrew/English) text display with intuitive navigation, leveraging modern web technologies while adhering to traditional study patterns. The project aims to integrate traditional Talmudic layout with digital consumption, creating a familiar yet accessible experience.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture
### Design Philosophy
The interface honors traditional Talmud layout, adapting it for digital consumption. A custom sepia color palette and typography choices reflect the aesthetic of ancient manuscripts, aiming for familiarity for traditional learners and accessibility for modern users. The application provides customizable text size, Hebrew font selection, and dark mode.

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **UI Framework**: shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom sepia color palette
- **State Management**: TanStack Query for server state management and caching
- **Routing**: Wouter for lightweight client-side routing
- **Build Tool**: Vite for fast development and optimized production builds
- **Navigation**: Hierarchical breadcrumb navigation (Work → Tractate → Chapter → Folio) with mobile-first design and responsive sheet overlays. Page navigation understands Talmudic folio patterns (2a, 2b, 3a, etc.).
- **Text Display**: Bilingual (Hebrew/English) layout that stacks vertically on mobile. Offers "Side-by-Side" and "Stacked" layout preferences.
- **Components**: Navigation system, text display, and data management.

### Backend Architecture
- **Runtime**: Node.js with Express.js server
- **Language**: TypeScript
- **API Design**: RESTful endpoints
- **Data Storage**: In-memory storage with plans for PostgreSQL integration via Drizzle ORM.
- **Data Flow**: User navigation triggers local data check, then external fetch from Sefaria API if needed. Data is transformed, stored locally, and displayed.
- **Text Location System**: Structured system (Work, Tractate, Chapter, Folio, Side) for precise text referencing.

### Key Features
- **Accurate Folio Ranges**: Implements exact page counts for all 37 Talmud Bavli tractates based on Vilna edition data.
- **Contents System**: Comprehensive table of contents with traditional Seder organization and individual tractate pages with authentic chapter data.
- **Hebrew Font Selection**: Comprehensive Hebrew typography options including Google Fonts (Noto Sans Hebrew, Noto Serif Hebrew, Noto Rashi Hebrew, Frank Ruhl Libre, David Libre, Assistant) and system fonts, with visual Hebrew letter previews (aleph) in preferences dropdown.
- **Technical Term Highlighting**: Intelligent highlighting system using authentic gazetteers from talmud-nlp-indexer repository, featuring 5,385 terms across 3 categories (concepts, names, places) with distinct color coding and toggleable controls.
- **SEO Optimization**: Dynamic page titles, meta tags, clean URL structure (`/tractate/berakhot/2a`), JSON-LD structured data, and an SEO hook system.
- **Analytics**: Google Analytics 4 integration for comprehensive user behavior tracking and event tracking (page navigation, preferences, menu interactions).

## External Dependencies
- **Sefaria API**: Primary source for Jewish text content.
- **Neon Database**: PostgreSQL-compatible serverless database (configured for future use).
- **Radix UI**: Accessibility-first primitive components.
- **TanStack Query**: Server state management and caching.
- **Drizzle Kit**: Database migrations and schema management.
- **Google Analytics 4**: For user behavior tracking.
- **Google Fonts**: For Hebrew font integration (Noto Sans Hebrew, Frank Ruhl Libre).

## ✅ COMPLETED: Technical Term Highlighting with Gazetteers

### Feature Overview (IMPLEMENTED)
Successfully implemented intelligent highlighting of technical terms in Talmudic texts using curated gazetteers from the talmud-nlp-indexer repository. The feature is optional (default: off) and accessible via the hamburger menu, maintaining current UX/UI while adding sophisticated term recognition capabilities.

**Implementation Status: COMPLETE - August 10, 2025**
- ✅ Phase 1: Infrastructure and core functionality completed
- ✅ 5,385+ terms loaded from 6 gazetteer files
- ✅ Real-time highlighting with 3 categories (concepts, names, places)
- ✅ Full UI integration in hamburger menu preferences
- ✅ Rabbi/R' abbreviation mapping: 1,219 variants created, including mid-phrase matches (e.g., "R' Abba bar Kahana" matches "Rabbi Abba bar Kahana", "the school of R' Yishmael" matches "the school of Rabbi Yishmael")

### Technical Specifications

#### Gazetteer Data Sources
- **Repository**: https://github.com/EzraBrand/talmud-nlp-indexer/tree/main/data
- **Gazetteer Files**:
  - `talmud_concepts_gazetteer.txt` - Religious/theological concepts (Shekhina, tefillin, Gehenna, etc.)
  - `talmud_names_gazetteer.txt` - Rabbinic names and personas (Abaye, Rava, specific individuals)
  - `bible_names_gazetteer.txt` - Biblical figures and names (David, Solomon, Moses, etc.)
  - `bible_nations_gazetteer.txt` - Ancient nations and peoples
  - `bible_places_gazetteer.txt` - Geographic locations from biblical/talmudic texts
  - `talmud_toponyms_gazetteer.txt` - Talmudic geographic references

#### Implementation Architecture

**1. Data Layer**
- Create gazetteer data fetching service
- Implement client-side caching for gazetteer data
- Structure for categorized highlighting (concepts, names, places)

**2. Text Processing Layer** 
- Develop text analysis engine for term matching
- Handle Hebrew and English text variants
- Implement case-insensitive matching with word boundary detection
- Support multi-word entity recognition (e.g., "Bar Kochba rebellion", "World-to-Come")

**3. UI/UX Layer**
- Add toggle in hamburger menu preferences section
- Implement visual highlighting with distinct colors per category:
  - Concepts: Light blue highlight
  - Names: Light yellow highlight  
  - Places: Light green highlight
- Create hover tooltips showing term category
- Ensure accessibility compliance (ARIA labels, keyboard navigation)

**4. State Management**
- Extend preferences context to include highlighting state
- Persist highlighting preference in localStorage
- Track analytics events for feature usage

#### Development Phases

**Phase 1: Infrastructure Setup**
- Create gazetteer data fetching utilities
- Extend preferences context with highlighting options
- Add menu toggle UI components

**Phase 2: Core Highlighting Engine**
- Implement text analysis and matching algorithms
- Create highlighting component with category support
- Integrate with existing text display components

**Phase 3: UX Polish & Testing**
- Add tooltips and interactive elements
- Implement accessibility features
- Performance optimization for large texts
- Analytics integration

**Phase 4: Advanced Features**
- Context-aware highlighting intensity
- User feedback mechanisms
- Export highlighted text functionality

#### Technical Considerations
- **Performance**: Lazy loading of gazetteer data, debounced text processing
- **Accessibility**: Semantic markup, keyboard navigation, screen reader support
- **Internationalization**: Support for Hebrew RTL text highlighting
- **Mobile Responsiveness**: Touch-friendly highlighting on mobile devices
- **Privacy**: Client-side processing to maintain user privacy

#### Success Metrics
- Feature adoption rate via analytics
- User engagement with highlighted terms
- Performance impact on text rendering
- User feedback on highlighting accuracy

#### Timeline
- **Week 1**: Infrastructure and data layer
- **Week 2**: Core highlighting engine  
- **Week 3**: UI integration and testing
- **Week 4**: Polish, accessibility, and deployment

### Integration Points
- Hamburger menu preferences section
- SectionedBilingualDisplay component
- Text processing utilities
- Analytics tracking system

*Feature design prioritizes maintaining current UX while providing sophisticated scholarly tools for enhanced Talmud study experience.*