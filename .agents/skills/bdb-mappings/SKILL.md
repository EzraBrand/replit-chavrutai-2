---
name: bdb-mappings
description: Add or revise BDB (Brown-Driver-Briggs) abbreviation/text-conversion mappings used by the /bdb dictionary reader. Use when the user reports a BDB entry showing a wrong expansion (e.g. "Origen (Fritz Hommel"), asks to add new abbreviation expansions, or wants to tweak how BDB text renders.
---

# BDB Mappings Skill

The BDB reader (`/bdb`) displays Brown-Driver-Briggs lexicon entries fetched from Sefaria, with client-side text transformations to expand abbreviations and clean up formatting. This skill covers how to safely add or revise mappings.

## Key Files

| File | Purpose |
|---|---|
| `shared/data/lexicon-mappings/bdb.json` | The abbreviation → expansion map. **This is the single source of truth.** |
| `client/src/lib/dictionary-format.ts` | Transformation functions: `expandAbbreviations`, `convertSupTagsToParens`, `convertBdbSubFrequencyCounts`, `prependBdbCircaMarker`, `convertSuperscriptLetters`, etc. |
| `client/src/pages/bdb.tsx` | Composes the transformation pipeline in `renderDefinition()` (around line 460). |
| `client/src/pages/bdb-abbreviations.tsx` | Auto-generated index page that reads `bdb.json` — no edits needed when adding mappings. |
| `client/src/pages/changelog.tsx` | Add an entry under the current month after any mapping batch. |

## Critical: The Transformation Pipeline Order

In `bdb.tsx > renderDefinition()`, transforms run in this order (innermost to outermost):

```
1. convertBdbSubFrequencyCounts   <sub>NNNN</sub> → "(NNNN times)"
2. prependBdbCircaMarker          leading bare number → "c. NNNN"
3. wrapGreekMarkers
4. splitIntoParagraphsBdb / splitBySemicolon
5. convertSupTagsToParens         <sup>X</sup> → " (X)"     ← IMPORTANT
6. convertSuperscriptLetters      ᵃᵇᶜ → abc
7. expandAbbreviations            applies bdb.json mappings  ← runs LAST
8. convertBdbInternalLinks / convertJastrowInternalLinks / convertSefariaLinksToInternal
9. annotateTransliterationsInHtml
```

**Two implications that bite every time:**

1. **Pre-`expandAbbreviations` form.** By the time mappings run, `<sup>...</sup>` is already `(…)` and Unicode superscript letters are already normal letters. So a mapping key must match the **post-pipeline-but-pre-expansion** form, not the raw Sefaria source.

   Example: Sefaria source has `Origen<sup>Hom 4, 6 in Ex.</sup>`. Before `expandAbbreviations` runs, this is `Origen (Hom 4, 6 in Ex.)`. The key must be `"Origen (Hom"` — not `"Origen<sup>Hom"` and not `"Origen Hom"`.

2. **Single-pass expansion.** `expandAbbreviations` is one pass over the text with all keys sorted longest-first. Expansions are wrapped in `<span class="dict-expanded">…</span>` sentinels so a later iteration can't re-match inside them. **Crucially: a longer key that includes the *expanded* form of a shorter key will not match**, because the shorter key hasn't expanded yet when matching is decided. The longer key must contain the **abbreviated** form.

   Example: Sefaria has `Lag<sup>M. i. 255</sup>` → after sup conversion: `Lag (M. i. 255)`. To override the generic `Lag → Lagarde` rule for the Mittheilungen citation, the key must be `"Lag (M."` → `"Lagarde (Mittheilungen"`. A key of `"Lagarde (M."` will never fire, because the text still says `Lag (M.` at match time.

## How `expandAbbreviations` Matches

Defined in `dictionary-format.ts` around line 590. Key behaviors:

- **Longest-first.** Keys are sorted by `b.length - a.length` so a multi-word/contextual key wins over a shorter generic one (e.g. `"Origen (Hom"` beats `"Hom"`).
- **Splits on HTML tags.** The text is split with `/(<[^>]*>)/` and only the text segments are matched against. A key cannot match across an HTML tag boundary. (This is why `convertSupTagsToParens` running first matters — it removes the `<sup>` boundary.)
- **Word boundaries differ by key shape:**
  - Keys containing a space: matched as a literal regex with no boundary anchors.
  - Keys ending in `.`: anchored with `\b` on the left (or negative lookbehind if leading char is non-word).
  - Plain word keys: anchored with `\b` on both sides where the edge char is word-class.
