// Canonical source of truth for all tractate names and Hebrew translations
// This ensures consistency across frontend and backend

export const TRACTATE_LISTS = {
  "Bible": [
    "Genesis", "Exodus", "Leviticus", "Numbers", "Deuteronomy",
    "Joshua", "Judges", "Samuel I", "Samuel II", "Kings I", "Kings II",
    "Isaiah", "Jeremiah", "Ezekiel", "Hosea", "Joel", "Amos", "Obadiah",
    "Jonah", "Micah", "Nahum", "Habakkuk", "Zephaniah", "Haggai", "Zechariah", "Malachi",
    "Psalms", "Proverbs", "Job", "Song of Songs", "Ruth", "Lamentations",
    "Ecclesiastes", "Esther", "Daniel", "Ezra", "Nehemiah", "Chronicles I", "Chronicles II"
  ],
  "Mishnah": [
    "Berakhot", "Peah", "Demai", "Kilayim", "Sheviit", "Terumot", "Maasrot", "Maaser Sheni", "Challah", "Orlah", "Bikkurim",
    "Shabbat", "Eruvin", "Pesachim", "Shekalim", "Yoma", "Sukkah", "Beitzah", "Rosh Hashanah", "Taanit", "Megillah", "Moed Katan", "Chagigah",
    "Yevamot", "Ketubot", "Nedarim", "Nazir", "Sotah", "Gittin", "Kiddushin",
    "Bava Kamma", "Bava Metzia", "Bava Batra", "Sanhedrin", "Makkot", "Shevuot", "Eduyot", "Avodah Zarah", "Avot", "Horayot",
    "Zevachim", "Menachot", "Chullin", "Bekhorot", "Arakhin", "Temurah", "Keritot", "Meilah", "Tamid", "Middot", "Kinnim",
    "Kelim", "Oholot", "Negaim", "Parah", "Taharot", "Mikvaot", "Niddah", "Makhshirin", "Zavim", "Tevul Yom", "Yadayim", "Uktzin"
  ],
  "Talmud Yerushalmi": [
    "Berakhot", "Peah", "Demai", "Kilayim", "Sheviit", "Terumot", "Maasrot", "Maaser Sheni", "Challah", "Orlah", "Bikkurim",
    "Shabbat", "Eruvin", "Pesachim", "Shekalim", "Yoma", "Sukkah", "Beitzah", "Rosh Hashanah", "Taanit", "Megillah", "Chagigah",
    "Yevamot", "Ketubot", "Nedarim", "Nazir", "Sotah", "Gittin", "Kiddushin",
    "Bava Kamma", "Bava Metzia", "Bava Batra", "Sanhedrin", "Makkot", "Shevuot", "Avodah Zarah", "Horayot", "Niddah"
  ],
  "Talmud Bavli": [
    "Berakhot",
    "Shabbat", "Eruvin", "Pesachim", "Rosh Hashanah", "Yoma", "Sukkah", "Beitza", "Ta'anit", "Megillah", "Mo'ed Katan", "Chagigah",
    "Yevamot", "Ketubot", "Nedarim", "Nazir", "Sotah", "Gittin", "Kiddushin",
    "Bava Kamma", "Bava Metzia", "Bava Batra", "Sanhedrin", "Makkot", "Shevu'ot", "Avodah Zarah", "Horayot",
    "Zevahim", "Menachot", "Chullin", "Bekhorot", "Arachin", "Temurah", "Keritot", "Me'ilah", "Tamid", "Middot", "Kinnim", "Niddah"
  ]
} as const;

