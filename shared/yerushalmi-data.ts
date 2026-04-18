export const YERUSHALMI_HEBREW_NAMES: Record<string, string> = {
  "Berakhot": "ברכות",
  "Peah": "פאה",
  "Demai": "דמאי",
  "Kilayim": "כלאים",
  "Sheviit": "שביעית",
  "Terumot": "תרומות",
  "Maasrot": "מעשרות",
  "Maaser Sheni": "מעשר שני",
  "Challah": "חלה",
  "Orlah": "ערלה",
  "Bikkurim": "ביכורים",
  "Shabbat": "שבת",
  "Eruvin": "עירובין",
  "Pesachim": "פסחים",
  "Shekalim": "שקלים",
  "Yoma": "יומא",
  "Sukkah": "סוכה",
  "Beitzah": "ביצה",
  "Rosh Hashanah": "ראש השנה",
  "Taanit": "תענית",
  "Megillah": "מגילה",
  "Chagigah": "חגיגה",
  "Moed Katan": "מועד קטן",
  "Yevamot": "יבמות",
  "Ketubot": "כתובות",
  "Sotah": "סוטה",
  "Nedarim": "נדרים",
  "Nazir": "נזיר",
  "Gittin": "גיטין",
  "Kiddushin": "קידושין",
  "Bava Kamma": "בבא קמא",
  "Bava Metzia": "בבא מציעא",
  "Bava Batra": "בבא בתרא",
  "Sanhedrin": "סנהדרין",
  "Makkot": "מכות",
  "Shevuot": "שבועות",
  "Avodah Zarah": "עבודה זרה",
  "Horayot": "הוריות",
  "Niddah": "נדה",
};

export const YERUSHALMI_TRACTATES = {
  zeraim: [
    { name: "Berakhot", chapters: 9, sefaria: "Jerusalem_Talmud_Berakhot" },
    { name: "Peah", chapters: 8, sefaria: "Jerusalem_Talmud_Peah" },
    { name: "Demai", chapters: 7, sefaria: "Jerusalem_Talmud_Demai" },
    { name: "Kilayim", chapters: 9, sefaria: "Jerusalem_Talmud_Kilayim" },
    { name: "Sheviit", chapters: 10, sefaria: "Jerusalem_Talmud_Sheviit" },
    { name: "Terumot", chapters: 11, sefaria: "Jerusalem_Talmud_Terumot" },
    { name: "Maasrot", chapters: 5, sefaria: "Jerusalem_Talmud_Maasrot" },
    { name: "Maaser Sheni", chapters: 5, sefaria: "Jerusalem_Talmud_Maaser_Sheni" },
    { name: "Challah", chapters: 4, sefaria: "Jerusalem_Talmud_Challah" },
    { name: "Orlah", chapters: 3, sefaria: "Jerusalem_Talmud_Orlah" },
    { name: "Bikkurim", chapters: 3, sefaria: "Jerusalem_Talmud_Bikkurim" },
  ],
  moed: [
    { name: "Shabbat", chapters: 24, sefaria: "Jerusalem_Talmud_Shabbat" },
    { name: "Eruvin", chapters: 10, sefaria: "Jerusalem_Talmud_Eruvin" },
    { name: "Pesachim", chapters: 10, sefaria: "Jerusalem_Talmud_Pesachim" },
    { name: "Shekalim", chapters: 8, sefaria: "Jerusalem_Talmud_Shekalim" },
    { name: "Yoma", chapters: 8, sefaria: "Jerusalem_Talmud_Yoma" },
    { name: "Sukkah", chapters: 5, sefaria: "Jerusalem_Talmud_Sukkah" },
    { name: "Beitzah", chapters: 5, sefaria: "Jerusalem_Talmud_Beitzah" },
    { name: "Rosh Hashanah", chapters: 4, sefaria: "Jerusalem_Talmud_Rosh_Hashanah" },
    { name: "Taanit", chapters: 4, sefaria: "Jerusalem_Talmud_Taanit" },
    { name: "Megillah", chapters: 4, sefaria: "Jerusalem_Talmud_Megillah" },
    { name: "Chagigah", chapters: 3, sefaria: "Jerusalem_Talmud_Chagigah" },
    { name: "Moed Katan", chapters: 3, sefaria: "Jerusalem_Talmud_Moed_Katan" },
  ],
  nashim: [
    { name: "Yevamot", chapters: 16, sefaria: "Jerusalem_Talmud_Yevamot" },
    { name: "Ketubot", chapters: 13, sefaria: "Jerusalem_Talmud_Ketubot" },
    { name: "Sotah", chapters: 9, sefaria: "Jerusalem_Talmud_Sotah" },
    { name: "Nedarim", chapters: 11, sefaria: "Jerusalem_Talmud_Nedarim" },
    { name: "Nazir", chapters: 9, sefaria: "Jerusalem_Talmud_Nazir" },
    { name: "Gittin", chapters: 9, sefaria: "Jerusalem_Talmud_Gittin" },
    { name: "Kiddushin", chapters: 4, sefaria: "Jerusalem_Talmud_Kiddushin" },
  ],
  nezikin: [
    { name: "Bava Kamma", chapters: 10, sefaria: "Jerusalem_Talmud_Bava_Kamma" },
    { name: "Bava Metzia", chapters: 10, sefaria: "Jerusalem_Talmud_Bava_Metzia" },
    { name: "Bava Batra", chapters: 10, sefaria: "Jerusalem_Talmud_Bava_Batra" },
    { name: "Sanhedrin", chapters: 11, sefaria: "Jerusalem_Talmud_Sanhedrin" },
    { name: "Makkot", chapters: 3, sefaria: "Jerusalem_Talmud_Makkot" },
    { name: "Shevuot", chapters: 8, sefaria: "Jerusalem_Talmud_Shevuot" },
    { name: "Avodah Zarah", chapters: 5, sefaria: "Jerusalem_Talmud_Avodah_Zarah" },
    { name: "Horayot", chapters: 3, sefaria: "Jerusalem_Talmud_Horayot" },
    { name: "Niddah", chapters: 4, sefaria: "Jerusalem_Talmud_Niddah" },
  ],
} as const;