- **`&c.`** is special-cased.
- **`c.` inside `<strong>`** is skipped (BDB uses `<strong>c.</strong>` as a section label).
- Each expansion is wrapped in `<span class="dict-expanded">…</span>` for visual distinction.

## Workflow: Adding New Mappings

1. **Confirm the actual rendered text.** If the user reports a wrong expansion, look at the Sefaria source for that entry to see whether the abbreviation is inside `<sup>`, surrounded by punctuation, etc. The post-pipeline form is what your mapping key must match.

   Quick way to grab a Sefaria entry's raw text:
   ```bash
   curl -sL "https://www.sefaria.org/api/v3/texts/BDB,_<HEBREW_LEMMA_URL_ENCODED>" -o /tmp/bdb.json
   ```
   or hit the local API:
   ```bash
   curl -sL "http://localhost:5000/api/bdb/search?query=<HEBREW_LEMMA_URL_ENCODED>"
   ```

2. **Check for existing mappings / conflicts.**
   ```bash
   rg -n "\"<abbr>\"" shared/data/lexicon-mappings/bdb.json
   ```
   - If a shorter key already maps to something wrong in context (e.g. `Hom → Fritz Hommel`), add a longer, more specific key rather than removing the short one.
   - Case variants (`Prob.` vs `prob.`) are usually intentional — add both if needed.

3. **Edit the JSON.** Append entries to the last `// ── REVIEW BATCH (YYYY-MM-DD) ──` block, or create a new dated batch block if none exists for today. Place new entries **before** the `// ── END ──` line.

   ⚠ **File has mixed line endings (CRLF + LF).** The `edit` tool's exact-match can fail. Use a small Python script via `bash` to preserve byte-perfect contents:
   ```python
   path = 'shared/data/lexicon-mappings/bdb.json'
   data = open(path,'rb').read()
   old = b'    "<anchor line>",\n    "// \xe2\x94\x80\xe2\x94\x80 END'
   new = b'    "<anchor line>",\n    "<new key>": "<new value>",\n    "// \xe2\x94\x80\xe2\x94\x80 END'
   assert old in data
   open(path,'wb').write(data.replace(old, new, 1))
   import json; json.load(open(path)); print('OK')
   ```

4. **Validate JSON** (`json.load` above, or `node -e "JSON.parse(require('fs').readFileSync('shared/data/lexicon-mappings/bdb.json'))"`).

5. **Update the changelog** (`client/src/pages/changelog.tsx`) with a brief entry under the current month, listing the new mappings grouped by category (Grammar / Scholars / Vocabulary / Archaic English / etc.). Keep the user's exact spelling — including OCR oddities like `interrrog.` (triple r) — and flag any that look like typos.

6. **Verify in the browser** on `/bdb?q=<lemma>` (or wherever the user reported the bug). The dev server hot-reloads JSON imports.

7. **Draft a suggested tweet** for [@ChavrutAI](https://x.com/ChavrutAI) (per `replit.md`'s "After Every Major Update" rule).

## Common Pitfalls

- **Mapping doesn't fire.** Almost always: the key doesn't match the *post-pipeline* form. Check whether a `<sup>`, `<sub>`, paren, comma, or superscript-letter sits between the words you're trying to match. Re-check pipeline order above.
- **Mapping fires too aggressively.** A short generic key (e.g. `Hom`, `Bo`, `Pi`) is matching where you didn't want it. Fix by adding a longer, more specific contextual key — never weaken the short one without confirming nothing else relies on it.
- **`doest`-style modernizations.** Safe because plain word keys get `\b` on both sides — `doest` will not match inside `does`. But test with `rg` for unintended substrings before adding very short keys.
- **Bible-book references.** Already handled via Sefaria's `<a data-ref="…">` tags; don't duplicate them in the mappings.

## Categories Already Present

The file is organized by `// ── HEADER ──` comment markers. New entries can go either into the appropriate existing section or into the latest dated review batch at the bottom. Existing sections include: Proper Names / Geography, Grammatical (Verb Forms / Stems / Noun & Adjective / Person-Number-Gender / Part-of-Speech / Syntax), Semantic, Qualifiers, Textual Operations, Reference Markers, Languages, Text-Versions & Sigla, Journals, Reference Works, Scholars, Symbols, Archaic English (KJV-style) Modernized, and the dated REVIEW BATCH sections.

## Cross-References

- For Jastrow dictionary mappings, see the analogous `jastrow-dictionary` skill — the pipeline differs (no `convertSupTagsToParens`).
- For other text-display tweaks (Talmud English, Mishnah, Yerushalmi), see those dedicated skills; do not mix mapping concerns across corpora.
