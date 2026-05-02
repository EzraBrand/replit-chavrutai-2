// Hebrew alphabet used by lexicon readers and headword indexes.
// 22 letters; final-form letters (ך ם ן ף ץ) are intentionally excluded —
// they're normalized to their regular forms during headword matching.

export const HEBREW_ALPHABET = [
  'א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ז', 'ח', 'ט', 'י', 'כ',
  'ל', 'מ', 'נ', 'ס', 'ע', 'פ', 'צ', 'ק', 'ר', 'ש', 'ת',
] as const;

export type HebrewLetter = typeof HEBREW_ALPHABET[number];

export function isHebrewLetter(s: string): s is HebrewLetter {
  return (HEBREW_ALPHABET as readonly string[]).includes(s);
}
