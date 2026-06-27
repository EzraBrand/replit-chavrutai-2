# Text Processing Refactor — Research & Ideas

## Current State

The text processing system spans **~2,100 lines** across 5 files (+494 lines of JSON config), handling bilingual Hebrew/English text transformation for Talmud, Mishnah, Rambam, Yerushalmi, and Bible content.

### File Inventory

| File | Lines | Role |
|------|-------|------|
| `shared/text-processing.ts` | 582 | Core Talmud Hebrew/English splitting + term replacement |
| `client/src/lib/text-processing.ts` | 369 | Client wrapper: Mishnah, Rambam, Bible processing + Bible citation linking |
| `server/lib/bible-text-processing.ts` | 403 | Server-side Bible: cantillation splitting, divine name replacement, English verse splitting |
| `shared/number-parser.ts` | 193 | Cardinal number-word → digit conversion |
| `shared/term-replacements-schema.ts` | 62 | Zod schema + loader for term-replacements JSON |
| `shared/data/term-replacements.json` | 494 | ~500 term mappings in categorized JSON |

### Consumers (13 import sites)

- **Client pages:** `mishnah-chapter`, `rambam-chapter`, `yerushalmi-chapter`, `search`, `sugya-viewer`
- **Client components:** `sectioned-bilingual-display`, `bible-text-display`, `hebrew-text`, `english-text`
- **Server routes:** `talmud`, `mishnah`, `yerushalmi`, `rambam`
- **Tests:** `tests/text-processing.test.ts`, `client/src/lib/text-processing.test.ts`

---

## Pain Points & Complexity Drivers

### 1. Regex Sprawl
The shared file alone declares **40+ pre-compiled regex patterns** at module scope (lines 65–123). Many are subtle variants of each other (e.g., `PERIOD_QUOTE_PATTERN` vs `PERIOD_SPLIT_PATTERN` vs `QUESTION_QUOTE_PATTERN`). Understanding which pattern fires when requires tracing through the step-by-step logic in `splitEnglishText`, which spans 125 lines of sequential regex replacements.

### 2. Duplicated "Protection Pattern"
The protect-then-restore idiom (replace sensitive content with placeholders, process, restore) is reimplemented from scratch in at least **5 separate functions**:
- `splitHebrewText` — protects HTML tags, punctuation clusters, ellipses
- `splitEnglishText` — protects "son of" patterns, HTML tags, ellipses, punct-tag-quote clusters
- `linkBibleCitations` — protects existing anchors, HTML tags
- `processRambamEnglishText` — protects `<sup>` footnotes, `<em>` italics
- `processMishnahEnglishText` — protects abbreviations with null bytes

Each reimplements the same placeholder-replace-restore loop with different naming conventions (`__HTML_TAG_N__`, `___PROTECTED_N___`, `\x00RAMBAM_NOTE_N\x00`, etc.).

### 3. Duplicated Hebrew Punctuation Replacement Rules
`processMishnahHebrewText` and `processRambamHebrewText` share ~20 identical Hebrew speech-formula replacements (אומר, → אומר:  etc.). These are copy-pasted between the two functions with only 2-3 lines of difference at the end.

### 4. Duplicated English Sentence-Splitting Logic
`processMishnahEnglishText` and `processRambamEnglishText` both implement:
- Strip HTML → normalize whitespace
- Protect abbreviations (`i.e.`, `e.g.`, `ibid.`, `R.`, `b.`) with null bytes
- Split on punctuation + uppercase or punctuation + space
- Restore abbreviations
- Final whitespace cleanup

The Rambam version adds footnote/italic protection, but the core splitting logic is near-identical.

### 5. Scattered Concerns Across shared/client/server
- **Nikud removal** lives in `shared/` but Bible-specific nikud+cantillation removal is reimplemented in `server/lib/bible-text-processing.ts`
- **Divine name replacement** (YHWH) is entirely in the server Bible file, though it's a text transformation like any other
- **Term replacement** is in `shared/` but only used by Talmud and Bible English paths
- **Number parsing** is in `shared/` but Bible ordinals are reimplemented separately in `server/lib/bible-text-processing.ts`

