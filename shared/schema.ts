import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, json, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

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
