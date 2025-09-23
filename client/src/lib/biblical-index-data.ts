import type { BiblicalBook } from '@shared/schema';

// Import index metadata statically since it's small and frequently used
import indexMetadata from '../../../talmud-data/biblical-index/index.json';

/**
 * Biblical index metadata loaded from JSON file
 */
export const biblicalIndexMetadata = indexMetadata;

/**
 * Cache for loaded biblical book data to avoid repeated dynamic imports
 */
const biblicalBookCache = new Map<string, BiblicalBook>();

/**
 * Dynamically loads biblical index data for a specific book
 * @param bookName - Name of the biblical book (filename without .json)
 * @returns Promise resolving to biblical book data or null if not found
 */
export async function getBiblicalBook(bookName: string): Promise<BiblicalBook | null> {
  const cacheKey = bookName.toLowerCase();
  
  // Return cached data if available
  if (biblicalBookCache.has(cacheKey)) {
    return biblicalBookCache.get(cacheKey)!;
  }

  try {
    // Dynamic import from talmud-data/biblical-index/
    const module = await import(`../../../talmud-data/biblical-index/${cacheKey}.json`);
    const bookData = module.default || module;
    
    // Cache the result
    biblicalBookCache.set(cacheKey, bookData);
    return bookData;
  } catch (error) {
    console.warn(`Failed to load biblical book data for: ${bookName}`, error);
    return null;
  }
}

/**
 * Get biblical index metadata including categories and book lists
 * @returns Biblical index metadata
 */
export function getBiblicalIndexMetadata() {
  return biblicalIndexMetadata;
}

/**
 * Get list of books in a specific category
 * @param category - The category ('torah', 'neviim', 'ketuvim')
 * @returns Array of book names in that category
 */
export function getBooksInCategory(category: 'torah' | 'neviim' | 'ketuvim'): string[] {
  return biblicalIndexMetadata.categories[category] || [];
}

/**
 * Get display name for a book by its filename
 * @param filename - The filename (with or without .json extension)
 * @returns Display name or the filename if not found
 */
export function getBookDisplayName(filename: string): string {
  const cleanFilename = filename.replace('.json', '');
  const bookInfo = biblicalIndexMetadata.books.find(
    book => book.filename === `${cleanFilename}.json`
  );
  return bookInfo?.displayName || cleanFilename.replace(/_/g, ' ');
}

/**
 * Load multiple books from a category
 * @param category - The category to load books from
 * @returns Promise resolving to array of biblical books in that category
 */
export async function getBooksFromCategory(category: 'torah' | 'neviim' | 'ketuvim'): Promise<BiblicalBook[]> {
  const bookNames = getBooksInCategory(category);
  const books: BiblicalBook[] = [];
  
  for (const bookName of bookNames) {
    const book = await getBiblicalBook(bookName);
    if (book) {
      books.push(book);
    }
  }
  
  return books;
}

/**
 * Search for citations containing specific text across all loaded books
 * @param searchTerm - The term to search for
 * @param books - Array of books to search in
 * @returns Array of matching citations with book context
 */
export function searchCitations(searchTerm: string, books: BiblicalBook[]) {
  const results: Array<{
    book: string;
    citation: any;
    chapter: number;
  }> = [];
  
  const term = searchTerm.toLowerCase();
  
  for (const book of books) {
    for (const chapter of book.chapters) {
      for (const citation of chapter.citations) {
        if (
          citation.verseText.toLowerCase().includes(term) ||
          citation.verseLocation.toLowerCase().includes(term) ||
          citation.talmudFullText.toLowerCase().includes(term)
        ) {
          results.push({
            book: book.bookName,
            citation,
            chapter: chapter.chapterNumber
          });
        }
      }
    }
  }
  
  return results;
}