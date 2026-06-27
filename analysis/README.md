# Guggenheimer Greek & Latin Loanword Extraction

## Abstract

This dataset catalogs Greek and Latin loanwords identified in Heinrich W. Guggenheimer's English translation and commentary of the Jerusalem Talmud (Talmud Yerushalmi), as available through the Sefaria API. The extraction script systematically traverses all 39 tractates of the Yerushalmi across 297 chapters, parsing Guggenheimer's scholarly footnotes for explicit references to Greek and Latin etymologies.

Guggenheimer frequently annotates Talmudic terms with their Greco-Roman origins — marking words with labels such as "Greek" or "Latin" followed by the source term, often in the original Greek script or transliterated Latin. The script identifies these annotations through three complementary methods: detection of Greek Unicode characters (U+0370–U+03FF, U+1F00–U+1FFF), pattern matching on labeled etymologies (e.g., "Latin *strata*", "from Greek δήλωμα"), and extraction of italicized terms immediately following language markers.

## Dataset Summary

- **1,867 total entries** across 38 of 39 tractates
- **1,512 Greek entries** (81%) and **355 Latin entries** (19%)
- **999 unique words**
- Source: Sefaria API, Guggenheimer translation (versionTitle: "The Jerusalem Talmud, translation and commentary by Heinrich W. Guggenheimer")

## CSV Columns

| Column | Description |
|---|---|
| `word` | The Greek or Latin word as it appears in the footnote (in original script or transliterated) |
| `type` | Language classification: `Greek` or `Latin` |
| `note` | Full text of the footnote providing scholarly context for the word |
| `url` | Direct link to the relevant section on [chavrutai.com](https://chavrutai.com), formatted as `/yerushalmi/{Tractate}/{Chapter}#{Halakhah}-{Segment}` |
| `sefaria_ref` | Sefaria reference in the format `Jerusalem_Talmud_{Tractate}.{Chapter}.{Halakhah}.{Segment}` |

## Script

`extract-greek-latin.cjs` — Node.js script that:
1. Reads the structural "shape" data (`yerushalmi-shapes.json`) to determine how many halakhot exist per chapter
2. Fetches each halakhah from the Sefaria API with the Guggenheimer English translation
3. Extracts footnotes from the HTML response (`<i class="footnote">...</i>`)
4. Applies pattern matching to identify Greek/Latin word references
5. Writes results incrementally to CSV, supporting resume via a tractate argument

### Usage

```bash
# Full extraction (all 39 tractates, ~2,211 API requests)
node analysis/extract-greek-latin.cjs

# Resume from a specific tractate
node analysis/extract-greek-latin.cjs Jerusalem_Talmud_Shabbat
```

## Notes

- The dataset reflects Guggenheimer's editorial choices in identifying loanwords; it is not an exhaustive linguistic analysis
- Some entries may capture multiple Greek/Latin words from the same footnote, each as a separate row with the full note repeated for context
- Greek words appear in their original polytonic script where Guggenheimer uses it; otherwise they appear in transliteration
- The `url` column links to ChavrutAI's Yerushalmi reader, which provides the full bilingual Hebrew-English text with footnotes
