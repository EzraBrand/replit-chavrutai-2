# ChavrutAI - Modern Talmud Study Interface

A sophisticated web application designed to make Jewish texts, particularly the Talmud, more accessible through a digital interface that honors traditional study patterns while leveraging modern web technologies.

## Overview

ChavrutAI provides bilingual (Hebrew/English) text display with intuitive navigation, creating a familiar yet accessible experience for studying the Babylonian Talmud. The interface combines traditional Talmudic layout with digital innovation, featuring a custom sepia color palette and typography that reflects the aesthetic of ancient manuscripts.

## Key Features

### 📚 **Comprehensive Text Access**
- All 37 tractates of the Babylonian Talmud
- Accurate folio ranges based on Vilna edition data
- Seamless integration with Sefaria API for authentic content

### 🎨 **Traditional Design**
- Manuscript-inspired sepia color palette
- Custom Hebrew iconography and typography
- Responsive design adapting from mobile to desktop

### 🧭 **Intelligent Navigation**
- Hierarchical breadcrumb system (Work → Tractate → Chapter → Folio)
- Understanding of Talmudic folio patterns (2a, 2b, 3a, etc.)
- Mobile-first design with responsive sheet overlays

### 🔤 **Enhanced Text Processing**
- Intelligent paragraph splitting for better readability
- Bilingual layout with proper Hebrew RTL support
- Technical term highlighting with authentic gazetteers (5,385+ terms)

### ⚙️ **Customizable Experience**
- Text size controls and Hebrew font selection
- Light/dark mode with sepia theme
- Layout preferences (side-by-side vs stacked)

### 🔍 **SEO Optimized**
- Dynamic page titles and meta descriptions
- Strategic sitemap covering key entry points
- Structured data for educational content

## Technology Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and optimized builds
- **Tailwind CSS** with custom design system
- **shadcn/ui** components built on Radix UI primitives
- **TanStack Query** for server state management
- **Wouter** for lightweight client-side routing

### Backend
- **Node.js** with Express.js
- **TypeScript** throughout
- **RESTful API** design
- **Drizzle ORM** ready for PostgreSQL integration

### Infrastructure
- **Neon Database** (PostgreSQL-compatible serverless)
- **Google Analytics 4** for comprehensive tracking
- **Replit** hosting and development environment

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn package manager

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

The application will be available at `http://localhost:5000`

## Project Structure

```
ChavrutAI/
├── client/                 # React frontend application
│   ├── public/            # Static assets and favicons
│   └── src/               # Source code
│       ├── components/    # Reusable UI components
│       ├── pages/         # Application pages
│       ├── lib/           # Utilities and services
│       └── types/         # TypeScript definitions
├── server/                # Express.js backend
├── shared/                # Shared types and schemas
└── docs/                  # Documentation assets
```

## Features in Detail

### Navigation System
The application provides intuitive navigation through complex Talmudic structure:
- **Contents pages** organized by traditional Seder structure
- **Breadcrumb navigation** for precise location tracking
- **Page controls** understanding folio numbering (2a→2b→3a)

### Text Display
- **Bilingual presentation** with Hebrew and English side-by-side
- **Responsive stacking** on mobile devices (Hebrew first)
- **Smart text processing** for improved readability
- **Term highlighting** for concepts, names, and places

### Technical Innovation
- **Gazetteer integration** with 5,385+ authentic Talmudic terms
- **SEO optimization** for educational content discovery
- **Performance optimization** with intelligent caching
- **Accessibility features** throughout the interface

## Contributing

ChavrutAI welcomes contributions from developers interested in Jewish text technology. Please review the contribution guidelines and development setup documentation.

## License

This project is developed for educational and scholarly purposes, making ancient Jewish texts more accessible to modern learners.

---

**ChavrutAI** - Where ancient wisdom meets modern technology 📚