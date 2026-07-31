# ChavrutAI Design Language — "ParchmentScholar"

The approved sitewide design direction, first implemented on the homepage
(`src/pages/home.tsx`). Use this document as the reference when revamping
subpages so the whole site converges on one uniform look.

Direction: Sefaria-inspired — clean, scholarly, minimal. White background,
Georgia serif for headings only, text links instead of buttons, near-square
corners, generous whitespace.

## Tokens

### Colors (light)

| Token | Value | Use |
|---|---|---|
| Primary (navy) | `#1a4a6b` | links, the Search button, logo text |
| Background | `#ffffff` | page background |
| Footer / muted surface | `#f9fafb` | footer, subdued panels |
| Hover surface | `#f3f4f6` | card/list hover |
| Border | `#e5e7eb` | section dividers, card borders |
| Input border | `#d1d5db` | text inputs |
| Text | `#111827` | primary text |
| Secondary text | `#374151` | secondary text |
| Muted text | `#9ca3af` | descriptions, captions, nav links |

### Text-category palette

Each corpus gets a short colored underline bar — 2px tall, 2.5rem wide,
placed **above** the title. Never a badge, tag, or pill.

| Corpus | Color |
|---|---|
| Babylonian Talmud | `#4b7a8a` (teal) |
| Tanakh | `#5a7a4a` (olive) |
| Mishnah | `#7a5a4a` (rust) |
| Jerusalem Talmud | `#6a5a8a` (muted purple) |
| Mishneh Torah | `#8a6a3a` (warm amber) |

An approved dark-mode palette exists in
`attached_assets/chavrutai-tokens_1785474686438.css` (`.dark` block).

### Typography

- Headings: `Georgia, serif` (system font — never load a webfont for it)
- Body & UI: `system-ui, sans-serif`
- Mono: `Menlo, Consolas, monospace`

### Layout & shape

- Max content width: `64rem` (Tailwind: `max-w-content`)
- Horizontal page padding: `1.5rem`
- Radius: `0.25rem` default (near-square); `0.125rem` small, `0.375rem` large

## Tailwind support (already in `tailwind.config.ts`)

- `font-georgia` — Georgia headings
- `max-w-content` — 64rem column
- `text-talmud-bavli`, `text-tanakh`, `text-mishnah`,
  `text-talmud-yerushalmi`, `text-mishneh-torah` (also `bg-…`) — category colors

## Rules (the "what not to do" list)

1. No rounded cards — use the near-square radius.
2. No shadows or hover-lift effects; hover is a flat `#f3f4f6` surface.
3. No icon libraries (Lucide, react-icons) on redesigned pages — the only
   graphic is the ChavrutAI book logo in the nav.
4. No loaded display fonts (e.g. Playfair Display); Georgia is system.
5. Text links, not buttons — the only button is the navy Search button.
6. Category colors always appear as the 2px underline bar, used consistently.
7. Sections separated by 1px `#e5e7eb` top borders, not boxes.

## Page anatomy (homepage as the pattern)

1. **Nav** — logo + "ChavrutAI" in navy left; muted text links right.
2. **Page title** — Georgia heading, optional one-line muted subtitle.
3. **Content sections** — divided by hairline borders; Georgia section
   headings; two- or three-column grids of flat white cards or plain
   text links.
4. **Footer** — shared `src/components/footer.tsx`.

## Rollout plan for subpages

1. Extract shared primitives from the homepage: `SiteHeader`, page
   container (max-w-content + px-6), section heading, category bar,
   text link.
2. Replace raw hex values with named tokens once the primitives exist.
3. Convert pages in order of traffic: the five contents pages (Talmud,
   Bible, Mishnah, Yerushalmi, Rambam) → reader pages → tools pages →
   utility pages (about, changelog, contact…).
4. ~~Settle the dark-mode question~~ **Settled:** the approved dark palette
   from `attached_assets/chavrutai-tokens_1785474686438.css` is now applied
   to the `.dark` theme block in `src/index.css` (with a slightly brighter
   muted-foreground for readable captions on the navy background). The
   `paper` theme remains the warm/sepia option and already fits
   ParchmentScholar; `white` and `high-contrast` are unchanged. Reader
   pages have been converted (flat headers, hairline borders, near-square
   corners, Georgia headings, no shadows).
