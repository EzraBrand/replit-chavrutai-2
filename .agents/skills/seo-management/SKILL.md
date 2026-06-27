---
name: seo-management
description: Add, modify, or audit SEO meta titles, descriptions, Open Graph tags, structured data, and crawler content for any page in ChavrutAI. Use when adding a new page/route, fixing page titles, updating meta descriptions, or auditing SEO health across the site.
---

# SEO Management

ChavrutAI is a server-side-rendered SPA. SEO text data lives in **one place** — `shared/seo-data.ts` — which both the server and the client import. This eliminates the client/server sync problem. To change a title or description, edit only that file.

## Architecture Overview

### Files involved

| File | Purpose |
|------|---------|
| `shared/seo-data.ts` | **Single source of truth** — all titles, descriptions, ogTitles, ogDescriptions, robots |
| `client/src/hooks/use-seo.ts` | `useSEO()` DOM hook + `generateSEOData` helpers; imports from shared |
| `server/routes/seo.ts` | `generateServerSideMetaTags()` (4 lines, calls `getPageSEO`); crawler content and structured data |
| `client/index.html` | Static fallback meta (homepage defaults) |
| `tests/seo-meta.test.ts` | Live test suite (347 tests, 38 pages) |

### What's in `shared/seo-data.ts`

- **`SEOEntry`** type: `{ title, description, ogTitle, ogDescription, robots }`
- **`SEOResult`** type: `SEOEntry & { canonical: string }`
- **`STATIC_MAP`** (private): record keyed by pathname for ~20 fixed pages
- **`getStaticSEO(pathname, baseUrl)`** → `SEOResult | null`
- **13 factory functions** for dynamic routes:
  `getTalmudTractateSEO`, `getTalmudFolioSEO`, `getBibleBookSEO`, `getBibleChapterSEO`,
  `getMishnahTractateSEO`, `getMishnahChapterSEO`, `getYerushalmiTractateSEO`,
  `getYerushalmiHalachahSEO`, `getRambamHilchotSEO`, `getRambamChapterSEO`,
  `getJastrowSEO`, `getBDBSEO`, `getSearchSEO`
- **`getPageSEO(pathname, searchParams, baseUrl)`** — dispatches to the right factory; used only by the server

### How it works

1. A crawler requests a page (e.g., `/jastrow?letter=א`)
2. `servePageWithMeta()` detects the crawler user-agent
3. It calls `generateServerSideMetaTags(req.originalUrl)` which calls `getPageSEO(pathname, searchParams, baseUrl)` from `shared/seo-data.ts`
4. The result (title, description, ogTitle, ogDescription, canonical, robots) is injected into the HTML template via `escapeHtmlAttr()`
5. JSON-LD and crawler body content are also injected

For regular browsers, Vite serves the SPA normally, and `useSEO()` (which also calls the same shared factories) updates meta after React loads.

### Critical: URL parsing

`generateServerSideMetaTags` receives `req.originalUrl` which **includes query parameters**. It calls `new URL(url, baseUrl)` and passes `urlObj.pathname` and `urlObj.searchParams` to `getPageSEO`. All route matching happens on `pathname`, never the raw URL.

### Critical: HTML escaping

`servePageWithMeta()` calls `escapeHtmlAttr()` on **all values** before inserting them into HTML attributes. Therefore:

- **`seoData` strings must always be plain text** — no HTML entities (`&amp;`, `&quot;`, etc.)
- **Never pre-escape query params** before putting them in seoData — causes double-encoding
- The `<title>` element also gets `escapeHtmlAttr()` applied

### Key conventions

- `canonical` and `baseUrl` are **never stored** in `shared/seo-data.ts` — always passed as a parameter
- `structuredData` (JSON-LD) stays in page components — it is client-only and uses `window.location.origin`
- `| ChavrutAI` suffix goes in `title`, **not** in `ogTitle` (a few Mishnah/Yerushalmi/Rambam entries are intentional exceptions)

---

## Adding SEO to a New Page

### Step 1: Add to `shared/seo-data.ts`

**For a static page**, add an entry to `STATIC_MAP`:

```ts
"/my-page": {
  title: "My Page Title | ChavrutAI",
  description: "Page description for search engines.",
  ogTitle: "My Page Title",
  ogDescription: "Page description for social sharing.",
  robots: "index, follow",
},
```

**For a dynamic page** (route params or query params), add a factory function:

```ts
export function getMyPageSEO(slug: string, baseUrl: string): SEOResult {
  return {
    title: `${slug} - My Section | ChavrutAI`,
    description: `Description for ${slug}.`,
    ogTitle: `${slug} - My Section`,
    ogDescription: `Description for ${slug}.`,
    robots: "index, follow",
    canonical: `${baseUrl}/my-section/${slug}`,
  };
}
```

Then add a dispatch case in `getPageSEO()`:

```ts
} else if (pathname.startsWith('/my-section/')) {
  const slug = parts[2] || '';
  return getMyPageSEO(slug, baseUrl);
}
```

### Step 2: Update the page component

