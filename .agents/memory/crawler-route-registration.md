---
name: Crawler route registration
description: Crawler HTML for SPA routes requires explicit per-path registration in the api-server, not just body-content branches.
---

Adding a branch to the crawler body-content generator is not enough for direct bot hits: the api-server registers `servePageWithMeta` per explicit path in its route registration file, so any new SPA route also needs an `app.get('<path>', servePageWithMeta)` entry there. (The production web server's `/api/seo/enhance` path works for any pathname regardless.)

**Why:** dictionary headword and biblical-index book routes silently returned "Cannot GET" to crawlers despite having body-content branches — the routes were never registered.

**How to apply:** when adding crawler content for a new route, update both the body-content generator and the per-path registrations, then curl with a Googlebot UA to confirm a 200 with `crawler-content`.

Also: in dev the api-server runs its esbuild bundle from `dist/`, so `import.meta.dirname`-relative paths written for `src/` locations resolve wrong; resolve static assets by trying multiple candidate paths.
