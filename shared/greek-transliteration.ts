/**
 * Greek → Latin transliteration using classical / scholarly conventions.
 *
 * Standard rules:
 *   - η→ē, ω→ō (long vowels with macron)
 *   - θ→th, φ→ph, χ→ch, ψ→ps, ξ→x (digraphs)
 *   - υ→y in isolation, but → u in αυ/ευ/ηυ/ου diphthongs
 *   - γ→n before γ/κ/χ/ξ ("ngamma" rule)
 *   - rough breathing on initial vowel → h-prefix; on initial ρ → rh
 *   - capital + rough breathing → H + lowercase vowel (Ἑλλάς → Hellas)
 *   - diacritics (acute, grave, circumflex, smooth breathing, iota subscript,
 *     diaeresis) are stripped — they don't affect Latin transliteration.
 *
 * Source of truth: scripts/scrape-bdb-noun-proper.ts (originally) and now
 * shared between that script and the live BDB / Jastrow readers.
 */

const GREEK_LETTER_MAP: Record<string, string> = {
  α: 'a', β: 'b', γ: 'g', δ: 'd', ε: 'e', ζ: 'z', η: 'ē', θ: 'th',
  ι: 'i', κ: 'k', λ: 'l', μ: 'm', ν: 'n', ξ: 'x', ο: 'o', π: 'p',
  ρ: 'r', σ: 's', ς: 's', τ: 't', υ: 'y', φ: 'ph', χ: 'ch', ψ: 'ps',
  ω: 'ō',
  Α: 'A', Β: 'B', Γ: 'G', Δ: 'D', Ε: 'E', Ζ: 'Z', Η: 'Ē', Θ: 'Th',
  Ι: 'I', Κ: 'K', Λ: 'L', Μ: 'M', Ν: 'N', Ξ: 'X', Ο: 'O', Π: 'P',
  Ρ: 'R', Σ: 'S', Τ: 'T', Υ: 'Y', Φ: 'Ph', Χ: 'Ch', Ψ: 'Ps', Ω: 'Ō',
  // Archaic letters (rare in BDB / Jastrow but appear in Homeric and dialectal
  // forms — e.g., "Ἰάϝονες" for "Ionians"). Digamma ϝ → w is standard.
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
  out = out.replace(/([aeēoō])y/g, '$1u').replace(/([AEĒOŌ])Y/g, '$1U').replace(/([AEĒOŌ])y/g, '$1u');
  return out;
}

// v-flag set intersection: "in Greek block" AND "is a letter" (\p{L}). This
// excludes Greek-block punctuation like U+037E ";" or U+0387 "·" and standalone
// breathing marks like U+1FFE. v-flag requires Chrome 112+, Firefox 116+,
// Safari 17+, Node 20+. Created via `new RegExp` + try/catch so older engines
// degrade to no-op rather than crashing the module load.
let GREEK_RUN_RE: RegExp | null = null;
try {
  GREEK_RUN_RE = new RegExp(
    '[[\\u0370-\\u03FF\\u1F00-\\u1FFF]&&\\p{L}]+(?:[\\s,]+[[\\u0370-\\u03FF\\u1F00-\\u1FFF]&&\\p{L}]+)*',
    'gv'
  );
} catch {
  GREEK_RUN_RE = null;
}

/**
 * Find Greek-letter runs in plain text and append a Latin transliteration in
 * `[brackets]` after each run. Idempotent: a Greek run that is already
 * immediately followed by `[...]` is left alone, so re-running the function
 * doesn't accumulate duplicate annotations.
 *
 * For HTML input, use `annotateGreekInHtml` from
 * `client/src/lib/dictionary-format.ts` instead — that version walks text
 * nodes only so HTML attributes aren't rewritten.
 */
export function annotateGreekTransliterations(text: string): string {
  if (!GREEK_RUN_RE) return text;
  return text.replace(GREEK_RUN_RE, (match, ...rest) => {
    // String.replace callback ends with (offset, fullString) (no named groups
    // here, so those are the last two args).
    const fullString: string = rest[rest.length - 1];
    const offset: number = rest[rest.length - 2];
    const tail = fullString.slice(offset + match.length);
    // Already annotated → leave it alone.
    if (/^\s*\[[^\]]*\]/.test(tail)) return match;
    const lat = transliterateGreek(match).trim();
    // Skip empty results, and skip when the "transliteration" is identical to
    // the input (which means every letter passed through unchanged — i.e.
    // unmapped archaic letters — and an annotation would be uninformative).
    if (!lat || lat === match) return match;
    return `${match} [${lat}]`;
  });
}
