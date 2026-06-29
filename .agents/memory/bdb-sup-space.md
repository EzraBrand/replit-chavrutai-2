---
name: BDB space-before-sup normalization
description: Why BDB contextual abbreviation keys (e.g. "Dl (Par") sometimes failed to expand, and the convertSupTagsToParens normalization that fixes it.
---

# BDB: space before `<sup>` breaks contextual mapping keys

BDB source from Sefaria is inconsistent: some citations are `X<sup>…</sup>` (no
space) and others `X <sup>…</sup>` (a space before the tag). `convertSupTagsToParens`
turns `<sup>Y</sup>` into ` (Y)` (it *prepends* a space).

**The bug:** when the source already had a space (`X <sup>`), the result was
`X  (Y)` — a **double space**. A contextual mapping key written with a single
space (e.g. `"Dl (Par"`) then silently failed to match, so the abbreviation
never expanded on those entries.

**Fix:** `convertSupTagsToParens` now consumes one optional leading space
(` ?<sup>…` → ` ($1)`), so both `X<sup>` and `X <sup>` normalise to a single
space before the paren. Mapping keys must always be written with a **single**
space (`"Dl (Par"`, not `"Dl  (Par"`).

**Why it matters:** the symptom is "I added the mapping but it doesn't convert
on this specific entry." Before blaming the key, confirm whether the source has
a space before `<sup>` and that the single-space normalization in
`convertSupTagsToParens` is still intact. A real example: lemma סְפַרְוַ֫יִם
has both `Dl <sup>Par …</sup>` and `Wkl <sup>Alttest. Unters. …</sup>`.
