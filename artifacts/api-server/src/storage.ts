import { type User, type InsertUser, type Text, type InsertText, type Bookmark, type InsertBookmark, type DictionaryEntry, type SearchRequest } from "@workspace/db";
import { randomUUID } from "crypto";
import bdbSupplementalData from "@workspace/shared-data/data/bdb-supplemental-entries.json";
import { AsyncTtlLruCache } from "./lib/async-ttl-lru-cache";

// Reduce a Hebrew form to its bare consonant "skeleton" so user queries (typed
// without vowels/maqaf) can be matched against voweled supplemental headwords:
// strip niqqud + cantillation, maqaf, and homograph superscripts, then map final
// letters to their regular forms.
const BDB_FINAL_LETTERS: Record<string, string> = {
  'ך': 'כ', 'ם': 'מ', 'ן': 'נ', 'ף': 'פ', 'ץ': 'צ',
};
function bdbSkeleton(s: string): string {
  return (s || '')
    .replace(/[\u0591-\u05C7]/g, '') // niqqud + cantillation
    .replace(/\u05BE/g, '')          // maqaf
    .replace(/[¹²³⁴⁵⁶⁷⁸⁹⁰]/g, '')    // homograph superscripts
    .split('')
    .map((ch) => BDB_FINAL_LETTERS[ch] || ch)
    .join('')
    .trim();
}

// High-value BDB grammatical particles that exist via the v3 texts API but are
// absent from /api/words consonant search. These are merged into the main /bdb
// reader (the broader ~44 two-letter forms stay on /bdb-prefix-test for now).
// Keyed by consonant skeleton -> voweled forms to fetch.
const BDB_SUPPLEMENTAL_PARTICLE_FORMS = ['לְ', 'מִן־', 'וְ', 'בְּ', 'כְּ', 'הֲ', 'פֶּן־', 'הַל', 'לָט', 'לֹט'];
const BDB_SUPPLEMENTAL_PARTICLES: Record<string, string[]> = (() => {
  const map: Record<string, string[]> = {};
  for (const form of BDB_SUPPLEMENTAL_PARTICLE_FORMS) {
    const key = bdbSkeleton(form);
    (map[key] ||= []).push(form);
  }
  return map;
})();

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
  getBdbPrefixEntry(form: string): Promise<BdbPrefixProbeEntry | undefined>;
}

export interface BdbPrefixProbeEntry {
  form: string;
  ref: string;
  type: "letter" | "prefix" | "two-letter";
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
  private texts: AsyncTtlLruCache<Text>;
  private bookmarks: Map<string, Bookmark>;

