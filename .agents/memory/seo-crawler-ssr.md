---
name: SEO crawler SSR for the chavrutai frontend
description: Why the frontend artifact runs a small Node server (not static) in production, and the SSRF rule for its internal enhancement call.
---

# Per-page SEO meta for crawlers

A purely static-served SPA has no server to inject per-page `<title>`/description/OG/
canonical/JSON-LD, so every route ships the `index.html` shell's homepage meta to
crawlers and link-preview bots. This is the regression a static-serve migration
introduces.

**Fix shape (in use):** the `chavrutai` frontend artifact runs a small Express
server in production (`src/server/index.ts`, bundled by `build.mjs` to
`dist/index.mjs`; `artifact.toml` production uses `build`+`run`, not `serve="static"`).
For crawler user-agents only, it injects per-page meta via the shared pure
`getPageSEO`, then optionally fetches JSON-LD + a crawler body from the api-server
(`GET /api/seo/enhance?path=`) with a short timeout and graceful null fallback.
Human visitors fall through to the unchanged static SPA shell.

**Why a cross-artifact HTTP call, not an import:** leaf artifacts must not import
each other in this monorepo, so the frontend reaches the api-server over HTTP.

**SSRF rule (important):** the internal enhancement fetch destination must be a
FIXED base URL (env/`NODE_ENV`-derived), NEVER built from inbound `Host` /
`X-Forwarded-Proto`. Deriving the target from request headers is a host-header
SSRF primitive. Canonical/OG base URL is likewise fixed, not header-derived.

**Why:** code review flagged the header-derived target as a serious SSRF risk;
fixed-base routing closes it while keeping graceful degradation.

**Enhancement cache rule:** Cache and coalesce crawler enhancement calls in the
frontend production server, before the cross-artifact HTTP boundary. Normalize
keys by dropping tracking parameters while retaining only query parameters that
change SEO output. Do not cache upstream failures.

**Why:** API-side caching saves computation but not metered internal requests;
failure caching would also prolong missing crawler enrichment after recovery.

**How to apply:** Keep the cache bounded and expiring, expose hit/miss/coalesced
outcomes through web request telemetry, and update the SEO-relevant query
allowlist whenever a route gains query-dependent metadata.
