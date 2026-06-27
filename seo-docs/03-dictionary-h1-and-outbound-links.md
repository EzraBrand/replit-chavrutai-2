# Issues 4 & 5 — Dictionary H1 + Outbound Link Ratio

**Priority: MEDIUM**

---

## Issue 4 — Dictionary Page Missing H1

### What is happening

`/dictionary` has a `<title>` and `<meta name="description">` but no `<h1>` tag. Google uses the H1 as a strong on-page relevance signal. All other pages on the site have one; this is an oversight.

### Fix

In the Dictionary page component (`client/src/pages/dictionary.tsx` or similar), add an `<h1>` at the top of the visible page content. The text should match the page's intent, e.g.:

- `Jastrow Talmudic Dictionary`
- `Aramaic & Hebrew Dictionary`

Style it with Tailwind to match the existing visual hierarchy on other pages (likely `text-3xl font-bold` or whatever heading class is used on `/talmud`, `/about`, etc.).

### Verification

```bash
curl -sA "Googlebot" https://chavrutai.com/dictionary | grep "<h1"
# Expected: a non-empty <h1> tag
```

- [ ] `/dictionary` returns an `<h1>` in the raw HTML (server-side rendered) or is at minimum visible after JS renders

---

## Issue 5 — High Outbound Link Ratio on Folio Pages

### What is happening

Folio pages (e.g., Berakhot 2a) have 37 external links to Sefaria and Al HaTorah vs. only 14 internal links. External links without `rel` attributes pass "link equity" outward to competitor/reference sites.

### Fix

**Part A — Add `rel` attributes to external links**

In the component that renders per-section external study links, add `rel="nofollow noopener noreferrer"` to every external anchor tag pointing to Sefaria, Al HaTorah, or other third-party sites. This tells Google not to follow those links for ranking while still opening them safely for users.

**Part B — Strengthen internal linking**

Increase the internal link count on folio pages:

- Link the tractate name in the page header to `/talmud/:tractate` (if not already a link).
- Add visible **Previous folio / Next folio** navigation links at the top and bottom of the folio view. These also improve user experience and session depth.
- Consider linking section headings or Mishnah references to relevant internal pages (e.g., Mishnah Map, Biblical Index).

### Verification

```bash
# Count external vs internal links on a folio page (after JS renders — use a headless browser or check source manually)
curl -s https://chavrutai.com/talmud/berakhot/2a | grep -oP 'href="[^"]*sefaria[^"]*"' | wc -l
# Should have rel="nofollow" on those anchors after fix
```

- [ ] All Sefaria / Al HaTorah links have `rel="nofollow noopener noreferrer"`
- [ ] Tractate name in folio page header links to `/talmud/:tractate`
- [ ] Previous / Next folio navigation is present
