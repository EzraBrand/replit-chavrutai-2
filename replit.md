# ChavrutAI

Jewish text study platform: bilingual Hebrew-English access to Talmud (Bavli & Yerushalmi), Mishnah, Mishneh Torah, Tanakh, dictionaries, and scholarship works. Texts sourced live from the Sefaria API.

## ALWAYS: Document Changes in the Changelog

After every change, add an entry to `artifacts/chavrutai/src/pages/changelog.tsx` (date + short, user-facing description) — **unless** the change is likely important to keep private (e.g., security fixes, secrets handling, internal-only details). Also draft a suggested tweet for [@ChavrutAI](https://x.com/ChavrutAI) after major updates.

## User Preferences

- Communication style: Simple, everyday language.

## Design

Scholarly, quiet, typography-first — no decorative icons, no bright colors, no card/shadow clutter. Muted sepia/cream/navy palette. See `artifacts/chavrutai/DESIGN.md` (ParchmentScholar) for details.

## Recent Major Changes (mid-2026)

Four big changes landed in quick succession; see `PROJECT-REVIEW-2026-08.md` for the full health review:
- **pnpm monorepo migration** — shared code now lives in `lib/*` packages (`@workspace/text-processing`, `@workspace/shared-data`); no more duplicated modules between web and API server.
- **Rebrand: ChavrutAI → Bekiut** — canonical domain is bekiut.com; chavrutai.com 301-redirects. Twitter handle stays @ChavrutAI intentionally.
- **ParchmentScholar redesign** — all pages use the shared `PageShell` layout.
- **Replit workspace tasks/board workflow** — work merges in via project tasks.

Two habits that prevent recurring issues:
1. **Sequence related tasks with explicit dependencies** instead of running them in parallel when they touch the same files (parallel tasks have partly redone each other's work).
2. **After a task merge, if the preview is down, suspect a port collision first** — stale processes from before the merge can hold ports (post-merge cleanup + API-server listen retry now mitigate this; a workflow restart fixes the rest).

## Crucial Gotchas

- Backend `registerRoutes(app)` mounts routes with their own prefixes; never wrap it in `app.use("/api", ...)`.
- `talmud-data/` must live at the workspace root or chapter/outline data silently fails to load.
- Restart the workflows (`artifacts/api-server: API Server`, `artifacts/chavrutai: web`) instead of running pnpm dev directly.
