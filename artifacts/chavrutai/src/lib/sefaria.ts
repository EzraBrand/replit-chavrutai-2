import { apiRequest } from "./queryClient";
import type { TalmudText, Chapter, TalmudLocation } from "@/types/talmud";

export interface SefariaAPI {
  getText(location: TalmudLocation): Promise<TalmudText | null>;
  getTractates(work: string): Promise<string[]>;
  getChapters(tractate: string): Promise<Chapter[]>;
}

class SefariaAPIClient implements SefariaAPI {
  async getText(location: TalmudLocation): Promise<TalmudText | null> {
    try {
      const params = new URLSearchParams({
        work: location.work,
        tractate: location.tractate,
        chapter: location.chapter.toString(),
        folio: location.folio.toString(),
        side: location.side
      });
      
      const response = await apiRequest('GET', `/api/text?${params}`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching text:', error);
      return null;
    }
  }

  async getTractates(work: string): Promise<string[]> {
    try {
      const params = new URLSearchParams({ work });
      const response = await apiRequest('GET', `/api/tractates?${params}`);
      const data = await response.json();
      return data.tractates || [];
    } catch (error) {
      console.error('Error fetching tractates:', error);
      return [];
    }
  }

  async getChapters(tractate: string): Promise<Chapter[]> {
    try {
      const params = new URLSearchParams({ tractate });
      const response = await apiRequest('GET', `/api/chapters?${params}`);
      const data = await response.json();
      return data.chapters || [];
    } catch (error) {
      console.error('Error fetching chapters:', error);
      return [];
    }
  }
}

export const sefariaAPI = new SefariaAPIClient();