  constructor() {
    this.users = new Map();
    this.texts = new AsyncTtlLruCache<Text>(500, 6 * 60 * 60 * 1000);
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
    return this.texts.values().filter(text =>
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

  async getBdbPrefixEntry(form: string): Promise<BdbPrefixProbeEntry | undefined> {
    return sefariaAPI.getBdbPrefixEntry(form);
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
    const results = await this.searchLexiconCore(query, lexiconName);
    if (lexiconName === 'BDB Dictionary') {
      return this.mergeBdbSupplementalParticles(query, results);
    }
    return results;
  }

  // Fetch a single supplemental BDB headword from the v3 texts API and shape it
  // as a DictionaryEntry. These forms are missing from /api/words search but
  // present in /api/v3/texts. Cached in-memory (success or miss) to avoid refetch.
  private bdbSupplementalEntryCache = new Map<string, DictionaryEntry | null>();

  private async fetchBdbSupplementalEntry(form: string): Promise<DictionaryEntry | null> {
    if (this.bdbSupplementalEntryCache.has(form)) {
      return this.bdbSupplementalEntryCache.get(form) ?? null;
    }
    try {
      const url = `${this.baseURL}/v3/texts/${encodeURIComponent(`BDB, ${form}`)}`;
      const r = await fetch(url);
      if (!r.ok) {
        this.bdbSupplementalEntryCache.set(form, null);
        return null;
      }
      const d: any = await r.json();
      const versions: any[] = d.versions || [];
      const full =
        versions.find((v) => /Hebrew and English lexicon/i.test(v.versionTitle || '')) ||
        versions[0];
      if (!full) {
        this.bdbSupplementalEntryCache.set(form, null);
        return null;
      }
      const raw = full.text;
      const joined = Array.isArray(raw) ? raw.filter(Boolean).join('\n') : String(raw || '');
      if (!joined.trim()) {
        this.bdbSupplementalEntryCache.set(form, null);
        return null;
      }

      // Strip the leading headword block so the definition doesn't duplicate the
      // headword the reader renders separately as <h3>. Handles an optional leading
      // homograph numeral (e.g. "I. " before בְּ), nested <big><big> wrappers
      // (e.g. מִן־, הֲ) and a trailing <sub>NNN</sub> frequency count (e.g. פֶּן־).
      // Falls back to the full blob if the pattern doesn't match.
      const stripped = joined.replace(
        /^\s*†?\s*(?:[IVXLC]+\.\s*)?\[?\s*(?:<big>)+\s*<span dir="rtl">[\s\S]*?(?:<\/big>)+\]?\s*(?:<sub>[\s\S]*?<\/sub>)?\s*/,
        '',
      );
      const body = stripped.trim() ? stripped : joined;
      const definition = this.transformHyperlinks(body);

      const entry: DictionaryEntry = {
        headword: form,
        rid: `BDB-suppl-${form}`,
        parent_lexicon: 'BDB Dictionary',
        content: { senses: [{ definition }] },
      };
      this.bdbSupplementalEntryCache.set(form, entry);
      return entry;
    } catch {
      this.bdbSupplementalEntryCache.set(form, null);
      return null;
    }
  }

  // Merge high-value grammatical particles (לְ, מִן־, וְ, בְּ, כְּ, הֲ, פֶּן־) into
  // BDB results. This is a MERGE, not an empty-only fallback: e.g. searching פן
  // already returns פִּנָּה, yet still misses פֶּן־. Matching is by consonant
  // skeleton; particles are surfaced first since they're the high-value hits.
  private async mergeBdbSupplementalParticles(
    query: string,
    results: DictionaryEntry[],
  ): Promise<DictionaryEntry[]> {
    const forms = BDB_SUPPLEMENTAL_PARTICLES[bdbSkeleton(query)];
    if (!forms || forms.length === 0) return results;

    const existing = new Set(results.map((e) => e.headword));
    const additions: DictionaryEntry[] = [];
    for (const form of forms) {
      if (existing.has(form)) continue;
      const entry = await this.fetchBdbSupplementalEntry(form);
      if (entry && !existing.has(entry.headword)) {
        additions.push(entry);
        existing.add(entry.headword);
      }
    }
    return additions.length ? [...additions, ...results] : results;
  }

  private async searchLexiconCore(query: string, lexiconName: string): Promise<DictionaryEntry[]> {
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
        // The unscoped completion fallback exists to preserve Jastrow recall.
        // For BDB it does more harm than good: when BDB's scoped completion is
        // empty (e.g. short voweled particles like בְּ or לְ), the unscoped list
        // returns unrelated words that merely share the prefix, and fetching
        // them yields BDB entries for the WRONG headword (searching בְּ pulled in
        // random אֵל entries). Those gaps are exactly the supplemental particles
        // we now merge in separately, so for BDB we stop here rather than
        // contaminate the results with noise.
        if (lexiconName === 'BDB Dictionary') {
          return [];
        }
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
      'בְּ','כְּ','לְ','וְ','הֲ','הַ','מִן','מִן־','מִ','שֶׁ','שַׁ',
    ];
    // Two-letter BDB headwords that exist via the v3 texts API but are absent
    // from /api/words consonant search (direct lookup + completion). Surfaced
    // here for review before being merged into the main /bdb reader.
    const supplementalForms = Object.values(
      (bdbSupplementalData as { bySkeleton: Record<string, string[]> }).bySkeleton,
    ).flat();
    const supplementalSet = new Set(supplementalForms);
    const forms = Array.from(new Set([...baseLetters, ...prefixForms, ...supplementalForms]));

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
        const type: BdbPrefixProbeEntry['type'] = supplementalSet.has(form)
          ? 'two-letter'
          : joined.length > 1000 || /<strong>\s*(prep|conj|adv|subst|particle)\.?/i.test(joined)
            ? 'prefix'
            : 'letter';

        // Headword: first rtl span in the entry, else the probed form. For the
        // supplemental two-letter forms keep the probed form so homographs
        // (e.g. שֵׂט vs שֵׂט²) stay distinguishable.
        const hwMatch = joined.match(/dir="rtl"[^>]*>([^<]+)</);
        const headword = supplementalSet.has(form)
          ? form
          : (hwMatch ? hwMatch[1] : form).trim();

        // Run the same hyperlink transform the main BDB reader applies: it
        // rewrites internal refs to Sefaria URLs and replaces each citation's
        // abbreviated display text ("2 S 18:20") with the full reference from
        // the data-ref attribute ("II Samuel 18:20"). Without this the probe
        // entries render with raw abbreviations, unlike the live reader.
        const transformed = this.transformHyperlinks(joined);

        entries.push({
          form,
          ref: d.ref || `BDB, ${form}`,
          type,
          headword,
          text: transformed,
          length: transformed.length,
        });
      } catch {
        // ignore individual failures — probe is best-effort
      }
    }

    // Two-letter entries first (the ones under review), then prefixes/prepositions,
    // then single letters. Within a group, longest entries first.
    const typeOrder: Record<BdbPrefixProbeEntry['type'], number> = {
      'two-letter': 0,
      prefix: 1,
      letter: 2,
    };
    entries.sort((a, b) => {
      if (a.type !== b.type) return typeOrder[a.type] - typeOrder[b.type];
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

  async getBdbPrefixEntry(form: string): Promise<BdbPrefixProbeEntry | undefined> {
    const result = await this.probeBdbPrefixEntries();
    return result.entries.find((e) => e.form === form);
  }
}

const sefariaAPI = new SefariaAPI();

export const storage = new MemStorage();
