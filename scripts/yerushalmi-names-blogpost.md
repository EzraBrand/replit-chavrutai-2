# Who's Who in the Jerusalem Talmud: Automated Name Extraction from the Yerushalmi

*This post follows up on my earlier piece on extracting names from the Babylonian Talmud (Bavli) using the Guggenheimer translation. Here I apply the same approach — with substantial modifications — to the Jerusalem Talmud (Yerushalmi).*

---

The Yerushalmi is the Talmud that most people have never read. Redacted in the Land of Israel, probably in Tiberias, sometime in the late fourth or early fifth century, it is shorter than the Babylonian Talmud, harder to read, and was historically overshadowed by the Bavli in practical Jewish law. Its sages are, accordingly, less familiar to most readers: Rabbi Yoḥanan, Reish Laqish, Rabbi Zeira — names that appear in the Bavli too, but that the Yerushalmi treats as central.

I wanted to know: who are the most-cited figures in the Yerushalmi, and how does that compare to what the Bavli tells us? The same automated approach I used for the Bavli — a regex that matches names in their surrounding context of honorifics and patronymics — gave me an answer. With some important modifications.

## The Data

I used Heinrich Guggenheimer's English translation of the Jerusalem Talmud, published by De Gruyter between 1999 and 2015, which is available on Sefaria. The full text is downloadable in bulk from Sefaria's public export repository (a Google Cloud Storage bucket), organized by tractate. I wrote a script that downloads one JSON file per tractate, strips HTML formatting, and runs the regex against every segment of translated text.

The corpus covers all 39 tractates of the Yerushalmi for which Guggenheimer's translation exists. That is 12,243 text segments, covering roughly the entirety of the surviving Yerushalmi. The script ran in under a minute.

## The Results

Across all 39 tractates, the script found **3,147 distinct name strings** representing **53,368 total name occurrences**.

Before discussing who's at the top, a note on counting: one sage can appear under many surface forms — "Rebbi Joḥanan" and "R. Joḥanan" are the same person, and Guggenheimer spells Zeira's name four different ways across the text ("Zeïra", "Zeˋira", "Ze'ira", "Ze`ira"). Consolidating those variants is a separate task, partly manual. The counts below are raw, pre-consolidation.

The most-cited figures (by raw occurrence):

| Rank | Name | Occurrences |
|------|------|-------------|
| 1 | Rebbi Joḥanan | 3,442 |
| 2 | Rebbi Yose | 2,654 |
| 3 | Rebbi Jehudah | 1,470 |
| 4 | Rebbi Eleazar | 1,311 |
| 5 | Rebbi Simeon ben Laqish | 1,176 |
| 6 | R. Joḥanan | 1,143 |
| 7 | Rebbi Meïr | 995 |
| 8 | Rebbi Simeon | 982 |
| 9 | R. Jehudah | 951 |
| 10 | R. Yose | 833 |

The dominant figure is unmistakably Rebbi Joḥanan bar Nappaḥa — the great third-century Amora who heads the Tiberias academy and whose teachings saturate the Yerushalmi. Between "Rebbi Joḥanan" and "R. Joḥanan" alone, he appears over 4,500 times. His study partner and brother-in-law Reish Laqish (Rebbi Simeon ben Laqish) comes in fifth, with over 1,500 appearances across his two most common forms. The two of them together are the defining intellectual presence of the Yerushalmi.

Rebbi Zeira — counted across his four spelling variants — totals roughly 1,650 appearances, which would place him in the top five once consolidated. He was a transitional figure who studied in Babylonia but emigrated to the Land of Israel, and his frequent citation in the Yerushalmi reflects his central role in transmitting tradition between the two centers.

The presence of tannaitic figures — Rebbi Meïr, Rebbi Jehudah, Rebbi Aqiba — high in the list reflects the structure of Yerushalmi discussions, which spend substantial time analyzing Mishnaic disputes between the tannaim and attributing legal positions to them.

## Differences from the Bavli

