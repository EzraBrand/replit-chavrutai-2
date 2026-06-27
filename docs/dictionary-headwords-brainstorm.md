# Dictionary Headwords & Entry Display — Improvement Brainstorm

**Scope:** BDB and Jastrow readers in ChavrutAI.
**Constraint:** Keep calling Sefaria's `/api/words/{hw}` live on every entry view. **Do not** bundle the full corpus locally. The only local data we ship is the existing headword index for browse & autosuggest.

**Goal:** Make every dictionary entry a first-class, durable, discoverable URL with proper SEO, while keeping the runtime data-flow exactly as it is today.

---

## 1. Current setup (snapshot)

### Data we already ship locally
- `shared/data/lexicon-headwords/bdb.json` — 5,251 headwords (~117 KB).
- `shared/data/lexicon-headwords/jastrow.json` — ~30 K headwords (~733 KB).
- Built by `scripts/fetch-lexicon-headwords.ts`, ghost-filtered by `scripts/filter-lexicon-headwords.ts`.

### Runtime
- Entry bodies fetched live from `https://www.sefaria.org/api/words/{hw}` on every request. Unchanged in this proposal.

### Routes today
- `/bdb`, `/jastrow` — search-driven readers with `?q=<headword>` URL state.
- `/bdb/headwords[/:letter]`, `/jastrow/headwords[/:letter]` — alphabetical browse.
- **No per-entry route.** **No per-entry sitemap entry.** **No per-entry JSON-LD.**

### Pain points
1. `?q=…` URLs are ugly, not crawler-rich, not in sitemap.
2. Entries are exactly `schema.org/DefinedTerm` content — we ship none.
3. Ghost headwords (`ל`, `מוּר`) appear in the index but Sefaria's `/words/` API returns nothing for them, leaving a dead-end "No entries found" page.
4. No prev/next, no breadcrumbs once you're on an entry.

---

## 2. Sefaria-Export research (quick result)

Checked `https://github.com/Sefaria/Sefaria-Export` and the backing GCS bucket `gs://sefaria-export/`:

- `schemas/BDB.json`, `schemas/Jastrow.json` — schema-only (lexicon metadata + 23-letter `headwordMap` like `[["ל","BDB, ל"]]`). **Confirms `ל` is a real BDB headword** even though `/api/words/` doesn't return it.
- `json/Reference/Dictionary/` exists as a prefix but contains no lexicon JSON dumps.

**Verdict on the export bucket:** no shippable entry bodies, no need to keep looking there.

### 2.1 BUT — there *is* another live API endpoint

The schema files above gave away the trick: Sefaria's own schema **registers each lexicon as a "text"** with refs like `BDB, ל`, `Jastrow, מוּר`, etc. That means lexicon entries are reachable through the same `/api/texts/` endpoint we already use for Talmud and Bible.

Verified live (May 23, 2026):

| Endpoint                                             | Result                                  |
| ---------------------------------------------------- | --------------------------------------- |
| `GET /api/words/ל`                                   | only Jastrow + Klein, **no BDB**         |
| `GET /api/words/מוּר`                                | only Jastrow, **no BDB**                 |
| `GET /api/texts/BDB,_ל`                              | **200 OK, full HTML entry**              |
| `GET /api/texts/BDB,_מוּר`                           | **200 OK, full HTML entry**              |
| `GET /api/texts/Jastrow,_מוּר`                       | **200 OK, full HTML entry**              |
| `GET /api/v3/texts/BDB,_ל`                           | 200 OK, newer schema (more metadata)     |

The `/api/texts/` response shape (relevant fields):

```jsonc
{
  "ref": "BDB, מוּר",
  "heRef": "בראון-דרייבר-בריגס, מוּר",
  "text": ["† <big><big>[<span dir=\"rtl\">מוּר</span>]</big></big>  <strong>vb.</strong> change …"],
  "next": "BDB, תְּמוּרָה",
  "prev": "BDB, מוֹקֵשׁ²",
  "versions": [{ "license": "Public Domain", … }],
  "isComplex": true
}
```

Two huge consequences:

