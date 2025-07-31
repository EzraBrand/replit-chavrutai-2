// Accurate folio counts for each Talmud Bavli tractate based on Vilna edition
// Data sourced from Wikipedia's List of Talmudic tractates
export const TRACTATE_FOLIO_RANGES: Record<string, number> = {
  // Seder Zeraim (Order of Seeds)
  "Berakhot": 64,
  
  // Seder Moed (Order of Appointed Times)
  "Shabbat": 157, "Eruvin": 105, "Pesachim": 121, "Shekalim": 22, "Yoma": 88,
  "Sukkah": 56, "Beitza": 40, "Rosh Hashanah": 35, "Ta'anit": 31, "Megillah": 32,
  "Mo'ed Katan": 29, "Chagigah": 27,
  
  // Seder Nashim (Order of Women)
  "Yevamot": 122, "Ketubot": 112, "Nedarim": 91, "Nazir": 66, "Sotah": 49,
  "Gittin": 90, "Kiddushin": 82,
  
  // Seder Nezikin (Order of Damages)
  "Bava Kamma": 119, "Bava Metzia": 119, "Bava Batra": 176, "Sanhedrin": 113,
  "Makkot": 24, "Shevu'ot": 49, "Avodah Zarah": 76, "Horayot": 14,
  
  // Seder Kodashim (Order of Holy Things)
  "Zevahim": 120, "Menachot": 110, "Chullin": 142, "Bekhorot": 61, "Arachin": 34,
  "Temurah": 34, "Keritot": 28, "Me'ilah": 22, "Tamid": 8, "Middot": 3, "Kinnim": 4,
  
  // Seder Tohorot (Order of Purities)
  "Niddah": 73
};

/**
 * Get the maximum folio number for a given tractate
 * @param tractate - The name of the tractate
 * @returns The maximum folio number, defaults to 150 if tractate not found
 */
export function getMaxFolio(tractate: string): number {
  return TRACTATE_FOLIO_RANGES[tractate] || 150;
}

/**
 * Check if a folio number is valid for a given tractate
 * @param tractate - The name of the tractate
 * @param folio - The folio number to check
 * @returns true if the folio is within the valid range (2 to max folio)
 */
export function isValidFolio(tractate: string, folio: number): boolean {
  const maxFolio = getMaxFolio(tractate);
  return folio >= 2 && folio <= maxFolio;
}