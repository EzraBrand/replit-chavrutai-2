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