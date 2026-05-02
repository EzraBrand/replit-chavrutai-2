import { type User, type InsertUser, type Text, type InsertText, type Bookmark, type InsertBookmark, type DictionaryEntry, type SearchRequest, type BrowseRequest, type AutosuggestRequest, type AutosuggestResponse } from "@shared/schema";
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
  browseByLetter(request: BrowseRequest): Promise<DictionaryEntry[]>;
  getAutosuggest(request: AutosuggestRequest): Promise<AutosuggestResponse>;

  // BDB Dictionary methods
  searchBdbEntries(request: SearchRequest): Promise<DictionaryEntry[]>;
  browseBdbByLetter(request: BrowseRequest): Promise<DictionaryEntry[]>;
  getBdbAutosuggest(request: AutosuggestRequest): Promise<AutosuggestResponse>;
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

  async browseByLetter(request: BrowseRequest): Promise<DictionaryEntry[]> {
    return sefariaAPI.browseByLetter(request);
  }

  async getAutosuggest(request: AutosuggestRequest): Promise<AutosuggestResponse> {
    return sefariaAPI.getAutosuggest(request);
  }

  // BDB Dictionary methods - delegate to SefariaAPI
  async searchBdbEntries(request: SearchRequest): Promise<DictionaryEntry[]> {
    return sefariaAPI.searchBdbEntries(request);
  }

  async browseBdbByLetter(request: BrowseRequest): Promise<DictionaryEntry[]> {
    return sefariaAPI.browseBdbByLetter(request);
  }

  async getBdbAutosuggest(request: AutosuggestRequest): Promise<AutosuggestResponse> {
    return sefariaAPI.getBdbAutosuggest(request);
  }
}

// Sefaria API implementation for dictionary functionality
export class SefariaAPI {
  private baseURL = "https://www.sefaria.org/api";

