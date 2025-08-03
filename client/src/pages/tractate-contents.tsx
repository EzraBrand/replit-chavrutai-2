import { useRoute, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { HamburgerMenu } from "@/components/navigation/hamburger-menu";
import { sefariaAPI } from "@/lib/sefaria";
import { getMaxFolio } from "@/lib/tractate-ranges";
import { TRACTATE_HEBREW_NAMES, normalizeDisplayTractateName } from "@shared/tractates";
import hebrewBookIcon from "@/assets/hebrew-book-icon.png";
import type { TalmudLocation } from "@/types/talmud";

// Complete authentic chapter data for all Talmud Bavli tractates
const CHAPTER_DATA: Record<string, Array<{
  number: number;
  englishName: string;
  hebrewName: string;
  startFolio: number;
  startSide: 'a' | 'b';
  endFolio: number;
  endSide: 'a' | 'b';
}>> = {
  "berakhot": [
    { number: 1, englishName: "Me'eimatay", hebrewName: "מאימתי", startFolio: 2, startSide: 'a', endFolio: 13, endSide: 'a' },
    { number: 2, englishName: "Hayah Korei", hebrewName: "היה קורא", startFolio: 13, startSide: 'a', endFolio: 17, endSide: 'b' },
    { number: 3, englishName: "Mi She'meto", hebrewName: "מי שמתו", startFolio: 17, startSide: 'b', endFolio: 26, endSide: 'a' },
    { number: 4, englishName: "Tefilat HaShachar", hebrewName: "תפילת השחר", startFolio: 26, startSide: 'a', endFolio: 30, endSide: 'b' },
    { number: 5, englishName: "Ein Omdin", hebrewName: "אין עומדין", startFolio: 30, startSide: 'b', endFolio: 35, endSide: 'a' },
    { number: 6, englishName: "Keytzad Mevarkhim", hebrewName: "כיצד מברכין", startFolio: 35, startSide: 'a', endFolio: 45, endSide: 'a' },
    { number: 7, englishName: "Sheloshah She'achlu", hebrewName: "שלשה שאכלו", startFolio: 45, startSide: 'a', endFolio: 51, endSide: 'a' },
    { number: 8, englishName: "Eilu Devarim", hebrewName: "אלו דברים", startFolio: 51, startSide: 'a', endFolio: 54, endSide: 'a' },
    { number: 9, englishName: "HaRo'eh", hebrewName: "הרואה", startFolio: 54, startSide: 'a', endFolio: 64, endSide: 'a' }
  ],
  "shabbat": [
    { number: 1, englishName: "Yetziot HaShabbat", hebrewName: "יציאות השבת", startFolio: 2, startSide: 'a', endFolio: 20, endSide: 'b' },
    { number: 2, englishName: "BaMeh Madlikin", hebrewName: "במה מדליקין", startFolio: 20, startSide: 'b', endFolio: 31, endSide: 'a' },
    { number: 3, englishName: "Kirah", hebrewName: "כירה", startFolio: 36, startSide: 'b', endFolio: 47, endSide: 'b' },
    { number: 4, englishName: "BaMeh Tomnin", hebrewName: "במה טומנין", startFolio: 47, startSide: 'b', endFolio: 51, endSide: 'b' },
    { number: 5, englishName: "BaMeh Beheimah", hebrewName: "במה בהמה", startFolio: 51, startSide: 'b', endFolio: 65, endSide: 'a' },
    { number: 6, englishName: "Tzolelei Chamin", hebrewName: "צוללי חמין", startFolio: 65, startSide: 'a', endFolio: 77, endSide: 'a' },
    { number: 7, englishName: "Kelalim", hebrewName: "כללים", startFolio: 73, startSide: 'a', endFolio: 90, endSide: 'a' },
    { number: 8, englishName: "R' Eliezer", hebrewName: "ר' אליעזר", startFolio: 90, startSide: 'a', endFolio: 96, endSide: 'b' },
    { number: 9, englishName: "Amar R' Akiva", hebrewName: "אמר ר' עקיבא", startFolio: 95, startSide: 'a', endFolio: 106, endSide: 'b' },
    { number: 10, englishName: "HaBoneh", hebrewName: "הבונה", startFolio: 102, startSide: 'b', endFolio: 107, endSide: 'b' },
    { number: 11, englishName: "HaZorek", hebrewName: "הזורק", startFolio: 107, startSide: 'b', endFolio: 114, endSide: 'b' },
    { number: 12, englishName: "HaBoneh Bayit", hebrewName: "הבונה בית", startFolio: 114, startSide: 'b', endFolio: 122, endSide: 'a' },
    { number: 13, englishName: "R' Eliezer De'Milah", hebrewName: "ר' אליעזר דמילה", startFolio: 130, startSide: 'a', endFolio: 138, endSide: 'a' },
    { number: 14, englishName: "Arba'ah Devarim", hebrewName: "ארבעה דברים", startFolio: 140, startSide: 'a', endFolio: 148, endSide: 'a' },
    { number: 15, englishName: "Eilu Kesharim", hebrewName: "אלו קשרים", startFolio: 148, startSide: 'a', endFolio: 157, endSide: 'b' }
  ],
  "eruvin": [
    { number: 1, englishName: "Mavoy", hebrewName: "מבוי", startFolio: 2, startSide: 'a', endFolio: 26, endSide: 'b' },
    { number: 2, englishName: "Osin Pasin", hebrewName: "עושין פסין", startFolio: 26, startSide: 'b', endFolio: 35, endSide: 'a' },
    { number: 3, englishName: "Kol Gagot", hebrewName: "כל גגות", startFolio: 35, startSide: 'a', endFolio: 49, endSide: 'a' },
    { number: 4, englishName: "Mi She'hotziuhu", hebrewName: "מי שהוציאוהו", startFolio: 41, startSide: 'a', endFolio: 49, endSide: 'a' },
    { number: 5, englishName: "Kayitzad Me'arvin", hebrewName: "כיצד מערבין", startFolio: 49, startSide: 'a', endFolio: 62, endSide: 'b' },
    { number: 6, englishName: "HaDar", hebrewName: "הדר", startFolio: 62, startSide: 'b', endFolio: 73, endSide: 'a' },
    { number: 7, englishName: "Chalon", hebrewName: "חלון", startFolio: 73, startSide: 'a', endFolio: 81, endSide: 'a' },
    { number: 8, englishName: "Kayitzad Mitabed", hebrewName: "כיצד מטבד", startFolio: 81, startSide: 'a', endFolio: 89, endSide: 'a' },
    { number: 9, englishName: "Kol She'hu", hebrewName: "כל שהוא", startFolio: 89, startSide: 'a', endFolio: 96, endSide: 'b' },
    { number: 10, englishName: "Hayah Ba", hebrewName: "היה בא", startFolio: 96, startSide: 'b', endFolio: 105, endSide: 'a' }
  ],
  "pesachim": [
    { number: 1, englishName: "Or Le'arbah Asar", hebrewName: "אור לארבעה עשר", startFolio: 2, startSide: 'a', endFolio: 21, endSide: 'a' },
    { number: 2, englishName: "Kol Sha'ah", hebrewName: "כל שעה", startFolio: 21, startSide: 'a', endFolio: 35, endSide: 'a' },
    { number: 3, englishName: "Eilu Ovrin", hebrewName: "אלו עוברין", startFolio: 35, startSide: 'a', endFolio: 43, endSide: 'b' },
    { number: 4, englishName: "Makom She'nahagu", hebrewName: "מקום שנהגו", startFolio: 43, startSide: 'b', endFolio: 50, endSide: 'a' },
    { number: 5, englishName: "Tamid Nishchat", hebrewName: "תמיד נשחט", startFolio: 58, startSide: 'a', endFolio: 70, endSide: 'a' },
    { number: 6, englishName: "Eilu Devarim", hebrewName: "אלו דברים", startFolio: 70, startSide: 'a', endFolio: 82, endSide: 'a' },
    { number: 7, englishName: "Kayitzad Tzolin", hebrewName: "כיצד צולין", startFolio: 74, startSide: 'a', endFolio: 82, endSide: 'a' },
    { number: 8, englishName: "Ishah", hebrewName: "אשה", startFolio: 82, startSide: 'a', endFolio: 91, endSide: 'a' },
    { number: 9, englishName: "Mi She'hayah Tamei", hebrewName: "מי שהיה טמא", startFolio: 91, startSide: 'a', endFolio: 96, endSide: 'a' },
    { number: 10, englishName: "Arvei Pesachim", hebrewName: "ערבי פסחים", startFolio: 99, startSide: 'b', endFolio: 121, endSide: 'b' }
  ],
  "yoma": [
    { number: 1, englishName: "Shivat Yamim", hebrewName: "שבעת ימים", startFolio: 2, startSide: 'a', endFolio: 22, endSide: 'a' },
    { number: 2, englishName: "Ba Lo Kohen Gadol", hebrewName: "בא לו כהן גדול", startFolio: 22, startSide: 'a', endFolio: 31, endSide: 'b' },
    { number: 3, englishName: "Amar Lahem", hebrewName: "אמר להם", startFolio: 32, startSide: 'a', endFolio: 42, endSide: 'a' },
    { number: 4, englishName: "Taraf BaKalpi", hebrewName: "טרף בקלפי", startFolio: 39, startSide: 'a', endFolio: 52, endSide: 'b' },
    { number: 5, englishName: "Hillel HaZakein", hebrewName: "הלל הזקן", startFolio: 53, startSide: 'a', endFolio: 62, endSide: 'a' },
    { number: 6, englishName: "Shnei Se'irei", hebrewName: "שני שעירי", startFolio: 62, startSide: 'a', endFolio: 68, endSide: 'b' },
    { number: 7, englishName: "Kitzad", hebrewName: "כיצד", startFolio: 68, startSide: 'b', endFolio: 73, endSide: 'b' },
    { number: 8, englishName: "Yom HaKippurim", hebrewName: "יום הכפורים", startFolio: 73, startSide: 'b', endFolio: 88, endSide: 'a' }
  ],
  "rosh hashanah": [
    { number: 1, englishName: "Arba'ah Roshei Shanim", hebrewName: "ארבעה ראשי שנים", startFolio: 2, startSide: 'a', endFolio: 22, endSide: 'b' },
    { number: 2, englishName: "Im Ein Makirin", hebrewName: "אם אין מכירין", startFolio: 22, startSide: 'b', endFolio: 29, endSide: 'a' },
    { number: 3, englishName: "Ra'uhu Beit Din", hebrewName: "ראוהו בית דין", startFolio: 29, startSide: 'a', endFolio: 34, endSide: 'a' },
    { number: 4, englishName: "Yom Tov", hebrewName: "יום טוב", startFolio: 29, startSide: 'b', endFolio: 35, endSide: 'a' }
  ],
  "taanit": [
    { number: 1, englishName: "Me'eimatay", hebrewName: "מאימתי", startFolio: 2, startSide: 'a', endFolio: 15, endSide: 'a' },
    { number: 2, englishName: "Seder Ta'aniyot Keytzad", hebrewName: "סדר תעניות כיצד", startFolio: 15, startSide: 'a', endFolio: 18, endSide: 'b' },
    { number: 3, englishName: "Seder Ta'aniyot Eilu", hebrewName: "סדר תעניות אלו", startFolio: 18, startSide: 'b', endFolio: 26, endSide: 'a' },
    { number: 4, englishName: "Bi'Sheloshah Perakim", hebrewName: "בשלשה פרקים", startFolio: 26, startSide: 'a', endFolio: 31, endSide: 'a' }
  ],
  "gittin": [
    { number: 1, englishName: "HaMevi Get", hebrewName: "המביא גט", startFolio: 2, startSide: 'a', endFolio: 13, endSide: 'a' },
    { number: 2, englishName: "HaMevi Get MeMedinat HaYam", hebrewName: "המביא גט ממדינת הים", startFolio: 14, startSide: 'a', endFolio: 26, endSide: 'a' },
    { number: 3, englishName: "Kol Get", hebrewName: "כל גט", startFolio: 24, startSide: 'b', endFolio: 34, endSide: 'a' },
    { number: 4, englishName: "Mi She'achaz", hebrewName: "מי שאחז", startFolio: 34, startSide: 'a', endFolio: 41, endSide: 'b' },
    { number: 5, englishName: "HaZorek Get", hebrewName: "הזורק גט", startFolio: 77, startSide: 'a', endFolio: 90, endSide: 'b' },
    { number: 6, englishName: "HaNizakin", hebrewName: "הניזקין", startFolio: 48, startSide: 'b', endFolio: 58, endSide: 'a' },
    { number: 7, englishName: "Mi She'nitaref", hebrewName: "מי שנתערב", startFolio: 67, startSide: 'a', endFolio: 77, endSide: 'a' },
    { number: 8, englishName: "HaIshah", hebrewName: "האשה", startFolio: 77, startSide: 'a', endFolio: 82, endSide: 'a' },
    { number: 9, englishName: "HaOmer", hebrewName: "האומר", startFolio: 82, startSide: 'a', endFolio: 90, endSide: 'b' }
  ],
  "kiddushin": [
    { number: 1, englishName: "HaIshah Niknet", hebrewName: "האשה נקנית", startFolio: 2, startSide: 'a', endFolio: 25, endSide: 'b' },
    { number: 2, englishName: "HaIsh Mekadesh", hebrewName: "האיש מקדש", startFolio: 41, startSide: 'a', endFolio: 52, endSide: 'a' },
    { number: 3, englishName: "HaAv Zakhai", hebrewName: "האב זכאי", startFolio: 41, startSide: 'a', endFolio: 52, endSide: 'a' },
    { number: 4, englishName: "Eser Yuchasin", hebrewName: "עשר יוחסין", startFolio: 66, startSide: 'a', endFolio: 82, endSide: 'b' }
  ],
  "sukkah": [
    { number: 1, englishName: "Sukkah", hebrewName: "סוכה", startFolio: 2, startSide: 'a', endFolio: 17, endSide: 'a' },
    { number: 2, englishName: "HaYashein", hebrewName: "הישן", startFolio: 26, startSide: 'a', endFolio: 29, endSide: 'a' },
    { number: 3, englishName: "Lulav HaGazul", hebrewName: "לולב הגזול", startFolio: 29, startSide: 'b', endFolio: 42, endSide: 'a' },
    { number: 4, englishName: "Lulav VeAravah", hebrewName: "לולב וערבה", startFolio: 42, startSide: 'a', endFolio: 48, endSide: 'a' },
    { number: 5, englishName: "Chalil", hebrewName: "חליל", startFolio: 50, startSide: 'b', endFolio: 56, endSide: 'b' }
  ],
  "beitza": [
    { number: 1, englishName: "Beitzah", hebrewName: "ביצה", startFolio: 2, startSide: 'a', endFolio: 11, endSide: 'b' },
    { number: 2, englishName: "Yom Tov", hebrewName: "יום טוב", startFolio: 11, startSide: 'b', endFolio: 24, endSide: 'a' },
    { number: 3, englishName: "Ein Tzadin", hebrewName: "אין צדין", startFolio: 24, startSide: 'a', endFolio: 32, endSide: 'b' },
    { number: 4, englishName: "HaMevi", hebrewName: "המביא", startFolio: 32, startSide: 'b', endFolio: 37, endSide: 'b' },
    { number: 5, englishName: "Mashilin", hebrewName: "משילין", startFolio: 33, startSide: 'b', endFolio: 40, endSide: 'b' }
  ],
  "megillah": [
    { number: 1, englishName: "Megillah Nikret", hebrewName: "מגילה נקראת", startFolio: 2, startSide: 'a', endFolio: 10, endSide: 'b' },
    { number: 2, englishName: "HaKoreh", hebrewName: "הקורא", startFolio: 15, startSide: 'a', endFolio: 21, endSide: 'a' },
    { number: 3, englishName: "HaKoreh Omed", hebrewName: "הקורא עומד", startFolio: 21, startSide: 'a', endFolio: 26, endSide: 'a' },
    { number: 4, englishName: "Anshei Ir", hebrewName: "אנשי עיר", startFolio: 26, startSide: 'a', endFolio: 32, endSide: 'a' }
  ],
  "moed katan": [
    { number: 1, englishName: "Mashkin Beit HaShelachin", hebrewName: "משקין בית השלחין", startFolio: 2, startSide: 'a', endFolio: 11, endSide: 'b' },
    { number: 2, englishName: "Mi She'hafach", hebrewName: "מי שהפך", startFolio: 11, startSide: 'b', endFolio: 13, endSide: 'b' },
    { number: 3, englishName: "V'Eilu Megalchin", hebrewName: "ואלו מגלחין", startFolio: 13, startSide: 'b', endFolio: 29, endSide: 'a' }
  ],
  "chagigah": [
    { number: 1, englishName: "HaKol Chayavin", hebrewName: "הכל חייבין", startFolio: 2, startSide: 'a', endFolio: 9, endSide: 'a' },
    { number: 2, englishName: "Ein Dorshin", hebrewName: "אין דורשין", startFolio: 11, startSide: 'a', endFolio: 16, endSide: 'a' },
    { number: 3, englishName: "Kohen Gadol", hebrewName: "כהן גדול", startFolio: 22, startSide: 'a', endFolio: 27, endSide: 'a' }
  ],
  "yevamot": [
    { number: 1, englishName: "Chamesh Asar Nashim", hebrewName: "חמש עשרה נשים", startFolio: 2, startSide: 'a', endFolio: 13, endSide: 'b' },
    { number: 2, englishName: "Kitzad Choltzin", hebrewName: "כיצד חולצין", startFolio: 24, startSide: 'a', endFolio: 26, endSide: 'a' },
    { number: 3, englishName: "Arba'ah Achin", hebrewName: "ארבעה אחין", startFolio: 26, startSide: 'a', endFolio: 35, endSide: 'a' },
    { number: 4, englishName: "HaBa Al Yevimto", hebrewName: "הבא על יבמתו", startFolio: 39, startSide: 'a', endFolio: 44, endSide: 'a' },
    { number: 5, englishName: "Almanah Le'Kohen Gadol", hebrewName: "אלמנה לכהן גדול", startFolio: 59, startSide: 'a', endFolio: 66, endSide: 'a' },
    { number: 6, englishName: "HaIshah Rabbah", hebrewName: "האשה רבה", startFolio: 65, startSide: 'a', endFolio: 76, endSide: 'a' }
  ],
  "ketubot": [
    { number: 1, englishName: "Betulah Niset", hebrewName: "בתולה נישאת", startFolio: 2, startSide: 'a', endFolio: 12, endSide: 'a' },
    { number: 2, englishName: "HaIshah Shenitgarsah", hebrewName: "האשה שנתגרשה", startFolio: 22, startSide: 'a', endFolio: 28, endSide: 'a' },
    { number: 3, englishName: "Eilu Ne'emani", hebrewName: "אלו נאמני", startFolio: 28, startSide: 'a', endFolio: 36, endSide: 'b' },
    { number: 4, englishName: "Mi Shekatav", hebrewName: "מי שכתב", startFolio: 36, startSide: 'b', endFolio: 47, endSide: 'a' }
  ],
  "nedarim": [
    { number: 1, englishName: "Kol Kinuyei", hebrewName: "כל כנויי", startFolio: 2, startSide: 'a', endFolio: 9, endSide: 'b' },
    { number: 2, englishName: "V'Eilu Mutar", hebrewName: "ואלו מותר", startFolio: 19, startSide: 'a', endFolio: 25, endSide: 'a' },
    { number: 3, englishName: "Arba'ah Nedarim", hebrewName: "ארבעה נדרים", startFolio: 25, startSide: 'a', endFolio: 28, endSide: 'a' },
    { number: 4, englishName: "Ein Bein Mudar Hana'ah", hebrewName: "אין בין מודר הנאה", startFolio: 32, startSide: 'a', endFolio: 42, endSide: 'a' }
  ],
  "nazir": [
    { number: 1, englishName: "Kol Kinuyei Nezirut", hebrewName: "כל כנויי נזירות", startFolio: 2, startSide: 'a', endFolio: 12, endSide: 'a' },
    { number: 2, englishName: "Hareini Nazir", hebrewName: "הריני נזיר", startFolio: 12, startSide: 'a', endFolio: 19, endSide: 'a' },
    { number: 3, englishName: "Mi Sheamar", hebrewName: "מי שאמר", startFolio: 19, startSide: 'a', endFolio: 24, endSide: 'b' },
    { number: 4, englishName: "Shnei Kitei Edim", hebrewName: "שני כתי עדים", startFolio: 24, startSide: 'b', endFolio: 29, endSide: 'a' }
  ],
  "sotah": [
    { number: 1, englishName: "HaMekane", hebrewName: "המקנא", startFolio: 2, startSide: 'a', endFolio: 8, endSide: 'a' },
    { number: 2, englishName: "Hayah Mevi", hebrewName: "היה מביא", startFolio: 14, startSide: 'a', endFolio: 19, endSide: 'a' },
    { number: 3, englishName: "Eizeh Neshavin", hebrewName: "איזה נשוין", startFolio: 20, startSide: 'a', endFolio: 28, endSide: 'a' },
    { number: 4, englishName: "Arusa", hebrewName: "ארוסה", startFolio: 26, startSide: 'a', endFolio: 28, endSide: 'a' }
  ],
  "bava kamma": [
    { number: 1, englishName: "Arba'ah Avot", hebrewName: "ארבעה אבות", startFolio: 2, startSide: 'a', endFolio: 14, endSide: 'a' },
    { number: 2, englishName: "Kitzad HaRegel", hebrewName: "כיצד הרגל", startFolio: 17, startSide: 'a', endFolio: 25, endSide: 'b' },
    { number: 3, englishName: "HaManiah", hebrewName: "המניח", startFolio: 25, startSide: 'b', endFolio: 32, endSide: 'a' },
    { number: 4, englishName: "Shor She'nagach", hebrewName: "שור שנגח", startFolio: 32, startSide: 'a', endFolio: 44, endSide: 'a' },
    { number: 5, englishName: "Shor She'nagach Et HaPaih", hebrewName: "שור שנגח את הפרה", startFolio: 44, startSide: 'a', endFolio: 55, endSide: 'b' },
    { number: 6, englishName: "HaHover", hebrewName: "החובל", startFolio: 83, startSide: 'b', endFolio: 93, endSide: 'b' },
    { number: 7, englishName: "Merubeh", hebrewName: "מרובה", startFolio: 55, startSide: 'b', endFolio: 63, endSide: 'a' },
    { number: 8, englishName: "HaGonev", hebrewName: "הגונב", startFolio: 63, startSide: 'a', endFolio: 79, endSide: 'a' },
    { number: 9, englishName: "HaGonev Kli", hebrewName: "הגונב כלי", startFolio: 79, startSide: 'a', endFolio: 83, endSide: 'b' },
    { number: 10, englishName: "HaHover Et Chavero", hebrewName: "החובל את חברו", startFolio: 83, startSide: 'b', endFolio: 119, endSide: 'b' }
  ],
  "bava metzia": [
    { number: 1, englishName: "Shnayim Ochazin", hebrewName: "שנים אוחזין", startFolio: 2, startSide: 'a', endFolio: 10, endSide: 'b' },
    { number: 2, englishName: "Eilu Metziot", hebrewName: "אלו מציאות", startFolio: 21, startSide: 'b', endFolio: 28, endSide: 'a' },
    { number: 3, englishName: "HaMafkid", hebrewName: "המפקיד", startFolio: 33, startSide: 'a', endFolio: 42, endSide: 'a' },
    { number: 4, englishName: "HaZahav", hebrewName: "הזהב", startFolio: 42, startSide: 'a', endFolio: 56, endSide: 'a' },
    { number: 5, englishName: "Eizehu Neshech", hebrewName: "איזהו נשך", startFolio: 60, startSide: 'b', endFolio: 71, endSide: 'a' },
    { number: 6, englishName: "HaMaskir", hebrewName: "המשכיר", startFolio: 73, startSide: 'b', endFolio: 83, endSide: 'a' },
    { number: 7, englishName: "HaMaskir Et HaPo'alim", hebrewName: "המשכיר את הפועלים", startFolio: 83, startSide: 'a', endFolio: 94, endSide: 'b' },
    { number: 8, englishName: "HaMaskir Et HaChamar", hebrewName: "המשכיר את החמור", startFolio: 94, startSide: 'b', endFolio: 105, endSide: 'a' },
    { number: 9, englishName: "HaMaskir Et HaBayit", hebrewName: "המשכיר את הבית", startFolio: 101, startSide: 'b', endFolio: 107, endSide: 'a' },
    { number: 10, englishName: "HaBayit VeHaAliyah", hebrewName: "הבית והעליה", startFolio: 107, startSide: 'a', endFolio: 119, endSide: 'b' }
  ],
  "bava batra": [
    { number: 1, englishName: "HaShutafin", hebrewName: "השותפין", startFolio: 2, startSide: 'a', endFolio: 11, endSide: 'a' },
    { number: 2, englishName: "Lo Yachpor", hebrewName: "לא יחפור", startFolio: 17, startSide: 'a', endFolio: 28, endSide: 'b' },
    { number: 3, englishName: "Chezkat HaBatim", hebrewName: "חזקת הבתים", startFolio: 28, startSide: 'b', endFolio: 46, endSide: 'a' },
    { number: 4, englishName: "Mi She'mecher Et HaSafinah", hebrewName: "מי שמכר את הספינה", startFolio: 69, startSide: 'a', endFolio: 79, endSide: 'b' },
    { number: 5, englishName: "V'Eilu Sadin", hebrewName: "ואלו שדין", startFolio: 79, startSide: 'b', endFolio: 93, endSide: 'a' },
    { number: 6, englishName: "HaLokach Peirot", hebrewName: "הלוקח פירות", startFolio: 93, startSide: 'a', endFolio: 104, endSide: 'a' },
    { number: 7, englishName: "Yesh Nochlin", hebrewName: "יש נוחלין", startFolio: 108, startSide: 'a', endFolio: 115, endSide: 'a' },
    { number: 8, englishName: "Yesh Mutav", hebrewName: "יש מותב", startFolio: 115, startSide: 'a', endFolio: 126, endSide: 'b' },
    { number: 9, englishName: "HaKotev Et Nechasyav", hebrewName: "הכותב את נכסיו", startFolio: 126, startSide: 'b', endFolio: 146, endSide: 'a' },
    { number: 10, englishName: "Get Pashut", hebrewName: "גט פשוט", startFolio: 146, startSide: 'a', endFolio: 176, endSide: 'b' }
  ],
  "sanhedrin": [
    { number: 1, englishName: "Dinei Mamonot", hebrewName: "דיני ממונות", startFolio: 2, startSide: 'a', endFolio: 16, endSide: 'a' },
    { number: 2, englishName: "Eilu Hen HaLokirin", hebrewName: "אלו הן הלוקין", startFolio: 17, startSide: 'a', endFolio: 27, endSide: 'a' },
    { number: 3, englishName: "Kohen Gadol", hebrewName: "כהן גדול", startFolio: 18, startSide: 'a', endFolio: 23, endSide: 'a' },
    { number: 4, englishName: "Hayah Ba", hebrewName: "היה בא", startFolio: 36, startSide: 'b', endFolio: 42, endSide: 'a' },
    { number: 5, englishName: "Hayah Zaken", hebrewName: "היה זקן", startFolio: 36, startSide: 'b', endFolio: 42, endSide: 'a' },
    { number: 6, englishName: "Nigmar HaDin", hebrewName: "נגמר הדין", startFolio: 42, startSide: 'a', endFolio: 46, endSide: 'a' },
    { number: 7, englishName: "Arba Mitot", hebrewName: "ארבע מיתות", startFolio: 49, startSide: 'b', endFolio: 67, endSide: 'a' },
    { number: 8, englishName: "Ben Sorer U'Moreh", hebrewName: "בן סורר ומורה", startFolio: 68, startSide: 'b', endFolio: 71, endSide: 'a' },
    { number: 9, englishName: "Ir HaNidachat", hebrewName: "עיר הנדחת", startFolio: 71, startSide: 'a', endFolio: 75, endSide: 'a' },
    { number: 10, englishName: "Eilu Hen HaNisrafin", hebrewName: "אלו הן הנשרפין", startFolio: 75, startSide: 'a', endFolio: 84, endSide: 'b' },
    { number: 11, englishName: "Kol Yisrael", hebrewName: "כל ישראל", startFolio: 90, startSide: 'a', endFolio: 113, endSide: 'b' }
  ],
  "avodah zarah": [
    { number: 1, englishName: "Lifnei Eideihen", hebrewName: "לפני אידיהן", startFolio: 2, startSide: 'a', endFolio: 17, endSide: 'a' },
    { number: 2, englishName: "Ein Ma'amidin", hebrewName: "אין מעמידין", startFolio: 17, startSide: 'a', endFolio: 33, endSide: 'a' },
    { number: 3, englishName: "Kol HaTzelalim", hebrewName: "כל הצללים", startFolio: 40, startSide: 'b', endFolio: 52, endSide: 'a' },
    { number: 4, englishName: "R' Yishmael", hebrewName: "ר' ישמעאל", startFolio: 52, startSide: 'a', endFolio: 65, endSide: 'a' },
    { number: 5, englishName: "HaSokher", hebrewName: "השוכר", startFolio: 65, startSide: 'a', endFolio: 76, endSide: 'b' }
  ],
  "zevachim": [
    { number: 1, englishName: "Kol HaZevachim", hebrewName: "כל הזבחים", startFolio: 2, startSide: 'a', endFolio: 18, endSide: 'b' },
    { number: 2, englishName: "Kol HaZevachim Shenitnu", hebrewName: "כל הזבחים שניתנו", startFolio: 18, startSide: 'b', endFolio: 29, endSide: 'a' },
    { number: 3, englishName: "Eizehu Mekoman", hebrewName: "איזהו מקומן", startFolio: 47, startSide: 'b', endFolio: 59, endSide: 'a' },
    { number: 4, englishName: "Beit Shammai", hebrewName: "בית שמאי", startFolio: 40, startSide: 'a', endFolio: 47, endSide: 'b' },
    { number: 5, englishName: "Eizehu Mekoman Shel Zevachim", hebrewName: "איזהו מקומן של זבחים", startFolio: 47, startSide: 'b', endFolio: 59, endSide: 'a' }
  ],
  "chullin": [
    { number: 1, englishName: "HaKol Shochtin", hebrewName: "הכל שוחטין", startFolio: 2, startSide: 'a', endFolio: 16, endSide: 'a' },
    { number: 2, englishName: "HaShochet", hebrewName: "השוחט", startFolio: 27, startSide: 'a', endFolio: 32, endSide: 'a' },
    { number: 3, englishName: "Eilu Tereifot", hebrewName: "אלו טרפות", startFolio: 42, startSide: 'a', endFolio: 59, endSide: 'a' },
    { number: 4, englishName: "Oto V'Et Beno", hebrewName: "אותו ואת בנו", startFolio: 78, startSide: 'b', endFolio: 83, endSide: 'a' },
    { number: 5, englishName: "Kisui HaDam", hebrewName: "כיסוי הדם", startFolio: 83, startSide: 'a', endFolio: 88, endSide: 'b' },
    { number: 6, englishName: "Gid HaNasheh", hebrewName: "גיד הנשה", startFolio: 89, startSide: 'a', endFolio: 94, endSide: 'a' },
    { number: 7, englishName: "Kol HaBasar", hebrewName: "כל הבשר", startFolio: 104, startSide: 'a', endFolio: 113, endSide: 'a' },
    { number: 8, englishName: "Kol HaBasar Lo Yevashel", hebrewName: "כל הבשר לא יבושל", startFolio: 113, startSide: 'a', endFolio: 123, endSide: 'a' },
    { number: 9, englishName: "HaOr VeHaRotev", hebrewName: "העור והרוטב", startFolio: 113, startSide: 'a', endFolio: 123, endSide: 'a' },
    { number: 10, englishName: "Reishit HaGez", hebrewName: "ראשית הגז", startFolio: 130, startSide: 'a', endFolio: 137, endSide: 'a' },
    { number: 11, englishName: "Shiluach HaKen", hebrewName: "שילוח הקן", startFolio: 138, startSide: 'a', endFolio: 142, endSide: 'a' },
    { number: 12, englishName: "HaBasar BeChalav", hebrewName: "הבשר בחלב", startFolio: 103, startSide: 'b', endFolio: 142, endSide: 'a' }
  ],
  "niddah": [
    { number: 1, englishName: "Shammai Omer", hebrewName: "שמאי אומר", startFolio: 2, startSide: 'a', endFolio: 12, endSide: 'a' },
    { number: 2, englishName: "Kol HaYad", hebrewName: "כל היד", startFolio: 13, startSide: 'a', endFolio: 19, endSide: 'a' },
    { number: 3, englishName: "BaMeh Ishah", hebrewName: "במה אשה", startFolio: 19, startSide: 'a', endFolio: 28, endSide: 'a' },
    { number: 4, englishName: "Yotzei Dofen", hebrewName: "יוצא דופן", startFolio: 40, startSide: 'a', endFolio: 45, endSide: 'a' },
    { number: 5, englishName: "V'Lad Behemah", hebrewName: "ולד בהמה", startFolio: 21, startSide: 'a', endFolio: 25, endSide: 'a' },
    { number: 6, englishName: "HaMafelet", hebrewName: "המפלת", startFolio: 21, startSide: 'a', endFolio: 25, endSide: 'a' },
    { number: 7, englishName: "Dam HaNiddah", hebrewName: "דם הנדה", startFolio: 54, startSide: 'a', endFolio: 59, endSide: 'a' },
    { number: 8, englishName: "HaIshah SheHi", hebrewName: "האשה שהיא", startFolio: 59, startSide: 'a', endFolio: 67, endSide: 'a' },
    { number: 9, englishName: "Chesronot", hebrewName: "חסרונות", startFolio: 67, startSide: 'a', endFolio: 69, endSide: 'a' },
    { number: 10, englishName: "HaRo'eh Ketemet", hebrewName: "הרואה כתמת", startFolio: 57, startSide: 'b', endFolio: 73, endSide: 'a' }
  ]
};



function generateFolioButtons(startFolio: number, startSide: 'a' | 'b', endFolio: number, endSide: 'a' | 'b', tractate: string) {
  const folios: Array<{ folio: number; side: 'a' | 'b'; label: string }> = [];
  
  for (let folio = startFolio; folio <= endFolio; folio++) {
    if (folio === startFolio && folio === endFolio) {
      // Same folio range
      if (startSide === 'a') {
        folios.push({ folio, side: 'a', label: `${folio}a` });
        if (endSide === 'b') {
          folios.push({ folio, side: 'b', label: `${folio}b` });
        }
      } else {
        folios.push({ folio, side: 'b', label: `${folio}b` });
      }
    } else if (folio === startFolio) {
      // First folio
      if (startSide === 'a') {
        folios.push({ folio, side: 'a', label: `${folio}a` });
        folios.push({ folio, side: 'b', label: `${folio}b` });
      } else {
        folios.push({ folio, side: 'b', label: `${folio}b` });
      }
    } else if (folio === endFolio) {
      // Last folio
      folios.push({ folio, side: 'a', label: `${folio}a` });
      if (endSide === 'b') {
        folios.push({ folio, side: 'b', label: `${folio}b` });
      }
    } else {
      // Middle folios
      folios.push({ folio, side: 'a', label: `${folio}a` });
      folios.push({ folio, side: 'b', label: `${folio}b` });
    }
  }
  
  return folios;
}

export default function TractateContents() {
  const [match, params] = useRoute("/contents/:tractate");
  const tractate = params?.tractate || "";
  const tractateDisplayName = normalizeDisplayTractateName(tractate);
  
  const { data: chapters, isLoading } = useQuery({
    queryKey: ['/api/chapters', tractate],
    queryFn: () => sefariaAPI.getChapters(tractateDisplayName),
    enabled: !!tractate
  });

  // Navigation handler for hamburger menu
  const handleLocationChange = (newLocation: TalmudLocation) => {
    // Navigate to home page with the selected location
    window.location.href = `/?tractate=${newLocation.tractate}&folio=${newLocation.folio}&side=${newLocation.side}`;
  };

  if (!match) {
    return <div>Tractate not found</div>;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="sticky top-0 z-50 bg-card border-b border-border shadow-sm">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              {/* Hamburger Menu */}
              <HamburgerMenu onLocationChange={handleLocationChange} />
              
              {/* Logo */}
              <div className="flex items-center space-x-2 flex-shrink-0">
                <div className="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden">
                  <img 
                    src={hebrewBookIcon} 
                    alt="ChavrutAI Logo" 
                    className="w-10 h-10 object-cover"
                  />
                </div>
                <h1 className="text-xl font-semibold text-primary font-roboto">ChavrutAI</h1>
              </div>
              
              {/* Empty space for balance */}
              <div className="w-10 flex-shrink-0"></div>
            </div>
          </div>
        </header>
        
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="text-center">Loading...</div>
        </div>
      </div>
    );
  }

  const tractateChapters = CHAPTER_DATA[tractate.toLowerCase()] || [];
  const maxFolio = getMaxFolio(tractateDisplayName);
  // Convert tractate name to proper case for Hebrew name lookup
  const properCaseTractate = tractateDisplayName;
  const hebrewName = TRACTATE_HEBREW_NAMES[properCaseTractate as keyof typeof TRACTATE_HEBREW_NAMES] || tractate;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Hamburger Menu */}
            <HamburgerMenu onLocationChange={handleLocationChange} />
            
            {/* Logo */}
            <div className="flex items-center space-x-2 flex-shrink-0">
              <div className="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden">
                <img 
                  src={hebrewBookIcon} 
                  alt="ChavrutAI Logo" 
                  className="w-10 h-10 object-cover"
                />
              </div>
              <h1 className="text-xl font-semibold text-primary font-roboto">ChavrutAI</h1>
            </div>
            
            {/* Empty space for balance */}
            <div className="w-10 flex-shrink-0"></div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link href="/contents">
            <Button variant="ghost" size="sm" className="flex items-center gap-2">
              <ChevronLeft className="w-4 h-4" />
              Back to Contents
            </Button>
          </Link>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-primary mb-2">{tractateDisplayName}</h1>
          <h2 className="text-2xl text-primary/80 mb-4 font-hebrew">{hebrewName}</h2>
          <p className="text-lg text-muted-foreground">
            {tractateChapters.length > 0 ? `${tractateChapters.length} Chapters` : `Folios 2a-${maxFolio}b`}
          </p>
        </div>

        {/* Chapters */}
        {tractateChapters.length > 0 ? (
          <div className="space-y-8">
            {tractateChapters.map((chapter) => {
              const folios = generateFolioButtons(
                chapter.startFolio, 
                chapter.startSide, 
                chapter.endFolio, 
                chapter.endSide,
                tractateDisplayName
              );

              return (
                <div key={chapter.number} className="space-y-4">
                  {/* Chapter Header */}
                  <div className="border-b border-border pb-3">
                    <h3 className="text-xl font-semibold text-primary">
                      Chapter {chapter.number}: <em>{chapter.englishName}</em> ({chapter.hebrewName})
                    </h3>
                  </div>

                  {/* Folio Grid */}
                  <div className="grid grid-cols-8 sm:grid-cols-10 md:grid-cols-12 lg:grid-cols-16 gap-2">
                    {folios.map((folio) => (
                      <Link 
                        key={`${folio.folio}${folio.side}`}
                        href={`/?tractate=${tractateDisplayName}&folio=${folio.folio}&side=${folio.side}`}
                      >
                        <Card className="hover:shadow-md transition-shadow cursor-pointer border-border hover:border-primary/20">
                          <CardContent className="p-3 text-center">
                            <span className="text-sm font-medium text-primary">
                              {folio.label}
                            </span>
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          // Fallback: Show all folios if no chapter data available
          <div className="space-y-4">
            <div className="border-b border-border pb-3">
              <h3 className="text-xl font-semibold text-primary">All Folios</h3>
            </div>
            
            <div className="grid grid-cols-8 sm:grid-cols-10 md:grid-cols-12 lg:grid-cols-16 gap-2">
              {Array.from({ length: maxFolio - 1 }, (_, i) => i + 2).map((folio) => (
                ['a', 'b'].map((side) => (
                  <Link 
                    key={`${folio}${side}`}
                    href={`/?tractate=${tractateDisplayName}&folio=${folio}&side=${side}`}
                  >
                    <Card className="hover:shadow-md transition-shadow cursor-pointer border-border hover:border-primary/20">
                      <CardContent className="p-3 text-center">
                        <span className="text-sm font-medium text-primary">
                          {folio}{side}
                        </span>
                      </CardContent>
                    </Card>
                  </Link>
                ))
              )).flat()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}