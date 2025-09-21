import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, json, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
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

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const texts = pgTable("texts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  work: text("work").notNull(), // Bible, Mishnah, Talmud Yerushalmi, Talmud Bavli
  tractate: text("tractate").notNull(),
  chapter: integer("chapter").notNull(),
  folio: integer("folio").notNull(),
  side: text("side").notNull(), // 'a' or 'b'
  hebrewText: text("hebrew_text").notNull(),
  englishText: text("english_text").notNull(),
  hebrewSections: json("hebrew_sections").$type<string[]>(), // Array of Hebrew text sections
  englishSections: json("english_sections").$type<string[]>(), // Array of English text sections
  sefariaRef: text("sefaria_ref"),
  nextPageFirstSection: json("next_page_first_section").$type<{ hebrew: string; english: string } | null>(), // First section of next page for continuation
});

export const bookmarks = pgTable("bookmarks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  textId: varchar("text_id").references(() => texts.id),
  notes: text("notes"),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
});

export const insertTextSchema = createInsertSchema(texts).omit({
  id: true,
});

export const insertBookmarkSchema = createInsertSchema(bookmarks).omit({
  id: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertText = z.infer<typeof insertTextSchema>;
export type Text = typeof texts.$inferSelect;
export type InsertBookmark = z.infer<typeof insertBookmarkSchema>;
export type Bookmark = typeof bookmarks.$inferSelect;
