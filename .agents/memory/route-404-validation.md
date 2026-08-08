---
name: Server-side 404 route validation
description: Servers 404 any URL a shared route allowlist rejects; new SPA routes/content must be registered there or production 404s them.
---

Both servers consult a shared route validator and return HTTP 404 + noindex for any path it rejects (fixes Search Console soft-404s).

**Why:** the SPA fallback used to return HTTP 200 for every URL, so invalid tractates/folios/chapters got indexed as soft 404s. Conversely, a route the validator doesn't know about will 404 in production even though the SPA can render it.

**How to apply:** when adding a new client route or new content availability (e.g. a new chapter outline), update the shared validator in lockstep. Be strict only for params checkable against local data; be lenient for remotely-validated params — a false 200 is much cheaper than a false 404. Legacy redirect paths must stay "known" so redirects can run. Crawler enrichment is best-effort: failures must degrade to a 200 shell with core meta, never a 5xx.