### 6. "Work-Specific" Branching
The system has evolved per-corpus functions rather than a composable pipeline:
- `processHebrewTextCore` (Talmud)
- `processMishnahHebrewText` (Mishnah)
- `processRambamHebrewText` (Rambam)
- `processBibleHebrewText` (Bible)
- `processHebrewVerse` (Bible — server)
- `processEnglishText` (Talmud)
- `processMishnahEnglishText` (Mishnah)
- `processRambamEnglishText` (Rambam)
- `processBibleEnglishText` (Bible — client)
- `processBibleEnglish` (Bible — server)

That's **10 top-level processing functions** for what is conceptually two tasks (process Hebrew, process English) parameterized by corpus.

---

## Refactoring Ideas

### Idea A: "Pipeline Builder" Pattern

Replace the monolithic per-corpus functions with a composable pipeline where each step is a small, testable transform function.

```
type TextTransform = (text: string) => string;

function pipeline(...steps: TextTransform[]): TextTransform {
  return (text) => steps.reduce((t, step) => step(t), text);
}
```

Each corpus would declare its pipeline:

```
const talmudHebrew = pipeline(
  removeNikud,
  handleMishnaGemaraMarkers,
  protectAndSplit(hebrewPunctuationRules),
  normalizeWhitespace,
);

const mishnahHebrew = pipeline(
  removeNikud,
  hebrewSpeechFormulas,    // shared with Rambam
  normalizeWhitespace,
);

const rambamHebrew = pipeline(
  removeNikud,
  hebrewSpeechFormulas,    // same shared step
  trailingColonToperiod,   // Rambam-specific
  normalizeWhitespace,
);
```

**Pros:** Eliminates duplication, makes per-corpus differences visible at a glance, each step is independently testable.

**Cons:** Requires careful ordering documentation; some steps have dependencies (e.g., protect before split, restore after). A simple linear pipeline may not capture protect/restore pairs cleanly.

### Idea B: "Protect/Process/Restore" Abstraction

Extract the protection pattern into a reusable utility:

```
function withProtection(
  protectors: Array<{ pattern: RegExp; prefix: string }>,
  process: TextTransform,
): TextTransform {
  return (text) => {
    const store = new ProtectionStore();
    let protected = text;
    for (const p of protectors) {
      protected = store.protect(protected, p.pattern, p.prefix);
    }
    const processed = process(protected);
    return store.restore(processed);
  };
}
```

This would eliminate the 5 separate reimplementations of placeholder management. Each function would declare *what* to protect but not *how*.

**Pros:** Big reduction in boilerplate; bug fixes to protection logic apply everywhere.

**Cons:** Ordering of protections matters (some must happen before others); need to handle nested protections carefully.

### Idea C: Corpus-Config Objects

Define each corpus's processing rules as a configuration object rather than imperative code:

```
const MISHNAH_CONFIG: CorpusConfig = {
  hebrew: {
    removeNikud: true,
    speechFormulaReplacements: SHARED_SPEECH_FORMULAS,
    customReplacements: [
      { pattern: /(איזהו\s+[^,\n]+),/, replacement: '$1?' },
      // ...
    ],
    splitOnPunctuation: false,   // Mishnah comes pre-split
  },
  english: {
    stripHtml: true,
    nameReplacements: MISHNAH_NAME_MAP,
    abbreviationProtection: true,
    splitOnSentences: true,
    termReplacement: false,      // Mishnah doesn't use shared term replacement
  },
};
```

A single generic processor reads the config and applies steps accordingly.

**Pros:** Adding a new corpus = adding a config object, not writing 2 new functions. Differences between corpora become declarative and diffable.

**Cons:** Some transformations are complex enough that they resist pure configuration (e.g., the English bold-tag comma splitting, Bible cantillation splitting). May need an escape hatch for custom transform functions.

### Idea D: Domain-Specific File Split

Instead of shared/client/server split, organize by *text domain*:

```
shared/text-processing/
  core.ts              — pipeline(), withProtection(), normalizeWhitespace()
  hebrew-common.ts     — removeNikud, speechFormulas, hebrewPunctuationSplit
  english-common.ts    — replaceTerms, sentenceSplit, abbreviationProtection
  talmud.ts            — talmudHebrew, talmudEnglish (pipelines)
  mishnah.ts           — mishnahHebrew, mishnahEnglish (pipelines)
  rambam.ts            — rambamHebrew, rambamEnglish (pipelines)
  bible.ts             — bibleHebrew, bibleEnglish, cantillationSplit, divineNames
  number-parser.ts     — unchanged
  term-replacements/   — schema + JSON (unchanged)
```

