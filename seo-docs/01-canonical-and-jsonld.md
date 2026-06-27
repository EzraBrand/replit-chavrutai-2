# Issues 1 & 2 — Canonical Tag + JSON-LD Injection

**Priority: CRITICAL**

## Context

ChavrutAI is a React SPA with a server-side meta-injection layer in `server/routes.ts`. When a crawler hits a URL, the Express server intercepts the request, reads `index.html`, injects `<title>`, `<meta>`, `<link rel="canonical">`, and JSON-LD, then serves the modified HTML. For regular users, the browser receives the same injected HTML and React hydrates on top of it.

---

## Issue 1 — Canonical Tag Points to Homepage for All Pages

### What is happening

The raw `index.html` file has a hardcoded `<link rel="canonical" href="https://chavrutai.com/">`. The server-side injection in `routes.ts` is supposed to replace this with the correct per-page canonical, but the report confirms it is **not working** for every route. When Google's HTML-only crawl pass hits `/talmud/berakhot/2a`, it reads the homepage canonical and treats the page as a duplicate of `/`.

This is the highest-risk item. If Google is already de-indexing inner pages, ranking recovery could take weeks even after the fix is shipped.

### Diagnosis steps

1. `curl -A "Googlebot" https://chavrutai.com/talmud/berakhot/2a | grep canonical` — check what the server actually sends.
2. Review `server/routes.ts` to confirm which routes have canonical injection and which do not. Look for gaps (e.g., Bible routes, dictionary, blog posts).
3. Check whether the fallback branch in the route handler returns the unmodified `index.html` (with the hardcoded canonical) instead of the injected version.

### Fix

In `server/routes.ts`, audit every catch-all / fallback path that serves `index.html`. For **any** route that does not have an explicit SEO handler yet, add a minimal injection block that at minimum:

- Sets `<title>` to a page-specific value.
- Sets `<meta name="description">` to a page-specific value.
- Replaces `<link rel="canonical">` with the correct absolute URL for that route.

The canonical replacement must use a **string replace** against the raw HTML string before sending — the same pattern already used for other tags in `routes.ts`. Confirm the replace target matches exactly what is in `index.html`.

**Routes to audit for missing or broken canonical injection:**
- `/talmud` (tractate list)
- `/talmud/:tractate` (per-tractate contents)
- `/talmud/:tractate/:folio` (folio pages — highest volume, ~5,400 pages)
- `/bible`, `/bible/:book`, `/bible/:book/:chapter`
- `/dictionary`
- `/biblical-index`, `/mishnah-map`, `/sugya-viewer`
- `/about`, `/contact`, `/privacy`, `/changelog`, `/blog-posts`

**Verification:** After deploying, run `curl -A "Googlebot"` against a sample of URLs from each route group and confirm the `<link rel="canonical">` in the raw HTML response matches the requested URL exactly.

---

## Issue 2 — JSON-LD Not Present in Raw HTML

### What is happening

The report shows JSON-LD is absent in the raw HTML on inner pages. The server-side injection either is not running, or the injected script tag is not being detected by the crawler.

### Fix

This is part of the same fix as Issue 1. For every route audited above, verify that `generateServerSideStructuredData()` is being called and that its output is injected as `<script type="application/ld+json">` before `</head>` in the served HTML.

For folio pages specifically, the JSON-LD should include:
- A `BreadcrumbList` (see `02-breadcrumbs.md` — can be added at the same time).
- A `Book` or `Article` node identifying the tractate/folio.
- The `WebPage` and `WebSite` nodes already present in the homepage handler.

---

## Verification (Steps 1 & 2)

Run these `curl` checks against live URLs after deploying:

```bash
# Check canonical is page-specific (not homepage)
curl -sA "Googlebot" https://chavrutai.com/talmud/berakhot/2a | grep canonical
# Expected: <link rel="canonical" href="https://chavrutai.com/talmud/berakhot/2a" />

# Check JSON-LD is present in raw HTML
curl -sA "Googlebot" https://chavrutai.com/talmud/berakhot/2a | grep "application/ld+json"
# Expected: non-empty result

# Spot-check other routes
curl -sA "Googlebot" https://chavrutai.com/talmud | grep canonical
curl -sA "Googlebot" https://chavrutai.com/dictionary | grep canonical
curl -sA "Googlebot" https://chavrutai.com/bible/genesis/1 | grep canonical
curl -sA "Googlebot" https://chavrutai.com/about | grep canonical
```

- [ ] `/talmud/berakhot/2a` canonical matches URL
- [ ] `/talmud/berakhot/2a` JSON-LD is present in raw HTML
- [ ] JSON-LD `@graph` includes `WebPage`, `WebSite`, and `Organization` nodes
- [ ] Same canonical checks pass for `/talmud`, `/dictionary`, `/bible/genesis/1`, `/about`
