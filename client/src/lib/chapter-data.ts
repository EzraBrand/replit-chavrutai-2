// Chapter data utility functions
// This file provides access to chapter information for breadcrumb navigation

// Chapter data migration complete - now using JSON files exclusively

// Static imports for all JSON files
import arachinData from '../../../talmud-data/chapters/arachin.json';
import avodahZarahData from '../../../talmud-data/chapters/avodah-zarah.json';
import bavaBartraData from '../../../talmud-data/chapters/bava-batra.json';
import bavaKammaData from '../../../talmud-data/chapters/bava-kamma.json';
import bavaMetzeaData from '../../../talmud-data/chapters/bava-metzia.json';
import bekhorotData from '../../../talmud-data/chapters/bekhorot.json';
import berakhottData from '../../../talmud-data/chapters/berakhot.json';
import beitzaData from '../../../talmud-data/chapters/beitza.json';
import chagigahData from '../../../talmud-data/chapters/chagigah.json';
import chullinData from '../../../talmud-data/chapters/chullin.json';
import eruvinData from '../../../talmud-data/chapters/eruvin.json';
import gittinData from '../../../talmud-data/chapters/gittin.json';
import horayotData from '../../../talmud-data/chapters/horayot.json';
import keritotData from '../../../talmud-data/chapters/keritot.json';
import ketubotData from '../../../talmud-data/chapters/ketubot.json';
import kiddushinData from '../../../talmud-data/chapters/kiddushin.json';
import makkotData from '../../../talmud-data/chapters/makkot.json';
import megillahData from '../../../talmud-data/chapters/megillah.json';
import meilahData from '../../../talmud-data/chapters/meilah.json';
import menachotData from '../../../talmud-data/chapters/menachot.json';
import moedKatanData from '../../../talmud-data/chapters/moed-katan.json';
import nazirData from '../../../talmud-data/chapters/nazir.json';
import nedarimData from '../../../talmud-data/chapters/nedarim.json';
import niddahData from '../../../talmud-data/chapters/niddah.json';
import pesachimData from '../../../talmud-data/chapters/pesachim.json';
import roshHashanahData from '../../../talmud-data/chapters/rosh-hashanah.json';
import sanhedrinData from '../../../talmud-data/chapters/sanhedrin.json';
import shabbatData from '../../../talmud-data/chapters/shabbat.json';
import shevuotData from '../../../talmud-data/chapters/shevuot.json';
import sotahData from '../../../talmud-data/chapters/sotah.json';
import sukkahData from '../../../talmud-data/chapters/sukkah.json';
import taanittData from '../../../talmud-data/chapters/taanit.json';
import tamidData from '../../../talmud-data/chapters/tamid.json';
import temurahData from '../../../talmud-data/chapters/temurah.json';
import yevamotData from '../../../talmud-data/chapters/yevamot.json';
import yomaData from '../../../talmud-data/chapters/yoma.json';
import zevachimData from '../../../talmud-data/chapters/zevachim.json';

