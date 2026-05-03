/**
 * Multi-script transliteration helpers used by both the BDB / Jastrow live
 * readers (browser) and the BDB scraping script (Node).
 *
 *   • Greek      → Latin   (classical / scholarly conventions)
 *   • Syriac     → Hebrew  (one-to-one cognate-letter mapping with Hebrew sofit
 *                           forms applied at end of each word)
 *   • Samaritan  → Hebrew  (one-to-one cognate-letter mapping, same 22-letter
 *                           abjad as Hebrew; sofit forms applied at word end)
 *   • Arabic     → Latin   (DIN 31635 — the standard for Semitic-studies works
 *                           such as BDB: ḥ ḫ ġ ṣ ḍ ṭ ẓ ʿ ʾ etc.)
 *   • Ethiopic   → Latin   (scholarly Ge'ez transliteration: each syllable is
 *                           consonant + vowel from columns ä/u/i/a/e/ə/o, with
 *                           labialized variants for the qʷ/kʷ/gʷ/ḫʷ rows)
 *
 * Each script gets:
 *   • `transliterateX(input)`           — pure character-level conversion
 *   • `annotateXTransliterations(text)` — finds runs of script-X letters in
 *     plain text and appends `[transliteration]`. Idempotent (a run already
 *     followed by `[…]` is left alone, and unchanged outputs are skipped).
 *
 * `annotateAllTransliterations(text)` runs all three. The HTML-aware version
 * lives in `client/src/lib/dictionary-format.ts` (annotateTransliterationsInHtml)
 * and walks text nodes only so attribute values aren't touched.
 */

// ============================================================================
// GREEK → LATIN
// ============================================================================
// Standard rules:
//   - η→ē, ω→ō (long vowels with macron)
//   - θ→th, φ→ph, χ→ch, ψ→ps, ξ→x (digraphs)
//   - υ→y in isolation, but → u in αυ/ευ/ηυ/ου diphthongs
//   - γ→n before γ/κ/χ/ξ ("ngamma" rule)
//   - rough breathing on initial vowel → h-prefix; on initial ρ → rh
//   - capital + rough breathing → H + lowercase vowel (Ἑλλάς → Hellas)
//   - acute, grave, circumflex, smooth breathing, iota subscript, diaeresis
//     are stripped — they don't affect Latin transliteration.

const GREEK_LETTER_MAP: Record<string, string> = {
  α: 'a', β: 'b', γ: 'g', δ: 'd', ε: 'e', ζ: 'z', η: 'ē', θ: 'th',
  ι: 'i', κ: 'k', λ: 'l', μ: 'm', ν: 'n', ξ: 'x', ο: 'o', π: 'p',
  ρ: 'r', σ: 's', ς: 's', τ: 't', υ: 'y', φ: 'ph', χ: 'ch', ψ: 'ps',
  ω: 'ō',
  Α: 'A', Β: 'B', Γ: 'G', Δ: 'D', Ε: 'E', Ζ: 'Z', Η: 'Ē', Θ: 'Th',
  Ι: 'I', Κ: 'K', Λ: 'L', Μ: 'M', Ν: 'N', Ξ: 'X', Ο: 'O', Π: 'P',
  Ρ: 'R', Σ: 'S', Τ: 'T', Υ: 'Y', Φ: 'Ph', Χ: 'Ch', Ψ: 'Ps', Ω: 'Ō',
  // Archaic letters — digamma ϝ → w (e.g., "Ἰάϝονες" for "Ionians")
  ϝ: 'w', Ϝ: 'W',
};
const ROUGH_BREATHING = '\u0314';

