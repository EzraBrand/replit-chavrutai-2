import type { ChapterOutline } from '@shared/schema';
import sanhedrinOutlineJson from "../../talmud data/sanhedrin-outline.json";

// Parse CSV data for Sanhedrin 10 (Perek Chelek)
export const sanhedrin10Outline: ChapterOutline = sanhedrinOutlineJson as ChapterOutline;