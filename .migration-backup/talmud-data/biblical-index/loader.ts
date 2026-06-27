import type { BiblicalBook } from '../../shared/schema';

/**
 * Dynamically loads biblical index data for a specific book
 * @param bookName - Name of the biblical book (lowercase filename)
 * @returns Promise resolving to biblical book data
 */
export async function loadBiblicalBook(bookName: string): Promise<BiblicalBook | null> {
  try {
    const filename = `${bookName.toLowerCase()}.json`;
    const module = await import(/* @vite-ignore */ `./${filename}`);
    return module.default || module;
  } catch (error) {
    console.warn(`Failed to load biblical index data for book: ${bookName}`, error);
    return null;
  }
}

/**
 * Loads the biblical index metadata
 * @returns Promise resolving to index metadata with categories and book lists
 */
export async function loadBiblicalIndexMetadata(): Promise<{
  description: string;
  totalBooks: number;
  books: Array<{ filename: string; displayName: string }>;
  categories: {
    torah: string[];
    neviim: string[];
    ketuvim: string[];
  };
} | null> {
  try {
    const module = await import('./index.json');
    return module.default || module;
  } catch (error) {
    console.warn('Failed to load biblical index metadata', error);
    return null;
  }
}

/**
 * Loads all books in a specific category (Torah, Nevi'im, or Ketuvim)
 * @param category - The category to load ('torah', 'neviim', 'ketuvim')
 * @returns Promise resolving to array of biblical books in that category
 */
export async function loadBiblicalCategory(category: 'torah' | 'neviim' | 'ketuvim'): Promise<BiblicalBook[]> {
  const metadata = await loadBiblicalIndexMetadata();
  if (!metadata) return [];
  
  const bookNames = metadata.categories[category];
  const books: BiblicalBook[] = [];
  
  for (const bookName of bookNames) {
    const book = await loadBiblicalBook(bookName);
    if (book) {
      books.push(book);
    }
  }
  
  return books;
}

/**
 * Loads all available biblical books
 * @returns Promise resolving to Record of book name -> book data
 */
export async function loadAllBiblicalBooks(): Promise<Record<string, BiblicalBook>> {
  const metadata = await loadBiblicalIndexMetadata();
  if (!metadata) return {};
  
  const allBooks: Record<string, BiblicalBook> = {};
  
  for (const bookInfo of metadata.books) {
    const bookName = bookInfo.filename.replace('.json', '');
    const book = await loadBiblicalBook(bookName);
    if (book) {
      allBooks[bookName] = book;
    }
  }
  
  return allBooks;
}

/**
 * Cache for loaded biblical book data to avoid repeated requests
 */
const biblicalBookCache = new Map<string, BiblicalBook>();

/**
 * Cached version of loadBiblicalBook for better performance
 * @param bookName - Name of the biblical book (lowercase filename)
 * @returns Promise resolving to cached or freshly loaded biblical book data
 */
export async function getCachedBiblicalBook(bookName: string): Promise<BiblicalBook | null> {
  const cacheKey = bookName.toLowerCase();
  
  if (biblicalBookCache.has(cacheKey)) {
    return biblicalBookCache.get(cacheKey)!;
  }

  const book = await loadBiblicalBook(bookName);
  if (book) {
    biblicalBookCache.set(cacheKey, book);
  }
  return book;
}

/**
 * Cache for metadata
 */
let metadataCache: any = null;

/**
 * Cached version of loadBiblicalIndexMetadata for better performance
 * @returns Promise resolving to cached or freshly loaded metadata
 */
export async function getCachedBiblicalIndexMetadata() {
  if (metadataCache) {
    return metadataCache;
  }
  
  metadataCache = await loadBiblicalIndexMetadata();
  return metadataCache;
}