---
name: API server cwd-dependent file reads
description: Why runtime data-file reads in api-server must anchor to import.meta.dirname, not process.cwd()
---

# Runtime file reads must anchor to the bundle, not the cwd

Any runtime `fs` read in `artifacts/api-server` must build its path from
`import.meta.dirname` (the bundled `dist/` dir), e.g.
`path.join(import.meta.dirname, "..", "public/data/...")` or
`path.join(import.meta.dirname, "..", "src/shared/data/...")`.
Never use `path.join(process.cwd(), ...)`.

**Why:** In **production** the server is launched as
`node artifacts/api-server/dist/index.mjs` from the **workspace root**, so
`process.cwd()` is `/home/runner/workspace`, not `artifacts/api-server`. In
**development** the dev script runs from the package dir, so cwd-based paths
happen to work — the bug is invisible until deploy. A cwd-based read that runs
eagerly at startup (e.g. the chat router constructs `getBlogPostSearch()` which
reads `blog-posts-full.json`) throws, the process dies, port 8080 never opens,
and the deployment health check (`/api/healthz`) fails to publish.

`import.meta.dirname` works in both envs because esbuild bundles everything into
`dist/index.mjs`; at runtime it resolves to that file's real location
(`artifacts/api-server/dist`), and `..` is the artifact root. The whole repo
ships to prod (`.replitignore` only excludes `.local`), so `public/` and `src/`
data files are present at runtime.

**How to apply:** When adding code that reads a data file at runtime (JSON
shapes, glossary, blog archive, sitemaps), prefer a static `import` so esbuild
inlines it; if you must read from disk, anchor to `import.meta.dirname`. After
any such change, sanity-check by running the bundle from the workspace root:
`cd /home/runner/workspace && PORT=xxxx NODE_ENV=production node artifacts/api-server/dist/index.mjs`.
