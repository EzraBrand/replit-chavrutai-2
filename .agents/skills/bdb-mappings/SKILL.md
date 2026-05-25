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

2. **Check for existing mappings / conflicts.** Always search for the *exact* key (with trailing punctuation), not a prefix — `rg "reflex"` will hit the existing `"refl.":` line and trick you into thinking `reflex.` is already mapped. The helper script in step 3 also auto-skips duplicates and prints a `SKIP` warning, so you'll catch it there too.
   ```bash
   # Good — exact key match:
   rg -nF '"reflex.":' shared/data/lexicon-mappings/bdb.json
   # Bad — prefix match, false positives:
   rg "reflex" shared/data/lexicon-mappings/bdb.json
   ```
   - If a shorter key already maps to something wrong in context (e.g. `Hom → Fritz Hommel`), add a longer, more specific key rather than removing the short one.
   - Case variants (`Prob.` vs `prob.`) are usually intentional — add both if needed.

3. **Edit the JSON — use the helper script.** Do **not** hand-craft byte-level patches; the file has unpredictable per-line endings (the line *before* `END` is LF but the `END` line itself is CRLF) and the dash count in the END marker is not what you'd guess (it's 61, not 60). Use:

   ```bash
   node scripts/add-bdb-mappings.mjs '{"Identif.":"Identification","nisi":"unless"}'
   ```

   The script:
   - Locates the `// ── END ──` sentinel by regex (no hardcoded dash count).
   - Appends to today's `REVIEW BATCH` block if one exists, otherwise creates one.
   - Preserves the file's existing per-line EOL style.
   - Skips keys already present in the file (and warns) — so it's safe to re-run.
   - Validates JSON before writing.

   Pass a date as the 2nd arg (`YYYY-MM-DD`) to backdate or batch under a specific day. If you ever need to edit the JSON by hand instead, read the END line's bytes first (`python3 -c "..."` with `rfind(b'END')`) — never assume dash count or line endings.

4. **JSON is already validated by the script.** If you edited by hand, run `node -e "JSON.parse(require('fs').readFileSync('shared/data/lexicon-mappings/bdb.json'))"`.

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

## Future Optimization Ideas

Things worth considering if mapping-batch work becomes more frequent:

- **Normalize line endings.** A one-time pass to convert the file to pure LF would let the `edit` tool handle exact-match edits directly, retiring the byte-level workflow entirely. Risk: ~1300-line diff that obscures real changes in `git blame`.
- **Drop the comment-as-key sectioning.** The `"// ── …": ""` markers are clever but force JSON-with-fake-comments. Moving to `.jsonc` (with a tiny build step) or YAML would allow real comments and `# REVIEW BATCH` headers without polluting the runtime key space.
- **Convert to a flat TSV/CSV** (`abbr<TAB>expansion<TAB>section`) loaded at server build time into the same object shape. Trivially appendable, diff-friendly, sortable, dedupe-able with `sort -u`.
- **Add a per-batch `node scripts/verify-bdb-mappings.mjs`** that loads `bdb.json`, then for each new key fetches one or two known BDB entries containing it from Sefaria and asserts the post-pipeline expansion fires (and doesn't fire inside `<sup>` left-over boundaries). Would catch unicode-form mismatches like a decomposed `ō` in `Hithpōʿ.` automatically.
- **Lint for shadow keys.** A small script that flags any new key whose substring matches an existing shorter key (`reflex.` vs `refl.`) — not necessarily a bug, but worth a confirm prompt.
- **Move the `NSG` orphan** sitting outside the END marker back into the appropriate section so the END line is truly the last entry; this would let the helper script use a stricter anchor and let humans trust the END marker.
- **Batch-input UX.** Accept a heredoc or file path in addition to the JSON-string CLI arg, so a user-supplied list (often pasted as `abbr - expansion` lines) can be piped through without manual JSON conversion.

## Cross-References

- For Jastrow dictionary mappings, see the analogous `jastrow-dictionary` skill — the pipeline differs (no `convertSupTagsToParens`).
- For other text-display tweaks (Talmud English, Mishnah, Yerushalmi), see those dedicated skills; do not mix mapping concerns across corpora.
