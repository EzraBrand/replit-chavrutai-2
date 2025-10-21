# ChavrutAI - Modern Talmud Study Platform

A comprehensive web application for studying the Babylonian Talmud, featuring bilingual text access, advanced study tools, and an intuitive interface designed for learners of all levels.

## Overview

ChavrutAI is a full-featured digital platform providing access to all 37 tractates of the Babylonian Talmud with bilingual (Hebrew/English) text display, integrated reference tools, and customizable study preferences. Built with modern web technologies, it combines traditional Talmudic scholarship with contemporary user experience design.

## Major Features

### 📚 Complete Text Library
- **All 37 tractates** of the Babylonian Talmud (5,400+ folio pages)
- **Bilingual text display** with Hebrew and English side-by-side
- **Sefaria API integration** for authoritative, up-to-date text content
- **Traditional folio numbering** supporting 2a, 2b, 3a format
- **Page continuation preview** showing the first section of the next folio

### 🧭 Intelligent Navigation
- **Hierarchical structure**: Work → Tractate → Chapter → Folio
- **Interactive breadcrumb navigation** with dropdown selectors
- **Mobile-optimized hamburger menu** for tractate and chapter selection
- **Section-by-section navigation** within individual folios
- **Previous/Next controls** understanding Talmudic folio patterns

### 📖 Study & Reference Tools

#### Dictionary/Lexicon
- **Full Jastrow Dictionary integration** via Sefaria API
- **Search functionality** with intelligent autosuggest
- **Browse by Hebrew letter** for systematic exploration
- **Hyperlinked cross-references** to related entries and primary texts

#### Biblical Index
- **Comprehensive biblical citation index** organized by book
- **Maps biblical verses** to their Talmudic locations
- **Browse by biblical book** (Torah, Prophets, Writings)
- **Direct links** to relevant Talmud passages

#### Topic Outlines
- **Structured outlines** showing key discussions and debates
- **Topic-based organization** for better conceptual understanding
- **Chapter-level summaries** (expanding coverage)

#### Blog Post Integration
- **"Talmud & Tech" blog integration** linked to specific Talmudic locations
- **Searchable and filterable** table of articles
- **External analysis and commentary** from modern perspectives

### 🎨 Advanced Text Processing
- **Intelligent highlighting system** with 5,385+ terms across multiple gazetteers:
  - Concepts and ideas
  - Personal and place names
  - Biblical references
  - Talmudic toponyms
- **Smart paragraph splitting** for improved readability
- **Proper RTL support** for Hebrew text
- **Section markers** for navigating complex passages

### ⚙️ Customizable Experience
- **Text size controls** (5 levels: extra-small to extra-large)
- **Hebrew font selection** (7 options: Calibri, Times, Frank Ruehl, Noto Sans Hebrew, Noto Serif Hebrew, Assistant, David Libre)
- **Theme switching** (light/dark mode with sepia palette)
- **Layout preferences** (side-by-side vs. stacked bilingual display)
- **Highlighting toggles** (enable/disable by category)
- **Persistent settings** saved to browser localStorage

### 🔍 Discovery Features
- **Suggested Pages**: Curated list of 20+ famous Talmudic passages (Hillel's Golden Rule, Hannah's Prayer, "Who is wise?", etc.)
- **Tractate Contents**: Visual grid showing all chapters and folio ranges
- **Traditional Seder organization**: 6 major divisions (Zeraim, Moed, Nashim, Nezikin, Kodashim, Tohorot)

### 🌐 SEO & Accessibility
- **Server-side meta tag injection** for search engine crawlers
- **XML sitemaps** (per-Seder and main site)
- **Responsive design** from mobile to desktop
- **Semantic HTML** with proper heading hierarchy
- **Keyboard navigation** support

## Pages & Routes

### Main Study Pages
| Page | Route | Description |
|------|-------|-------------|
| **Home/Contents** | `/` or `/contents` | Landing page showing all 37 tractates organized by traditional Seder |
| **Tractate Contents** | `/contents/:tractate` | Grid view of all chapters and folios for a specific tractate |
| **Tractate View** | `/tractate/:tractate/:folio` | Core reading page with bilingual text and full navigation |
| **Chapter Outline** | `/outline/:tractate/:chapter` | Topic-based outline of key discussions within a chapter |

### Discovery & Reference
| Page | Route | Description |
|------|-------|-------------|
| **Suggested Pages** | `/suggested-pages` | Curated list of famous and essential Talmudic passages |
| **Biblical Index** | `/biblical-index` | Complete index of biblical citations in the Talmud |
| **Biblical Book** | `/biblical-index/book/:bookName` | All citations from a specific biblical book |
| **Dictionary** | `/dictionary` | Full Jastrow Dictionary with search and browse capabilities |
| **Blog Posts** | `/blog-posts` | "Talmud & Tech" articles mapped to Talmudic locations |

### Information Pages
| Page | Route | Description |
|------|-------|-------------|
| **About** | `/about` | Project information and philosophy |
| **Contact** | `/contact` | Contact form and feedback channel |
| **Sitemap** | `/sitemap` | Human-readable hierarchical sitemap with statistics |
| **Privacy** | `/privacy` | Privacy policy and data handling information |
| **Changelog** | `/changelog` | Version history and feature updates |

## Technology Stack

### Frontend
- **React 18** - Component-based UI framework
- **TypeScript** - Type-safe development
- **Vite** - Fast development server and optimized builds
- **Tailwind CSS** - Utility-first styling with custom design system
- **shadcn/ui** - Accessible component library built on Radix UI
- **TanStack Query** (React Query) - Server state management and caching
- **Wouter** - Lightweight client-side routing
- **Framer Motion** - Animation library
- **next-themes** - Theme management
- **Lucide React** - Icon system