export function transliterateGreek(input: string): string {
  const nfd = input.normalize('NFD');
  let out = '';
  let i = 0;
  let isWordStart = true;
  while (i < nfd.length) {
    const ch = nfd[i];
    let j = i + 1;
    let hasRough = false;
    while (j < nfd.length && /[\u0300-\u036F]/.test(nfd[j])) {
      if (nfd[j] === ROUGH_BREATHING) hasRough = true;
      j++;
    }
    const mapped = GREEK_LETTER_MAP[ch];
    if (mapped !== undefined) {
      const isCapital = ch !== ch.toLowerCase();
      if (hasRough && isWordStart) {
        if (/^[aeiouēōy]/i.test(mapped)) {
          out += isCapital ? 'H' + mapped.toLowerCase() : 'h' + mapped;
        } else if (mapped === 'r' || mapped === 'R') {
          out += mapped + 'h';
        } else {
          out += mapped;
        }
      } else {
        out += mapped;
      }
      isWordStart = false;
    } else {
      out += ch;
      if (/\s|[.,;:!?·]/.test(ch)) isWordStart = true;
    }
    i = j;
  }
  // ngamma rule: γγ→ng, γκ→nk, γχ→nch, γξ→nx
  out = out
    .replace(/gg/g, 'ng').replace(/Gg/g, 'Ng')
    .replace(/gk/g, 'nk').replace(/Gk/g, 'Nk')
    .replace(/gch/g, 'nch').replace(/Gch/g, 'Nch')
    .replace(/gx/g, 'nx').replace(/Gx/g, 'Nx');
  // Diphthongs ending in υ → -u
  out = out
    .replace(/([aeēoō])y/g, '$1u')
    .replace(/([AEĒOŌ])Y/g, '$1U')
    .replace(/([AEĒOŌ])y/g, '$1u');
  return out;
}

// ============================================================================
// SYRIAC → HEBREW
// ============================================================================
// Syriac and Hebrew alphabets are cognate 22-letter abjads with a clean
// one-to-one letter correspondence. We strip Syriac vowel pointing (combining
// marks U+0730–U+074A and the superscript-Alaph U+0711) and apply Hebrew
// final-form (sofit) substitution to the last consonant of each word.

const SYRIAC_LETTER_MAP: Record<string, string> = {
  '\u0710': 'א',  // ALAPH
  '\u0712': 'ב',  // BETH
  '\u0713': 'ג',  // GAMAL
  '\u0714': 'ג',  // GAMAL GARSHUNI (Persian variant)
  '\u0715': 'ד',  // DALATH
  '\u0716': 'ד',  // DOTLESS DALATH RISH
  '\u0717': 'ה',  // HE
  '\u0718': 'ו',  // WAW
  '\u0719': 'ז',  // ZAIN
  '\u071A': 'ח',  // HETH
  '\u071B': 'ט',  // TETH
  '\u071C': 'ט',  // TETH GARSHUNI
  '\u071D': 'י',  // YUDH
  '\u071E': 'יה', // YUDH HE (digraph)
  '\u071F': 'כ',  // KAPH
  '\u0720': 'ל',  // LAMADH
  '\u0721': 'מ',  // MIM
  '\u0722': 'נ',  // NUN
  '\u0723': 'ס',  // SEMKATH
  '\u0724': 'ס',  // FINAL SEMKATH (positional variant)
  '\u0725': 'ע',  // E (Ayn)
  '\u0726': 'פ',  // PE
  '\u0727': 'פ',  // REVERSED PE
  '\u0728': 'צ',  // SADHE
  '\u0729': 'ק',  // QAPH
  '\u072A': 'ר',  // RISH
  '\u072B': 'ש',  // SHIN
  '\u072C': 'ת',  // TAW
};
const HEBREW_FINAL_FORM: Record<string, string> = {
  'כ': 'ך', 'מ': 'ם', 'נ': 'ן', 'פ': 'ף', 'צ': 'ץ',
};

export function transliterateSyriac(input: string): string {
  // Strip Syriac vowel pointing (U+0711 superscript-alaph + U+0730–U+074A)
  // before mapping; pointing is positional and not part of the consonantal
  // skeleton we're transferring to Hebrew.
  const stripped = input.replace(/[\u0711\u0730-\u074A]/g, '');
  let out = '';
  for (const ch of stripped) {
    out += SYRIAC_LETTER_MAP[ch] ?? ch;
  }
  // Apply Hebrew sofit forms at end of each word (within the matched run,
  // word boundaries are space or comma; or end-of-string).
  return out.replace(/([\u05D0-\u05EA])(?=[\s,]|$)/g, (_, letter: string) =>
    HEBREW_FINAL_FORM[letter] ?? letter
  );
}

