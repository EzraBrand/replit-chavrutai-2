---
name: seo-management
description: Add, modify, or audit SEO meta titles, descriptions, Open Graph tags, structured data, and crawler content for any page in ChavrutAI. Use when adding a new page/route, fixing page titles, updating meta descriptions, or auditing SEO health across the site.
---

# SEO Management

ChavrutAI is a server-side-rendered SPA. SEO data lives in **two places that must stay in sync**:

1. **Client-side** — `useSEO()` hook in each page component (updates `document.title` and meta tags after React hydrates)
2. **Server-side** — `generateServerSideMetaTags()` in `server/routes/seo.ts` (injects meta into HTML for crawlers before JS loads)

Both systems must produce identical titles, descriptions, and OG tags for the same URL. If they diverge, crawlers see one thing and users see another.

## Architecture Overview

### Files involved

| File | Purpose |
|------|---------|
| `client/src/hooks/use-seo.ts` | `useSEO()` hook + `generateSEOData` helpers for common page types |
| `server/routes/seo.ts` | `generateServerSideMetaTags()` — server-side meta for crawlers |
| `server/routes/seo.ts` | `generateServerSideStructuredData()` — JSON-LD for crawlers |
| `server/routes/seo.ts` | `generateCrawlerBodyContent()` — visible HTML body for crawlers |
| `server/routes/seo.ts` | `servePageWithMeta()` — middleware that reads template, injects meta |
| `client/index.html` | Static fallback meta (homepage defaults) |
| `tests/seo-meta.test.ts` | Live test suite (329 tests, 38 pages) |

### How it works

1. A crawler requests a page (e.g., `/jastrow?letter=א`)
2. `servePageWithMeta()` detects the crawler user-agent
3. It calls `generateServerSideMetaTags(req.originalUrl)` which:
   - Parses `pathname` from the URL (stripping query params)
   - Matches pathname against route patterns
   - Returns title, description, ogTitle, ogDescription, canonical, robots
4. The function replaces meta tags in `client/index.html` template using `escapeHtmlAttr()` for all attribute values
5. It also injects JSON-LD and crawler body content

For regular browsers, Vite serves the SPA normally, and `useSEO()` updates meta after React loads.

### Critical: URL parsing

`generateServerSideMetaTags` receives `req.originalUrl` which **includes query parameters**. The function parses `pathname` using `new URL(url, baseUrl).pathname` before route matching. All route comparisons use `pathname`, not the raw URL. This prevents query params from breaking route matching.

### Critical: HTML escaping

`servePageWithMeta()` calls `escapeHtmlAttr()` on **all values** before inserting them into HTML attributes (`content="..."` etc.). Therefore:

- **`seoData` strings must always be plain text** — no HTML entities (`&amp;`, `&quot;`, etc.)
- **Never call `escapeHtmlAttr()` on query params before putting them in seoData** — it would cause double-encoding
- The `<title>` element also gets `escapeHtmlAttr()` applied, so `"` in titles becomes `&quot;` (decoded correctly by browsers)

## Adding SEO to a New Page

When adding a new page/route, you must update **all three layers**:

### Step 1: Client-side `useSEO()` in the page component

```tsx
import { useSEO } from "@/hooks/use-seo";

export default function MyPage() {
  useSEO({
    title: "Page Title | ChavrutAI",
    description: "Page description for search engines.",
    ogTitle: "Page Title",
    ogDescription: "Page description for social sharing.",
    canonical: `${window.location.origin}/my-page`,
    robots: "index, follow",
    structuredData: { /* JSON-LD */ },
  });
  // ...
}
```

### Step 2: Server-side meta in `generateServerSideMetaTags()`

Add a new `else if` branch in `server/routes/seo.ts`:

```ts
} else if (pathname === '/my-page') {
  seoData = {
    title: "Page Title | ChavrutAI",  // MUST match client
    description: "Page description for search engines.",
    ogTitle: "Page Title",            // no | ChavrutAI suffix
    ogDescription: "Page description for social sharing.",
    canonical: `${baseUrl}/my-page`,
    robots: "index, follow"
  };
}
```

### Step 3: Register the route for `servePageWithMeta`

Add the Express route handler near the other `servePageWithMeta` registrations:

```ts
app.get('/my-page', servePageWithMeta);
```

### Step 4 (optional): Crawler body content

For content-heavy pages, add a case in `generateCrawlerBodyContent()` to inject visible text/links for crawlers.

### Step 5 (optional): Structured data

For rich pages, add a case in `generateServerSideStructuredData()` to inject JSON-LD.

## Dynamic Titles (Pages with Query Parameters)

For pages where the title changes based on URL parameters (search, dictionaries, etc.):

**Server-side:** Use `urlObj.searchParams` (already parsed at function top). Always use raw query values — do NOT pre-escape them:

