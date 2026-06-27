# BDB Noun-Proper Scraper

`scrape-bdb-noun-proper.ts` — extract every "noun proper" (n.pr.*) entry from the cached Brown-Driver-Briggs (BDB) Hebrew Bible dictionary into a clean, human-readable CSV (and a parallel JSON) for downstream analysis.

## Abstract

A machine-readable extraction of every "noun proper" entry in the **Brown-Driver-Briggs Hebrew Lexicon** (BDB, 1906) — the standard scholarly dictionary of biblical Hebrew — covering personal names, place names, deities, peoples, rivers, mountains, and other named entities. The source HTML was harvested from Sefaria's lexicon API and parsed; BDB's dense, century-old scholarly shorthand is then expanded into modern equivalents and split into structured columns suitable for filtering, sorting, and downstream analysis (including LLM ingestion).

**Headline numbers**

- **1,796 senses** across **1,741 unique headwords** (homonyms get separate rows — e.g. `אָדָם` appears as both "the man" and "the city")
- **6,588 Bible references** in canonical full-name form (`II Samuel 23:32`, not BDB's terse `2 S. 23, 32`)
- **0 parse failures**

**What's been modernized**

- POS abbreviations expanded (`n.pr.m.` → `masculine`, `n.pr.loc.` → `locative (place name)`, `n.pr.gent.` → `gentilic (people group)`, …)
- Bible references canonicalized to Sefaria-format full book names with Roman numerals
- Etymology, definition body, Bible refs, and internal BDB cross-references split into separate columns
- Words in non-Latin scripts get an inline `[transliteration]` appended in both the **definition** and the **etymology**:
  - **Greek** → Latin (classical / scholarly): `Ἑβραῖος [Hebraios]`, `Πυθαγόρας [Pythagoras]`, `Ῥόδος [Rhodos]`, `Ὠκεανός [Ōkeanos]`, archaic digamma as in `Ἰάϝονες [Iawones]`
  - **Syriac** → Hebrew (one-to-one cognate-letter mapping with sofit forms): `ܐܰܒܕܳܢܳܐ [אבדנא]`, `ܒܰܪ ܗܰܕܰܕ [בר הדד]`
  - **Arabic** → Latin per **DIN 31635** (the Semitic-studies standard): `أَجِيرٌ [ʾajīrun]`, `بَطْنٌ [baṭnun]`, `أَوَّابٌ [ʾawwābun]`, `أُرْفَةٌ [ʾurfahun]`
- CSV is Excel-safe — cells starting with `=` are prefixed with `'` so Excel and Google Sheets won't interpret them as formulas

**Format**

- `bdb-noun-proper.csv` — 445 KB, RFC-4180 quoted, UTF-8 (8 columns: `row, headword, sense_index, pos, etymology, definition, refs, other_refs`)
- `bdb-noun-proper.json` — 807 KB, the same data as a plain array of objects (no `row` field — array index serves)

## What it does

Walks the local BDB cache (built by `scan-lexicon-acronyms.ts --lexicon=bdb`), finds every dictionary sense whose definition is tagged as a proper noun (`n.pr.`, `n.pr.m.`, `n.pr.f.`, `n.pr.loc.`, `n.pr.gent.`, `n.pr.div.`, …), and modernizes the BDB shorthand using ChavrutAI's existing logic:

- **POS abbreviations** are expanded via `client/src/data/bdb-mappings.json` (e.g. `n.pr.m.` → `noun proper masculine`, `n.pr.loc.` → `noun proper locative (place name)`).
- **Bible references** are pulled from Sefaria's `data-ref` attributes, which already give canonical names with Roman numerals (`II Samuel 23:32`, `I Chronicles 11:33`).
- **Internal BDB cross-references** (`BDB, שְׁאוֹל`, etc.) are separated from Bible refs into their own column.
- **Etymology** — the parenthetical scholarly gloss right after the POS — is split out into its own column.
- **Definition** — the prose body — is cleaned of refs, sentinels, and stray punctuation.

## Input

- **Cache:** `scripts/.cache/bdb-corpus/<headword>.json` — one file per BDB headword query, populated by the BDB acronym scanner.
- **Mappings:** `client/src/data/bdb-mappings.json` — the abbreviation expansion table shared with the live `/bdb` reader.
- **Bible book list:** `shared/bible-books.ts` — used to filter `data-ref` values into Bible vs. non-Bible.

If the cache is missing, the script exits with instructions to run the scanner first.

## Output

Two files written to `scripts/`:

- `bdb-noun-proper.csv` — ~445 KB, 1,796 rows + 1 header, RFC-4180 quoted
- `bdb-noun-proper.json` — ~807 KB, the same data as a plain array of objects

### Columns

| Column        | Description                                                                                                                    |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `row`         | **CSV only.** 1-based sequential row number for easy human reference (e.g. "see row 412"). Omitted from the JSON output, where consumers can use the array index. |
| `headword`    | The Hebrew/Aramaic headword as BDB lists it (with vowel points and cantillation).                                              |
| `sense_index` | 1-based position in the entry's recursive sense tree. Disambiguates homonyms — e.g. `אָדָם` has `sense_index=7` (the man) and `sense_index=9` (the city). |
| `pos`         | Part-of-speech subcategory. Since every row in this file is a noun proper, the redundant `noun proper` prefix is stripped: just `masculine`, `feminine`, `locative (place name)`, `gentilic (people group)`, `river`, `mountain`, `divine name`, etc. (Empty when the source is just plain `n.pr.` with no further qualifier.) The JSON output keeps the full string for programmatic consumers. |
| `etymology`   | The parenthetical etymology / gloss right after the POS — typically a short English meaning like `God hides`, `my father is joy`. May be empty. Greek words inside the etymology are annotated with `[Latin transliteration]` (see "Greek transliteration" below). In the CSV only, cells starting with `=` are prefixed with `'` to defuse Excel/Sheets formula interpretation (see "Excel safety" below). |
| `definition`  | The prose body of the sense, with Bible refs removed (they live in their own column), minor punctuation tidied, AND a Latin transliteration appended in `[brackets]` after every Greek word or phrase (see "Greek transliteration" below). Same CSV `=` defusing as the etymology column. |
| `refs`        | Bible references only, semicolon-joined, in canonical Sefaria form (`II Samuel 23:32; I Chronicles 11:33`).                    |
| `other_refs`  | Internal BDB cross-references (`BDB, שְׁאוֹל`) and any non-Bible `data-ref` values, semicolon-joined.                          |

### Example row

For Sefaria entry [BDB, אֶלְיַחְבָּא](https://www.sefaria.org.il/BDB%2C_%D7%90%D6%B6%D7%9C%D6%B0%D7%99%D7%97%D6%B0%D7%91%D6%BC%D6%B8%D7%90):

> † אֶלְיַחְבָּא n.pr.m. (God hides) one of David's chiefs 2 S 23:32 1 Ch 11:33.

becomes (CSV):

| headword     | sense_index | pos        | etymology  | definition                | refs                                           | other_refs |
| ------------ | ----------- | ---------- | ---------- | ------------------------- | ---------------------------------------------- | ---------- |
| אֶלְיַחְבָּא | 1           | masculine  | God hides  | one of David's chiefs.    | II Samuel 23:32; I Chronicles 11:33            |            |

And for an entry whose definition contains Greek (e.g. אֶגְלַ֫יִם — a town in Moab):

> definition column: `town in Moab; (meaning?);? cf. Αἰγαλειμ [Aigaleim] (Euseb.) 9 m. S. of Areopolis…`

The `[Aigaleim]` after `Αἰγαλειμ` is added automatically by the transliterator.

## Greek transliteration

828 of the 1,796 definitions contain Greek (mostly Septuagint / Eusebian transliterations of Hebrew place- and person-names). Each Greek word or phrase is automatically followed by a Latin transliteration in square brackets, using **standard scholarly classical Greek conventions**:

| Greek                  | Transliteration |
| ---------------------- | --------------- |
| α β γ δ ε ζ η θ        | a b g d e z **ē** th |
| ι κ λ μ ν ξ ο π        | i k l m n x o p |
| ρ σ/ς τ υ φ χ ψ ω      | r s t **y** ph ch ps **ō** |

**Special rules applied:**

- **Long vowels with macrons:** η → `ē`, ω → `ō`.
- **Aspirated stops:** θ → `th`, φ → `ph`, χ → `ch`, ψ → `ps`.
- **Diphthongs ending in υ:** αυ → `au`, ευ → `eu`, ηυ → `ēu`, ου → `ou`. (Standalone υ stays as `y`.)
- **Rough breathing on initial vowel** → `h`-prefix (Ἑλλάς → `Hellas`, Ἥρα → `Hēra`, ὕδωρ → `hydōr`). When the vowel is capital, the H takes the capital and the vowel drops to lowercase.
- **Rough breathing on initial ρ** → `rh` (Ῥόδος → `Rhodos`).
- **"ngamma" rule:** γ before γ/κ/χ/ξ → `n` (ἄγγελος → `angelos`, Σφίγξ → `Sphinx`).
- **Diacritics stripped:** acute, grave, circumflex, smooth breathing, iota subscript, diaeresis — none of these affect the Latin form.

Verified against thirteen test cases including `Ἑβραῖος → Hebraios`, `Πυθαγόρας → Pythagoras`, `εὐαγγέλιον → euangelion`, `Σφίγξ → Sphinx`, `Ὠκεανός → Ōkeanos`. The transliteration applies in both the CSV and the JSON output.

## Excel safety (CSV only)

20 definitions and 25 etymologies in BDB begin with `=` (e.g. `= iii. אָמוֹן.`, `= אַשְׁבְּאֵל? so Thes…`). Excel and Google Sheets interpret any cell starting with `=` as a formula, which would render those rows as `#NAME?` errors (and is also the standard CSV-injection attack vector). At CSV write time the script prefixes any such cell with a single apostrophe (`'=`) — this is the conventional spreadsheet escape: the apostrophe forces literal-text mode and is itself hidden from the displayed cell. The JSON output is untouched (programmatic consumers don't have this problem and shouldn't see a phantom apostrophe).

## Run it

```bash
npx tsx scripts/scrape-bdb-noun-proper.ts
```

No flags. Reruns are idempotent — they overwrite the two output files in place.

If the BDB cache hasn't been built yet:

```bash
npx tsx scripts/scan-lexicon-acronyms.ts --lexicon=bdb --concurrency=12
```

## Summary stats (current run)

- 9,045 cache files scanned, 10,631 BDB entries
- 4,529 cross-file duplicates skipped (Sefaria returns the same `rid` from multiple voweled/unvoweled query variants — see "Pipeline notes" below)
- **1,796 noun-proper senses across 1,741 unique headwords**
- ~55 headwords have multiple n.pr. senses (e.g. אָדָם is both a person and a city; אָשֵׁר is both the tribe and the patriarch)
- 6,588 Bible refs cleanly separated from 370 internal BDB cross-refs
- Zero parse failures

POS distribution: n.pr.m. 1084 · n.pr.loc. 433 · n.pr.f. 96 · n.pr. 87 · n.pr.gent. 30 · n.pr.terr. 18 · n.pr.fl. 10 · n.pr.mont. 10 · n.pr.div. 9 · n.pr.dei. 5 · long tail of compounds (n.pr.gent.pl., n.pr.terr.m., n.pr.m.coll., …).

## Pipeline notes (gotchas the script handles)

1. **Cross-file duplicate entries.** A single BDB `rid` often appears in 3+ cache files because Sefaria's `/api/words/` endpoint returns related entries from queries for voweled/unvoweled/cantillated variants of a headword (e.g. `BDB00130 "Adam"` came back from both `אָדָם` and `אֱדֹם` queries). The script dedupes by `rid` before walking senses; entries without a `rid` fall back to a `headword + first-80-chars-of-definition` hash.

2. **Recursive sense walking.** Many n.pr. senses live in nested `senses[i].senses[j]` rather than top-level. For example, `אָדָם` has its `n.pr.m. Adam` definition at sub-sense 4.1 (because the top level holds `n.m. man, mankind`). A naive `senses[0]`-only scan was missing 86 entries; the recursive walk catches them all and assigns each a unique `sense_index`.

3. **Bible-ref filtering.** Sefaria's `data-ref` attribute covers BOTH Bible passages AND internal BDB cross-references (`BDB, שְׁאוֹל`, `BDB, אֲבִיאֵל`, etc.). The script filters `refs` to canonical Bible book names (via `ALL_BIBLE_BOOKS` from `shared/bible-books.ts`) and routes the rest to `other_refs`.

4. **Sentinel-replace for refs.** Bible-ref anchors are rewritten to `◊REF◊` placeholders BEFORE tag-stripping, so balanced-paren etymology extraction still works. After the etymology is split off, the sentinels are scrubbed from BOTH `etymology` and `definition` (an early version leaked sentinels into 135 etymology cells).

5. **POS expansion fallback.** Compound POS like `n.pr.gent.pl.` aren't all in `bdb-mappings.json` — the long tail is too sparse to maintain by hand. The script tries longest-prefix match and emits e.g. `noun proper gentilic (people group) (pl)` as a graceful fallback.

## Files

- **Script:** `scripts/scrape-bdb-noun-proper.ts`
- **Output (CSV):** `scripts/bdb-noun-proper.csv`
- **Output (JSON):** `scripts/bdb-noun-proper.json`
- **Cache (input):** `scripts/.cache/bdb-corpus/`
- **Mappings (input):** `client/src/data/bdb-mappings.json`
- **Bible book list (input):** `shared/bible-books.ts`

## Possible next steps

- Cross-link `n.pr.loc.` / `n.pr.terr.` / `n.pr.mont.` / `n.pr.fl.` entries to GeoJSON for a Bible atlas overlay.
- Add chained-POS detection for entries like `<strong>n.pr.gent.</strong> & <strong>terr.</strong>` (currently only the first POS is captured).
- Generalize to a `scrape-bdb-pos.ts --pos=…` driver so other POS classes (verbs, prepositions, etc.) can be extracted with the same pipeline.
- Use Sefaria's `headword_unvoweled` (if exposed) for cleaner alphabetical sorting — current locale sort puts maqaf-bearing headwords in slightly weird spots.
