---
name: blogpost-writing
description: Write blog posts for the Talmud & Tech Substack (ezrabrand.com). Use when the user asks to draft, generate, or write a blog post about a script, analysis, or finding related to Talmudic texts or digital humanities. Produces a Markdown file in scripts/ (gitignored) with main body, technical appendix, and data appendices.
---

# Blog Post Writing — Talmud & Tech

Ezra Brand's Substack focuses on classical Jewish texts (Talmud, Mishnah, Yerushalmi, Midrash) and digital humanities / computational analysis of those texts. He codes the analyses himself and writes about them in first person.

## Voice and Style

- **First person**: "I ran…", "I found…", "I wrote a script…" — Ezra is the author and coder.
- **Direct, no fluff**: No throat-clearing, no "In this post I will…", no editorializing. Start with substance.
- **No hype language**: Avoid "fascinating", "incredible", "remarkable", "exciting". Let the data speak.
- **General audience**: Readers are interested in Jewish texts but not necessarily technical. Explain what the Talmud is if needed, but don't over-explain.
- **Concise**: ~700–1,000 words for the main body (roughly 2 printed pages). Then separate appendices.
- **Comparative when relevant**: Reference earlier posts in the series (e.g., the Bavli name extraction post) when continuing a thread.

## Structure

1. **Main body** (~2 pages / 700–1000 words)
   - What was done, what data was used, key results, what they mean, what's missing
   - Include a small inline table of top results if data supports it
   - Discuss differences from previous work if applicable

2. **Technical Appendix** (~1 page)
   - Script name, language, how it works (step-by-step)
   - The regex or algorithm used
   - Numbered list of **challenges** encountered and how each was resolved
   - Honest about limitations

3. **Data Appendices** (as needed)
   - Appendix A: Top 100 names table (or full ranked list)
   - Appendix B: Per-tractate counts table
   - Additional appendices as relevant

## File Output

- Write to `scripts/<slug>-blogpost.md` (gitignored, safe for drafts)
- Also generate `scripts/<slug>-results.csv` when tabular data exists

## Project-Specific Context

- **Translation sources used so far**:
  - Bavli: Steinsaltz (bolded text only, from Sefaria)
  - Yerushalmi: Guggenheimer (full text, from Sefaria-Export GCS bucket)
- **Regex patterns**: Adapted from the two-pattern approach in the Bavli post:
  - Pattern 1: honorific-first (Rabbi X ben Y)
  - Pattern 2: name-first (X ben Y)
  - Source: https://www.ezrabrand.com/p/automated-extraction-of-over-1000
- **Key Guggenheimer quirks** (document when relevant):
  - Uses "Rebbi" (not "Rabbi") for Palestinian sages
  - Uses "R." as universal abbreviation
  - Represents glottal stops with 4 different Unicode apostrophe characters
  - Stores ḥ as decomposed h + U+0323 (requires NFC normalization)
  - U+2018 (left single quote) serves as apostrophe inside names, NOT as a quote delimiter
- **Script location**: `scripts/extract-yerushalmi-names.ts` (Yerushalmi), `scripts/extract-bavli-names.py` (Bavli, if exists)
- **Results location**: `scripts/yerushalmi-names-results.json` / `.csv` / `.md`
- **Prior posts** in the series:
  - https://www.ezrabrand.com/p/discovering-the-talmuds-most-cited (Bavli, Ein Yaakov)
  - https://www.ezrabrand.com/p/automated-extraction-of-over-1000 (Bavli, Steinsaltz full)
  - Yerushalmi post (this one / future iterations)

## What NOT to Do

- Do not add section headers like "Introduction" or "Conclusion"
- Do not use bullet points in the main narrative — prose only
- Do not end with a call to action ("subscribe!", "let me know in the comments")
- Do not pad word count with summaries of what was just said
- Do not refer to the script code inline in the main body — that belongs in the technical appendix
- **No fragmented sentences**: A phrase like "With some important modifications." as its own sentence reads as AI-generated. Attach it to the preceding sentence with a comma instead.
- **No hyperbolic or breathless words**: Avoid "unmistakably", "remarkably", "fascinating", "great" (in the sense of "important"), "defining", "central". Prefer sober alternatives: "major", "prominent", "frequent". Let the numbers speak.
- **No editorializing about historical significance**: Do not make claims like "X and Y are the defining intellectual presence of the Yerushalmi" or "he was a transitional figure who…". These are arguable and read as filler. Stick to what the data shows.
- **No meta-commentary about the structure of texts**: Do not explain why certain figures appear in the data by characterizing the literary structure of the Talmud (e.g., "Yerushalmi discussions spend substantial time analyzing Mishnaic disputes"). Report the finding; let the reader draw structural conclusions.
- **No em-dash asides or "not X, but Y" constructs**: Both read as AI-generated. Avoid mid-sentence em-dash parentheticals (e.g., "— not because X, but because Y —") and the "not X, but Y" rhetorical pattern. Rewrite as direct, affirmative statements.

## Example Opening Lines (Reference Only)

Good: "The Yerushalmi is the Talmud that most people have never read."
Good: "Around 3,000 names were found."
Bad: "In this blog post, I will be discussing my exciting findings from my analysis of the Jerusalem Talmud using regex-based name extraction techniques."
