# Jastrow abbreviation review

## Provenance

- Source: Jastrow, *List of Abbreviations*, London, Luzac, 1903
- Digitized source: `https://www.sefaria.org/api/v3/texts/Jastrow,_List_of_Abbreviations`
- Review date: 2026-09-03
- Source rows parsed: 279
- Existing real mappings before this review: 402

## Reconciliation

The authoritative list had 40 keys absent from the existing mapping file. Thirty-four were approved. Six were deliberately rejected as global mappings because a single letter followed by a period is too ambiguous:

- `a.`
- `c.`
- `r.`
- `S.`
- `s.`
- `w.`

The source also disagrees textually with many existing expansions because Bekiut uses modernized tractate names and concise reader-facing labels. Those differences are retained rather than overwritten automatically.

## Corpus evidence

A deterministic sample of 220 headwords, spread across the 30,756-entry local headword index, returned 277 Jastrow entries and 446 senses through the app’s Jastrow search route. Candidate tokens were ranked by frequency with their source headword and surrounding definition text retained during review.

Twenty additional high-confidence forms were approved from this sample. The batch favors grammatical labels, language labels, edition citations, and other forms whose meaning is stable in context. Longer forms such as `Part. pass.` and `ed. Lag.` intentionally take precedence over their shorter components.

## Repeatable workflow

Run the reconciliation script from the repository root:

```sh
node scripts/reconcile-jastrow-abbreviations.mjs
```

To include a locally cached JSON array of Jastrow entries in the frequency report:

```sh
node scripts/reconcile-jastrow-abbreviations.mjs \
  --corpus=/tmp/jastrow-corpus-sample.json \
  --output=/tmp/jastrow-abbreviation-report.json
```

The report separates exact matches, textual conflicts, missing source keys, explicitly rejected single-letter keys, and corpus candidates. It never changes the mapping file automatically; reviewed additions remain a deliberate code change.