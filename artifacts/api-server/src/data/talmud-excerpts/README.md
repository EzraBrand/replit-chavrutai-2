# Talmud excerpt snapshot

Regenerate from the repository root:

```sh
pnpm --filter @workspace/scripts exec tsx src/generate-talmud-excerpts.ts
pnpm --filter @workspace/scripts exec tsx --test src/generate-talmud-excerpts.test.ts
pnpm --filter @workspace/scripts exec tsx src/validate-talmud-excerpts.ts
```

The generator downloads only the explicitly named Sefaria GCS editions into a
resumable cache under `/tmp`, checks bilingual segment positions, and emits at
most five aligned leading segments per folio. It never substitutes a merged or
different edition.

English is **William Davidson Edition - English** and Hebrew/Aramaic is
**William Davidson Edition - Vocalized Aramaic**. Generated excerpts are
attributed to Sefaria and those editions and are distributed under their
**CC-BY-NC** license. The per-tractate source URLs and generation timestamp are
recorded in each JSON file. See `manifest.json` for measured byte size,
coverage, and every upstream exception. This generation populated 4,708 of
5,350 routes in 14,178,834 bytes of tractate JSON. The remaining 642 routes are
enumerated in the manifest; 641 are blocked by unavailable or unlicensed
explicit-edition exports, and Nazir 33b has no complete aligned leading
segment. The manifest is the authoritative current measurement.

`sourceEvidence` documents targeted provenance checks for the three blocked
tractates and the genuine Nazir 33b source gap. In particular, Menachot and
Chullin retain their export/API license value of `unknown`; this snapshot does
not infer a CC-BY-NC license simply because another Davidson export has one.