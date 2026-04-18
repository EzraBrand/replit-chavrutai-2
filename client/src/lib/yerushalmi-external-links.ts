import { YERUSHALMI_HEBREW_NAMES } from "@shared/yerushalmi-data";
import { numberToHebrewGematria } from "@/lib/external-links";

export interface YerushalmiExternalLink {
  name: string;
  url: string;
  type: 'chapter';
  description?: string;
}

// Wikisource uses slightly different Hebrew spellings than our display names.
// Map our display Hebrew name -> the spelling Wikisource uses in its page titles.
const WIKISOURCE_HEBREW_NAME_OVERRIDES: Record<string, string> = {
  'נדה': 'נידה',
};

export function getYerushalmiWikisourceLink(tractate: string, chapter: number, halakhah?: number): string {
  const rawHebrewName = YERUSHALMI_HEBREW_NAMES[tractate];
  if (!rawHebrewName) return '';
  const hebrewName = WIKISOURCE_HEBREW_NAME_OVERRIDES[rawHebrewName] ?? rawHebrewName;
  const hebrewChapter = numberToHebrewGematria(chapter);
  const suffix = halakhah ? `_${numberToHebrewGematria(halakhah)}` : '';
  const pageName = `ירושלמי_${hebrewName.replace(/ /g, '_')}_${hebrewChapter}${suffix}`;
  return `https://he.wikisource.org/wiki/${encodeURIComponent(pageName)}`;
}

export function getYerushalmiHalakhahLinks(tractate: string, chapter: number, halakhah: number, sefariaRef: string): YerushalmiExternalLink[] {
  const links: YerushalmiExternalLink[] = [];

  links.push({
    name: 'Sefaria',
    url: `https://www.sefaria.org.il/${sefariaRef.replace(/ /g, '_')}`,
    type: 'chapter',
    description: 'View this halakhah on Sefaria',
  });

  const wikisourceUrl = getYerushalmiWikisourceLink(tractate, chapter, halakhah);
  if (wikisourceUrl) {
    links.push({
      name: 'Wikisource',
      url: wikisourceUrl,
      type: 'chapter',
      description: 'View this halakhah on Hebrew Wikisource',
    });
  }

  return links;
}

export function getYerushalmiChapterLinks(tractate: string, chapter: number, sefariaRef: string): YerushalmiExternalLink[] {
  const links: YerushalmiExternalLink[] = [];

  links.push({
    name: 'Sefaria',
    url: `https://www.sefaria.org.il/${sefariaRef.replace(/ /g, '_')}`,
    type: 'chapter',
    description: 'View this chapter on Sefaria',
  });

  const wikisourceUrl = getYerushalmiWikisourceLink(tractate, chapter);
  if (wikisourceUrl) {
    links.push({
      name: 'Wikisource',
      url: wikisourceUrl,
      type: 'chapter',
      description: 'View this chapter on Hebrew Wikisource',
    });
  }

  return links;
}
