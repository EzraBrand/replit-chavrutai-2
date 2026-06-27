---
name: yerushalmi-text-tweaks
description: Add or modify punctuation rules in the Yerushalmi (Jerusalem Talmud) Hebrew text processing function. Use when the user wants to tweak how Yerushalmi text is displayed — converting periods to colons, question marks, or exclamations for specific words and phrases.
---

# Yerushalmi Text Tweaks

## File

All rules live in `client/src/lib/text-processing.ts` inside `processYerushalmiHebrewText()` (~line 48).

The function removes nikud first, then runs a chain of `.replace()` calls that convert periods (`.`) at the end of specific dialogue / discourse phrases into colons (`:`), question marks (`?`), or exclamations (`!`). Finally it calls `processHebrewTextCore()` for nikud removal + paragraph splitting.

Unlike the Mishnah processor (which handles comma → colon because Sefaria's Mishnah text uses commas as soft breaks), the Yerushalmi processor is almost entirely **period → other punctuation**, because Sefaria's Yerushalmi text uses periods as the only sentence-ending mark.

## How the Hebrew Processing Chain Works

The chain is grouped by transformation type, and within each group **more specific (longer) patterns come first** to avoid shorter rules consuming the period before a longer rule can match.

### Section order (top → bottom)

1. **Speech / dialogue: period → colon** — fixed phrases like `אמר ליה.`, `אמרו לו.`, `דבר אחר.`
2. **Fixed introductory phrases: period → colon** — like `כמאן דמר.`, `מן הדא.`, `הדא אמרה.`, `[ודה]?תנינן.`
3. **Multi-word attribution patterns: period → colon** — patterns where a rabbi name (1–6 words) sits between fixed markers, like `אמר רבי [x].`, `דרש רבי [x].`, `רבי [x] בשם [x].`, etc.
4. **Single-word speech markers (optional ו/ד/ה prefix): period → colon** — like `[ודה]?תני.`, `[ודה]?אמר.`
5. **Rhetorical / interrogative: period → question mark** — like `מהו.`, `למה.`, `מה יעשה.`, `מני אמרו לו.`
6. **Vocative: period → exclamation** — `רבי.`, `רבותיי.`

## Boundary convention

Every rule uses the lookbehind `(?<![א-ת])` to ensure no Hebrew letter precedes the match. This prevents `אמר.` from matching the substring `אמר` inside `ואמר.` (which is a different word) or `דאמר.` (which has a meaningful prefix).

The `[ודה]?` prefix variant is the way to **opt in** to ו / ד / ה prefix matching for a given base word. Use it when the user explicitly mentions prefix variants (e.g. "תני / ותני / דתני / התני") or when the established convention from prior rules makes the prefix variant the obvious choice.

## Adding a New Rule

### Step 1: Identify the pattern type

The user will typically provide:
- The Hebrew phrase
- The current (wrong) punctuation, almost always `.`
- The desired (correct) punctuation: `:`, `?`, or `!`
- An example URL like `https://chavrutai.com/yerushalmi/Tractate/Chapter.Halakhah#Section`

### Step 2: Choose the regex pattern

**Fixed phrase** (no variable words):
```js
.replace(/(?<![א-ת])כמאן דמר\./g, 'כמאן דמר:')
```

**Word with optional ו / ד / ה prefix** (e.g. תני / ותני / דתני / התני):
```js
.replace(/(?<![א-ת])([ודה]?תני)\./g, '$1:')
```

**Phrase + named element** (e.g. rabbi name, 1–6 Hebrew words, accepting both רבי and רב):
```js
.replace(/(?<![א-ת])(אמר\s+(?:רבי|רב)\s+(?:[א-ת״׳'\-]+\s+){0,5}[א-ת״׳'\-]+)\./g, '$1:')
```
- `(?:רבי|רב)` — alternation, longer alternative listed first
- `(?:[א-ת״׳'\-]+\s+){0,5}[א-ת״׳'\-]+` — 1–6 Hebrew word tokens (only Hebrew letters + geresh / gershayim / maqaf, never bare `[^.\s]+`, which over-matches punctuation-heavy tokens)
- The whole multi-word run is captured as `$1` and replayed with `:` instead of `.`

**Sandwich pattern** (rabbi name between two fixed markers, e.g. `רבי [x] אומר.`):
```js
.replace(/(?<![א-ת])((?:רבי|רב)\s+(?:[א-ת״׳'\-]+\s+){0,5}[א-ת״׳'\-]+\s+אומר)\./g, '$1:')
```

**Chain pattern** (`רבי [x] בשם [x] בשם [x].` — multiple `בשם` links):
```js
.replace(/(?<![א-ת])((?:רבי|רב)\s+(?:[א-ת״׳'\-]+\s+){0,5}[א-ת״׳'\-]+\s+בשם\s+(?:[א-ת״׳'\-]+\s+){0,5}[א-ת״׳'\-]+\s+בשם\s+(?:[א-ת״׳'\-]+\s+){0,5}[א-ת״׳'\-]+)\./g, '$1:')
```

### Step 3: Place the rule in the correct group

- **Period → colon (speech / dialogue)** → with the existing `אמר ליה.` block
- **Period → colon (fixed intro)** → with the `כמאן דמר.` / `מן הדא.` block
- **Period → colon (multi-word attribution)** → with the `אמר רבי [x].` / `דרש רבי [x].` block
- **Period → colon (single-word with ו/ד/ה prefix)** → with the `[ודה]?תני.` block
- **Period → question** → with the `מהו.` / `מה עבד.` block
- **Period → exclamation** → with the `רבי.` / `רבותיי.` block

### Step 4: Watch for ordering

Inside each group, more specific patterns must come before more general ones:

- **3-name `בשם` chain before 2-name `בשם`** — otherwise the shorter pattern wins and the third name is left dangling.
- **`מני אמרו לו.` (→ `?`) before `אמרו לו.` (→ `:`)** — otherwise the colon rule fires first and the question-mark rule never sees a period.
- **Multi-word `אמר רבי [x].` before single-word `[ודה]?אמר.`** — same logic: the longer pattern needs first crack at the period.

Cross-group ordering also matters: the question-mark group runs **after** the colon group, but you can promote a question-mark rule into the colon group if it shadows a colon rule (e.g. `מני אמרו לו.` lives in the colon group so it pre-empts `אמרו לו.`).

## Existing Rules Reference

### Period → Colon (speech / dialogue)
| Pattern |
|---|
| `אמר ליה.` |
| `אמר לון.` |
| `אמרין ליה.` |
| `אמרין.` |
| `ואמרו לו.` |
| `אמרו לו.` |
| `אמר לו.` |
| `ויש אומרים.` |
| `ולא כן כתיב.` |
| `דבר אחר.` |

### Period → Colon (fixed introductory phrases)
| Pattern |
|---|
| `כמאן דמר.` |
| `מאן דמר.` |
| `אלא כן אנן קיימין.` |
| `אין תימר.` |
| `וכתוב.` |
| `מן הדא.` |
| `הדא אמרה.` |
| `[ודה]?תנינן.` |

### Period → Colon (multi-word attribution, [x] = 1–6 Hebrew words, both רבי and רב accepted)
| Pattern |
|---|
| `רבי/רב [x] בשם [x] בשם [x].` |
| `רבי/רב [x] בשם [x].` |
| `אמר רבי/רב [x].` |
| `תני רבי/רב [x].` |
| `תנא רבי/רב [x].` |
| `דרש רבי/רב [x].` |
| `רבי/רב [x] אומר.` |
| `רבי/רב [x] בעי.` |

### Period → Colon (single-word, optional ו/ד/ה prefix)
| Pattern |
|---|
| `[ודה]?תני.` |
| `[ודה]?בעי.` |
| `[ודה]?בעא.` |
| `[ודה]?תימר.` |
| `[ודה]?אומרים.` |
| `[ודה]?אומר.` |
| `[ודה]?אמר.` |

### Period → Question Mark
| Pattern |
|---|
| `מני אמרו לו.` *(promoted into the colon group so it pre-empts `אמרו לו.`)* |
| `מנו אמרו לו.` *(same)* |
| `מה עבד.` |
| `מה טעם.` |
| `ומה פליגין.` |
| `מאי כדון.` |
| `מיי כדון.` |
| `מה אנן קיימין.` |
| `היך עבידא.` |
| `מה יעשה.` |
| `מהו.` |
| `למה.` |

### Period → Exclamation
| Pattern |
|---|
| `רבי.` → `רבי!` |
| `רבותיי.` → `רבותיי!` |

## Documenting the Change

After adding rules, update the "Yerushalmi Hebrew: Phrase-Level Punctuation Cues" entry in `client/src/pages/changelog.tsx` so the new patterns are listed in the appropriate bucket (period → colon for speech / fixed phrase / attribution / single-word, period → question, period → exclamation). Keep the code samples as `<code>` tags styled consistently with the surrounding entries.

## Testing

After adding a rule, visit the specific Yerushalmi URL the user provided to confirm the change renders correctly. The app hot-reloads on save.

For a quick offline sanity check, paste the new `.replace(...)` chain into a small Node script with sample inputs and confirm both positive cases (the rule fires) and negative cases (preceded by a Hebrew letter, the rule does **not** fire — so `ולמה.` should stay as `ולמה.` if you only added `למה.`).
