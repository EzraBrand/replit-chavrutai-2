# ChavrutAI

ChavrutAI is a Jewish text study platform offering bilingual Hebrew-English access to the Babylonian Talmud, Jerusalem Talmud (Yerushalmi), Mishnah, Mishneh Torah (Rambam), Tanakh (Bible), the Jastrow and BDB dictionaries, scholarship works, search, and a study feed. Text is sourced live from the Sefaria API.

## User Preferences

- Communication style: Simple, everyday language.

## After Every Major Update

1. **Changelog** — add an entry to `artifacts/chavrutai/src/pages/changelog.tsx` (date + short description).
2. **X/Twitter** — draft a suggested tweet for the user to post on [@ChavrutAI](https://x.com/ChavrutAI).

## Design Principles

ChavrutAI is a **scholarly study platform**, not a consumer app. The design must reflect this:

- **No icons in content areas.** Avoid decorative icons, emoji, or icon-heavy UI. Let typography and whitespace do the work. Icons are acceptable only for functional controls (e.g., navigation arrows, close buttons).
- **No bright or splashy colors.** The palette is muted and warm: sepia tones, browns, slate blues, and cream backgrounds. Avoid saturated blues, greens, ambers, or any "startup" color palette.
- **Scholarly, serious tone.** Think academic journal or high-quality library interface, not SaaS dashboard. The UI should feel quiet and focused.
- **Typography-first.** The hierarchy comes from font weight, size, and spacing — not from colored badges, cards with shadows, or decorative elements.
- **Highlighting is subtle.** Term highlighting (concepts, names, places) uses very light background tints, not bold colored badges or pills.
- **Warm, paper-like feel.** The app's default theme uses cream/parchment backgrounds (`hsl(28, 37%, 94%)`), thin sepia borders, and brown accent text.
- **Original vision reference.** The user's original mockups (see blog post at ezrabrand.com) show top-level tabs on the Talmud page: "Text & Translation", "Summaries & Key Terms", "Broader Analysis". New features should follow this tab-based pattern rather than inventing new UI paradigms.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server
- `pnpm --filter @workspace/chavrutai run dev` — run the web frontend (use the workflow, not this directly)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

Workflows: `artifacts/api-server: API Server` (backend) and `artifacts/chavrutai: web` (frontend). Restart these rather than running pnpm dev directly.

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5 (legacy `registerRoutes` orchestrator)
- Frontend: React + Vite 7 + Wouter + TanStack Query + Tailwind v3 (via postcss)
- DB: PostgreSQL + Drizzle ORM
- Text source: Sefaria public API

## Where things live

- `artifacts/api-server/` — Express backend. `src/register-routes.ts` is the main route orchestrator; `src/routes/*` hold per-section routers (talmud, mishnah, yerushalmi, rambam, bible, jastrow, bdb, chat, search, feed, scholarship, seo, sitemaps).
- `artifacts/chavrutai/` — React frontend. `src/App.tsx` is the entry with all Wouter routes; `src/pages/*` are the page components; `src/lib/*` holds data loaders.
- `artifacts/*/src/shared/` — shared utilities (tractates, bible-books, rambam-data, yerushalmi-data, schema, text-processing). Copied into BOTH the api-server and chavrutai trees.
- `lib/db/src/schema/` — Drizzle DB table definitions (source of truth for DB tables).
- `talmud-data/` (workspace root) — static JSON data (chapters, outlines, biblical-index). Must live at the workspace root because the frontend imports it via relative paths `../../../../talmud-data/`.
- `artifacts/api-server/public/data/blog-posts-full.json` — blog post data read at runtime.

## Architecture decisions

- The legacy backend's `registerRoutes(app)` mounts all routes directly on the Express app, and each route path already carries its own prefix (`/api/...`, `/talmud/...`, etc.). It is wired in `index.ts` and must NOT be mounted under `app.use("/api", ...)` — doing so produces `/api/api/...` and 404s. `app.ts` only mounts the scaffold health route.
- `src/shared/schema.ts` keeps only the pure Zod schemas. The Drizzle table definitions were removed because the tables already live in `@workspace/db`; re-declaring them pulled in `drizzle-zod` (not installed) and duplicated the DB schema.
- The Mishnah section only contains Mishnah-*only* tractates (Peah, Demai, etc.). Tractates with Gemara (e.g. Berakhot) are shown under Talmud, so `/mishnah/berakhot` is intentionally a 404.
- Yerushalmi pages use a combined `chapterHalakhah` URL segment (e.g. `/yerushalmi/berakhot/1.1`), not a bare chapter.

## Gotchas

- `talmud-data/` is NOT copied by the standard migration copy scripts — it must be placed at the workspace root manually, or the frontend chapter/outline data silently fails to load (chapter grids and outlines go empty).
- Express 5 wildcard routes must use `{*path}` syntax, not bare `*`.

## External APIs

- **Sefaria** — primary text source (Talmud, Bible, Mishnah, Yerushalmi, Rambam, dictionaries).
- **OpenRouter** — Claude AI chat.
- **PostHog** — analytics.
- **talmud-nlp-indexer** (GitHub) — gazetteer for term highlighting (fetched at runtime; degrades gracefully if unavailable).

## Social / Identity Links (sameAs)

Keep these consistent in `structured-data.tsx` and `use-seo.ts`:
- `https://github.com/EzraBrand/chavrutai`
- `https://www.ezrabrand.com/`
- `https://x.com/ChavrutAI`

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