1. **The ghost-headword problem disappears.** Every headword in our index — including `ל`, `מוּר`, and the rest of the dropped 42% — is reachable through `/api/texts/`. No more dead-end "No entries found" pages, no need for HTML scraping, no manual override file.
2. **Prev/next navigation is free.** `next` and `prev` come back in every response. We don't have to walk the headword index ourselves.

### 2.2 The catch (small one)

The ref must use the **exact canonical voweled headword** Sefaria stores. For Jastrow:

- `Jastrow, מוּר` (voweled, exact) → works.
- `Jastrow, אב` (unvoweled) → empty.

Same for BDB. This is fine because our `shared/data/lexicon-headwords/{bdb,jastrow}.json` already stores the canonical voweled forms — we already do the slug → voweled-headword mapping for autosuggest.

So the slug pipeline is:

```
URL /bdb/אב   →  normalized slug "אב"
              →  lookup in lexicon-headwords/bdb.json → "אָב" (canonical voweled)
              →  fetch /api/texts/BDB,_אָב
              →  render entry + prev/next
```

### 2.3 What changes for our existing fetcher

`server/storage.ts :: SefariaAPI.searchEntriesForLexicon()` currently:

1. `GET /api/words/{query}` for exact match.
2. Falls back to `/api/words/completion/.../{lexicon}` to fuzzy-suggest neighbors.

For the **per-entry view** (which is what the new pretty-URL route serves), the primary fetch becomes:

1. Resolve slug → canonical voweled headword from the local index.
2. `GET /api/texts/{LexiconTitle},_{headword}` — this is the new primary path.
3. Fall back to `/api/words/{headword}` only if step 2 returns no `text` (defensive).

For the **search page** (`/bdb?q=...` typeahead), the existing `/api/words/` path is still fine — it's optimized for partial matches and returns multiple lexicons at once. No change there.

---

## 3. Pretty per-entry URLs

The biggest leverage win that doesn't change the data flow.

### 3.1 URL shape

| New                                  | Old (kept as 301 redirect)      |
| ------------------------------------ | ------------------------------- |
| `/bdb/אב`                            | `/bdb?q=אב`                     |
| `/bdb/מוּר-2` (homonym disambig)     | `/bdb?q=מוּר II`                |
| `/jastrow/אב`                        | `/jastrow?q=אב`                 |
| `/bdb/headwords/א`                   | (unchanged)                     |
| `/bdb`, `/jastrow` (search landing)  | (unchanged)                     |

Notes:
- Slug is the **normalized** headword (`normalizeHebrew()` strips niqqud, normalizes finals). Voweled form stays in the page heading.
- Hebrew in path segments renders readably in modern browsers (Chrome decodes them visually in the address bar).
- Homonyms (`מוּר I`, `מוּר II`) get a deterministic `-2`, `-3` suffix derived from the order Sefaria returns them — record it in the headword index so the URLs are stable.
- `?q=` continues to work via a 301 redirect to the canonical pretty URL — preserves existing inbound links and tweets.

### 3.2 Wouter routing

```ts
<Route path="/bdb/headwords/:letter" component={LexiconHeadwords} />  // existing
<Route path="/bdb/headwords"        component={LexiconHeadwords} />  // existing
<Route path="/bdb/:slug"            component={BdbEntry} />           // NEW
<Route path="/bdb"                  component={Bdb} />                // existing (search landing)
// twin set for /jastrow
```

`<BdbEntry>` is a thin wrapper: takes `slug` from the URL, resolves it to a headword (via the local index), then runs the **same** live-fetch + render pipeline the current `?q=` page uses.

### 3.3 Server-side hooks

- `app.get('/bdb/:slug', servePageWithMeta)` mounts the SPA shell with per-entry meta/structured-data. Mirrors how folio pages are served.
- `app.get('/bdb', (req, res, next) => { if (req.query.q) return res.redirect(301, `/bdb/${slugify(req.query.q)}`); next(); })`.
- For ghost headwords whose `/api/words/` is empty: render a real entry page anyway, but with a "This entry is not available via Sefaria's API — read it on Sefaria" fallback link. No 404 dead-end.

### 3.4 Internal link updates

