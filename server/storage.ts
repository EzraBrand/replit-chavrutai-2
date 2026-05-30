import { type User, type InsertUser, type Text, type InsertText, type Bookmark, type InsertBookmark, type DictionaryEntry, type SearchRequest } from "@shared/schema";
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
  
  // Jastrow Dictionary methods
  searchEntries(request: SearchRequest): Promise<DictionaryEntry[]>;

  // BDB Dictionary methods
  searchBdbEntries(request: SearchRequest): Promise<DictionaryEntry[]>;

  // BDB internal/test: probe single-letter prefix & preposition entries
  probeBdbPrefixEntries(): Promise<BdbPrefixProbeResult>;
}

export interface BdbPrefixProbeEntry {
  form: string;
  ref: string;
  type: "letter" | "prefix";
  headword: string;
  text: string;
  length: number;
}

export interface BdbPrefixProbeResult {
  generatedAt: string;
  probed: number;
  found: number;
  entries: BdbPrefixProbeEntry[];
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private texts: Map<string, Text>;
  private bookmarks: Map<string, Bookmark>;

  constructor() {
    this.users = new Map();
    this.texts = new Map();
    this.bookmarks = new Map();
    
    // No sample data - fetch from Sefaria API
  }

  // Removed sample data - fetch from Sefaria API instead

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
      sefariaRef: insertText.sefariaRef || null,
      hebrewSections: insertText.hebrewSections ? [...insertText.hebrewSections] : null,
      englishSections: insertText.englishSections ? [...insertText.englishSections] : null,
      nextPageFirstSection: (insertText.nextPageFirstSection && 
        typeof insertText.nextPageFirstSection === 'object' &&
        'hebrew' in insertText.nextPageFirstSection &&
        'english' in insertText.nextPageFirstSection) 
        ? insertText.nextPageFirstSection as { hebrew: string; english: string }
        : null
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

  // Jastrow Dictionary methods - delegate to SefariaAPI
  async searchEntries(request: SearchRequest): Promise<DictionaryEntry[]> {
    return sefariaAPI.searchEntries(request);
  }

  // BDB Dictionary methods - delegate to SefariaAPI
  async searchBdbEntries(request: SearchRequest): Promise<DictionaryEntry[]> {
    return sefariaAPI.searchBdbEntries(request);
  }

  async probeBdbPrefixEntries(): Promise<BdbPrefixProbeResult> {
    return sefariaAPI.probeBdbPrefixEntries();
  }
}

// Sefaria API implementation for dictionary functionality
export class SefariaAPI {
  private baseURL = "https://www.sefaria.org/api";

  private flattenSenses(senses: any[]): any[] {
    const flattenedSenses: any[] = [];
    
    for (const sense of senses) {
      if (sense.definition) {
        // `num` is the actual field name in Sefaria's BDB data (e.g. "1.", "a.", "2.")
        // `number` was the old assumption — keep both for safety.
        let cleanNumber = sense.num || sense.number || '';
        if (cleanNumber) {
          cleanNumber = cleanNumber.replace(/^[—–-]+/, '').trim();
        }
        const numberPrefix = cleanNumber ? `<strong>${cleanNumber}</strong> ` : '';
        flattenedSenses.push({
          definition: numberPrefix + this.transformHyperlinks(sense.definition),
          grammar: sense.grammar
        });
      }
      
      if (Array.isArray(sense.senses)) {
        const nestedFlattened = this.flattenSenses(sense.senses);
        for (const [idx, nestedSense] of nestedFlattened.entries()) {
          const grammarInfo = sense.grammar || nestedSense.grammar;
          let prefix = '';
          // Only label the first nested sense in a section; subsequent senses
          // are sub-points and don't need the stem/number repeated every time.
          if (idx === 0) {
            if (sense.form) {
              // BDB Dictionary: `form` field carries verbal-stem labels
              // (e.g. "Qal", "Niph.", "Pi.", "Hithp.", "Hiph.")
              prefix = `<strong>${sense.form}</strong> `;
            } else if (sense.num || sense.number) {
              // `num` carries numbered/lettered section labels (e.g. "1.", "2.", "a.", "b.")
              // when the container sense itself has no definition — only child senses.
              const n = (sense.num || sense.number).replace(/^[—–-]+/, '').trim();
              prefix = `<strong>${n}</strong> `;
            } else if (grammarInfo?.verbal_stem) {
              const binyanForm = grammarInfo.binyan_form?.join(', ') || '';
              prefix = `<strong>${grammarInfo.verbal_stem}</strong>${binyanForm ? ` - <span dir="rtl">${binyanForm}</span>` : ''} `;
            }
          }
          flattenedSenses.push({
            definition: prefix + nestedSense.definition,
            grammar: grammarInfo
          });
        }
      }
    }
    
    return flattenedSenses;
  }

