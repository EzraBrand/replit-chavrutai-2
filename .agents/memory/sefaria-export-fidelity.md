---
name: Sefaria bulk-export fidelity
description: External export provenance and alignment constraints for future offline text snapshots.
---

Use edition-specific files from Sefaria's public GCS exports when a snapshot must match the live reader; do not assume a merged export is the same edition as the API default.

**Why:** Research found mixed-version fallback passages in merged English exports. Explicit Davidson exports matched sampled live bilingual passages and carried CC-BY-NC license metadata that the merged files omitted. Equal outer-array lengths also did not guarantee equal segment counts within every folio.

**How to apply:** Consult the current index and documentation at https://github.com/Sefaria/Sefaria-Export; choose and record both language editions and their individual licenses, validate references and bilingual alignment, and compare sample passages with the reader before generating snapshots. Do not infer redistribution permission from public download availability or from the application's code license.

For crawler excerpts, keep snapshot generation offline rather than making crawler requests populate a live text cache.

**Why:** The user chose predictable crawler responses and no database dependency over on-demand population. Warm reader-cache results are not evidence that a cold crawler request will receive substantive text. This addresses content availability, not a proven cause of lost Google visibility or a guarantee of ranking recovery.

**How to apply:** Treat publication as the boundary for a validated snapshot. Operational download failures must not be accepted as newly missing text; known source gaps need explicit evidence and must not be silently filled from another edition.