- Autosuggest results → pretty URL.
- `/bdb/headwords/:letter` list items → pretty URL.
- Reference panel "look up in BDB" links → pretty URL.
- "Open in BDB" CTAs across the app → pretty URL.

---

## 4. SEO upgrades

### 4.1 Per-entry meta (`shared/seo-data.ts`)

```ts
export function getBdbEntrySEO(slug: string, headword: string) {
  return {
    title: `${headword} — BDB Hebrew Bible Dictionary | ChavrutAI`,
    description: `BDB entry for ${headword}. Definitions, cross-references, and verse citations from the Brown-Driver-Briggs Hebrew Bible lexicon (1906).`,
    ogTitle: `${headword} — BDB`,
    ogDescription: `BDB entry for ${headword} on ChavrutAI.`,
    canonical: `/bdb/${slug}`,
    robots: 'index,follow',
  };
}
```

Plus a `getJastrowEntrySEO()` twin. Both wired through `getPageSEO()` dispatch.

Description text is meta-friendly even though we don't have the body locally — using the headword + lexicon-name template is enough for Google to disambiguate the page from neighbors.

### 4.2 Per-entry JSON-LD (`DefinedTerm`)

Emitted client-side after the live fetch resolves (when the body is available); falls back to a lighter `DefinedTerm` without `description` when the API returns nothing.

```jsonc
{
  "@context": "https://schema.org",
  "@type": "DefinedTerm",
  "name": "אָב",
  "alternateName": ["אב"],
  "description": "father; of an individual; of God as father of his people …",
  "inDefinedTermSet": {
    "@type": "DefinedTermSet",
    "name": "BDB Hebrew Bible Dictionary",
    "author": "Brown, Driver, Briggs",
    "datePublished": "1906",
    "url": "https://chavrutai.com/bdb/headwords"
  },
  "url": "https://chavrutai.com/bdb/אב",
  "inLanguage": "he"
}
```

This is the schema.org type Google explicitly recommends for glossary entries — would be a meaningful differentiator.

### 4.3 Sitemap

- New generator: `server/routes/sitemap-lexicon.ts` emits one sitemap chunk per lexicon, listing every headword from `shared/data/lexicon-headwords/{bdb,jastrow}.json` as a pretty URL.
- Sizes: ~5 K + ~30 K URLs, well below Google's 50 K/sitemap cap.
- Listed in `sitemap-index.xml` alongside existing chunks.
- `<changefreq>monthly</changefreq>`, `<priority>0.4</priority>`, `<lastmod>` = headword-index `fetched_at`.

### 4.4 Crawler body content

Per `server/routes/seo.ts` conventions, `generateCrawlerBodyContent()` injects semantic HTML for crawlers. For entry pages, inject:

```html
<article>
  <nav>BDB › א › אָב</nav>
  <h1>אָב — BDB Hebrew Bible Dictionary</h1>
  <p>Entry for the Hebrew headword אָב in the Brown-Driver-Briggs Lexicon (1906).</p>
  <p>See also: <a href="/bdb/אב-2">אב (2)</a>, <a href="/bdb/אבד">אבד</a> · <a href="/bdb/headwords/א">All BDB entries starting with א</a></p>
</article>
```

We don't have the body server-side (no caching), but we *do* have prev/next neighbors and headword text — that's enough semantic content for crawlers to index the page meaningfully.

---

## 5. The ghost-headword problem is solved by §2.1

Switching the per-entry fetcher from `/api/words/` to `/api/texts/BDB,_<headword>` removes the problem entirely. No fallback UI needed, no HTML scraping, no manual overrides file.

The only follow-up is to **rerun `filter-lexicon-headwords.ts` with the new source-of-truth** (a `/api/texts/`-based probe) and restore the ~42% of headwords it dropped against the wrong API. Expected outcome: BDB index grows from ~5,250 to ~9,000 entries; Jastrow grows proportionally.

---

## 6. Display polish (orthogonal, low-risk)

Quick wins worth bundling with the rewrite:

