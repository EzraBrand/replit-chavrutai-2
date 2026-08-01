---
name: Favicon glyph portability
description: Why favicon/icon SVGs must not depend on named fonts
---
Rule: any SVG asset that is served or rasterized standalone (favicons, OG images, app icons) must be self-contained — convert text to outlined paths rather than referencing a font family.

**Why:** favicon SVGs load outside the page's font stylesheets, and librsvg/sharp resolve fonts via the local fontconfig. Named families silently fall back to sans-serif on machines without the font — this is exactly how the Bekiut ב favicon shipped in a sans fallback once.

**How to apply:** when (re)generating any icon asset containing text, outline the glyphs (e.g. opentype.js glyph.getPath) into the SVG, verify by rendering on a machine without the font installed, and optically center by measuring the rendered glyph's pixel bbox rather than trusting text metrics.
