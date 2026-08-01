import { z } from "zod";

// Talmud Outline Schema
export const TalmudOutlineEntrySchema = z.object({
  rowNumber: z.number(),
  locationRange: z.string(),
  sectionCount: z.number(),
  sectionHeader: z.string(),
  keywords: z.string(),
  blogpostUrl: z.string().optional(),
  macroSugya: z.string(),
});

export const ChapterOutlineSchema = z.object({
  tractate: z.string(),
  chapter: z.number(),
  chapterName: z.string(),
  entries: z.array(TalmudOutlineEntrySchema),
});

export type TalmudOutlineEntry = z.infer<typeof TalmudOutlineEntrySchema>;
export type ChapterOutline = z.infer<typeof ChapterOutlineSchema>;

// Blog Posts Schema
export const BlogPostEntrySchema = z.object({
  rowNumber: z.number(),
  title: z.string(),
  tractate: z.string(),
  talmudLocation: z.string(),
  blogUrl: z.string(),
  caiLink: z.string(),
  keywords: z.string(),
});

export const BlogPostsSchema = z.object({
  title: z.string(),
  description: z.string(),
  totalPosts: z.number(),
  entries: z.array(BlogPostEntrySchema),
});

export type BlogPostEntry = z.infer<typeof BlogPostEntrySchema>;
export type BlogPosts = z.infer<typeof BlogPostsSchema>;

// Chapter information for tractate contents
export const ChapterInfoSchema = z.object({
  number: z.number(),
  englishName: z.string(),
  hebrewName: z.string(),
  startFolio: z.number(),
  startSide: z.enum(["a", "b"]),
  endFolio: z.number(),
  endSide: z.enum(["a", "b"]),
});

export type ChapterInfo = z.infer<typeof ChapterInfoSchema>;

// Biblical Index Schema
export const BiblicalCitationSchema = z.object({
  verseLocation: z.string(),
  verseText: z.string(),
  talmudLocation: z.string(),
  talmudLocationUrl: z.string(),
  talmudFullText: z.string(),
});

export const BiblicalChapterSchema = z.object({
  chapterNumber: z.number(),
  citations: z.array(BiblicalCitationSchema),
});

export const BiblicalBookSchema = z.object({
  bookName: z.string(),
  totalEntries: z.number(),
  chapters: z.array(BiblicalChapterSchema),
});

export type BiblicalCitation = z.infer<typeof BiblicalCitationSchema>;
export type BiblicalChapter = z.infer<typeof BiblicalChapterSchema>;
export type BiblicalBook = z.infer<typeof BiblicalBookSchema>;

// Jastrow Dictionary Entry Types
export const dictionaryEntrySchema = z.object({
  headword: z.string(),
  rid: z.string().optional(),
  parent_lexicon: z.string(),
  language_code: z.string().optional(),
  language_reference: z.string().optional(),
  content: z.object({
    senses: z.array(z.object({
      definition: z.string()
    }))
  }),
  refs: z.array(z.string()).optional(),
  prev_hw: z.string().optional(),
  next_hw: z.string().optional()
});

export type DictionaryEntry = z.infer<typeof dictionaryEntrySchema>;

// Dictionary search request schema
export const searchRequestSchema = z.object({
  query: z.string().min(1)
});

export type SearchRequest = z.infer<typeof searchRequestSchema>;

// Bible Location Schema
export const BibleLocationSchema = z.object({
  work: z.literal("Bible"),
  book: z.string(),
  chapter: z.number(),
  verse: z.number().optional(),
});

export type BibleLocation = z.infer<typeof BibleLocationSchema>;

// Bible Text Schema
export const BibleVerseSchema = z.object({
  verseNumber: z.number(),
  hebrewSegments: z.array(z.string()),
  englishSegments: z.array(z.string()),
});

export const BibleTextSchema = z.object({
  work: z.literal("Bible"),
  book: z.string(),
  chapter: z.number(),
  verses: z.array(BibleVerseSchema),
  sefariaRef: z.string(),
  verseCount: z.number(),
});

export type BibleVerse = z.infer<typeof BibleVerseSchema>;
export type BibleText = z.infer<typeof BibleTextSchema>;

// Bible Query Schema for API requests
export const BibleQuerySchema = z.object({
  book: z.string(),
  chapter: z.coerce.number(),
});

// Text Search Schemas
export const textSearchRequestSchema = z.object({
  query: z.string().min(1, "Search query is required"),
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(50).default(15),
  type: z.enum(["all", "talmud", "bible"]).default("all"),
  exact: z.preprocess((val) => String(val) === 'true', z.boolean()),
});

export type TextSearchRequest = z.infer<typeof textSearchRequestSchema>;

// Search result from Sefaria API
export const searchResultSchema = z.object({
  ref: z.string(),
  hebrewRef: z.string().optional(),
  text: z.string(),
  highlight: z.string().optional(),
  path: z.string().optional(),
  type: z.enum(["talmud", "bible", "other"]),
});

export type SearchResult = z.infer<typeof searchResultSchema>;

export const textSearchResponseSchema = z.object({
  results: z.array(searchResultSchema),
  total: z.number(),
  page: z.number(),
  pageSize: z.number(),
  totalPages: z.number(),
  query: z.string(),
});

export type TextSearchResponse = z.infer<typeof textSearchResponseSchema>;