// ============================================================================
// SAMARITAN → HEBREW
// ============================================================================
// The Samaritan alphabet is the same 22-letter abjad as Hebrew (they share
// a common Proto-Sinaitic ancestor), with a clean one-to-one letter
// correspondence. Unicode block U+0800–U+082F.
// Samaritan vowel marks and cantillation (U+0816–U+082D, U+083F) are stripped
// before mapping — only the consonantal skeleton is transferred to Hebrew.
// Hebrew final-form (sofit) substitution is applied at the end of each word,
// identical to the Syriac path above.
//
// Letter correspondence (in abjad order):
//   U+0800 ALAF → א,  U+0801 BIT  → ב,  U+0802 GAMAN  → ג,  U+0803 DALAT → ד
//   U+0804 IY   → ה,  U+0805 BAA  → ו,  U+0806 ZEN    → ז,  U+0807 IT    → ח
//   U+0808 TIT  → ט,  U+0809 YUT  → י,  U+080A KAAF   → כ,  U+080B LABAT → ל
//   U+080C MIM  → מ,  U+080D NUN  → נ,  U+080E SINGAAT → ס,  U+080F IN   → ע
//   U+0810 FI   → פ,  U+0811 TSAADIY → צ, U+0812 QUF  → ק,  U+0813 RISH → ר
//   U+0814 SHAN → ש,  U+0815 TAAF → ת

const SAMARITAN_LETTER_MAP: Record<string, string> = {
  '\u0800': 'א',  // ALAF
  '\u0801': 'ב',  // BIT
  '\u0802': 'ג',  // GAMAN
  '\u0803': 'ד',  // DALAT
  '\u0804': 'ה',  // IY
  '\u0805': 'ו',  // BAA
  '\u0806': 'ז',  // ZEN
  '\u0807': 'ח',  // IT
  '\u0808': 'ט',  // TIT
  '\u0809': 'י',  // YUT
  '\u080A': 'כ',  // KAAF
  '\u080B': 'ל',  // LABAT
  '\u080C': 'מ',  // MIM
  '\u080D': 'נ',  // NUN
  '\u080E': 'ס',  // SINGAAT
  '\u080F': 'ע',  // IN (Ayin)
  '\u0810': 'פ',  // FI
  '\u0811': 'צ',  // TSAADIY
  '\u0812': 'ק',  // QUF
  '\u0813': 'ר',  // RISH
  '\u0814': 'ש',  // SHAN
  '\u0815': 'ת',  // TAAF
};

export function transliterateSamaritan(input: string): string {
  // Strip Samaritan vowel marks and cantillation signs (U+0816–U+082D, U+083F)
  const stripped = input.replace(/[\u0816-\u082D\u083F]/g, '');
  let out = '';
  for (const ch of stripped) {
    out += SAMARITAN_LETTER_MAP[ch] ?? ch;
  }
  // Apply Hebrew sofit forms at end of each word (same logic as Syriac above)
  return out.replace(/([\u05D0-\u05EA])(?=[\s,]|$)/g, (_, letter: string) =>
    HEBREW_FINAL_FORM[letter] ?? letter
  );
}

// ============================================================================
// ARABIC → LATIN  (DIN 31635)
// ============================================================================
// Notable conventions used by BDB and most modern Semitic-studies works:
//   ث → th, ج → j,  ح → ḥ, خ → kh, ذ → dh,
//   ش → sh, ص → ṣ,  ض → ḍ, ط → ṭ, ظ → ẓ,
//   ع → ʿ,  غ → gh, ق → q,
//   ا/ى → ā, و → w, ي → y, hamza ء → ʾ
//   shadda ّ doubles the preceding consonant unit
//   tanwīn ً ٌ ٍ → -an / -un / -in
//   tatweel ـ (cosmetic kashida elongation) is dropped