// JSON data registry
const JSON_CHAPTER_DATA: Record<string, ChapterInfo[]> = {
  'arachin': arachinData as ChapterInfo[],
  'avodah zarah': avodahZarahData as ChapterInfo[],
  'bava batra': bavaBartraData as ChapterInfo[],
  'bava kamma': bavaKammaData as ChapterInfo[],
  'bava metzia': bavaMetzeaData as ChapterInfo[],
  'bekhorot': bekhorotData as ChapterInfo[],
  'berakhot': berakhottData as ChapterInfo[],
  'beitza': beitzaData as ChapterInfo[],
  'chagigah': chagigahData as ChapterInfo[],
  'chullin': chullinData as ChapterInfo[],
  'eruvin': eruvinData as ChapterInfo[],
  'gittin': gittinData as ChapterInfo[],
  'horayot': horayotData as ChapterInfo[],
  'keritot': keritotData as ChapterInfo[],
  'ketubot': ketubotData as ChapterInfo[],
  'kiddushin': kiddushinData as ChapterInfo[],
  'makkot': makkotData as ChapterInfo[],
  'megillah': megillahData as ChapterInfo[],
  'meilah': meilahData as ChapterInfo[],
  'menachot': menachotData as ChapterInfo[],
  'moed katan': moedKatanData as ChapterInfo[],
  'nazir': nazirData as ChapterInfo[],
  'nedarim': nedarimData as ChapterInfo[],
  'niddah': niddahData as ChapterInfo[],
  'pesachim': pesachimData as ChapterInfo[],
  'rosh hashanah': roshHashanahData as ChapterInfo[],
  'sanhedrin': sanhedrinData as ChapterInfo[],
  'shabbat': shabbatData as ChapterInfo[],
  'shevuot': shevuotData as ChapterInfo[],
  'sotah': sotahData as ChapterInfo[],
  'sukkah': sukkahData as ChapterInfo[],
  'taanit': taanittData as ChapterInfo[],
  'tamid': tamidData as ChapterInfo[],
  'temurah': temurahData as ChapterInfo[],
  'yevamot': yevamotData as ChapterInfo[],
  'yoma': yomaData as ChapterInfo[],
  'zevachim': zevachimData as ChapterInfo[],
};

/**
 * Preload function (now a no-op since we use static imports)
 */
export async function preloadChapterData() {
  // Data is already loaded via static imports
  return Promise.resolve();
}

/**
 * Get chapter data for a tractate (using JSON files exclusively)
 */
function getChapterData(tractate: string): ChapterInfo[] | null {
  const tractateKey = tractate.toLowerCase().replace(/\s+/g, ' ');
  return JSON_CHAPTER_DATA[tractateKey] || null;
}

/**
 * Public function to get chapter data for external components
 */
export function getChapterDataByTractate(tractate: string): ChapterInfo[] {
  return getChapterData(tractate) || [];
}

export interface ChapterInfo {
  number: number;
  englishName: string;
  hebrewName: string;
  startFolio: number;
  startSide: 'a' | 'b';
  endFolio: number;
  endSide: 'a' | 'b';
}

/**
 * Find which chapter a given folio belongs to for a specific tractate
 */
export function findChapterForFolio(
  tractate: string, 
  folio: number, 
  side: 'a' | 'b'
): ChapterInfo | null {
  const chapters = getChapterData(tractate);
  if (!chapters) return null;

  // Convert folio and side to a comparable number (2a = 2.0, 2b = 2.5)
  const folioNumber = folio + (side === 'b' ? 0.5 : 0);

  for (const chapter of chapters) {
    const startNumber = chapter.startFolio + (chapter.startSide === 'b' ? 0.5 : 0);
    const endNumber = chapter.endFolio + (chapter.endSide === 'b' ? 0.5 : 0);
    
    if (folioNumber >= startNumber && folioNumber <= endNumber) {
      return chapter;
    }
  }

  // If no exact match found, find the chapter that starts closest to or before this folio
  let bestMatch: ChapterInfo | null = null;
  for (const chapter of chapters) {
    const startNumber = chapter.startFolio + (chapter.startSide === 'b' ? 0.5 : 0);
    if (startNumber <= folioNumber) {
      if (!bestMatch || startNumber > (bestMatch.startFolio + (bestMatch.startSide === 'b' ? 0.5 : 0))) {
        bestMatch = chapter;
      }
    }
  }

  return bestMatch;
}

/**
 * Get the URL for the first page of a chapter
 */
export function getChapterFirstPageUrl(tractate: string, chapter: ChapterInfo): string {
  const tractateSlug = encodeURIComponent(tractate.toLowerCase());
  const folioSlug = `${chapter.startFolio}${chapter.startSide}`;
  return `/tractate/${tractateSlug}/${folioSlug}`;
}