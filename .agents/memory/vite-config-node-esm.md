---
name: vite.config runs under plain Node ESM
description: Why workspace TS imports fail in vite.config and how to load shared TS modules in dev middleware
---

Vite bundles vite.config.ts itself but externalizes workspace deps, so a top-level import of a `@workspace/*` TS module with extensionless internal imports crashes config load with ERR_MODULE_NOT_FOUND.

**Why:** Node's ESM resolver (not Vite's pipeline) resolves the externalized package, and it can't handle extensionless `.ts` import chains.

**How to apply:** Inside dev-server middleware, lazy-load shared TS via `await server.ssrLoadModule("@workspace/...")` (wrap in try/catch) instead of importing at the top of vite.config. Also note chavrutai builds require PORT and BASE_PATH env vars even for `vite build`.