// Hamza-bearing letters are bare consonants 'ʾ'; the *explicit* harakat in
// the source provides the vowel. (BDB Arabic citations are fully vocalized.)
const ARABIC_LETTER_MAP: Record<string, string> = {
  '\u0621': 'ʾ',     // HAMZA
  '\u0622': 'ʾā',    // ALEF WITH MADDA ABOVE  (= hamza + long ā, fused)
  '\u0623': 'ʾ',     // ALEF WITH HAMZA ABOVE
  '\u0624': 'ʾ',     // WAW WITH HAMZA ABOVE
  '\u0625': 'ʾ',     // ALEF WITH HAMZA BELOW
  '\u0626': 'ʾ',     // YEH WITH HAMZA ABOVE
  '\u0627': 'ā',     // ALEF  (default; fatha+alif lookahead skips this)
  '\u0628': 'b',     // BEH
  '\u0629': 'h',     // TEH MARBUTA  (default; "t" only in construct state)
  '\u062A': 't',     // TEH
  '\u062B': 'th',    // THEH
  '\u062C': 'j',     // JEEM
  '\u062D': 'ḥ',     // HAH
  '\u062E': 'kh',    // KHAH
  '\u062F': 'd',     // DAL
  '\u0630': 'dh',    // THAL
  '\u0631': 'r',     // REH
  '\u0632': 'z',     // ZAIN
  '\u0633': 's',     // SEEN
  '\u0634': 'sh',    // SHEEN
  '\u0635': 'ṣ',     // SAD
  '\u0636': 'ḍ',     // DAD
  '\u0637': 'ṭ',     // TAH (emphatic)
  '\u0638': 'ẓ',     // ZAH (emphatic)
  '\u0639': 'ʿ',     // AIN
  '\u063A': 'gh',    // GHAIN
  '\u0640': '',      // TATWEEL  (kashida — purely cosmetic elongation)
  '\u0641': 'f',     // FEH
  '\u0642': 'q',     // QAF
  '\u0643': 'k',     // KAF
  '\u0644': 'l',     // LAM
  '\u0645': 'm',     // MEEM
  '\u0646': 'n',     // NOON
  '\u0647': 'h',     // HEH
  '\u0648': 'w',     // WAW
  '\u0649': 'ā',     // ALEF MAKSURA  (looks like ya, sounds like alif)
  '\u064A': 'y',     // YEH
  '\u0671': 'a',     // ALEF WASLA  (hamzat al-waṣl)
  // Persian / Urdu letters — extremely rare in BDB but cheap to support
  '\u067E': 'p',     // PEH
  '\u0686': 'ch',    // TCHEH
  '\u0698': 'zh',    // JEH
  '\u06AF': 'g',     // GAF
};
const ARABIC_DIACRITIC_MAP: Record<string, string> = {
  '\u064B': 'an',    // FATHATAN  (tanwīn fatḥ)
  '\u064C': 'un',    // DAMMATAN  (tanwīn ḍamm)
  '\u064D': 'in',    // KASRATAN  (tanwīn kasr)
  '\u064E': 'a',     // FATHA
  '\u064F': 'u',     // DAMMA
  '\u0650': 'i',     // KASRA
  '\u0652': '',      // SUKUN              (no vowel)
  '\u0653': '',      // MADDA ABOVE        (already encoded into U+0622)
  '\u0654': '',      // HAMZA ABOVE        (already encoded into U+0623/0624/0626)
  '\u0655': '',      // HAMZA BELOW        (already encoded into U+0625)
  '\u0670': 'ā',     // SUPERSCRIPT ALEF   (alif khanjariyya / dagger alif)
};
const ARABIC_SHADDA = '\u0651';
const FATHA = '\u064E', KASRA = '\u0650', DAMMA = '\u064F';
const ALIF = '\u0627', ALIF_MAKSURA = '\u0649', YA = '\u064A', WAW = '\u0648';

export function transliterateArabic(input: string): string {
  // Canonical Unicode order puts shadda *after* the vowel mark on the same
  // consonant (combining-class 33 vs 28), but linguistically shadda doubles
  // the consonant before the vowel is heard ("kallaba", not "kalbba").
  // Swap any "harakat + shadda" → "shadda + harakat" so a single left-to-right
  // pass produces the correct output. Loop because successive vowel marks
  // (e.g., dammatan + shadda + dagger-alif) may need multiple swaps.
  let prev: string;
  do {
    prev = input;
    input = input.replace(/([\u064B-\u0650\u0670])\u0651/g, '\u0651$1');
  } while (input !== prev);

  let out = '';
  let lastConsonant = '';
  for (let i = 0; i < input.length; i++) {
    const ch = input[i];
    const next = input[i + 1];

    // Long-vowel digraphs (lookahead): fatha+alif/maksura → ā, kasra+ya → ī,
    // damma+waw → ū. These represent the long vowel as a single unit, not
    // vowel-then-consonant.
    if (ch === FATHA && (next === ALIF || next === ALIF_MAKSURA)) {
      out += 'ā'; i++; continue;
    }
    if (ch === KASRA && next === YA) {
      out += 'ī'; i++; continue;
    }
    if (ch === DAMMA && next === WAW) {
      out += 'ū'; i++; continue;
    }

    if (ch === ARABIC_SHADDA) {
      // Double the most recent consonant unit. For digraphs like "sh" this
      // produces "shsh" — accurate per DIN 31635.
      out += lastConsonant;
    } else if (ch in ARABIC_LETTER_MAP) {
      const v = ARABIC_LETTER_MAP[ch];
      out += v;
      if (v) lastConsonant = v;
    } else if (ch in ARABIC_DIACRITIC_MAP) {
      out += ARABIC_DIACRITIC_MAP[ch];
      // Diacritics don't update lastConsonant — shadda doubles the consonant,
      // never the vowel ("kalla", not "kallaa").
    } else {
      out += ch;
    }
  }
  return out;
}

