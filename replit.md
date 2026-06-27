# ChavrutAI - Digital Talmud Study Platform

## ⚠️ After Every Major Update

1. **Changelog** — add an entry to `client/src/pages/changelog.tsx` (date + short description).
2. **X/Twitter** — draft a suggested tweet for the user to post on [@ChavrutAI](https://x.com/ChavrutAI).

## Do Not Modify

- `server/vite.ts` and `vite.config.ts` — Vite setup, handles frontend/backend on same port
- `drizzle.config.ts` — DB config
- `package.json` — use packager tool for deps; ask before editing scripts

---

## User Preferences

- Communication style: Simple, everyday language.

## Design Principles

ChavrutAI is a **scholarly study platform**, not a consumer app. The design must reflect this:

- **No icons in content areas.** Avoid decorative icons, emoji, or icon-heavy UI. Let typography and whitespace do the work. Icons are acceptable only for functional controls (e.g., navigation arrows, close buttons).
- **No bright or splashy colors.** The palette is muted and warm: sepia tones, browns, slate blues, and cream backgrounds. Avoid saturated blues, greens, ambers, or any "startup" color palette.
- **Scholarly, serious tone.** Think academic journal or high-quality library interface, not SaaS dashboard. The UI should feel quiet and focused.
- **Typography-first.** The hierarchy comes from font weight, size, and spacing — not from colored badges, cards with shadows, or decorative elements.
- **Highlighting is subtle.** Term highlighting (concepts, names, places) uses very light background tints, not bold colored badges or pills.
- **Warm, paper-like feel.** The app's default theme uses cream/parchment backgrounds (`hsl(28, 37%, 94%)`), thin sepia borders, and brown accent text.
- **Original vision reference.** The user's original mockups (see blog post at ezrabrand.com) show top-level tabs on the Talmud page: "Text & Translation", "Summaries & Key Terms", "Broader Analysis". New features should follow this tab-based pattern rather than inventing new UI paradigms.

## Tech Stack

- **Frontend:** React 18 + TypeScript, Vite, Wouter, Tailwind CSS + shadcn/ui
- **State:** TanStack Query, React Context (user preferences)
- **Backend:** Express.js, Drizzle ORM + PostgreSQL (Neon), in-memory storage layer
- **Analytics:** PostHog
- **AI Chat:** Vercel AI SDK v6 + Claude via OpenRouter (`@openrouter/ai-sdk-provider`)
- **Email:** SendGrid / Google Mail (integrations installed)

## Yerushalmi (Jerusalem Talmud) Reader

Per-halakhah pages (not per-chapter). Routes:
- `/yerushalmi` — contents page
- `/yerushalmi/:tractate` — tractate TOC (chapter list with halakhah counts)
- `/yerushalmi/:tractate/:chapter.:halakhah` — single-halakhah reader (e.g. `/yerushalmi/Chagigah/2.1`)
- Section anchors are segment numbers: `#3`. Legacy `/yerushalmi/T/C` redirects (301) to `/yerushalmi/T/C.1`; legacy `#H-S` hashes are translated client-side.

Prev/Next walks halakhah-by-halakhah and crosses chapter boundaries (uses `shared/data/yerushalmi-shapes.json` for halakhah counts per chapter). Header format: "Chapter X · Halakhah Y".

Key files: `client/src/pages/yerushalmi-halakhah.tsx`, `client/src/pages/yerushalmi-tractate.tsx`, `shared/yerushalmi-data.ts` (incl. `parseChapterHalakhah`), `server/routes/yerushalmi.ts` (`/api/yerushalmi/:tractate/:chapter/:halakhah` endpoint), `server/routes/sitemap-yerushalmi.ts`.

## Mishnah Reader

Standalone bilingual reader for **26 Mishnah tractates** not covered by Talmud Bavli. Routes:
- `/mishnah` — contents page (all tractates by Seder)
- `/mishnah/:tractate` — chapter TOC with mishnah counts
- `/mishnah/:tractate/:chapter` — bilingual chapter reader (50/50 columns)
- `/mishnah-map` — Mishnah-to-Talmud mapping

Key files: `shared/tractates.ts` (MISHNAH_ONLY_TRACTATES, URL normalization), `client/src/pages/mishnah-*.tsx`, `client/src/lib/text-processing.ts` (processMishnahHebrewText, processMishnahEnglishText). API endpoints in `server/routes.ts` fetch from Sefaria's public API with in-memory caching.

## Project Structure

```
client/src/
  pages/       — route pages (tractate-view, bible-chapter, mishnah-*, search, etc.)
  components/  — UI components (text/, navigation/, bible/, outline/)
  hooks/       — use-seo, use-chat, use-mobile
  lib/         — text-processing, gazetteer, analytics
  context/     — preferences (theme, font, layout)
server/
  routes.ts    — slim orchestrator (~220 lines): imports route modules, registers middleware & mounts routers
  routes/      — domain-focused route modules:
    seo.ts       — crawler detection, meta tags, structured data, servePageWithMeta (~1,356 lines)
    talmud.ts    — /api/text, /api/tractates, /api/chapters, /api/sefaria-fetch
    mishnah.ts   — /api/mishnah/* (tractates, info, chapter text)
    yerushalmi.ts— /api/yerushalmi/* (tractates, info, chapter text, shapes)
    rambam.ts    — /api/rambam/* (info, chapter text)
    bible.ts     — /api/bible/* (books, chapters, text)
    dictionary.ts— /api/dictionary/* (search, browse, autosuggest)
    chat.ts      — /api/chat (AI streaming via OpenRouter)
    search.ts    — /api/search/text (full-text search)
    feed.ts      — /api/rss-feed, /api/rss-feed-full, /api/daf-yomi
    sitemap-*.ts — XML sitemap generators (pre-existing)
  storage.ts   — storage interface + in-memory implementation
shared/
  schema.ts          — Drizzle schema + Zod insert schemas
  text-processing.ts — Hebrew/English text splitting (shared)
  tractates.ts       — Talmud & Mishnah tractate data, URL normalization
  mishnah-map.ts     — Mishnah-to-Talmud mapping data
  talmud-navigation.ts — page validation, prev/next logic
  talmud-data.ts     — tractate metadata, folio ranges, Seder groupings
client/public/
  data/chapters/ — JSON files for 37 tractates
```

## Key Technical Notes

**Crawler content injection:** `server/routes/seo.ts` contains `generateCrawlerBodyContent()` which injects visible semantic HTML (headings, breadcrumbs, descriptions, navigation links, and text excerpts from cache) into the page body for search engine crawlers. This runs inside `servePageWithMeta()` which detects crawler user-agents and serves enriched HTML. Regular browsers get the standard SPA shell. Covers all routes: homepage, talmud index, tractate pages, folio pages, bible pages, and static pages.

**Text mapping:** `server/routes/talmud.ts` fetches Sefaria API; `sefariaData.he` and `sefariaData.text` are parallel arrays mapped into `hebrewSections` / `englishSections`. Rendered in `sectioned-bilingual-display.tsx` by index.

**Reference Panel:** `components/text/reference-panel.tsx` — collapsible panel below the Talmud text with "Bible Verses" and "Key Terms (beta)" tabs. Extracts Bible citations from English text using `BIBLE_CITATION_PATTERN`, fetches verse text from `/api/bible/text`. Key Terms uses gazetteer highlighting data + `/api/glossary` for glossary lookups. Only fetches glossary when highlighting is enabled.

**Text splitting:** `shared/text-processing.ts` — `splitHebrewText()` breaks on punctuation/Mishnah markers; `splitEnglishText()` creates paragraphs by sentence boundaries. Both preserve HTML tags.

## SEO Architecture

**Single source of truth:** `shared/seo-data.ts` — all SEO text (title, description, ogTitle, ogDescription, robots) lives here. Both server and client import from it. Adding or editing SEO for any page means editing only this one file.

Key files:
- `shared/seo-data.ts` — `STATIC_MAP` for 20 static pages + 13 factory functions (`getTalmudFolioSEO`, `getMishnahChapterSEO`, `getBibleChapterSEO`, `getJastrowSEO`, etc.) + `getPageSEO()` dispatch for server
- `client/src/hooks/use-seo.ts` — `useSEO()` DOM hook; `generateSEOData` factories spread from shared + keep `structuredData`
- `server/routes/seo.ts` — `generateServerSideMetaTags()` is now 4 lines (calls `getPageSEO`); also contains `generateCrawlerBodyContent()`, `generateServerSideStructuredData()`, `servePageWithMeta()`
- `client/index.html` — static fallback meta

**When adding a new page:**
1. Add entry to `STATIC_MAP` (or new factory) in `shared/seo-data.ts`
2. Add dispatch branch in `getPageSEO()` in the same file
3. Add `useSEO(getStaticSEO('/path', window.location.origin)!)` in the page component
4. Register route with `app.get('/route', servePageWithMeta)` in `server/routes/seo.ts`

**Title conventions**: All `<title>` tags end with `| ChavrutAI`. `ogTitle` omits the suffix (exception: a few Mishnah/Yerushalmi/Rambam pages where the full name is the brand). Use plain text (no HTML entities).

**`canonical` and `baseUrl`** are never stored in `shared/seo-data.ts` — always passed as a parameter at call time. `structuredData` stays in page components (client-only).

## SEO Live Test Suite

`tests/seo-meta.test.ts` — 347 tests, fetches 38 real pages with a Googlebot user-agent and asserts:
- Every `<title>` ends with `| ChavrutAI`
- Every `<title>` and `og:title` is non-empty and contains no raw HTML entities
- All page titles are unique (no two pages share the same title)
- No non-homepage page uses the generic homepage title
- Page-specific keywords appear in each title
- Query-param pages (`/search?q=`, `/jastrow?letter=`, `/bdb?letter=`) have titles distinct from their base page

Run against local dev server: `SEO_TEST_BASE_URL=http://localhost:5000 npx vitest run tests/seo-meta.test.ts`
Run against production: `npx vitest run tests/seo-meta.test.ts`
Skip when offline: `SKIP_LIVE_SEO_TESTS=1 npx vitest run tests/seo-meta.test.ts`

## Social / Identity Links (sameAs)

Keep these consistent in `structured-data.tsx` and `use-seo.ts`:
- `https://github.com/EzraBrand/chavrutai`
- `https://www.ezrabrand.com/`
- `https://x.com/ChavrutAI`

## Jastrow Dictionary

Modernized presentation of Jastrow's Talmudic dictionary at `/dictionary`. Fetches from Sefaria API, applies client-side text transformations (abbreviation expansion, paragraph splitting, superscript conversion, period+link line breaks). URL params (`?q=`, `?letter=`) support shareable links. See skill at `.agents/skills/jastrow-dictionary/SKILL.md` for full details.

Key files: `client/src/pages/dictionary.tsx`, `client/src/data/jastrow-mappings.json`, `server/storage.ts` (SefariaAPI class).

## External APIs

- **Sefaria** — primary text source (Talmud + Bible)
- **OpenRouter** — Claude AI chat
- **PostHog** — analytics
- **talmud-nlp-indexer** (GitHub) — gazetteer for term highlighting