// Hebrew names for Talmud Bavli tractates
export const TRACTATE_HEBREW_NAMES = {
  "Berakhot": "ברכות",
  "Shabbat": "שבת",
  "Eruvin": "עירובין", 
  "Pesachim": "פסחים",
  "Rosh Hashanah": "ראש השנה",
  "Yoma": "יומא",
  "Sukkah": "סוכה",
  "Beitza": "ביצה",
  "Ta'anit": "תענית",
  "Megillah": "מגילה",
  "Mo'ed Katan": "מועד קטן",
  "Chagigah": "חגיגה",
  "Yevamot": "יבמות",
  "Ketubot": "כתובות",
  "Nedarim": "נדרים",
  "Nazir": "נזיר", 
  "Sotah": "סוטה",
  "Gittin": "גיטין",
  "Kiddushin": "קידושין",
  "Bava Kamma": "בבא קמא",
  "Bava Metzia": "בבא מציעא",
  "Bava Batra": "בבא בתרא",
  "Sanhedrin": "סנהדרין",
  "Makkot": "מכות",
  "Shevu'ot": "שבועות",
  "Avodah Zarah": "עבודה זרה", 
  "Horayot": "הוריות",
  "Zevahim": "זבחים",
  "Menachot": "מנחות",
  "Chullin": "חולין",
  "Bekhorot": "בכורות",
  "Arachin": "ערכין",
  "Temurah": "תמורה",
  "Keritot": "כריתות",
  "Me'ilah": "מעילה",
  "Tamid": "תמיד",
  "Middot": "מדות", 
  "Kinnim": "קינים",
  "Niddah": "נדה"
} as const;

// Folio ranges for all Talmud Bavli tractates
export const TRACTATE_FOLIO_RANGES = {
  "Berakhot": 64, "Shabbat": 157, "Eruvin": 105, "Pesachim": 121, "Shekalim": 22, "Yoma": 88,
  "Sukkah": 56, "Beitza": 40, "Rosh Hashanah": 35, "Ta'anit": 31, "Megillah": 32,
  "Mo'ed Katan": 29, "Chagigah": 27, "Yevamot": 122, "Ketubot": 112, "Nedarim": 91, 
  "Nazir": 66, "Sotah": 49, "Gittin": 90, "Kiddushin": 82, "Bava Kamma": 119, 
  "Bava Metzia": 119, "Bava Batra": 176, "Sanhedrin": 113, "Makkot": 24, "Shevu'ot": 49, 
  "Avodah Zarah": 76, "Horayot": 14, "Zevahim": 120, "Menachot": 110, "Chullin": 142, 
  "Bekhorot": 61, "Arachin": 34, "Temurah": 34, "Keritot": 28, "Me'ilah": 22, 
  "Tamid": 8, "Middot": 3, "Kinnim": 4, "Niddah": 73
} as const;

export type WorkName = keyof typeof TRACTATE_LISTS;
export type TalmudBavliTractate = typeof TRACTATE_LISTS["Talmud Bavli"][number];

// URL-safe to proper case mapping for Sefaria API calls
export const URL_TO_SEFARIA_TRACTATE_MAP: Record<string, string> = {
  "berakhot": "Berakhot",
  "shabbat": "Shabbat", 
  "eruvin": "Eruvin",
  "pesachim": "Pesachim",
  "rosh hashanah": "Rosh Hashanah",
  "yoma": "Yoma",
  "sukkah": "Sukkah", 
  "beitza": "Beitzah",
  "ta'anit": "Taanit",
  "megillah": "Megillah",
  "mo'ed katan": "Moed Katan", // Note: Sefaria uses without apostrophe
  "chagigah": "Chagigah",
  "yevamot": "Yevamot",
  "ketubot": "Ketubot", 
  "nedarim": "Nedarim",
  "nazir": "Nazir",
  "sotah": "Sotah",
  "gittin": "Gittin",
  "kiddushin": "Kiddushin",
  "bava kamma": "Bava Kamma",
  "bava metzia": "Bava Metzia", 
  "bava batra": "Bava Batra",
  "sanhedrin": "Sanhedrin",
  "makkot": "Makkot",
  "shevu'ot": "Shevuot",
  "avodah zarah": "Avodah Zarah",
  "horayot": "Horayot",
  "zevahim": "Zevachim",
  "menachot": "Menachot",
  "chullin": "Chullin",
  "bekhorot": "Bekhorot", 
  "arachin": "Arachin",
  "temurah": "Temurah",
  "keritot": "Keritot", 
  "me'ilah": "Meilah",
  "tamid": "Tamid",
  "middot": "Middot",
  "kinnim": "Kinnim",
  "niddah": "Niddah"
};

// Helper function to normalize tractate names for Sefaria API calls
export function normalizeSefariaTractateName(urlTractate: string): string {
  const normalized = URL_TO_SEFARIA_TRACTATE_MAP[urlTractate.toLowerCase()];
  return normalized || urlTractate;
}