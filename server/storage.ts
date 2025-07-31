import { type User, type InsertUser, type Text, type InsertText, type Bookmark, type InsertBookmark } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Text methods
  getText(work: string, tractate: string, chapter: number, folio: number, side: string): Promise<Text | undefined>;
  getTexts(work: string, tractate?: string): Promise<Text[]>;
  createText(text: InsertText): Promise<Text>;
  
  // Bookmark methods
  getBookmarks(userId: string): Promise<Bookmark[]>;
  createBookmark(bookmark: InsertBookmark): Promise<Bookmark>;
  deleteBookmark(id: string): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private texts: Map<string, Text>;
  private bookmarks: Map<string, Bookmark>;

  constructor() {
    this.users = new Map();
    this.texts = new Map();
    this.bookmarks = new Map();
    
    // Initialize with sample Talmud text
    this.initializeSampleData();
  }

  private initializeSampleData() {
    const sampleText: Text = {
      id: randomUUID(),
      work: "Talmud Bavli",
      tractate: "Berakhot",
      chapter: 1,
      folio: 2,
      side: "a",
      hebrewText: `**משנה:** מאימתי קורין את שמע בערבין? משעה שהכהנים נכנסין לאכול בתרומתן, דברי *רבי אליעזר*. וחכמים אומרים: משעה שהכוכבים נראין. ועד מתי? עד סוף האשמורה הראשונה, דברי *רבי אליעזר*. וחכמים אומרים: עד חצות.

**גמרא:** תנא מאימתי? **למה פתח בערבית?** ליפתח בשחרית! משום דכתיב: "ובשכבך ובקומך" - הכתוב הקדים שכיבה לקימה.

אי נמי, קא סליק ליה לתנא כסדר בראשית, דכתיב: "ויהי ערב ויהי בקר יום אחד".

והיינו דקאמר רחמנא: "ובשכבך" - זה ערבית, "ובקומך" - זה שחרית.`,
      englishText: `**MISHNA:** From when do we recite *Shema* in the evening? From the time when the priests enter to partake of their *teruma*. These are the words of *Rabbi Eliezer*. And the Rabbis say: From the time when the stars emerge. And until when does the time for the recitation of the evening *Shema* extend? Until midnight. This is the statement of *Rabbi Eliezer*. And the Rabbis say: Until dawn.

**GEMARA:** The *mishna* opens with the question: From when do we recite *Shema* in the evening? The *Gemara* asks: **Why does the mishna begin with the evening Shema?** Let it begin with the morning *Shema*, which is the first *mitzvah* of the day.

The *Gemara* answers: The *mishna* is following the order established by the verse, as it is written: "When you lie down and when you rise up" (Deuteronomy 6:7). The verse mentions lying down, which refers to the evening, before rising up, which refers to the morning.

Alternatively, the *mishna* follows the order of Creation, as it is written: "And there was evening and there was morning, one day" (Genesis 1:5). Evening precedes morning in the daily cycle.`,
      sefariaRef: "Berakhot.2a"
    };
    
    this.texts.set(this.getTextKey(sampleText.work, sampleText.tractate, sampleText.chapter, sampleText.folio, sampleText.side), sampleText);
  }

  private getTextKey(work: string, tractate: string, chapter: number, folio: number, side: string): string {
    return `${work}:${tractate}:${chapter}:${folio}:${side}`;
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getText(work: string, tractate: string, chapter: number, folio: number, side: string): Promise<Text | undefined> {
    const key = this.getTextKey(work, tractate, chapter, folio, side);
    return this.texts.get(key);
  }

  async getTexts(work: string, tractate?: string): Promise<Text[]> {
    return Array.from(this.texts.values()).filter(text => 
      text.work === work && (!tractate || text.tractate === tractate)
    );
  }

  async createText(insertText: InsertText): Promise<Text> {
    const id = randomUUID();
    const text: Text = { 
      ...insertText, 
      id,
      sefariaRef: insertText.sefariaRef || null
    };
    const key = this.getTextKey(text.work, text.tractate, text.chapter, text.folio, text.side);
    this.texts.set(key, text);
    return text;
  }

  async getBookmarks(userId: string): Promise<Bookmark[]> {
    return Array.from(this.bookmarks.values()).filter(bookmark => bookmark.userId === userId);
  }

  async createBookmark(insertBookmark: InsertBookmark): Promise<Bookmark> {
    const id = randomUUID();
    const bookmark: Bookmark = { 
      ...insertBookmark, 
      id,
      userId: insertBookmark.userId || null,
      textId: insertBookmark.textId || null,
      notes: insertBookmark.notes || null
    };
    this.bookmarks.set(id, bookmark);
    return bookmark;
  }

  async deleteBookmark(id: string): Promise<void> {
    this.bookmarks.delete(id);
  }
}

export const storage = new MemStorage();