### Backend
- **Node.js** with **Express.js** - HTTP server
- **TypeScript** - End-to-end type safety
- **Drizzle ORM** - Type-safe database access
- **PostgreSQL** (Neon) - Serverless database
- **express-session** - Session management
- **Passport.js** - Authentication framework (ready for user accounts)

### Infrastructure & APIs
- **Sefaria API** - Primary text source and dictionary
- **Google Analytics** - Usage tracking and insights
- **Service Worker** - PWA support with offline capability
- **GitHub** - Gazetteer data hosting

## Getting Started

### Prerequisites
- Node.js 18 or higher
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/chavrutai.git
   cd chavrutai
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables** (optional for full functionality)
   ```bash
   VITE_GA_MEASUREMENT_ID=your-google-analytics-id
   DATABASE_URL=your-postgresql-connection-string
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

The application will be available at `http://localhost:5000`

### Building for Production

```bash
npm run build
npm start
```

## Project Structure

```
ChavrutAI/
├── client/                     # React frontend application
│   ├── public/                # Static assets, favicons, service worker
│   └── src/
│       ├── pages/             # 16 application pages
│       ├── components/        # 60+ reusable components
│       │   ├── ui/           # 54 shadcn/ui components
│       │   ├── navigation/   # Navigation components
│       │   ├── text/         # Text display components
│       │   ├── seo/          # SEO optimization
│       │   └── ...
│       ├── lib/              # Utilities and services
│       ├── hooks/            # Custom React hooks
│       ├── context/          # React context providers
│       ├── types/            # TypeScript definitions
│       └── data/             # Static data files
│
├── server/                    # Express.js backend
│   ├── index.ts              # Server entry point
│   ├── routes.ts             # Main API routes
│   ├── routes/               # Additional route handlers
│   └── storage.ts            # Database layer & Sefaria integration
│
├── shared/                    # Shared types and schemas
│   ├── schema.ts             # Database schemas
│   └── tractates.ts          # Tractate metadata
│
├── talmud-data/              # Reference data (JSON)
│   ├── chapters/             # Chapter metadata
│   ├── outlines/             # Topic outlines
│   └── biblical-index/       # Biblical citation mappings
│
└── tests/                    # Data integrity tests
```

## API Endpoints

### Text & Study
- `GET /api/text` - Fetch text for a specific folio
- `GET /api/tractates` - List all tractates
- `GET /api/chapters` - Get chapter information for a tractate
- `GET /api/sitemap` - Get sitemap data

### Dictionary
- `GET /api/dictionary/search` - Search dictionary entries
- `GET /api/dictionary/browse` - Browse entries by Hebrew letter
- `GET /api/dictionary/autosuggest` - Autocomplete suggestions

### SEO
- `GET /sitemap.xml` - XML sitemap index
- `GET /sitemap-main.xml` - Main pages sitemap
- `GET /sitemap-seder-*.xml` - Per-Seder XML sitemaps

## Data Sources

1. **Sefaria API** - Primary text source for bilingual Talmud content
2. **Local JSON files** - Chapter metadata, outlines, biblical index
3. **GitHub-hosted gazetteers** - 5,385+ highlighted terms (concepts, names, places)
4. **Jastrow Dictionary** - Via Sefaria's dictionary API

## Key Features in Detail

### Navigation System
The app provides intuitive navigation through the complex structure of the Talmud:
- **Contents pages** organized by traditional Seder (order) structure
- **Breadcrumb navigation** showing current location with dropdown selectors
- **Page controls** that understand Talmudic folio numbering (2a → 2b → 3a)
- **Mobile hamburger menu** for quick tractate and chapter switching

### Text Display & Processing
- **Bilingual presentation** with Hebrew and English side-by-side or stacked
- **Responsive stacking** on mobile (Hebrew first, maintaining traditional reading order)
- **Smart text processing** splits long paragraphs for better readability
- **Section markers** help navigate within complex folios
- **Page continuation** shows a preview of the next folio's opening

### Highlighting System
Powered by comprehensive gazetteers (5,385+ terms):
- **Concepts** - Talmudic ideas and technical terms
- **Names** - People and places
- **Biblical references** - Verses and biblical figures
- **Customizable** - Toggle highlighting categories on/off

### User Preferences
All settings persist in browser localStorage:
- 5 text size levels
- 7 Hebrew font choices
- Light/dark themes
- Side-by-side or stacked layouts
- Individual highlighting toggles

## Development Features

- **Hot Module Replacement** (HMR) for fast development
- **TypeScript** throughout for type safety
- **ESLint** for code quality
- **Tailwind CSS** with custom configuration
- **Component-driven** architecture
- **PWA-ready** with service worker support

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile browsers (iOS Safari, Chrome Mobile)
- Progressive enhancement for older browsers

## License

[Your license here]

## Contact

- Email: ezra@chavrutai.com
- GitHub: [Your GitHub URL]

## Acknowledgments

- **Sefaria** for providing the Talmud text and API
- **Jastrow Dictionary** for lexicon integration
- **shadcn/ui** for accessible component patterns
- The open-source community for excellent tooling

---

Built with dedication to making Talmud study more accessible and engaging for all learners.

## Key Statistics

| Metric | Count |
|--------|-------|
| Total Pages | 16 |
| API Endpoints | 10 |
| UI Components | 60+ |
| Tractates | 37 |
| Folio Pages | 5,400+ |
| Dictionary Terms | 5,385+ |
| Hebrew Fonts | 7 |
| Text Sizes | 5 |
