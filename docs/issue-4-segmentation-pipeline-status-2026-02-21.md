# Issue #4: LLM Co-Segmentation Pipeline Status

Date: 2026-02-21  
Branch: `issue-4-segmentation-pipeline`

## Scope

Implement a phrase segmentation pipeline for Hebrew/English aligned text using an index-based approach that preserves source text integrity, with robust validation and a lightweight UI for experimentation.

## Work Completed

### 1. Core Segmentation Utilities

File: `shared/segmentation.ts`

- Added word-span tokenization with character offsets:
  - `getWordSpans(text)`
- Added boundary-index to contiguous range conversion:
  - `boundariesToWordRanges(boundaries, wordCount)`
- Added range validation:
  - `validateWordRanges(ranges, wordCount)`
- Added segment construction from ranges (exact slicing from original text):
  - `buildSegmentsFromWordRanges(text, ranges)`
- Added reconstruction integrity guard:
  - `validateSegmentationIntegrity(originalText, segments)`

### 2. Structured Output Schema

File: `shared/segmentation-schema.ts`

- Added strict Zod and JSON schema for co-segmentation output.
- Current required structured output fields:
  - `hebrew_segments: [start,end][]`
  - `english_segments: [start,end][]`
  - `hebrew_texts: string[]`
  - `english_texts: string[]`
- Added schema-level constraints:
  - text-array lengths must match segment-array lengths.

### 3. LLM Co-Segmentation Backend Helper

File: `server/lib/segmentation-llm.ts`

- Added OpenAI integration:
  - `coSegmentWithOpenAI(input, options)`
- Added deterministic prompt strategy:
  - indexed word lists for Hebrew/English
  - strict instructions: full contiguous coverage, inclusive indices, 1:1 pair count
  - required verification text arrays
- Added parse/validate helpers:
  - `parseCoSegmentationJson(content)`
  - `validateCoSegmentationOutput(input, output)`
- Added retry/repair loop:
  - `maxAttempts` option (default `2`)
  - repair prompt generated from prior invalid response + error message
- Added auto-recovery logic:
  - recover ranges from verification text arrays when indices are inconsistent
  - normalize trailing under-coverage for contiguous ranges (common off-by-one/end-range miss)

### 4. API Endpoint

File: `server/routes.ts`

- Added `POST /api/segment/co-segment`
- Request payload:
  - `hebrewText` (required)
  - `englishText` (required)
  - `model` (optional)
  - `temperature` (optional)
  - `maxAttempts` (optional, 1-4)
- Returns:
  - validated Hebrew/English segments
  - alignment count
  - raw normalized model output

### 5. Segmentation Lab UI

Files:
- `client/src/pages/segmentation-lab.tsx`
- `client/src/App.tsx`

- Added route: `/segmentation-lab`
- UI capabilities:
  - raw Hebrew/English input
  - model, temperature, maxAttempts controls
  - call co-segmentation endpoint and display aligned outputs
  - show raw JSON response
  - load source text from Sefaria URL via existing `/api/sefaria-fetch`:
    - supports URLs like `https://www.sefaria.org.il/Shabbat.31a.5`

### 6. Dev Runtime Fixes for Local Windows

File: `server/index.ts`

- Removed `reusePort: true` from `server.listen` options (caused Windows `ENOTSUP`).
- Host binding now defaults to:
  - `127.0.0.1` on Windows
  - `0.0.0.0` otherwise

### 7. Tests

Files:
- `tests/segmentation.test.ts`
- `tests/segmentation-llm.test.ts`

- Added and expanded tests for:
  - word span extraction
  - boundaries/ranges conversion
  - contiguous/full-coverage validation
  - exact reconstruction/integrity
  - schema parsing rules
  - segment-count mismatch rejection
  - recovery via verification texts
  - trailing under-coverage auto-repair

Latest run: all segmentation tests passing (`16/16`).

## Current Status

### Functional

- End-to-end experimental flow is implemented:
  1. Load text from Sefaria URL
  2. Run LLM co-segmentation
  3. Validate/repair output
  4. Render aligned segments in UI

### Stable Components

- Integrity-first segmentation primitives
- Strict structured output parsing
- Retry + repair strategy
- UI lab for rapid manual evaluation

## Current Challenges

### 1. Model Range Drift on Long/Tag-Heavy English

- Observed failure mode: model can return partial English range coverage for long inputs with HTML tags.
- Mitigations now implemented:
  - required `*_texts` verification arrays
  - recovery from verification text
  - trailing range normalization
- Remaining risk:
  - model may still return internally inconsistent segment counts/content in difficult passages.

### 2. Token/Complexity Pressure

- Long passages with indexed tokens and HTML increase prompt complexity.
- This can degrade boundary quality and consistency across retries.

### 3. Alignment Quality vs. Strict 1:1 Constraint

- Strict 1:1 can be difficult where English commentary expands significantly relative to Hebrew.
- Current implementation enforces 1:1; quality tradeoffs remain passage-dependent.

## Work Remaining

### High Priority

1. Add LLM integration tests (mocked OpenAI client) for retry paths and repair prompt behavior.
2. Add explicit telemetry/logging for segmentation attempts:
   - attempt count
   - repair activation
   - normalized range adjustments
3. Add optional output diagnostics in API response:
   - `recoveredFromTexts: boolean`
   - `normalizedTrailingCoverage: boolean`
4. Add guardrails for very long inputs:
   - max token/word threshold
   - chunking strategy or pre-segmentation fallback

### Medium Priority

1. Improve prompt with 1-2 Talmud-specific few-shot examples.
2. Add UI diff panel showing model raw ranges vs normalized/recovered ranges.
3. Add a CLI regression harness for fixed refs (e.g., `Shabbat.31a.5`) with snapshot outputs.

### Optional

1. Add per-segment confidence estimation (heuristic or model-derived metadata).
2. Evaluate hybrid fallback:
   - deterministic punctuation/HTML-aware segmentation as backup when model fails repeatedly.

## Files Modified in This Workstream

- `client/src/App.tsx`
- `client/src/pages/segmentation-lab.tsx`
- `server/index.ts`
- `server/routes.ts`
- `server/lib/segmentation-llm.ts`
- `shared/segmentation.ts`
- `shared/segmentation-schema.ts`
- `tests/segmentation.test.ts`
- `tests/segmentation-llm.test.ts`
- `package-lock.json`

## Notes

- Temporary local helper files used during ad-hoc testing (`tmp-seg-input.json`, `tmp-seg-test.ts`) are not part of the intended change set and should remain excluded from commit/PR.