```tsx
import { useSEO } from "@/hooks/use-seo";
import { getStaticSEO } from "@shared/seo-data";
// or: import { getMyPageSEO } from "@shared/seo-data";

export default function MyPage() {
  // Static page (no structuredData):
  useSEO(getStaticSEO("/my-page", window.location.origin)!);

  // Static page (with structuredData):
  useSEO({
    ...getStaticSEO("/my-page", window.location.origin)!,
    structuredData: { "@context": "https://schema.org", /* ... */ },
  });

  // Dynamic page:
  useSEO(getMyPageSEO(slug, window.location.origin));
  // ...
}
```

### Step 3: Register the route for `servePageWithMeta`

Add the Express route handler in `server/routes/seo.ts`:

```ts
app.get('/my-page', servePageWithMeta);
// or for param routes:
app.get('/my-section/:slug', servePageWithMeta);
```

### Step 4 (optional): Crawler body content

For content-heavy pages, add a case in `generateCrawlerBodyContent()` in `server/routes/seo.ts` to inject visible text/links for crawlers.

### Step 5 (optional): Server-side structured data

For rich pages, add a case in `generateServerSideStructuredData()` in `server/routes/seo.ts` to inject JSON-LD for crawlers.

### Step 6: Add to the test suite

Add the page to `PAGE_SPECS` in `tests/seo-meta.test.ts`:

```ts
{ path: '/my-page', keywords: ['my', 'page'] },
```

---

## Dynamic Titles (Pages with Query Parameters)

Both server and client share the same factory from `shared/seo-data.ts`. The factory receives the query string as a parameter:

**In `shared/seo-data.ts`:**

```ts
export function getJastrowSEO(letter: string, query: string, baseUrl: string): SEOResult {
  if (query) {
    return {
      title: `"${query}" - Jastrow Dictionary | ChavrutAI`,
      ogTitle: `"${query}" - Jastrow Dictionary`,
      // ...
    };
  }
  if (letter) {
    return {
      title: `Jastrow Dictionary - Letter ${letter} | ChavrutAI`,
      ogTitle: `Jastrow Dictionary - Letter ${letter}`,
      // ...
    };
  }
  return { /* default */ };
}
```

**Server dispatch in `getPageSEO()`:**
```ts
} else if (pathname === '/jastrow') {
  return getJastrowSEO(
    searchParams.get('letter') || '',
    searchParams.get('q') || '',
    baseUrl
  );
}
```

**Client in the page component:**
```tsx
const jastrowSEO = getJastrowSEO("", searchQuery, window.location.origin);
useSEO({ ...jastrowSEO, structuredData: { /* ... */ } });
```

---

## Title Format Conventions

- `<title>` tags: `Specific Content - Category | ChavrutAI` — **always end with `| ChavrutAI`**
- Keep under 60 characters when possible
- `ogTitle`: same descriptive part but **without** the `| ChavrutAI` suffix
- All strings in `shared/seo-data.ts` are plain text — `servePageWithMeta` handles HTML escaping

---

## Live Test Suite

`tests/seo-meta.test.ts` — 347 tests that fetch real pages with a Googlebot user-agent and assert:

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

---

## SEO Audit Checklist

1. **Single source**: Is the text in `shared/seo-data.ts`? (Not duplicated in the page component and server separately)
2. **`| ChavrutAI` suffix**: Does every `title` end with it? Does every `ogTitle` omit it?
3. **Plain-text strings**: Are all strings in `shared/seo-data.ts` free of HTML entities?
4. **`canonical` not stored**: Is `canonical` computed via `baseUrl` parameter, not hardcoded?
5. **Route registration**: Is the route registered with `app.get('/route', servePageWithMeta)`?
6. **`getPageSEO()` dispatch**: Is the new route handled in `getPageSEO()`?
7. **Robots directives**: Are search results / thin pages set to `noindex, follow`?
8. **Structured data**: Do key content pages have `structuredData` in the page component?
9. **Crawler body**: Do text-heavy pages have a case in `generateCrawlerBodyContent()`?
10. **Test coverage**: Is the new page added to `PAGE_SPECS` in `tests/seo-meta.test.ts`?

---

## Known Gaps (as of May 2026)

### Missing crawler body content
These pages fall back to generic content for crawlers:
- `/jastrow`, `/bdb` — no dictionary entries shown
- `/term-index` — no terms shown
- `/suggested-pages` — no page list shown
- `/blog-posts` — no blog list shown

### Missing server-side structured data
These pages have client-side `structuredData` in the page component but no JSON-LD from `generateServerSideStructuredData()` (so crawlers don't see it):
- `/jastrow`, `/bdb`, `/term-index`, `/blog-posts`, `/suggested-pages`

### Missing text snippets in crawler body
- Mishnah chapter pages — no text excerpts (unlike Talmud/Bible pages)
- Yerushalmi chapter pages — no text excerpts

---

## Common Mistakes to Avoid

1. **Editing titles in the page component** instead of `shared/seo-data.ts` — the server won't pick up the change
2. **Pre-escaping query params** with `escapeHtmlAttr()` before putting them in seoData — causes double-encoding
3. **HTML entities in shared strings** — use plain `&` and `"`, not `&amp;` or `&quot;`
4. **Storing `canonical` or `baseUrl` in `STATIC_MAP`** — always pass `baseUrl` as a parameter
5. **Putting `structuredData` in `shared/seo-data.ts`** — it uses `window.location.origin` and belongs in page components
6. **Forgetting `servePageWithMeta` registration** when adding a new route
7. **Forgetting to add the page to `PAGE_SPECS`** in `tests/seo-meta.test.ts`