export type YerushalmiSederName = keyof typeof YERUSHALMI_TRACTATES;

export const YERUSHALMI_URL_MAP: Record<string, string> = {
  "berakhot": "Berakhot",
  "peah": "Peah",
  "demai": "Demai",
  "kilayim": "Kilayim",
  "sheviit": "Sheviit",
  "terumot": "Terumot",
  "maasrot": "Maasrot",
  "maaser-sheni": "Maaser Sheni",
  "maaser_sheni": "Maaser Sheni",
  "maaser sheni": "Maaser Sheni",
  "challah": "Challah",
  "orlah": "Orlah",
  "bikkurim": "Bikkurim",
  "shabbat": "Shabbat",
  "eruvin": "Eruvin",
  "pesachim": "Pesachim",
  "shekalim": "Shekalim",
  "yoma": "Yoma",
  "sukkah": "Sukkah",
  "beitzah": "Beitzah",
  "rosh-hashanah": "Rosh Hashanah",
  "rosh_hashanah": "Rosh Hashanah",
  "rosh hashanah": "Rosh Hashanah",
  "taanit": "Taanit",
  "megillah": "Megillah",
  "chagigah": "Chagigah",
  "moed-katan": "Moed Katan",
  "moed_katan": "Moed Katan",
  "moed katan": "Moed Katan",
  "yevamot": "Yevamot",
  "ketubot": "Ketubot",
  "sotah": "Sotah",
  "nedarim": "Nedarim",
  "nazir": "Nazir",
  "gittin": "Gittin",
  "kiddushin": "Kiddushin",
  "bava-kamma": "Bava Kamma",
  "bava_kamma": "Bava Kamma",
  "bava kamma": "Bava Kamma",
  "bava-metzia": "Bava Metzia",
  "bava_metzia": "Bava Metzia",
  "bava metzia": "Bava Metzia",
  "bava-batra": "Bava Batra",
  "bava_batra": "Bava Batra",
  "bava batra": "Bava Batra",
  "sanhedrin": "Sanhedrin",
  "makkot": "Makkot",
  "shevuot": "Shevuot",
  "avodah-zarah": "Avodah Zarah",
  "avodah_zarah": "Avodah Zarah",
  "avodah zarah": "Avodah Zarah",
  "horayot": "Horayot",
  "niddah": "Niddah",
};