  private flattenSenses(senses: any[]): any[] {
    const flattenedSenses: any[] = [];
    
    for (const sense of senses) {
      if (sense.definition) {
        // Include sense number if present (e.g., "1)", "—2)")
        // Remove leading dashes from sense numbers (e.g., "—2)" -> "2)")
        let cleanNumber = sense.number || '';
        if (cleanNumber) {
          cleanNumber = cleanNumber.replace(/^[—–-]+/, '').trim();
        }
        const numberPrefix = cleanNumber ? `${cleanNumber} ` : '';
        flattenedSenses.push({
          definition: numberPrefix + this.transformHyperlinks(sense.definition),
          grammar: sense.grammar
        });
      }
      
      if (Array.isArray(sense.senses)) {
        const nestedFlattened = this.flattenSenses(sense.senses);
        for (const nestedSense of nestedFlattened) {
          const grammarInfo = sense.grammar || nestedSense.grammar;
          let prefix = '';
          if (grammarInfo?.verbal_stem) {
            const binyanForm = grammarInfo.binyan_form?.join(', ') || '';
            prefix = `<strong>${grammarInfo.verbal_stem}</strong>${binyanForm ? ` - <span dir="rtl">${binyanForm}</span>` : ''} `;
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

  private async browseByLetterForLexicon(letter: string, lexiconName: string): Promise<DictionaryEntry[]> {
    try {
      const initialResults = await this.searchEntriesForLexicon(letter, lexiconName);
      if (initialResults.length === 0) {
        return [];
      }

      const allResults: DictionaryEntry[] = [...initialResults];
      const processedIds = new Set(initialResults.map(entry => entry.rid));

      const maxAdditionalEntries = 8;
      let additionalCount = 0;
      let currentHeadwords = initialResults.map(entry => entry.next_hw).filter(Boolean);

      while (currentHeadwords.length > 0 && additionalCount < maxAdditionalEntries) {
        try {
          const batchSize = Math.min(3, currentHeadwords.length);
          const currentBatch = currentHeadwords.slice(0, batchSize);

          const searchPromises = currentBatch
            .filter((headword): headword is string => Boolean(headword))
            .map(headword =>
              this.searchEntriesForLexicon(headword, lexiconName).catch(error => {
                console.log(`[${lexiconName}] Error searching for ${headword}:`, error instanceof Error ? error.message : String(error));
                return [];
              })
            );

          const batchResults = await Promise.all(searchPromises);
          const newHeadwords: string[] = [];

          for (const nextResults of batchResults) {
            if (nextResults.length === 0) continue;
            const nextEntry = nextResults[0];
            if (!nextEntry.headword.startsWith(letter)) {
              continue;
            }
            for (const entry of nextResults) {
              if (!processedIds.has(entry.rid)) {
                allResults.push(entry);
                processedIds.add(entry.rid);
                additionalCount++;
                if (entry.next_hw && additionalCount < maxAdditionalEntries) {
                  newHeadwords.push(entry.next_hw);
                }
              }
            }
          }

          currentHeadwords = [...currentHeadwords.slice(batchSize), ...newHeadwords];
        } catch (error) {
          console.log(`[${lexiconName}] Error following chain, stopping:`, error instanceof Error ? error.message : String(error));
          break;
        }
      }

      console.log(`[${lexiconName}] Browse by letter final results: ${allResults.length} entries`);
      return allResults;
    } catch (error) {
      console.error(`[${lexiconName}] Browse API error:`, error);
      return [];
    }
  }

  private async getAutosuggestForLexicon(query: string, lexiconName: string): Promise<AutosuggestResponse> {
    try {
      // Lexicon-scoped completion endpoint; falls back to all-lexicon if it fails.
      const scopedUrl = `${this.baseURL}/words/completion/${encodeURIComponent(query)}/${encodeURIComponent(lexiconName)}`;
      let response = await fetch(scopedUrl);
      if (!response.ok) {
        console.log(`[${lexiconName}] Scoped completion failed, falling back to all-lexicon completion`);
        response = await fetch(`${this.baseURL}/words/completion/${encodeURIComponent(query)}`);
      }
      if (!response.ok) {
        console.error(`[${lexiconName}] Autosuggest API response not ok:`, response.status, response.statusText);
        return [];
      }
      const data = await response.json();
      if (!Array.isArray(data)) {
        return [];
      }
      const suggestions: AutosuggestResponse = data
        .filter((item: any) => Array.isArray(item) && item.length >= 2)
        .map((item: any) => ({
          unvoweled: item[0],
          voweled: item[1] || item[0]
        }))
        .slice(0, 10);
      return suggestions;
    } catch (error) {
      console.error(`[${lexiconName}] Autosuggest API error:`, error);
      return [];
    }
  }

  // Jastrow public methods
  async searchEntries(request: SearchRequest): Promise<DictionaryEntry[]> {
    return this.searchEntriesForLexicon(request.query, 'Jastrow Dictionary');
  }
  async browseByLetter(request: BrowseRequest): Promise<DictionaryEntry[]> {
    return this.browseByLetterForLexicon(request.letter, 'Jastrow Dictionary');
  }
  async getAutosuggest(request: AutosuggestRequest): Promise<AutosuggestResponse> {
    return this.getAutosuggestForLexicon(request.query, 'Jastrow Dictionary');
  }

  // BDB public methods
  async searchBdbEntries(request: SearchRequest): Promise<DictionaryEntry[]> {
    return this.searchEntriesForLexicon(request.query, 'BDB Dictionary');
  }
  async browseBdbByLetter(request: BrowseRequest): Promise<DictionaryEntry[]> {
    return this.browseByLetterForLexicon(request.letter, 'BDB Dictionary');
  }
  async getBdbAutosuggest(request: AutosuggestRequest): Promise<AutosuggestResponse> {
    return this.getAutosuggestForLexicon(request.query, 'BDB Dictionary');
  }
}

const sefariaAPI = new SefariaAPI();

export const storage = new MemStorage();
