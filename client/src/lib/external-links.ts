import { TRACTATE_HEBREW_NAMES } from "@shared/tractates";
import { findChapterForFolio } from "./chapter-data";

export interface TalmudReference {
  tractate: string;
  folio: number;
  side: 'a' | 'b';
  section?: number;
}

export interface ExternalLink {
  name: string;
  url: string;
  type: 'section' | 'page';
  description?: string;
}

const HEBREW_ONES = ['', 'א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ז', 'ח', 'ט'];
const HEBREW_TENS = ['', 'י', 'כ', 'ל', 'מ', 'נ', 'ס', 'ע', 'פ', 'צ'];
const HEBREW_HUNDREDS = ['', 'ק', 'ר', 'ש', 'ת'];

export function numberToHebrewGematria(num: number): string {
  if (num <= 0 || num >= 500) return num.toString();
  
  let result = '';
  
  if (num >= 100) {
    result += HEBREW_HUNDREDS[Math.floor(num / 100)];
    num %= 100;
  }
  
  if (num === 15) {
    result += 'טו';
  } else if (num === 16) {
    result += 'טז';
  } else {
    if (num >= 10) {
      result += HEBREW_TENS[Math.floor(num / 10)];
      num %= 10;
    }
    
    if (num > 0) {
      result += HEBREW_ONES[num];
    }
  }
  
  return result;
}

const DAF_YOMI_MASSECHET_IDS: Record<string, number> = {
  "Berakhot": 2,
  "Shabbat": 284,
  "Eruvin": 595,
  "Pesachim": 806,
  "Shekalim": 1048,
  "Yoma": 1092,
  "Sukkah": 1268,
  "Beitza": 1380,
  "Rosh Hashanah": 1460,
  "Taanit": 1530,
  "Megillah": 1592,
  "Moed Katan": 1656,
  "Chagigah": 1714,
  "Yevamot": 1768,
  "Ketubot": 2012,
  "Nedarim": 2236,
  "Nazir": 2418,
  "Sotah": 2550,
  "Gittin": 2648,
  "Kiddushin": 2828,
  "Bava Kamma": 2992,
  "Bava Metzia": 3230,
  "Bava Batra": 3468,
  "Sanhedrin": 3820,
  "Makkot": 4046,
  "Shevuot": 4094,
  "Avodah Zarah": 4192,
  "Horayot": 4344,
  "Zevachim": 4372,
  "Menachot": 4612,
  "Chullin": 4832,
  "Bekhorot": 5116,
  "Arachin": 5238,
  "Temurah": 5306,
  "Keritot": 5374,
  "Meilah": 5430,
  "Niddah": 5500
};

const CHABAD_TRACTATE_IDS: Record<string, number> = {
  "Berakhot": 5441689,
  "Shabbat": 5443530,
  "Eruvin": 5443840,
  "Pesachim": 5444050,
  "Shekalim": 5444292,
  "Yoma": 5444336,
  "Sukkah": 5444512,
  "Beitza": 5444624,
  "Rosh Hashanah": 5444704,
  "Taanit": 5444774,
  "Megillah": 5444836,
  "Moed Katan": 5444900,
  "Chagigah": 5444958,
  "Yevamot": 5445012,
  "Ketubot": 5445256,
  "Nedarim": 5445480,
  "Nazir": 5445662,
  "Sotah": 5445794,
  "Gittin": 5445892,
  "Kiddushin": 5446072,
  "Bava Kamma": 5446236,
  "Bava Metzia": 5446474,
  "Bava Batra": 5446712,
  "Sanhedrin": 5447064,
  "Makkot": 5447290,
  "Shevuot": 5447338,
  "Avodah Zarah": 5447436,
  "Horayot": 5447588,
  "Zevachim": 5447616,
  "Menachot": 5447856,
  "Chullin": 5448076,
  "Bekhorot": 5448360,
  "Arachin": 5448482,
  "Temurah": 5448550,
  "Keritot": 5448618,
  "Meilah": 5448674,
  "Tamid": 5448718,
  "Niddah": 5448734
};

function getHebrewSide(side: 'a' | 'b'): string {
  return side === 'a' ? 'א' : 'ב';
}

function getDafYomiAmudId(folio: number, side: 'a' | 'b'): number {
  return folio * 2 - (side === 'a' ? 1 : 0);
}

