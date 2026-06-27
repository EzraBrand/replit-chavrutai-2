# BDB & Jastrow — Practical Bug Fixes & Polish

_Focused review based on real entry output. Skips the strategic/SEO/architecture stuff covered in the prior pass; this is concrete things to fix in current functionality._

---

## 1. The single highest-leverage finding

**The unmapped-abbreviation scanner output is stale and misleading.**

`scripts/bdb-unmapped-acronyms.txt` (header: `mapped keys excluded: 224`) claims ~1,280 unmapped tokens, but the live mapping file has **1,117 entries**. Spot-checking the supposed "top unmapped" tokens against `shared/data/lexicon-mappings/bdb.json`:

| Token | Listed as unmapped (freq) | Actually mapped? |
|---|---|---|
| `m.` | 1,136 | ✅ "masculine" |
| `BN` | 356 | ✅ "Lagarde, Bildung der Nomina" |
| `NB` | 172 | ✅ "Barth, Nominalbildung..." |
| `BAS` | 164 | ✅ "Beiträge zur Assyriologie" |
| `Zinj.` | 142 | ✅ "Inscriptions of Zinjirli..." |
| `Ezek.` | 128 | ✅ "Ezekiel" |
| `MV` | 138 | ✅ "Meyer & Valeton" |
| `Hpt.` | 75 | ✅ "Haupt" |
| `Proph.` | 75 | ✅ "Prophets" |
| `WMM` | 74 | ✅ "W. Max Müller" |
| `Germ.` | 72 | ✅ "German" |
| `Dr.` | 71 | ✅ "Driver" |
| `Co` | (in mid-list) | ✅ "Cornill" |
| `Lag` | (in mid-list) | ✅ "Lagarde" |
| `Brd` | (in mid-list) | ✅ "C. Bredenkamp" |
| `Inf.` | (in mid-list) | ✅ "Infinitive" |
| `Anm.` | 53 | ✅ "note" |
| `Codd.` | 53 | ✅ "codices (manuscripts)" |
| `Hast.` | 60 | ✅ "Hastings, Dictionary..." |
| `MP` | 55 | ❌ truly missing |
| `f.` | 1,220 | ❌ truly missing (ambiguous) |
| `p.` | 823 | ❌ truly missing (ambiguous) |
| `H.` | 328 | ❌ truly missing (ambiguous) |
| `N.` | 225 | ❌ truly missing (ambiguous) |

**Two separate problems here:**

**(a) The scanner is buggy or out of date.** Mapped keys are being flagged as unmapped, so the file is useless until re-run. Best guess: the scanner counts only mappings in some category section, or its regex tokenization doesn't match how mappings are keyed. Worth a 30-minute pass on `scripts/scan-lexicon-acronyms.ts` to figure out why `mapped_keys: 224` instead of `1117`, then re-run it.

**(b) Whatever the scanner saw as already mapped, the *runtime expansion still isn't firing* in many real pages** — i.e. the issue isn't that the mapping is missing, it's that `expandAbbreviations()` fails to match the token in the source HTML. Reasons it would fail:
- The token is inside a `<sup>...</sup>` that gets converted to ` (…)` *after* abbreviation expansion has already run, so by the time it's visible the regex never sees it. (Actually `convertSupTagsToParens` runs before `expandAbbreviations` in BDB — verify ordering.)
- The token is preceded/followed by a non-word char that `\b` can't anchor against (e.g. ` 𝔊 We Dr.` — works; but `Lag<sup>BN 207</sup>` becomes `Lag (BN 207)` — `Lag` is fine but `BN` is now preceded by `(`, which is fine for `\b`).
- The token sits inside the value of `data-ref="…"`. The existing `(?![^<]*>)` guard handles that. ✅
- **The mapped entry already lives in a previous `<span class="dict-expanded">` from an earlier iteration**, so the regex skips it. Correct, but it means we'd never re-expand a token Sefaria itself wrote inside an italic/bold range.

**Action items, ordered by ease/impact:**

1. **Fix or replace the scanner**, re-run, and treat the *new* output as the source of truth for what's actually unexpanded in rendered text. This is probably 1 day of work and unblocks every "missing abbreviation" complaint.
2. **Verify the render-pipeline order** in `bdb.tsx` and `jastrow.tsx` matches the assumptions in `dictionary-format.ts` (sup → parens → abbrev → translit). One wrong ordering can hide hundreds of expansions.
3. After (1), add a Vitest snapshot for 10 canonical entries per source so future mapping edits can't silently regress.