// ============================================================================
// ETHIOPIC (GE'EZ) → LATIN
// ============================================================================
// The Ethiopic syllabary is laid out in 8-column rows (U+1200, U+1208, …);
// each row is a consonant whose syllables are vowel forms in column order
// ä u i a e ə o, with column 7 being a "wä" labialized variant on most
// rows. The four labio-velar consonants (qʷ kʷ gʷ ḫʷ) live in 5-column rows
// (U+1248, U+12B0, U+1308, U+1288) using the vowels ä i a e ə (no u/o).
//
// Output uses scholarly transliteration (BDB-style): ä for the first-order
// vowel, ʾ for alaph, ʿ for ʿayn, ḥ ḫ ṣ ḍ ṭ ś š č̣ p̣ for emphatics and
// distinctive consonants. Punctuation marks U+1361–U+1368 map to ASCII
// equivalents (word separator → space, ፨ paragraph mark → "::").

const ETHIOPIC_BASE: Record<number, string> = {
  0x1200: 'h',  0x1208: 'l',  0x1210: 'ḥ',  0x1218: 'm',  0x1220: 'ś',
  0x1228: 'r',  0x1230: 's',  0x1238: 'š',  0x1240: 'q',
  0x1260: 'b',  0x1268: 'v',  0x1270: 't',  0x1278: 'č',
  0x1280: 'ḫ',  0x1290: 'n',  0x1298: 'ñ',
  0x12A0: 'ʾ',  0x12A8: 'k',  0x12B8: 'x',
  0x12C8: 'w',  0x12D0: 'ʿ',  0x12D8: 'z',  0x12E0: 'ž',
  0x12E8: 'y',  0x12F0: 'd',  0x12F8: 'ḍ',  // DDA (Amharic emphatic d)
  0x1300: 'ǧ',  // JA (sometimes written 'j')
  0x1308: 'g',
  0x1320: 'ṭ',  0x1328: 'č̣', 0x1330: 'p̣', 0x1338: 'ṣ',
  0x1340: 'ḍ',  0x1348: 'f',  0x1350: 'p',
};
// 5-column labio-velar rows (vowels in cols 0–4: ä, [—], i, a, e, ə, [—])
const ETHIOPIC_LABIOVELAR: Record<number, string> = {
  0x1248: 'qʷ', 0x1288: 'ḫʷ', 0x12B0: 'kʷ', 0x12C0: 'xʷ', 0x1310: 'gʷ',
};
const ETHIOPIC_VOWELS  = ['ä', 'u', 'i', 'a', 'e', 'ə', 'o'];        // cols 0–6
const ETHIOPIC_LV_VOW  = ['ä', '',  'i', 'a', 'e', 'ə', ''];         // cols 0–6 in 5-col rows
const ETHIOPIC_PUNCT: Record<number, string> = {
  0x1360: ' ',   // section mark (rare)
  0x1361: ' ',   // word separator
  0x1362: '.',   // full stop
  0x1363: ',',   // comma
  0x1364: ';',   // semicolon
  0x1365: ':',   // colon
  0x1366: '::',  // preface colon
  0x1367: '?',   // question mark
  0x1368: '¶',   // paragraph separator
};