  private transformHyperlinks(htmlContent: string): string {
    // Handle undefined or null content
    if (!htmlContent || typeof htmlContent !== 'string') {
      console.log('DEBUG: transformHyperlinks received invalid content:', htmlContent);
      return '';
    }

    // Transform Sefaria internal links to external URLs
    let transformed = htmlContent;

    // Pattern 1: Jerusalem Talmud links - add Sefaria base URL and use data-ref for text
    // <a class="refLink" href="Jerusalem_Talmud_Nedarim.5.6.3" data-ref="Jerusalem Talmud Nedarim 5:6">text</a>
    // -> <a class="refLink" href="https://www.sefaria.org/Jerusalem_Talmud_Nedarim.5.6.3" data-ref="Jerusalem Talmud Nedarim 5:6">Jerusalem Talmud Nedarim 5:6</a>
    transformed = transformed.replace(
      /<a([^>]*?)href="(Jerusalem_Talmud_[^"]+)"([^>]*?)data-ref="([^"]*)"([^>]*)>([^<]+)<\/a>/g,
      (match, before, url, middle, dataRef, after, text) => {
        return `<a${before}href="https://www.sefaria.org/${url}"${middle}data-ref="${dataRef}"${after}>${dataRef}</a>`;
      }
    );

    // Pattern 1b: Handle Jerusalem Talmud links where data-ref comes before href
    transformed = transformed.replace(
      /<a([^>]*?)data-ref="([^"]*)"([^>]*?)href="(Jerusalem_Talmud_[^"]+)"([^>]*)>([^<]+)<\/a>/g,
      (match, before, dataRef, middle, url, after, text) => {
        return `<a${before}data-ref="${dataRef}"${middle}href="https://www.sefaria.org/${url}"${after}>${dataRef}</a>`;
      }
    );

    // Pattern 2: href="/Jastrow,_something.1" -> href="https://www.sefaria.org/Jastrow%2C_something"
    // Keep original text for Jastrow entries
    transformed = transformed.replace(
      /href="\/Jastrow,_([^"]+)\.1"/g,
      'href="https://www.sefaria.org/Jastrow%2C_$1"'
    );

    // Pattern 3: Primary works links - replace href and use data-ref for text content
    // <a class="refLink" href="/Bamidbar_Rabbah.10.8" data-ref="Bamidbar Rabbah 10:8">text</a> 
    // -> <a class="refLink" href="https://www.sefaria.org/Bamidbar_Rabbah.10.8" data-ref="Bamidbar Rabbah 10:8">Bamidbar Rabbah 10:8</a>
    transformed = transformed.replace(
      /<a([^>]*?)href="\/([^"\/][^"]*\.[^"]+)"([^>]*?)data-ref="([^"]*)"([^>]*)>([^<]+)<\/a>/g,
      (match, before, url, middle, dataRef, after, text) => {
        return `<a${before}href="https://www.sefaria.org/${url}"${middle}data-ref="${dataRef}"${after}>${dataRef}</a>`;
      }
    );

    // Pattern 4: Handle links where data-ref comes before href
    transformed = transformed.replace(
      /<a([^>]*?)data-ref="([^"]*)"([^>]*?)href="\/([^"\/][^"]*\.[^"]+)"([^>]*)>([^<]+)<\/a>/g,
      (match, before, dataRef, middle, url, after, text) => {
        return `<a${before}data-ref="${dataRef}"${middle}href="https://www.sefaria.org/${url}"${after}>${dataRef}</a>`;
      }
    );

    return transformed;
  }

  private mapEntry = (entry: any): DictionaryEntry => ({
    headword: entry.headword,
    rid: entry.rid,
    parent_lexicon: entry.parent_lexicon,
    language_code: entry.language_code,
    language_reference: entry.language_reference,
    content: {
      ...entry.content,
      senses: this.flattenSenses(entry.content.senses)
    },
    refs: entry.refs,
    prev_hw: entry.prev_hw,
    next_hw: entry.next_hw
  });

  private async searchEntriesForLexicon(query: string, lexiconName: string): Promise<DictionaryEntry[]> {
    try {
      console.log(`[${lexiconName}] Improved search for:`, query);

      // First, try direct word lookup for exact matches
      const directResponse = await fetch(`${this.baseURL}/words/${encodeURIComponent(query)}`);
      let allEntries: DictionaryEntry[] = [];

      if (directResponse.ok) {
        const directData = await directResponse.json();
        if (Array.isArray(directData)) {
          const directEntries = directData
            .filter((entry: any) =>
              entry.parent_lexicon === lexiconName &&
              entry.headword &&
              entry.content &&
              Array.isArray(entry.content.senses)
            )
            .map(this.mapEntry);
          allEntries.push(...directEntries);
          console.log(`[${lexiconName}] Direct search found:`, directEntries.length, 'entries');
        }
      }

      if (allEntries.length > 0) {
        return allEntries;
      }

      // Fall back to lexicon-scoped completion API; if that fails, fall back further
      // to the unscoped completion API (preserves pre-refactor Jastrow search recall).
      console.log(`[${lexiconName}] No direct results, trying completion API...`);
      let completionResponse = await fetch(
        `${this.baseURL}/words/completion/${encodeURIComponent(query)}/${encodeURIComponent(lexiconName)}`
      );
      let completionData: any = null;
      if (completionResponse.ok) {
        try {
          completionData = await completionResponse.json();
        } catch {
          completionData = null;
        }
      }
      if (!Array.isArray(completionData) || completionData.length === 0) {
        console.log(`[${lexiconName}] Scoped completion empty, falling back to unscoped completion`);
        const unscoped = await fetch(`${this.baseURL}/words/completion/${encodeURIComponent(query)}`);
        if (!unscoped.ok) {
          return [];
        }
        try {
          completionData = await unscoped.json();
        } catch {
          return [];
        }
      }
      if (!Array.isArray(completionData) || completionData.length === 0) {
        return [];
      }

      const searchPromises = completionData.slice(0, 5).map(async (suggestion: any) => {
        if (!Array.isArray(suggestion) || suggestion.length < 2) return [];
        const headword = suggestion[1] || suggestion[0];
        try {
          const response = await fetch(`${this.baseURL}/words/${encodeURIComponent(headword)}`);
          if (!response.ok) return [];
          const data = await response.json();
          if (!Array.isArray(data)) return [];
          return data
            .filter((entry: any) =>
              entry.parent_lexicon === lexiconName &&
              entry.headword &&
              entry.content &&
              Array.isArray(entry.content.senses)
            )
            .map(this.mapEntry);
        } catch (error) {
          console.log(`[${lexiconName}] Error searching for suggestion:`, headword, error);
          return [];
        }
      });

      const searchResults = await Promise.all(searchPromises);
      const foundEntries = searchResults.flat();
      const uniqueEntries = Array.from(
        new Map(foundEntries.map(entry => [entry.rid, entry])).values()
      );
      return uniqueEntries;

    } catch (error) {
      console.error(`[${lexiconName}] Search API error:`, error);
      return [];
    }
  }

  // Jastrow public method
  async searchEntries(request: SearchRequest): Promise<DictionaryEntry[]> {
    return this.searchEntriesForLexicon(request.query, 'Jastrow Dictionary');
  }

  // BDB public method
  async searchBdbEntries(request: SearchRequest): Promise<DictionaryEntry[]> {
    return this.searchEntriesForLexicon(request.query, 'BDB Dictionary');
  }

  // BDB internal/test: probe single-letter prefix & preposition entries via the
  // v3 texts API (which DOES return them, unlike /api/words used by search).
  private prefixProbeCache: BdbPrefixProbeResult | null = null;

  async probeBdbPrefixEntries(): Promise<BdbPrefixProbeResult> {
    if (this.prefixProbeCache) return this.prefixProbeCache;

    // Every base Hebrew letter (incl. final forms) + the voweled prefix /
    // preposition / particle headwords BDB actually stores as standalone entries.
    const baseLetters = [
      'א','ב','ג','ד','ה','ו','ז','ח','ט','י','כ','ך','ל','מ','ם',
      'נ','ן','ס','ע','פ','ף','צ','ץ','ק','ר','ש','ת',
    ];
    const prefixForms = [
      'בְּ','כְּ','לְ','וְ','הֲ','הַ','מִן','מִן־','מִ','שֶׁ','שַׁ','אֵת','אֶת','אֶת־',
    ];
    const forms = Array.from(new Set([...baseLetters, ...prefixForms]));

    const entries: BdbPrefixProbeEntry[] = [];
    for (const form of forms) {
      try {
        const url = `${this.baseURL}/v3/texts/${encodeURIComponent(`BDB, ${form}`)}`;
        const r = await fetch(url);
        if (!r.ok) continue;
        const d: any = await r.json();
        const versions: any[] = d.versions || [];
        // Prefer the full 1906 BDB lexicon version; fall back to first non-empty.
        const full =
          versions.find((v) => /Hebrew and English lexicon/i.test(v.versionTitle || '')) ||
          versions[0];
        if (!full) continue;
        const raw = full.text;
        const joined = Array.isArray(raw) ? raw.filter(Boolean).join('\n') : String(raw || '');
        if (!joined.trim()) continue;

        // Classify: letter descriptions are tiny ("Bêth, 2nd letter…");
        // preposition/conjunction entries are large grammatical articles.
        const type: BdbPrefixProbeEntry['type'] =
          joined.length > 1000 || /<strong>\s*(prep|conj|adv|subst|particle)\.?/i.test(joined)
            ? 'prefix'
            : 'letter';

        // Headword: first rtl span in the entry, else the probed form.
        const hwMatch = joined.match(/dir="rtl"[^>]*>([^<]+)</);
        const headword = (hwMatch ? hwMatch[1] : form).trim();

        entries.push({
          form,
          ref: d.ref || `BDB, ${form}`,
          type,
          headword,
          text: joined,
          length: joined.length,
        });
      } catch {
        // ignore individual failures — probe is best-effort
      }
    }

    // Prefixes/prepositions first (the grammatically important ones), then letters.
    entries.sort((a, b) => {
      if (a.type !== b.type) return a.type === 'prefix' ? -1 : 1;
      return b.length - a.length;
    });

    this.prefixProbeCache = {
      generatedAt: new Date().toISOString(),
      probed: forms.length,
      found: entries.length,
      entries,
    };
    return this.prefixProbeCache;
  }
}

const sefariaAPI = new SefariaAPI();

export const storage = new MemStorage();