---

## 2. Real display bugs (verified against live `/bdb?q=אביב`)

### 2a. Redundant nested citation: `Lag<sup>BN 207</sup>` renders as "Lagarde ( Lagarde, Bildung der Nomina 207)"

Source HTML: `Lag<sup>BN 207</sup> Inf.`
After `convertSupTagsToParens`: `Lag (BN 207) Inf.`
After `expandAbbreviations`: `[Lagarde] ([Lagarde, Bildung der Nomina] 207) [Infinitive]` — where `[X]` is a `dict-expanded` pill.

The author's intent was a single citation: *Lagarde, Bildung der Nomina, p. 207*. We render it as two nested Lagarde pills. **Fix idea:** detect the pattern `<Scholar><sup><Work> <pages></sup>` *before* either transform fires, and emit one combined pill: `Lagarde, BN p. 207`. Equivalent for any scholar+work pair (Ew Gesch., RS Sem, Dr Intr., Lag BN, Ba NB, …).

A simpler interim fix: skip abbreviation expansion *inside* `(…)` runs that came from a converted `<sup>`. Mark them with a sentinel class (e.g. `<span class="sup-converted">…</span>` instead of plain parens) and have the expander short-circuit on that container.

### 2b. `<sup>(×2)</sup>` becomes ` ((×2))`

`convertSupTagsToParens` blindly wraps content in `(…)`. When the source already contains parens, this doubles them. Real example from `אָב`: `<a>Genesis 11:29</a><sup>(×2)</sup>` → `<a>Genesis 11:29</a> ((×2))`.

**Fix:** if the `<sup>` content is already wrapped in parens, just unwrap to a single set; or output as a small superscript-styled span (`<span class="text-xs align-super">`) instead of inline parens — which is arguably the right rendering anyway and would solve 2a as a bonus.

### 2c. Stray `,=""` phantom attribute

Raw API output contains malformed Sefaria HTML like:
```html
<a , data-ref="BDB, אֲבִי" dir="rtl" href="/BDB,_אֲבִי">…</a>
<a data-ref="..." href="/BDB,_X", dir="rtl">…</a>
```
That stray comma between attributes parses as an attribute named `,` with empty value. Browsers tolerate it, but it breaks copy-paste, screen readers, and any future attribute-based handler. **Fix:** one-line regex sweep on incoming Sefaria HTML in `server/storage.ts` or `dictionary-format.ts`:
```js
html.replace(/(<a[^>]*?)\s*,\s*(?=[a-z-]+=)/g, '$1 ')
```

### 2d. Duplicate consecutive Bible citations

`אביב` entry renders: "Exodus 34:18, Exodus 34:18 (JE), Deuteronomy 16:1, Deuteronomy 16:1". These come straight from Sefaria. **Fix:** in `convertSefariaLinksToInternal` (or a step just after), dedupe consecutive identical anchor hrefs separated only by a comma/semicolon + whitespace.

### 2e. Repeated chapter prefix in citation runs

"Genesis 19:31, Genesis 19:32, Genesis 19:33" could collapse to "Genesis 19:31–33" or "Genesis 19:31, 32, 33". Strictly cosmetic, but BDB entries have dozens of these and the visual density would drop dramatically. Lowest-priority of this section but visible immediately to readers.

---

## 3. Genuinely missing / under-expanded tokens (after manual verification)

Things that are *not* in the mapping today and would be safe to add (unambiguous in BDB context):

- `MP` → "Messianic Prophecy" (KueBr MP → Kuenen & Briggs, Messianic Prophecy)
- `Jes` → "Jesaja (Isaiah)" — used standalone occasionally, e.g. "De Jes" already mapped but the bare form appears
- `gr.-greatgr.` → "great-great-grandfather" (multi-token, would need a phrase rule)
- `greatgr.` → "great-grandfather"
- `Hup` → "Hupfeld" (currently only `Hupf` is mapped — both forms appear)
- `Bek` → "Bekenntnis" / scholar context — verify before adding
- `Ol` → "Olshausen" (currently only `Olsh` is mapped)
- `Bä` / `Bä Rel.` → already `Bä` is mapped → "K. C. Bähr" but `Bä Rel.` could be a phrase entry → "Bähr, Symbolik des Mosaischen Cultus"
- `Hom` → "Hommel" (currently only `Hommel` full form is mapped; the abbreviation `Hom` appears in "Hom Südar. Chrest. 128")

