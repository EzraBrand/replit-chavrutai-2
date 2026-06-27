import { apiRequest } from "./queryClient";
import type { BibleText, BibleBook, BibleLocation } from "@/types/bible";

export interface BibleAPI {
  getText(location: BibleLocation): Promise<BibleText | null>;
  getBooks(): Promise<{ books: BibleBook[]; sections: any }>;
  getChapters(book: string): Promise<number[]>;
}

class BibleAPIClient implements BibleAPI {
  async getText(location: BibleLocation): Promise<BibleText | null> {
    try {
      const params = new URLSearchParams({
        book: location.book,
        chapter: location.chapter.toString(),
      });

      const response = await apiRequest('GET', `/api/bible/text?${params}`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching Bible text:', error);
      return null;
    }
  }

  async getBooks(): Promise<{ books: BibleBook[]; sections: any }> {
    try {
      const response = await apiRequest('GET', '/api/bible/books');
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching Bible books:', error);
      return { books: [], sections: {} };
    }
  }

  async getChapters(book: string): Promise<number[]> {
    try {
      const params = new URLSearchParams({ book });
      const response = await apiRequest('GET', `/api/bible/chapters?${params}`);
      const data = await response.json();
      return data.chapters || [];
    } catch (error) {
      console.error('Error fetching Bible chapters:', error);
      return [];
    }
  }
}

export const bibleAPI = new BibleAPIClient();
