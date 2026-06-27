# Issue 3 — No Breadcrumbs

**Priority: HIGH**

## What is happening

The site has a four-level hierarchy (Seder > Tractate > Chapter > Folio) but no breadcrumb navigation in the UI and no `BreadcrumbList` schema in JSON-LD. Google can show breadcrumbs as rich snippets in search results, improving click-through rate.

---

## Fix (two parts)

### Part A — UI Breadcrumb Component

Add a `<Breadcrumb>` component (using the existing shadcn breadcrumb primitive if available, otherwise a simple `nav > ol > li` chain) to the following pages:

| Page | Trail |
|------|-------|
| `/talmud/:tractate/:folio` | Home > Talmud > [Tractate] > [Folio] |
| `/talmud/:tractate` | Home > Talmud > [Tractate] |
| `/bible/:book/:chapter` | Home > Bible > [Book] > Chapter [N] |
| `/bible/:book` | Home > Bible > [Book] |

All items except the last should be clickable links. The last item (current page) should be plain text.

### Part B — BreadcrumbList JSON-LD (server-side)

Inside `generateServerSideStructuredData()` in `server/routes.ts`, add a `BreadcrumbList` node for each route that has a breadcrumb trail. Include it in the `@graph` array alongside the existing `WebPage` and `Organization` nodes.

**Example for a folio page (`/talmud/berakhot/2a`):**

```json
{
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "Home",     "item": "https://chavrutai.com/" },
    { "@type": "ListItem", "position": 2, "name": "Talmud",   "item": "https://chavrutai.com/talmud" },
    { "@type": "ListItem", "position": 3, "name": "Berakhot", "item": "https://chavrutai.com/talmud/berakhot" },
    { "@type": "ListItem", "position": 4, "name": "Berakhot 2a", "item": "https://chavrutai.com/talmud/berakhot/2a" }
  ]
}
```

**Example for a tractate page (`/talmud/berakhot`):**

```json
{
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "Home",     "item": "https://chavrutai.com/" },
    { "@type": "ListItem", "position": 2, "name": "Talmud",   "item": "https://chavrutai.com/talmud" },
    { "@type": "ListItem", "position": 3, "name": "Berakhot", "item": "https://chavrutai.com/talmud/berakhot" }
  ]
}
```

---

## Verification

```bash
# Confirm BreadcrumbList appears in JSON-LD on a folio page
curl -sA "Googlebot" https://chavrutai.com/talmud/berakhot/2a | python3 -c "
import sys, json, re
html = sys.stdin.read()
ld = re.search(r'<script type=\"application/ld\+json\">(.*?)</script>', html, re.DOTALL)
data = json.loads(ld.group(1))
types = [n.get('@type') for n in data.get('@graph', [])]
print(types)
"
# Expected: [..., 'BreadcrumbList']
```

- [ ] `BreadcrumbList` node present in JSON-LD on folio pages
- [ ] `BreadcrumbList` node present in JSON-LD on tractate pages
- [ ] Breadcrumb UI visible on `/talmud/berakhot/2a`
- [ ] Breadcrumb UI visible on `/talmud/berakhot`
- [ ] Validate with [Google's Rich Results Test](https://search.google.com/test/rich-results)