Things that look unmapped but are **ambiguous and should NOT be auto-expanded**:

- `f.` — could be "feminine", "father", or "following". Wrong half the time.
- `p.` — "page" vs. the headword being defined.
- `s.` — "singular" vs. "see".
- `l.` — "line" vs. "Lagarde".
- `i.`, `ii.`, `iii.`, `iv.`, `I.`, `II.`, `III.` — these are **outline markers**, not abbreviations. Already correctly skipped.
- `H.`, `N.`, `J.`, `E.` — initials, source-critical sigla, and abbreviations of half a dozen scholars/sources. Better left as-is.
- `a.`, `b.`, `c.`, `d.`, `e.` — sub-sense letters or initials. Already partially handled (`c.` has special-case for `<strong>c.</strong>`).

**The right thing for these ambiguous tokens is not a mapping entry but a hover tooltip** listing the 2–3 possible expansions, so the reader can pick mentally. Easy to implement as a follow-on after (1).

---

## 4. Display polish (smaller, all under an hour each)

- **Sense-header layout.** Right now each sense is one prose paragraph beginning with `<strong>1.</strong> father of individual …`. Even minimal vertical rhythm (sense number as a hanging label, body indented) would make long BDB entries 3× more scannable. The "Split by semicolons" toggle proves the team's already thinking this way; carry it through to sense-level structure.
- **Hebrew quotes inside English prose** render with the right font/direction but no visual setoff — adding a faint underline or letter-spacing on `[dir="rtl"]` runs would help. The reverse is also true: bracketed transliterations like `[ʾāb]` next to Hebrew can look LTR-bleed messy without `<bdi>` wrapping.
- **`<sup>` content with embedded sup-anchors.** `(Ew<sup>§ 273b</sup>)` → ` (Ew (§ 273b))` after sup→parens. Better: emit as a small superscript span and skip the paren wrap when the parent is already inside parens.
- **The "About this dictionary" disclosure.** Currently a single click target; ideal for keyboard users to be reachable via the `Tab` order with proper `aria-expanded`.
- **Headword copy button.** A small "copy" affordance next to each entry header — scholars cite these.
- **Loading skeleton on slow lookups** — current spinner sits inside the search box, but on cold cache the page can feel frozen for ~600ms. A 2-line skeleton in the results area would feel faster.
- **External-link icon next to Sefaria-derived links.** Right now internal-rewritten links look identical to remaining Sefaria links; subtle iconography would tell the reader which click leaves ChavrutAI.

---

## 5. Performance & infra (small, real wins)

- **Server-side LRU cache** in front of Sefaria's `/api/words/*` (5–10MB is plenty). The same handful of headwords are hit repeatedly; right now every search is a fresh upstream call.
- **Don't ship Jastrow's ~1.5MB headword JSON in the initial bundle.** Defer fetch to the moment the user focuses the search box (or visits `/jastrow`). Easy with `useLexiconIndex` already being a hook.
- **Headword index pages** (`/bdb/headwords/ב`) render every headword in a letter eagerly. ב alone has ~300+. Virtualization optional, but at minimum lazy-render past the fold.

---

## 6. Suggested sequencing for this pass

A reasonable 1-week effort, all within current functionality:

**Day 1.** Fix the scanner (`scripts/scan-lexicon-acronyms.ts`) — figure out why mapped_keys=224 vs 1,117, re-run, replace `bdb-unmapped-acronyms.txt`. Snapshot tests on 10 entries per source.

**Day 2.** Render-pipeline bugs: stray-comma stripping (2c); dedupe consecutive citations (2d); `<sup>` → small superscript span instead of `(…)` (fixes 2a + 2b together).

**Day 3.** Verify pipeline ordering; re-run scanner against fixed pipeline; add any genuinely missing abbreviations the new output surfaces (§3).

**Day 4.** Sense-header layout polish; `<bdi>` wrappers; copy button; loading skeleton.

**Day 5.** Server LRU cache; lazy-load Jastrow headword JSON; letter-index pagination.

No new features, no new routes — just making the existing surface read better, render correctly, and load faster.
