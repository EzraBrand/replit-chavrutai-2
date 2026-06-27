---
name: BDB literal angle-bracket markers vs HTML-tag splitter
description: Why expandAbbreviations must split on real tags only — BDB uses literal < and > as scholarly markers.
---

BDB lexicon text uses literal `<` ("derived from") and `>` ("preferred over") as
scholarly markers, not just as HTML. `expandAbbreviations` (in
`client/src/lib/dictionary-format.ts`) splits text into tag vs. non-tag segments
and only expands abbreviations in non-tag segments.

**Rule:** the split regex must match *genuine* HTML tags only —
`/(<\/?[a-zA-Z][^>]*>)/`, i.e. `<` followed by a letter or `</`.

**Why:** A naive `/(<[^>]*>)/` treats a bare literal `<` (e.g. `< name of Bab.
king`) as the start of a tag and swallows everything up to the next real tag's
`>` into one "tag" segment, so abbreviations in that span silently never expand
(observed: `Bab.` not expanding in the Nimrod entry). The earlier lookahead
form `(?![^<]*>)` had the mirror-image bug for literal `>`.

**How to apply:** If a BDB abbreviation refuses to expand only in certain
entries, check whether a literal `<` or `>` marker sits between it and the next
real tag. Don't widen the splitter to `[^>]*` again.