1. **Persistent breadcrumbs** on every entry: `BDB › ל › ל`.
2. **Prev/next entry navigation.** The headword index gives us this for free.
3. **"Open on Sefaria" footer link** as a stable escape hatch.
4. **Recently viewed entries** strip at the top of `/bdb` and `/jastrow` (localStorage, no server work).
5. **Letter index preview** — show the first 20 entries per letter inline on `/bdb/headwords` so the user can dive in without an extra click.
6. **Search bar autosuggest** stays on the new pretty URLs (no `?q=` hop).

---

## 7. Migration plan (incremental, each step shippable on its own)

**Step 1 — Swap the per-entry fetcher to `/api/texts/`.**
- Add `getLexiconEntry(lexicon, headword)` in `server/storage.ts` that hits `/api/texts/{LexiconTitle},_{headword}`.
- Wire it into the existing `?q=` page render path (no URL change yet).
- Test against the ghost-headword cases (`ל`, `מוּר`) — they should now load.
- This step **on its own** kills the dead-end pages.

**Step 2 — Pretty URLs.**
- Add `/bdb/:slug` and `/jastrow/:slug` routes.
- Slug helper in `shared/lexicon-slug.ts` (`normalizeHebrew` already exists).
- Server 301 from `?q=…` → `/{lex}/{slug}`.
- Update all internal links (autosuggest, letter pages, reference-panel links).
- *No* SEO data, *no* sitemap yet.

**Step 3 — Per-entry SEO.**
- `getBdbEntrySEO()`, `getJastrowEntrySEO()` in `shared/seo-data.ts`.
- `useSEO()` call inside the entry pages.
- `servePageWithMeta()` registration for the new routes.
- Crawler body content for entry pages.
- Run the existing SEO live-test suite; add per-entry assertions.

**Step 4 — Sitemap chunks.**
- `sitemap-lexicon.ts` generator emits one chunk per lexicon.
- Register in `sitemap-index.xml`.

**Step 5 — JSON-LD `DefinedTerm`.**
- Client-side emission inside `<BdbEntry>` / `<JastrowEntry>`.

**Step 6 — Refresh the headword index.**
- Modify `filter-lexicon-headwords.ts` to probe via `/api/texts/` instead of `/api/words/`.
- Rerun. Expect BDB index ≈ 9 K (was 5,251); Jastrow proportionally.
- Commit the larger `lexicon-headwords/*.json` files. Sitemap auto-grows.

**Step 7 — Display polish** (breadcrumbs, prev/next from the `next`/`prev` fields, recently viewed) — ship anytime, any order.

Each step is one PR. Steps 1–7 are independent of any data-bundling work; we keep calling Sefaria live, exactly as today.

---

## 8. Risks & open questions

- **Hebrew in URLs.** Modern browsers handle this fine. Twitter cards, Slack unfurls, etc. — all tested against `chavrutai.com/talmud/...` paths already, no encoding issues expected.
- **Slug collisions across lexicons.** None — namespaced under `/bdb/` and `/jastrow/`.
- **Homonyms.** Need to decide the disambiguator scheme **once** and lock it. Suggestion: append `-2`, `-3` in the order Sefaria's API returns them; record the assignment in the headword index file so it's reproducible and reviewable.
- **Vocalization in URLs.** Strip niqqud in slug, display voweled on page. `lang="he"`, `dir="rtl"` on the entry element.
- **Inbound `?q=` link rot.** Mitigated by 301 — Google + browsers transfer ranking.
- **Sitemap rebuild cadence.** Only changes when `shared/data/lexicon-headwords/*.json` regenerates (manually). No drift risk.

---

## 9. Recommended next action

**Step 1** (swap the per-entry fetcher to `/api/texts/`) is now the highest-leverage first PR:

- Tiny diff — one new method in `server/storage.ts`, one call-site swap in the existing reader.
- Immediately fixes every ghost-headword dead-end, including `ל` and `מוּר`.
- Unlocks free prev/next navigation (Step 7) since `next`/`prev` come back in the same response.
- Zero URL surface change, zero risk to existing inbound links, instant rollback.

Once that's in, Step 2 (pretty URLs) follows naturally, and the SEO/sitemap/JSON-LD steps stack on top.
