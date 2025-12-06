import { TRACTATE_HEBREW_NAMES } from "@shared/tractates";

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
  "Berakhot": 283,
  "Shabbat": 284,
  "Eruvin": 285,
  "Pesachim": 286,
  "Shekalim": 287,
  "Yoma": 288,
  "Sukkah": 289,
  "Beitza": 290,
  "Rosh Hashanah": 291,
  "Taanit": 292,
  "Megillah": 293,
  "Moed Katan": 294,
  "Chagigah": 295,
  "Yevamot": 296,
  "Ketubot": 297,
  "Nedarim": 298,
  "Nazir": 299,
  "Sotah": 300,
  "Gittin": 301,
  "Kiddushin": 302,
  "Bava Kamma": 303,
  "Bava Metzia": 304,
  "Bava Batra": 305,
  "Sanhedrin": 306,
  "Makkot": 307,
  "Shevuot": 308,
  "Avodah Zarah": 309,
  "Horayot": 310,
  "Zevachim": 311,
  "Menachot": 312,
  "Chullin": 313,
  "Bekhorot": 314,
  "Arachin": 315,
  "Temurah": 316,
  "Keritot": 317,
  "Meilah": 318,
  "Niddah": 322
};

const EXTERNAL_TRACTATE_NAMES: Record<string, string> = {
  "Eruvin": "Eiruvin",
  "Rosh Hashanah": "Rosh_HaShanah",
  "Beitza": "Beitzah",
  "Chullin": "Chulin",
  "Arachin": "Arakhin"
};

function getExternalTractateName(tractate: string): string {
  return EXTERNAL_TRACTATE_NAMES[tractate] || tractate;
}

function getHebrewSide(side: 'a' | 'b'): string {
  return side === 'a' ? 'א' : 'ב';
}

function getDafYomiAmudId(folio: number, side: 'a' | 'b'): number {
  return folio * 2 - (side === 'a' ? 1 : 0);
}

export function getSefariaLink(ref: TalmudReference): string {
  const { tractate, folio, side, section } = ref;
  const externalName = getExternalTractateName(tractate);
  const folioStr = `${folio}${side}`;
  if (section !== undefined) {
    return `https://www.sefaria.org.il/${externalName}.${folioStr}.${section}`;
  }
  return `https://www.sefaria.org.il/${externalName}.${folioStr}`;
}

export function getAlHaTorahLink(ref: TalmudReference): string {
  const { tractate, folio, side, section } = ref;
  const externalName = getExternalTractateName(tractate);
  const folioStr = `${folio}${side}`;
  if (section !== undefined) {
    return `https://shas.alhatorah.org/Full/${externalName}/${folioStr}.${section}`;
  }
  return `https://shas.alhatorah.org/Full/${externalName}/${folioStr}`;
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

export function getDafYomiLink(ref: TalmudReference): string {
  const { tractate, folio, side } = ref;
  const massechetId = DAF_YOMI_MASSECHET_IDS[tractate];
  if (!massechetId) return '';
  
  const amudId = getDafYomiAmudId(folio, side);
  return `https://daf-yomi.com/Dafyomi_Page.aspx?massechet=${massechetId}&amud=${amudId}&fs=1`;
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