```ts
} else if (pathname === '/jastrow') {
  const letter = urlObj.searchParams.get('letter') || '';
  const query  = urlObj.searchParams.get('q') || '';

  if (letter) {
    seoData = {
      title: `Jastrow Dictionary - Letter ${letter} | ChavrutAI`,
      ogTitle: `Jastrow Dictionary - Letter ${letter}`,
      // ...
    };
  } else if (query) {
    // Use plain query — servePageWithMeta handles attribute escaping
    seoData = {
      title: `"${query}" - Jastrow Dictionary | ChavrutAI`,
      ogTitle: `"${query}" - Jastrow Dictionary`,
      // ...
    };
  } else {
    seoData = { /* default title */ };
  }
}
```

**Client-side:** Derive title from React state:

```tsx
const seoTitle = selectedLetter
  ? `Jastrow Dictionary - Letter ${selectedLetter} | ChavrutAI`
  : "Modernized Jastrow Talmud Dictionary of Hebrew & Aramaic | ChavrutAI";

useSEO({ title: seoTitle, /* ... */ });
```

## Title Format Conventions

- `<title>` tags: `Specific Content - Category | ChavrutAI` — **always end with `| ChavrutAI`**
- Keep under 60 characters when possible
- `ogTitle`: same descriptive part but **without** the `| ChavrutAI` suffix
- `seoData` strings are always plain text — let `servePageWithMeta` escape for HTML

## Live Test Suite

`tests/seo-meta.test.ts` — 329+ tests that fetch real pages with a Googlebot user-agent and assert:

- Every `<title>` ends with `| ChavrutAI`
- Every `<title>` and `og:title` is non-empty and contains no raw HTML entities
- All page titles are unique across all tested pages
- No non-homepage page uses the generic homepage title
- Page-specific keywords appear in each title
- Query-param pages have titles distinct from their base page

**Run commands:**
```bash
# Against local dev server (fast, ~200ms)
SEO_TEST_BASE_URL=http://localhost:5000 npx vitest run tests/seo-meta.test.ts

# Against production (slow, ~30s, requires internet)
npx vitest run tests/seo-meta.test.ts

# Skip when offline
SKIP_LIVE_SEO_TESTS=1 npx vitest run tests/seo-meta.test.ts
```

**When adding a new page:** add its spec to the `PAGE_SPECS` array in the test file so it is automatically covered.

## SEO Audit Checklist

When auditing or reviewing SEO:

1. **Title parity**: Do client and server produce the same title for each route?
2. **`| ChavrutAI` suffix**: Does every `<title>` end with it? Does every `ogTitle` omit it?
3. **Plain-text seoData**: Are all `seoData` strings free of HTML entities?
4. **Query param safety**: Does `generateServerSideMetaTags` use `pathname` (not raw `url`) for route matching?
5. **No pre-escaping of user input**: Are query params used raw in seoData (not passed through `escapeHtmlAttr` first)?
6. **Canonical URLs**: Are canonicals consistent between client and server?
7. **Route registration**: Is every client route also registered with `app.get('/route', servePageWithMeta)`?
8. **Robots directives**: Are search results and thin pages set to `noindex, follow`?
9. **Structured data**: Do key content pages have JSON-LD?
10. **Crawler body**: Do text-heavy pages inject readable content for crawlers?
11. **Test coverage**: Is the new page added to `PAGE_SPECS` in `tests/seo-meta.test.ts`?

## Known Gaps (as of May 2026)

### Title inconsistencies between client and server
- **Folio pages** (`/talmud/:tractate/:folio`): Server uses en-dash (`–`) and "Hebrew & English Talmud", client uses hyphen and "Talmud Bavli"
- Minor description wording differences on several pages

### ogTitle inconsistencies (contains `| ChavrutAI` when it shouldn't)
- `/term-index` — ogTitle includes `| ChavrutAI` suffix
- `/mishnah-map` — ogTitle includes `| ChavrutAI` suffix
- `/contact` — ogTitle includes `| ChavrutAI` suffix
- `/yerushalmi` — ogTitle includes `| ChavrutAI` suffix
- `/rambam` — ogTitle includes `| ChavrutAI` suffix

### Missing crawler body content
These pages fall back to generic content for crawlers:
- `/jastrow`, `/bdb` — no entries shown to crawlers
- `/term-index` — no terms shown
- `/suggested-pages` — no page list shown
- `/blog-posts` — no blog list shown

### Missing structured data
These pages have no JSON-LD:
- `/jastrow`, `/bdb`, `/term-index`, `/blog-posts`, `/suggested-pages`

### Missing text snippets in crawler body
- Mishnah chapter pages — no text excerpts (unlike Talmud/Bible which do include them)
- Yerushalmi chapter pages — no text excerpts

## Common Mistakes to Avoid

1. **Using `url` instead of `pathname`** in `generateServerSideMetaTags` — query params will break matching
2. **Pre-escaping query params** with `escapeHtmlAttr()` before putting them in seoData — causes double-encoding since `servePageWithMeta` escapes again
3. **HTML entities in seoData strings** — use plain `&` and `"`, not `&amp;` or `&quot;`
4. **Forgetting to update server-side** when changing client-side titles
5. **Forgetting `servePageWithMeta` registration** when adding a new route
6. **Hardcoding `window.location.origin`** on the server — use the `baseUrl` variable instead
7. **Not adding the page to `PAGE_SPECS`** in `tests/seo-meta.test.ts`
