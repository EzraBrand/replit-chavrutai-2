# ChavrutAI

Jewish text study platform: bilingual Hebrew-English access to Talmud (Bavli & Yerushalmi), Mishnah, Mishneh Torah, Tanakh, dictionaries, and scholarship works. Texts sourced live from the Sefaria API.

## ALWAYS: Document Changes in the Changelog

After every change, add an entry to `artifacts/chavrutai/src/pages/changelog.tsx` (date + short, user-facing description) — **unless** the change is likely important to keep private (e.g., security fixes, secrets handling, internal-only details). Also draft a suggested tweet for [@ChavrutAI](https://x.com/ChavrutAI) after major updates.

## User Preferences

- Communication style: Simple, everyday language.

## Design

Scholarly, quiet, typography-first — no decorative icons, no bright colors, no card/shadow clutter. Muted sepia/cream/navy palette. See `artifacts/chavrutai/DESIGN.md` (ParchmentScholar) for details.

## Crucial Gotchas

- Backend `registerRoutes(app)` mounts routes with their own prefixes; never wrap it in `app.use("/api", ...)`.
- `talmud-data/` must live at the workspace root or chapter/outline data silently fails to load.
- Restart the workflows (`artifacts/api-server: API Server`, `artifacts/chavrutai: web`) instead of running pnpm dev directly.
