---
name: Jastrow abbreviation safety
description: Durable review policy for expanding Jastrow abbreviations without corrupting dictionary prose.
---

Reconcile candidates against Jastrow’s own digitized abbreviation list, but do not treat that list as safe for automatic import. Ambiguous global single-letter forms remain excluded; short forms require strong corpus evidence and representative context.

**Why:** The printed abbreviation list contains forms such as a single letter followed by a period. In browser text replacement, these can collide with ordinary prose or unrelated citation notation even when token boundaries are enforced. Existing reader-facing expansions may also intentionally modernize or shorten the source wording.

**How to apply:** For each new batch, classify authoritative-list gaps and conflicts, scan real definitions for frequency and context, prefer longer contextual keys, retain intentional modernized expansions, and add formatter tests using representative source snippets.