export function getSefariaLink(ref: TalmudReference): string {
  const { tractate, folio, side, section } = ref;
  const folioStr = `${folio}${side}`;
  if (section !== undefined) {
    return `https://www.sefaria.org.il/${tractate}.${folioStr}.${section}`;
  }
  return `https://www.sefaria.org.il/${tractate}.${folioStr}`;
}

export function getAlHaTorahLink(ref: TalmudReference): string {
  const { tractate, folio, side, section } = ref;
  const folioStr = `${folio}${side}`;
  if (section !== undefined) {
    return `https://shas.alhatorah.org/Full/${tractate}/${folioStr}.${section}`;
  }
  return `https://shas.alhatorah.org/Full/${tractate}/${folioStr}`;
}

export function getWikisourceHebrewLink(ref: TalmudReference): string {
  const { tractate, folio, side } = ref;
  const hebrewTractate = TRACTATE_HEBREW_NAMES[tractate as keyof typeof TRACTATE_HEBREW_NAMES];
  if (!hebrewTractate) return '';
  
  const hebrewFolio = numberToHebrewGematria(folio);
  const hebrewSide = getHebrewSide(side);
  
  const pageName = `${hebrewTractate}_${hebrewFolio}_${hebrewSide}`;
  return `https://he.wikisource.org/wiki/${encodeURIComponent(pageName)}`;
}

export function getChabadLink(ref: TalmudReference): string {
  const { tractate, folio, side } = ref;
  const tractateId = CHABAD_TRACTATE_IDS[tractate];
  if (!tractateId) return '';
  
  const chapterInfo = findChapterForFolio(tractate, folio, side);
  const chapterNum = chapterInfo?.number || 1;
  
  const folioStr = `${folio}${side}`;
  const tractateSlug = tractate.replace(/ /g, '-');
  return `https://www.chabad.org/torah-texts/${tractateId}/The-Talmud/${tractateSlug}/Chapter-${chapterNum}/${folioStr}`;
}

export function getDafYomiLink(ref: TalmudReference): string {
  const { tractate, folio, side } = ref;
  const massechetId = DAF_YOMI_MASSECHET_IDS[tractate];
  if (!massechetId) return '';
  
  const amudId = getDafYomiAmudId(folio, side);
  return `https://daf-yomi.com/Dafyomi_Page.aspx?vt=1&massechet=${massechetId}&amud=${amudId}&fs=1`;
}

export function getAllExternalLinks(ref: TalmudReference): ExternalLink[] {
  const links: ExternalLink[] = [];
  
  if (ref.section !== undefined) {
    links.push({
      name: 'Sefaria',
      url: getSefariaLink(ref),
      type: 'section',
      description: 'Sefaria.org.il - section-level link'
    });
    
    links.push({
      name: 'Al HaTorah',
      url: getAlHaTorahLink(ref),
      type: 'section',
      description: 'Al HaTorah Shas - section-level link'
    });
  }
  
  const pageRef = { ...ref, section: undefined };
  
  links.push({
    name: 'Sefaria (Page)',
    url: getSefariaLink(pageRef),
    type: 'page',
    description: 'Sefaria.org.il - page-level link'
  });
  
  links.push({
    name: 'Al HaTorah (Page)',
    url: getAlHaTorahLink(pageRef),
    type: 'page',
    description: 'Al HaTorah Shas - page-level link'
  });
  
  const wikisourceUrl = getWikisourceHebrewLink(ref);
  if (wikisourceUrl) {
    links.push({
      name: 'Wikisource Hebrew',
      url: wikisourceUrl,
      type: 'page',
      description: 'Hebrew Wikisource - full page text'
    });
  }
  
  const chabadUrl = getChabadLink(ref);
  if (chabadUrl) {
    links.push({
      name: 'Chabad',
      url: chabadUrl,
      type: 'page',
      description: 'Chabad.org Talmud'
    });
  }
  
  const dafYomiUrl = getDafYomiLink(ref);
  if (dafYomiUrl) {
    links.push({
      name: 'Daf Yomi (Tzurat HaDaf)',
      url: dafYomiUrl,
      type: 'page',
      description: 'Daf-Yomi.com - Traditional page layout'
    });
  }
  
  return links;
}

export function getSectionLinks(ref: TalmudReference): ExternalLink[] {
  return getAllExternalLinks(ref).filter(link => link.type === 'section');
}

export function getPageLinks(ref: TalmudReference): ExternalLink[] {
  return getAllExternalLinks(ref).filter(link => link.type === 'page');
}