When I ran the same approach on the Bavli (Steinsaltz translation), the top names were dominated by Babylonian amoraim: Rav, Shmuel, Rava, Abaye. The Yerushalmi's top names are almost entirely Palestinian. Rav Huna appears (#31 here, mostly in legal contexts), but otherwise the Babylonian sages are minor figures. The texts come from different worlds.

The raw name count is also lower for the Yerushalmi than the Bavli — not because the Yerushalmi is shorter (it isn't, dramatically so), but because it is more laconic. The Bavli is expansive and discursive; the Yerushalmi is terse and elliptical. Fewer words, fewer name attributions.

## What This Doesn't Capture

Mononyms — sages known by a single name with no title or patronymic (Ulla, Shmuel, Rav) — are largely invisible to this method. The regex works by detecting a name *in context*, requiring either an honorific prefix ("Rebbi", "R.", "Rabban") or a patronymic connector ("ben", "bar"). A bare "Ulla" in running text is undetectable without additional logic.

The full list of 3,147 name strings, with occurrence counts and example references, is in the appendix. The data is also available as a CSV.

---

# Technical Appendix

## The Script

The extraction script is `scripts/extract-yerushalmi-names.ts`, written in TypeScript and run with `npx tsx`. It:

1. Reads `shared/data/yerushalmi-shapes.json` to know which tractates and chapters exist.
2. For each tractate, fetches the Guggenheimer JSON dump from the Sefaria-Export GCS bucket (`gs://sefaria-export/json/Talmud/Yerushalmi/...`), caching it locally.
3. Strips HTML tags and entities from each segment, strips double-quoted content (which in Guggenheimer typically marks Bible verse citations), and NFC-normalizes the Unicode.
4. Collects all regex matches from both patterns across the segment.
5. Applies greedy longest-match deduplication: all match spans are sorted by start position (ties broken by length descending), and overlapping spans are dropped. This prevents a match like "Simeon ben Laqish" and the sub-match "ben Laqish" from both being counted for the same textual occurrence.
6. Aggregates counts globally and per-tractate, recording up to three example references per name string.
7. Writes `yerushalmi-names-results.json`, `yerushalmi-names-results.md`, and `yerushalmi-names-results.csv`.

## The Regex

Two patterns are used, both adapted from the original Bavli patterns in my earlier blog post:

**Pattern 1** (honorific-first): matches an opening honorific or relational phrase followed by a capitalized name, optionally followed by a connector and patronymic, and optionally a place name. Example: `Rebbi Joḥanan`, `R. Simeon ben Laqish`, `the son of Rebbi Abbahu`.

**Pattern 2** (name-first): matches a capitalized name followed by a patronymic connector and another name. Example: `Simeon ben Laqish`, `Joḥanan bar Nappaḥa`.

The name token character class is: `[A-Z + Latin Extended] [a-z + Latin Extended + apostrophe variants]+`. This proved the most consequential part to get right (see Challenges below).

Guggenheimer-specific additions to the honorific list (absent from the original Bavli patterns):
- `Rebbi` — used for Palestinian sages (vs. `Rabbi` for Babylonian ones in Steinsaltz)
- `R.` — Guggenheimer's standard abbreviation, appearing ~12,000 times
- All relational variants: `son of Rebbi`, `bar Rebbi`, `daughter of Rebbi`, etc.

## Challenges

**1. Missing honorifics.** The original Bavli regex was tuned to the Steinsaltz translation, which uses "Rabbi" and "Rav". Guggenheimer uses "Rebbi" for Palestinian sages and "R." as a universal abbreviation. These two forms together account for over 50,000 occurrences in the text and were entirely missed in the first pass.

**2. Decomposed Unicode.** Guggenheimer's text on Sefaria stores the transliteration character ḥ (h-with-dot-below, U+1E25) in decomposed form: ASCII "h" followed by combining dot below (U+0323). Without NFC normalization, the regex character class `[ḥ]` would not match the decomposed sequence, and names like "Joḥanan" would be truncated to "Jo". Applied `.normalize('NFC')` to each segment before matching.

**3. Four different apostrophes.** Guggenheimer represents the Aramaic glottal stop (in names like Zeira, Ze'ira) using four distinct characters depending on where in the text it appears:
- U+2018 (left single quotation mark): `Ze'ira`
- U+02CB (modifier letter grave accent): `Zeˋira`
- U+0060 (grave accent / backtick): `` Ze`ira ``
- U+00EF (i-diaeresis / ï): `Zeïra`

None of these are standard ASCII. The first three were being treated as non-name characters, causing "Rebbi Ze'ira" to match as "Rebbi Ze" — a truncated non-name that was appearing near the top of the frequency list with ~900 false occurrences. Adding all four variants to the character class resolved this.

**4. Quote-stripping collateral damage.** The original blog post blanks out content in quotation marks (Bible verse citations) before matching. My initial implementation extended this to single-quoted content using U+2018/U+2019. This correctly strips verse citations but also strips apostrophes inside names — "Ze'ira" becomes "Ze" after the stripper removes everything between `'` and `'`. Fixed by limiting quote-stripping to double-quote delimiters only (U+201C/U+201D and straight `"`).

---

# Appendix A: Top 100 Names

| Rank | Name | Count | First Example |
|------|------|-------|---------------|
| 1 | Rebbi Joḥanan | 3442 | Berakhot 2:4.15 |
| 2 | Rebbi Yose | 2654 | Berakhot 1:1.2 |
| 3 | Rebbi Jehudah | 1470 | Berakhot 8:5.6 |
| 4 | Rebbi Eleazar | 1311 | Berakhot 1:3.3 |
| 5 | Rebbi Simeon ben Laqish | 1176 | Berakhot 1:1.25 |
| 6 | R. Joḥanan | 1143 | Berakhot 8:2.4 |
| 7 | Rebbi Meïr | 995 | Berakhot 1:1.32 |
| 8 | Rebbi Simeon | 982 | Berakhot 1:1.31 |
| 9 | R. Jehudah | 951 | Berakhot 9:2.13 |
| 10 | R. Yose | 833 | Berakhot 1:1.2 |
| 11 | Rebbi Mana | 779 | Berakhot 1:1.15 |
| 12 | Rebbi Abbahu | 778 | Berakhot 2:1.11 |
| 13 | Rebbi Eliezer | 765 | Berakhot 1:1.1 |
| 14 | Rebbi Jeremiah | 747 | Berakhot 1:1.4 |
| 15 | Rebbi Aqiba | 729 | Berakhot 1:1.32 |
| 16 | Rebbi Ḥiyya | 723 | Berakhot 1:1.2 |
| 17 | Rebbi Jonah | 703 | Berakhot 1:2.7 |
| 18 | Rebbi Abba | 695 | Berakhot 1:1.16 |
| 19 | R. Simeon | 605 | Berakhot 1:1.31 |
| 20 | R. Meïr | 563 | Berakhot 1:1.2 |
| 21 | Rebbi Yose ben Rebbi Abun | 563 | Berakhot 1:1.9 |
| 22 | Rebbi Ḥanina | 543 | Berakhot 1:1.12 |
| 23 | Rebbi Joshua ben Levi | 541 | Berakhot 1:1.30 |
| 24 | R. Aqiba | 518 | Berakhot 1:1.30 |
| 25 | R. Eliezer | 515 | Berakhot 1:1.1 |
| 26 | Rebbi Zeïra | 501 | Berakhot 1:1.4 |
| 27 | R. Ismael | 478 | Berakhot 1:3.3 |
| 28 | R. Eleazar | 465 | Berakhot 1:1.22 |
| 29 | Rebbi Aḥa | 463 | Berakhot 1:1.15 |
| 30 | Rebbi Ze'ira | 446 | Shabbat 14:4.5 |
| 31 | Rav Huna | 431 | Berakhot 1:1.16 |
| 32 | Rabban Simeon ben Gamliel | 426 | Berakhot 2:9.2 |
| 33 | Rabban Gamliel | 425 | Berakhot 1:1.1 |
| 34 | Rebbi Jacob bar Aḥa | 412 | Berakhot 2:3.14 |
| 35 | Rebbi Yasa | 393 | Berakhot 1:1.29 |
| 36 | R. Simeon ben Laqish | 391 | Berakhot 1:5.4 |
| 37 | Rebbi Ismael | 389 | Berakhot 1:1.16 |
| 38 | Rebbi Immi | 379 | Berakhot 1:1.30 |
| 39 | Rebbi Zeˋira | 375 | Shabbat 1:1.7 |
| 40 | Rebbi Joshua | 366 | Berakhot 1:1.24 |
| 41 | Rebbi Yannai | 323 | Berakhot 2:3.3 |
| 42 | Rebbi Ze`ira | 307 | Eruvin 5:8.3 |
| 43 | Rebbi Hoshaia | 288 | Berakhot 4:6.7 |
| 44 | Rav Ḥisda | 286 | Berakhot 1:2.4 |
| 45 | R. Joshua | 276 | Berakhot 1:1.24 |
| 46 | Rav Jehudah | 272 | Berakhot 8:1.7 |
| 47 | Rebbi Ḥiyya bar Abba | 258 | Berakhot 1:5.16 |
| 48 | Rebbi Hila | 255 | Demai 6:8.9 |
| 49 | Rebbi Yudan | 251 | Berakhot 1:2.9 |
| 50 | Rebbi Abun | 228 | Berakhot 1:1.23 |
| 51 | Rebbi Ḥaggai | 225 | Berakhot 2:4.6 |
| 52 | Rebbi Simon | 220 | Berakhot 1:1.18 |
| 53 | Rebbi Yose ben Ḥanina | 215 | Berakhot 4:1.19 |
| 54 | Rebbi Yoḥanan | 210 | Berakhot 1:1.4 |
| 55 | Rebbi Ḥizqiah | 202 | Berakhot 1:1.15 |
| 56 | Rebbi Me | 198 | Sheviit 5:2.1 |
| 57 | Bar Qappara | 191 | Berakhot 1:5.14 |
| 58 | Rebbi Abun bar Ḥiyya | 181 | Berakhot 2:4.16 |
| 59 | Rebbi Jonathan | 179 | Berakhot 1:1.29 |
| 60 | R. Ḥanina | 159 | Berakhot 1:1.12 |
| 61 | R. Ḥiyya | 154 | Berakhot 1:1.2 |
| 62 | Rav Ḥuna | 154 | Berakhot 1:1.29 |
| 63 | Rebbi Ḥuna | 153 | Berakhot 1:1.1 |
| 64 | R. Mana | 149 | Berakhot 1:1.15 |
| 65 | Rebbi Levi | 149 | Berakhot 1:1.18 |
| 66 | Rebbi Isaac | 149 | Berakhot 2:3.6 |
| 67 | Rebbi La | 145 | Berakhot 2:4.16 |
| 68 | R. Jeremiah | 144 | Berakhot 3:4.6 |
| 69 | Rebbi Ila | 142 | Terumot 2:1.14 |
| 70 | Rebbi Abba bar Mamal | 141 | Berakhot 4:1.25 |
| 71 | Rebbi Samuel bar Rav Isaac | 140 | Berakhot 2:5.7 |
| 72 | R. Me | 139 | Terumot 1:1.4 |
| 73 | Rebbi Phineas | 132 | Berakhot 1:1.6 |
| 74 | Rebbi Samuel bar Naḥman | 129 | Berakhot 1:5.2 |
| 75 | Rebbi Samuel | 129 | Berakhot 1:5.6 |
| 76 | Rebbi Abin | 126 | Berakhot 1:1.26 |
| 77 | R. Jonah | 125 | Berakhot 5:3.10 |
| 78 | R. Simson | 123 | Peah 1:2.1 |
| 79 | Rebbi Simeon ben Eleazar | 120 | Berakhot 1:1.33 |
| 80 | R. Joshua ben Levi | 117 | Berakhot 1:1.18 |
| 81 | Rebbi Ḥananiah | 117 | Berakhot 5:3.4 |
| 82 | Rav Jeremiah | 113 | Berakhot 1:1.4 |
| 83 | Rebbi Ḥinena | 112 | Berakhot 6:1.11 |
| 84 | Rebbi Assi | 111 | Berakhot 1:1.30 |
| 85 | Rebbi Eliezer ben Jacob | 111 | Berakhot 5:2.13 |
| 86 | Rebbi Eleazar ben Azariah | 108 | Berakhot 1:1.37 |
| 87 | R. Abbahu | 105 | Berakhot 2:2.2 |
| 88 | Rebbi Nathan | 96 | Berakhot 1:1.26 |
| 89 | Rebbi Jacob bar Idi | 95 | Berakhot 2:1.16 |
| 90 | R. Zeïra | 94 | Berakhot 1:1.4 |
| 91 | Rebbi Yehudah | 93 | Berakhot 1:1.14 |
| 92 | Rebbi Ammi | 93 | Berakhot 1:1.27 |
| 93 | R. Yasa | 92 | Berakhot 1:1.29 |
| 94 | Rebbi Yose ben Rebbi Jehudah | 90 | Peah 1:4.9 |
| 95 | R. Yannai | 86 | Berakhot 2:3.3 |
| 96 | Rebbi Ḥanania | 86 | Berakhot 2:3.6 |
| 97 | Abba Shaul | 86 | Peah 1:1.15 |
| 98 | R. Zeˋira | 85 | Shabbat 1:1.17 |
| 99 | R. Ḥiyya bar Abba | 84 | Berakhot 1:5.15 |
| 100 | Rebbi Huna | 83 | Berakhot 1:1.17 |

---

# Appendix B: Per-Tractate Counts

| Tractate | Segments | Name occurrences | Unique name strings |
|----------|----------|-----------------|---------------------|
| Berakhot | 655 | 3,851 | 760 |
| Peah | 402 | 1,484 | 317 |
| Demai | 300 | 1,243 | 245 |
| Kilayim | 322 | 1,556 | 297 |
| Sheviit | 390 | 1,435 | 287 |
| Terumot | 418 | 2,205 | 359 |
| Maasrot | 186 | 883 | 212 |
| Maaser Sheni | 241 | 969 | 222 |
| Challah | 179 | 854 | 189 |
| Orlah | 176 | 720 | 153 |
| Bikkurim | 143 | 551 | 170 |
| Shabbat | 771 | 3,585 | 522 |
| Eruvin | 415 | 1,988 | 318 |
| Pesachim | 515 | 2,361 | 314 |
| Shekalim | 226 | 982 | 262 |
| Yoma | 362 | 1,143 | 257 |
| Sukkah | 205 | 862 | 212 |
| Beitzah | 194 | 777 | 218 |
| Rosh Hashanah | 160 | 616 | 167 |
| Taanit | 245 | 1,049 | 294 |
| Megillah | 232 | 1,184 | 286 |
| Chagigah | 149 | 718 | 174 |
| Moed Katan | 161 | 764 | 194 |
| Yevamot | 638 | 2,840 | 443 |
| Ketubot | 516 | 2,524 | 420 |
| Sotah | 381 | 1,446 | 340 |
| Nedarim | 346 | 1,149 | 239 |
| Nazir | 305 | 1,344 | 257 |
| Gittin | 349 | 1,822 | 317 |
| Kiddushin | 329 | 1,713 | 319 |
| Bava Kamma | 275 | 826 | 185 |
| Bava Metzia | 273 | 759 | 200 |
| Bava Batra | 260 | 893 | 226 |
| Sanhedrin | 586 | 1,921 | 389 |
| Makkot | 75 | 222 | 107 |
| Shevuot | 291 | 1,271 | 209 |
| Avodah Zarah | 352 | 1,509 | 323 |
| Horayot | 122 | 704 | 182 |
| Niddah | 98 | 645 | 157 |
| **Total** | **12,243** | **53,368** | **3,147** |
