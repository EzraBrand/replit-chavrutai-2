# Yerushalmi ↔ Bavli Name Gazetteer

Merges the Yerushalmi name-frequency table (Guggenheimer translation) with
the Bavli glossary to produce a unified gazetteer showing how prominently each
rabbinic figure appears in each Talmudic corpus.

---

## Inputs

| File | Description |
|---|---|
| `yerushalmi-names-results.csv` | 2,168-row frequency table extracted from the Guggenheimer Yerushalmi by `extract-yerushalmi-names.ts` |
| `bavli-glossary.csv` | Bavli glossary fetched from EzraBrand/talmud-nlp-indexer; filtered to rows where `categories = names` and `count > 10` (355 entries) |

## Running

```bash
npx tsx scripts/merge-names-tables.ts
```

Overwrites `scripts/yerushalmi-bavli-merged.csv`.

---

## Output: `yerushalmi-bavli-merged.csv`

**2,019 rows** (unique normalized names), **14 columns**.

| Column | Description |
|---|---|
| `rank` | Rank by Yerushalmi frequency (1 = most frequent) |
| `normalized_name` | Canonical form: honorifics stripped to `R'`, Guggenheimer transliterations standardized (Jehudah → Yehudah, bar ↔ ben, etc.) |
| `yerushalmi_count` | Total occurrences in the Guggenheimer corpus (summed across all raw spelling variants) |
| `yerushalmi_pct` | `yerushalmi_count` as a % of all name-occurrences in the Yerushalmi table |
| `bavli_term` | Matched term from the Bavli glossary (`R'` normalized), blank if unmatched |
| `bavli_count` | Occurrences of that term in the Bavli corpus |
| `bavli_pct` | `bavli_count` as a % of all name-occurrences in the Bavli glossary, blank if unmatched |
| `wikipedia_he` | Hebrew Wikipedia article URL (from Bavli glossary), blank if unmatched |
| `hebrew_term` | Hebrew name (from Bavli glossary) |
| `wikidata_id` | Wikidata QID (from Bavli glossary) |
| `match_type` | How the Bavli entry was found — see table below |
| `match_score` | Confidence 0–100 |
| `match_note` | Matching detail (key strings, distance, Jaccard score) |
| `yerushalmi_variant_names` | Pipe-separated list of raw spelling forms found in the Guggenheimer text |

### Match types

| Type | Score | Method |
|---|---|---|
| `exact` | 100 | Normalized keys are identical after honorific stripping, diacritic removal, and transliteration mapping |
| `token_subset` | 85–99 | All non-trivial tokens of the shorter name appear in the longer one (catches abbreviated patronymics) |
| `fuzzy_edit` | 45 or 30 | Levenshtein ≤ 1 (score 45) or ≤ 2 (score 30) on single-token keys only |
| `none` | 0 | No match found above threshold |

Reversed-name pairs ("Elazar ben Shimon" / "Shimon ben Elazar") are
intentionally **not** matched — they are different people.

---

## Key numbers

- **2,019** unique normalized names, **42,686** total Yerushalmi occurrences
- **391 matched** (19%): 233 exact · 137 fuzzy · 21 token-subset
- **1,628 unmatched** (81%) — mostly Yerushalmi-specific amoraim with no Bavli
  parallel above the count-10 threshold (e.g. R' Mana ×760, R' Yirmeyah ×721,
  R' Yose ben R' Abun ×562, R' Yudan ×238)
- **188** matched names carry a Hebrew Wikipedia link and Wikidata ID
