import type { BiblicalBook } from '@shared/schema';

interface IndexMetadata {
  categories: {
    torah: string[];
    neviim: string[];
    ketuvim: string[];
  };
  books: Array<{
    filename: string;
    displayName: string;
    hebrewName: string;
  }>;
}

let indexMetadataCache: IndexMetadata | null = null;

const biblicalBookCache = new Map<string, BiblicalBook>();

async function loadIndexMetadata(): Promise<IndexMetadata> {
  if (indexMetadataCache) {
    return indexMetadataCache;
  }
  
  const response = await fetch('/data/biblical-index/index.json');
  if (!response.ok) {
    throw new Error('Failed to load biblical index metadata');
  }
  indexMetadataCache = await response.json();
  return indexMetadataCache!;
}

export async function getBiblicalBook(bookName: string): Promise<BiblicalBook | null> {
  const cacheKey = bookName.toLowerCase();
  
  if (biblicalBookCache.has(cacheKey)) {
    return biblicalBookCache.get(cacheKey)!;
  }

  try {
    const response = await fetch(`/data/biblical-index/${cacheKey}.json`);
    if (!response.ok) {
      console.warn(`Failed to load biblical book data for: ${bookName}`);
      return null;
    }
    const bookData = await response.json();
    
    biblicalBookCache.set(cacheKey, bookData);
    return bookData;
  } catch (error) {
    console.warn(`Failed to load biblical book data for: ${bookName}`, error);
    return null;
  }
}

export async function getBiblicalIndexMetadata(): Promise<IndexMetadata> {
  return loadIndexMetadata();
}

export async function getBooksInCategory(category: 'torah' | 'neviim' | 'ketuvim'): Promise<string[]> {
  const metadata = await loadIndexMetadata();
  return metadata.categories[category] || [];
}

export async function getBookDisplayName(filename: string): Promise<string> {
  const cleanFilename = filename.replace('.json', '');
  
  const specialNames: { [key: string]: string } = {
    'Leviticus_part1': 'Leviticus part1 (Ch. 1-14)',
    'Leviticus_part2': 'Leviticus part2 (Ch. 15-27)', 
    'Deuteronomy_part1': 'Deuteronomy part1 (Ch. 1-17)',
    'Deuteronomy_part2': 'Deuteronomy part2 (Ch. 18-34)'
  };
  
  if (specialNames[cleanFilename]) {
    return specialNames[cleanFilename];
  }
  
  const metadata = await loadIndexMetadata();
  const bookInfo = metadata.books.find(
    book => book.filename === `${cleanFilename}.json`
  );
  return bookInfo?.displayName || cleanFilename.replace(/_/g, ' ');
}

export async function getBooksFromCategory(category: 'torah' | 'neviim' | 'ketuvim'): Promise<BiblicalBook[]> {
  const bookNames = await getBooksInCategory(category);
  const books: BiblicalBook[] = [];
  
  for (const bookName of bookNames) {
    const book = await getBiblicalBook(bookName);
    if (book) {
      books.push(book);
    }
  }
  
  return books;
}

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
