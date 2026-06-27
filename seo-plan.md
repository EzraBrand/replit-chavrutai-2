# ChavrutAI SEO Remediation Plan

## Context

ChavrutAI is a React SPA with a server-side meta-injection layer in `server/routes.ts`. When a crawler hits a URL, the Express server intercepts the request, reads `index.html`, injects `<title>`, `<meta>`, `<link rel="canonical">`, and JSON-LD, then serves the modified HTML. For regular users, the browser receives the same injected HTML and React hydrates on top of it.

The SEO report identifies four issues. This plan addresses each one in priority order.

---

## Issue 1 — CRITICAL: Canonical Tag Points to Homepage for All Pages

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

## Issue 2 — CRITICAL (related): JSON-LD Not Present in Raw HTML

### What is happening

The report shows JSON-LD is absent in the raw HTML on inner pages. The server-side injection either is not running, or the injected script tag is not being detected by the crawler.

### Fix

This is part of the same fix as Issue 1. For every route audited above, verify that `generateServerSideStructuredData()` is being called and that its output is injected as `<script type="application/ld+json">` before `</head>` in the served HTML.

For folio pages specifically, the JSON-LD should include:
- A `BreadcrumbList` (see Issue 2 below — can be added at the same time).
- A `Book` or `Article` node identifying the tractate/folio.
- The `WebPage` and `WebSite` nodes already present in the homepage handler.

---

## Issue 3 — HIGH: No Breadcrumbs

### What is happening

The site has a four-level hierarchy (Seder > Tractate > Chapter > Folio) but no breadcrumb navigation in the UI and no `BreadcrumbList` schema in JSON-LD. Google can show breadcrumbs as rich snippets in search results, improving click-through rate.

### Fix (two parts)

**Part A — UI breadcrumb component**

Add a `<Breadcrumb>` component (using the existing shadcn breadcrumb primitive if available, otherwise a simple `nav > ol > li` chain) to the following pages:

- `TractateView` (`/talmud/:tractate/:folio`): Home > Talmud > [Tractate] > [Folio]
- Tractate contents (`/talmud/:tractate`): Home > Talmud > [Tractate]
- Bible chapter (`/bible/:book/:chapter`): Home > Bible > [Book] > Chapter [N]
- Bible book (`/bible/:book`): Home > Bible > [Book]

**Part B — BreadcrumbList JSON-LD (server-side)**

Inside `generateServerSideStructuredData()` in `server/routes.ts`, add a `BreadcrumbList` node for each route that has a breadcrumb trail. Example for a folio page:

```json
{
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://chavrutai.com/" },
    { "@type": "ListItem", "position": 2, "name": "Talmud", "item": "https://chavrutai.com/talmud" },
    { "@type": "ListItem", "position": 3, "name": "Berakhot", "item": "https://chavrutai.com/talmud/berakhot" },
    { "@type": "ListItem", "position": 4, "name": "Berakhot 2a", "item": "https://chavrutai.com/talmud/berakhot/2a" }
  ]
}
```

This is additive — include this node in the `@graph` array alongside the existing `WebPage` and `Organization` nodes.

---

## Issue 4 — MEDIUM: Dictionary Page Missing H1

### What is happening

`/dictionary` has a `<title>` and `<meta name="description">` but no `<h1>`. Google uses the H1 as a strong relevance signal for the page topic.

### Fix

In the Dictionary page component (`client/src/pages/dictionary.tsx` or similar), add an `<h1>` tag at the top of the visible page content. The text should match the page intent, e.g. `Jastrow Talmudic Dictionary` or `Aramaic & Hebrew Dictionary`. Style it with Tailwind to match the existing visual hierarchy (likely `text-3xl font-bold` or similar used on other pages).

---

## Issue 5 — MEDIUM: High Outbound Link Ratio on Folio Pages

### What is happening

Folio pages (e.g., Berakhot 2a) have 37 external links to Sefaria and Al HaTorah vs. 14 internal links. External links without `rel` attributes pass "link equity" outward.

### Fix

In the component that renders per-section external study links (Sefaria / Al HaTorah links on folio pages), add `rel="nofollow noopener noreferrer"` to each external anchor tag. This signals to Google not to follow those links for ranking purposes, while still opening them safely for users.

Additionally, consider increasing internal linking on folio pages:
- Link the tractate name in the page header to `/talmud/:tractate`.
- Add "Previous folio" / "Next folio" navigation links if not already present (these also improve user experience).

---

## Suggested Implementation Order

| Step | Issue | Effort | Impact |
|------|-------|--------|--------|
| 1 | Audit and fix canonical injection for all routes | Medium | Critical |
| 2 | Verify + complete JSON-LD injection for all routes | Low (same pass) | Critical |
| 3 | Add BreadcrumbList JSON-LD server-side | Medium | High |
| 4 | Add UI breadcrumb component to deep pages | Low-Medium | High |
| 5 | Add H1 to Dictionary page | Very Low | Medium |
| 6 | Add `rel="nofollow noopener"` to external study links | Very Low | Medium |
| 7 | Add prev/next folio internal links | Low | Medium |

Steps 1 and 2 should be shipped first and verified with `curl` before moving on, since they carry the highest risk of ongoing indexing damage.

---

## Verification Checklist (post-deploy)

- [ ] `curl -A "Googlebot" https://chavrutai.com/talmud/berakhot/2a | grep canonical` returns `https://chavrutai.com/talmud/berakhot/2a`
- [ ] Same check for `/talmud`, `/dictionary`, `/bible/genesis/1`, `/about`
- [ ] `curl -A "Googlebot" https://chavrutai.com/talmud/berakhot/2a | grep "application/ld+json"` returns a non-empty result
- [ ] JSON-LD contains a `BreadcrumbList` node on folio and tractate pages
- [ ] `/dictionary` page has a visible `<h1>` in the rendered HTML
- [ ] Folio page external links have `rel="nofollow noopener noreferrer"`
- [ ] Google Search Console: request re-indexing for a sample of inner pages after fixes are live
