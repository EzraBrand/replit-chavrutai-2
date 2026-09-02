---
name: RTL dash split wrapping
description: How to keep a spaced dash as a paragraph split without letting it become visually isolated.
---

For a spaced en/em dash that remains a paragraph boundary, replace its leading ordinary space with U+00A0 NO-BREAK SPACE followed by U+2060 WORD JOINER: `word ⁠–\nnext`. This binds the dash leftward while preserving the semantic newline after it. Do not wrap the phrase in an inline-block.

**Why:** Word joiners around an ordinary space still allowed Chrome to visually isolate the dash in narrow RTL text. An inline-block can reorder Hebrew, while NBSP plus a joiner removes the pre-dash opportunity without changing the post-dash boundary.

**How to apply:** Insert the joiner idempotently before punctuation splitting, preserve existing HTML tags, and verify the result at the actual narrow bilingual width because string tests alone cannot prove visual wrapping.