export function normalizeYerushalmiTractateName(urlTractate: string): string | null {
  const key = decodeURIComponent(urlTractate)
    .toLowerCase()
    .replace(/['\u2019]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return YERUSHALMI_URL_MAP[key] || YERUSHALMI_URL_MAP[decodeURIComponent(urlTractate).toLowerCase()] || null;
}

export function isValidYerushalmiTractate(urlTractate: string): boolean {
  return normalizeYerushalmiTractateName(urlTractate) !== null;
}

export function getYerushalmiTractateInfo(nameOrSlug: string): { name: string; chapters: number; sefaria: string } | null {
  const displayName = normalizeYerushalmiTractateName(nameOrSlug) || nameOrSlug;
  for (const tractates of Object.values(YERUSHALMI_TRACTATES)) {
    for (const t of tractates) {
      if (t.name === displayName) return { name: t.name, chapters: t.chapters, sefaria: t.sefaria };
    }
  }
  return null;
}

export function getYerushalmiTractateSlug(tractate: string): string {
  return tractate.replace(/ /g, '_');
}

// Halakhot that exist in Sefaria's data but contain no actual text.
// Keyed by display tractate name -> chapter -> list of missing halakhah numbers.
// The website / sitemap / nav skip these, so e.g. Ketubot 4 jumps from 4.4 to 4.6.
export const YERUSHALMI_MISSING_HALAKHOT: Record<string, Record<number, number[]>> = {
  Ketubot: { 4: [5] },
};

export function isMissingYerushalmiHalakhah(tractate: string, chapter: number, halakhah: number): boolean {
  return (YERUSHALMI_MISSING_HALAKHOT[tractate]?.[chapter] ?? []).includes(halakhah);
}

// Given a chapter's total halakhah count, return the sorted list of halakhah numbers
// that actually have content (skipping any in YERUSHALMI_MISSING_HALAKHOT).
export function getValidYerushalmiHalakhot(tractate: string, chapter: number, totalCount: number): number[] {
  const missing = new Set(YERUSHALMI_MISSING_HALAKHOT[tractate]?.[chapter] ?? []);
  const out: number[] = [];
  for (let h = 1; h <= totalCount; h++) {
    if (!missing.has(h)) out.push(h);
  }
  return out;
}

// Find the next/previous valid halakhah number within a chapter, skipping missing ones.
// Returns null if none in this chapter.
export function nextValidHalakhahInChapter(tractate: string, chapter: number, halakhah: number, totalCount: number): number | null {
  const missing = new Set(YERUSHALMI_MISSING_HALAKHOT[tractate]?.[chapter] ?? []);
  for (let h = halakhah + 1; h <= totalCount; h++) {
    if (!missing.has(h)) return h;
  }
  return null;
}

export function prevValidHalakhahInChapter(tractate: string, chapter: number, halakhah: number): number | null {
  const missing = new Set(YERUSHALMI_MISSING_HALAKHOT[tractate]?.[chapter] ?? []);
  for (let h = halakhah - 1; h >= 1; h--) {
    if (!missing.has(h)) return h;
  }
  return null;
}

// First / last valid halakhah in a chapter (used when crossing chapter boundaries).
export function firstValidHalakhahInChapter(tractate: string, chapter: number, totalCount: number): number | null {
  return nextValidHalakhahInChapter(tractate, chapter, 0, totalCount);
}

export function lastValidHalakhahInChapter(tractate: string, chapter: number, totalCount: number): number | null {
  return prevValidHalakhahInChapter(tractate, chapter, totalCount + 1);
}

export function parseChapterHalakhah(value: string): { chapter: number; halakhah: number } | null {
  const match = /^(\d+)\.(\d+)$/.exec(value);
  if (!match) return null;
  const chapter = parseInt(match[1], 10);
  const halakhah = parseInt(match[2], 10);
  if (isNaN(chapter) || isNaN(halakhah) || chapter < 1 || halakhah < 1) return null;
  return { chapter, halakhah };
}
