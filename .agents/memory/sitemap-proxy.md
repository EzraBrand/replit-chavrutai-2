---
name: Sitemap proxy routing
description: Why root-level crawler files (sitemap*.xml) need /api aliases on the api-server and proxy routes on the web server.
---
The shared proxy forwards to the api-server with the `/api` prefix intact, so any api-server route registered at a root path (e.g. `/sitemap.xml`) is unreachable from the domain — the web artifact answers root paths.

**Why:** production `/sitemap.xml` 404'd because generators only existed as root routes on the api-server.

**How to apply:** for any crawler-facing root file served by the api-server, register both the root path and an `/api`-prefixed alias on the api-server, then proxy the root path from the chavrutai server (express in prod, a Vite `configureServer` middleware in dev) using the FIXED base URL pattern (never inbound Host). On upstream failure return 503, never the SPA HTML shell.
