---
name: SVG rasterization with custom fonts
description: How to rasterize SVGs with non-system fonts (e.g. Hebrew serif favicon) using sharp
---
Rule: to rasterize an SVG containing text in a Google Font with sharp/librsvg, download the TTF into `~/.fonts`, run `fc-cache -f`, and reference the family name in the SVG. Do not rely on `@font-face` data URIs inside the SVG.

**Why:** librsvg (used by sharp) resolves fonts via fontconfig; embedded data-URI @font-face support is unreliable, which is how the pre-2026 favicon PNGs silently fell back to sans-serif for the ב.

**How to apply:** regenerating any favicon/OG image from `artifacts/chavrutai/public/favicon.svg` (Frank Ruhl Libre); optical centering was solved by measuring the rendered glyph bbox in pixels and adjusting the text y (currently y=364 centers the glyph at 256,256). A verified ICO can be built by concatenating PNG entries with a hand-written ICONDIR header.