export function transliterateEthiopic(input: string): string {
  let out = '';
  for (const ch of input) {
    const cp = ch.codePointAt(0)!;
    if (cp >= 0x1360 && cp <= 0x1368) { out += ETHIOPIC_PUNCT[cp] ?? ch; continue; }
    if (cp < 0x1200 || cp > 0x135F) { out += ch; continue; }
    const rowStart = cp & ~0x07;
    const col = cp - rowStart;
    if (rowStart in ETHIOPIC_LABIOVELAR) {
      const base = ETHIOPIC_LABIOVELAR[rowStart];
      // 5-col rows occupy columns 0–4 of an 8-col block; remaining cols are
      // gaps in the syllabary, so emit the base alone for safety.
      out += base + (ETHIOPIC_LV_VOW[col] ?? '');
      continue;
    }
    const base = ETHIOPIC_BASE[rowStart];
    if (!base) { out += ch; continue; }
    if (col < 7) {
      out += base + ETHIOPIC_VOWELS[col];
    } else {
      // Column 7 is the labialized "wä" form on most rows.
      out += base + 'wä';
    }
  }
  return out;
}

// ============================================================================
// HTML-IGNORANT RUN ANNOTATORS
// ============================================================================
// Each annotator finds maximal runs of its script's letters (and combining
// marks, for Syriac/Arabic vowel pointing) — possibly joined by `,` or
// whitespace — and appends `[transliteration]`. v-flag set intersection with
// `\p{L}\p{M}` excludes block-level punctuation and digits. The try/catch
// makes the module degrade to a no-op on engines without v-flag support
// (Chrome <112, Firefox <116, Safari <17, Node <20).

function buildRunRegex(blockPattern: string): RegExp | null {
  try {
    return new RegExp(
      `[[${blockPattern}]&&[\\p{L}\\p{M}]]+(?:[\\s,]+[[${blockPattern}]&&[\\p{L}\\p{M}]]+)*`,
      'gv'
    );
  } catch {
    return null;
  }
}

const GREEK_RUN_RE      = buildRunRegex('\\u0370-\\u03FF\\u1F00-\\u1FFF');
const SYRIAC_RUN_RE     = buildRunRegex('\\u0700-\\u074F');
const SAMARITAN_RUN_RE  = buildRunRegex('\\u0800-\\u082F');
const ARABIC_RUN_RE     = buildRunRegex('\\u0600-\\u06FF\\u0750-\\u077F');
const ETHIOPIC_RUN_RE   = buildRunRegex('\\u1200-\\u137F');

/**
 * Apply `transliterate` to each match of `runRe` and append `[result]`.
 * Idempotent: skips runs already followed by `[…]`, and skips when the
 * transliteration equals the input (which means every char passed through
 * unchanged — annotation would be uninformative).
 */
function annotateRuns(
  text: string,
  runRe: RegExp | null,
  transliterate: (m: string) => string,
): string {
  if (!runRe) return text;
  return text.replace(runRe, (match, ...rest) => {
    // String.replace callback ends with (offset, fullString).
    const fullString: string = rest[rest.length - 1];
    const offset: number = rest[rest.length - 2];
    const tail = fullString.slice(offset + match.length);
    if (/^\s*\[[^\]]*\]/.test(tail)) return match;
    const out = transliterate(match).trim();
    if (!out || out === match) return match;
    return `${match} [${out}]`;
  });
}

export function annotateGreekTransliterations(text: string): string {
  return annotateRuns(text, GREEK_RUN_RE, transliterateGreek);
}
export function annotateSyriacTransliterations(text: string): string {
  return annotateRuns(text, SYRIAC_RUN_RE, transliterateSyriac);
}
export function annotateSamaritanTransliterations(text: string): string {
  return annotateRuns(text, SAMARITAN_RUN_RE, transliterateSamaritan);
}
export function annotateArabicTransliterations(text: string): string {
  return annotateRuns(text, ARABIC_RUN_RE, transliterateArabic);
}
export function annotateEthiopicTransliterations(text: string): string {
  return annotateRuns(text, ETHIOPIC_RUN_RE, transliterateEthiopic);
}

/**
 * Apply Greek + Syriac + Samaritan + Arabic + Ethiopic annotation in one pass.
 * Order is inconsequential: each block is disjoint from the others, and each
 * transliteration produces output in a different block (Latin / Hebrew),
 * so no annotator can "see" another's output.
 */
export function annotateAllTransliterations(text: string): string {
  text = annotateGreekTransliterations(text);
  text = annotateSyriacTransliterations(text);
  text = annotateSamaritanTransliterations(text);
  text = annotateArabicTransliterations(text);
  text = annotateEthiopicTransliterations(text);
  return text;
}