**Pros:** Each file is small and focused; easy to find where Bible vs. Talmud logic lives. Shared building blocks are explicit imports.

**Cons:** More files to navigate; import paths change (but can be re-exported from a barrel index).

### Idea E: Hybrid (Recommended)

Combine ideas A + B + D:

1. **Extract shared primitives** into `shared/text-processing/core.ts`:
   - `pipeline()` combinator
   - `ProtectionStore` class (idea B)
   - `normalizeWhitespace()`, `stripHtml()`, `removeNikud()`

2. **Extract shared Hebrew rules** into `shared/text-processing/hebrew-common.ts`:
   - `hebrewSpeechFormulas()` — the 20+ shared replacements used by Mishnah + Rambam
   - `hebrewPunctuationSplit()` — the full Talmud splitting logic
   - `handleMishnaGemaraMarkers()`

3. **Extract shared English rules** into `shared/text-processing/english-common.ts`:
   - `protectAbbreviations()` / `restoreAbbreviations()` — shared by Mishnah, Rambam, Talmud
   - `sentenceSplit()` — generic split-on-punctuation with configurable rules
   - `replaceTerms()` + number parsing (unchanged)

4. **Per-corpus pipelines** in dedicated files, each <50 lines:
   - `shared/text-processing/talmud.ts`
   - `shared/text-processing/mishnah.ts`
   - `shared/text-processing/rambam.ts`
   - `shared/text-processing/bible.ts`

5. **Barrel export** via `shared/text-processing/index.ts` preserving existing public API so consumers don't need to change imports.

---

## What NOT to Refactor

- **`number-parser.ts`** — Clean, well-documented, self-contained. Leave as-is.
- **`term-replacements-schema.ts` + JSON** — Clean separation of data and schema. Leave as-is.
- **`linkBibleCitations`** — Client-only, small, self-contained. Can stay in client lib.

---

## Risk Assessment

| Risk | Severity | Mitigation |
|------|----------|------------|
| Regression in text display | **High** — text rendering affects every page | Existing test suites (`tests/text-processing.test.ts`, `client/src/lib/text-processing.test.ts`) must pass before/after. Add snapshot tests for key edge cases before starting. |
| Import path breakage | **Medium** — 13 consumer files | Use barrel re-export (`index.ts`) to preserve existing import paths. Update consumers only if needed. |
| Performance regression | **Low** — current pre-compiled patterns are fast | Pipeline combinator adds negligible overhead (one function call per step). Protection store is comparable to current manual approach. |
| Ordering bugs | **Medium** — step order matters | Each pipeline is explicitly ordered in code. Document why ordering matters. Add integration tests with real Sefaria API responses. |

---

## Estimated Effort

| Phase | Work |
|-------|------|
| 1. Snapshot tests | Add before/after snapshot tests using real API text samples (~20 cases) |
| 2. Extract primitives | `pipeline()`, `ProtectionStore`, shared utilities |
| 3. Extract shared rules | Hebrew speech formulas, abbreviation protection, sentence splitting |
| 4. Build per-corpus pipelines | Talmud, Mishnah, Rambam, Bible — compose from shared pieces |
| 5. Wire up barrel exports | `index.ts` preserving public API |
| 6. Update consumers | Minimal — mostly import path adjustments if any |
| 7. Verify | Run all tests, spot-check each corpus type in the app |

Total: Medium-sized refactor, best done as a focused task.

---

## Open Questions

1. **Should Bible processing move to `shared/`?** Currently split between client (`processBibleHebrewText`, `processBibleEnglishText`) and server (`processHebrewVerse`, `processBibleEnglish`, `splitEnglishByCommas`). The server does heavy lifting (cantillation, YHWH), client does light cleanup. Could unify, but would increase shared bundle size.

2. **Should the Mishnah/Rambam name replacement maps be externalized to JSON?** Currently hardcoded (`Joshua` → `Yehoshua`, etc.). Could follow the term-replacements pattern for consistency, or keep inline since they're small and corpus-specific.

3. **How far to push the pipeline pattern?** The Talmud English splitting is genuinely complex (bold-tag comma handling, cross-tag scenarios). A pure pipeline may need a few "compound steps" that internally use protect/process/restore. This is fine — the goal is to eliminate *duplication*, not to force every transformation into a single-line function.
