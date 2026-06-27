# SEO Improvement Plan — chavrutai.com

**Based on:** External SEO audit (March 2026)  
**Core problem:** Searching "chavrutai" on Google surfaces GitHub, LinkedIn, Substack — but not chavrutai.com itself. The site is indexed, but Google has weak brand-entity association.

---

## Context: What Already Exists

The codebase has a meaningful amount of SEO infrastructure in place:

- **`index.html`** — Full OG/Twitter meta tags, description, keywords, og:type="website" (correct)
- **`server/routes.ts` → `servePageWithMeta`** — Detects crawlers by User-Agent and injects page-specific title, description, and `<link rel="canonical">` *before* sending HTML
- **`client/src/hooks/use-seo.ts`** — Client-side hook that updates document title, meta tags, and injects JSON-LD structured data per page
- **`sameAs`** — Exists inside the About page's client-side structured data (Organization schema), but only rendered via JavaScript on that page
- **Sitemap** — Comprehensive XML sitemap covering all 5,400+ Talmud folio pages
- **`robots.txt`** — Well-configured

---

## Issues Identified

### Issue 1 — JSON-LD Structured Data Is Invisible on First Crawl (HIGH IMPACT)

**What's happening:** All JSON-LD (`@type: WebSite`, `@type: Organization`, breadcrumbs, etc.) is injected by the React app client-side. Google's first-pass HTML parse sees none of it. Structured data is what connects the "ChavrutAI" entity to chavrutai.com.

**What exists:** `use-seo.ts` generates rich structured data per page — it just never reaches the server HTML.

**Fix:** Extend `servePageWithMeta` in `server/routes.ts` to also inject a JSON-LD `<script>` block for each crawled route — at minimum for the homepage, `/about`, and `/talmud`. This requires extracting the structured data generation logic from the client hook and mirroring it server-side.

---

### Issue 2 — `sameAs` Is Absent from Homepage Schema (HIGH IMPACT)

**What's happening:** `sameAs` only exists in the About page's JavaScript-rendered Organization schema. The homepage has no `sameAs`. Google sees "ChavrutAI" mentioned on GitHub, Substack, and LinkedIn but has no structured data tying those mentions to chavrutai.com.

**What exists:** `use-seo.ts` line 442 has `sameAs` in the About page's Organization — but it never reaches the server, and it's not on the homepage.

**Fix:**
1. Add `sameAs` to the homepage's Organization/WebSite schema in `use-seo.ts`
2. Include it in the server-injected JSON-LD (see Issue 1)
3. Use only profiles you control: GitHub repos, ezrabrand.com, X/Twitter profile

Recommended `sameAs` array:
```json
[
  "https://github.com/EzraBrand/chavrutai-platform",
  "https://github.com/EzraBrand/replit-chavrutai-2",
  "https://www.ezrabrand.com/",
  "https://x.com/ChavrutAI"
]
```

---

### Issue 3 — `og:type` Is Overwritten to "article" by JavaScript (MEDIUM IMPACT)

**What's happening:** `index.html` correctly sets `og:type = "website"`. The `use-seo.ts` hook at line 143 calls `updateMeta("og:type", "article", "property")` — this runs on content/folio pages, and potentially bleeds into the homepage depending on navigation order.

**Fix:** Audit the `use-seo.ts` hook to ensure `og:type = "article"` is only set for individual folio/content pages, and `og:type = "website"` is explicitly set (or preserved) when the homepage SEO data is applied. Add a defensive reset in the homepage SEO config.

---

### Issue 4 — Canonical Tag Not in Base `index.html` (LOW-MEDIUM IMPACT)

**What's happening:** The canonical tag is either injected server-side (for known crawlers) or added client-side via JS (for all others). The raw `index.html` template has no `<link rel="canonical">` for the homepage at all.

**What exists:** `servePageWithMeta` does inject canonical correctly for crawlers. But non-crawler first-pass parsing and social media scrapers that don't run JS get no canonical.

**Fix:** Add a static `<link rel="canonical" href="https://chavrutai.com/" />` directly to `index.html`. For inner pages, the server injection already handles crawlers and the JS hook handles clients — this covers the homepage base case.

---

### Issue 5 — Brand Name Weak in Meta Description (LOW IMPACT)

**What's happening:** The meta description leads with "Access all 37 tractates of the Babylonian Talmud..." — the brand name "ChavrutAI" only appears at the end of the keywords list, not in the description text itself.

**Fix:** Revise the meta description and og:title in `index.html` to lead with or prominently feature "ChavrutAI" as the brand name:

> "ChavrutAI — study the Babylonian Talmud online, free. All 37 tractates with Hebrew-English text, chapter navigation, and modern study tools."

---

## Off-Site Recommendations (Cannot Be Done in Code)

These require action outside the codebase but have meaningful impact:

- **Google Search Console** — Verify ownership if not done. Submit sitemap. Request indexing on the homepage and `/about`. This gives Google a direct signal.
- **Backlinks from profiles you own** — Ensure your GitHub profile, Substack bio, and ezrabrand.com all have a visible link back to chavrutai.com. This reinforces the entity graph.
- **Wikidata stub** — A minimal Wikidata entry for ChavrutAI (linking to the website) helps Google's Knowledge Graph distinguish the brand from the Hebrew word "chavruta."

---

## Implementation Order

| # | Task | Where | Impact | Effort |
|---|------|--------|--------|--------|
| 1 | Add static canonical to `index.html` | `client/index.html` | Low-Med | 5 min |
| 2 | Fix `og:type` not overwriting "website" on homepage | `use-seo.ts` | Medium | 15 min |
| 3 | Add `sameAs` to homepage Organization schema in `use-seo.ts` | `use-seo.ts` | High | 15 min |
| 4 | Strengthen brand name in `index.html` meta description | `client/index.html` | Low | 10 min |
| 5 | Inject JSON-LD server-side in `servePageWithMeta` for crawlers | `server/routes.ts` | High | 1–2 hrs |
| 6 | Off-site: GSC verification, backlinks, Wikidata | External | High | Manual |

Tasks 1–4 are quick wins that can be shipped immediately.  
Task 5 is the highest-impact code change and the most involved.  
Task 6 requires manual action but amplifies everything else.

---

## Notes

- **No framework migration needed.** The audit recommends Next.js/Astro, but the existing server-side meta injection in `routes.ts` already addresses the crawler rendering problem for meta tags. The remaining gap is JSON-LD structured data (Task 5), which can be solved within the current Express setup without a full SSR migration.
- The sitemap and robots.txt are already in good shape — no changes needed there.
- The `<noscript>` fallback nav in `index.html` is a positive signal — keep it.
