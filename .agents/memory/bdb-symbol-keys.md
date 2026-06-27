---
name: BDB symbol/letter abbreviation keys
description: Why single-character symbol keys that double as script letters need a citation-context guard in expandAbbreviations.
---

# BDB symbol keys that are also valid script letters

When a BDB abbreviation key is a single character that is *also* a normal letter
in some script the lexicon quotes (e.g. `ψ` = Psalms siglum, but also the Greek
letter inside words like ψυχή), a bare `key -> expansion` mapping in
`shared/data/lexicon-mappings/bdb.json` will corrupt those quoted words.

**Why:** `expandAbbreviations` (`client/src/lib/dictionary-format.ts`) anchors
non-word keys with ASCII-only lookarounds `(?<![A-Za-z0-9_]) … (?![A-Za-z0-9_])`.
Greek/Hebrew/etc. letters are non-ASCII, so the lookarounds do NOT stop a match
inside a foreign-script word.

**How to apply:** Add a per-key guard in the `.replace()` callback (alongside the
existing `c.` frequency-marker guard) that only fires the expansion in the
intended context. For `ψ`, BDB only uses it as a Psalms citation (`ψ 23`,
`ψ 119:105`), so the guard requires the match be followed by optional space + a
digit; otherwise return the match unchanged. Mirror this pattern for any future
symbol-that-is-also-a-letter key.

## Unicode word boundaries in expandAbbreviations

`expandAbbreviations` must NOT rely on JS `\b` for token boundaries. `\b` only
recognises ASCII word chars, so a key like `Pe` matched inside `Peḳaḥ` (the `ḳ` =
U+1E33 counts as non-word, satisfying `\b`). Same risk for any key adjacent to
accented transliteration letters, Hebrew, Greek, etc.

**Why:** abbreviation keys are short; without true boundaries they match as
prefixes/suffixes of longer multilingual words.

**How to apply:** Build boundaries from Unicode property escapes
`[\p{L}\p{N}\p{M}_]` with negative lookarounds and the `u` flag, anchoring a side
only when the key's edge char is itself a word char. Symbol/punctuation edges
(e.g. `(Sym`, `+.`) need no anchor. When adding the `u` flag, every regex over a
mapping key must still escape regex metacharacters (already done) so it stays
valid in unicode mode.
