import { useEffect, useState } from "react";
import type { AutosuggestSuggestion } from "./dictionary-format";

export type LexiconKey = "bdb" | "jastrow";

export interface LexiconIndex {
  lexicon: LexiconKey;
  headwords: string[];
  normalized: string[];
  perLetterCounts: Record<string, number>;
  total: number;
}

const FINAL_TO_REGULAR: Record<string, string> = {
  "\u05DA": "\u05DB",
  "\u05DD": "\u05DE",
  "\u05DF": "\u05E0",
  "\u05E3": "\u05E4",
  "\u05E5": "\u05E6",
};

const NIQQUD_RE = /[\u0591-\u05C7]/g;
const FINAL_RE = /[\u05DA\u05DD\u05DF\u05E3\u05E5]/g;

export function normalizeHebrew(s: string): string {
  return s.replace(NIQQUD_RE, "").replace(FINAL_RE, (c) => FINAL_TO_REGULAR[c] ?? c);
}

const cache: Partial<Record<LexiconKey, Promise<LexiconIndex>>> = {};

export function loadLexiconIndex(lexicon: LexiconKey): Promise<LexiconIndex> {
  if (!cache[lexicon]) {
    cache[lexicon] = (async () => {
      const mod =
        lexicon === "bdb"
          ? await import("@shared/data/lexicon-headwords/bdb.json")
          : await import("@shared/data/lexicon-headwords/jastrow.json");
      const data: any = (mod as any).default ?? mod;
      const headwords: string[] = data.headwords ?? [];
      const normalized = headwords.map(normalizeHebrew);
      return {
        lexicon,
        headwords,
        normalized,
        perLetterCounts: data._metadata?.per_letter_counts ?? {},
        total: data._metadata?.total_headwords ?? headwords.length,
      };
    })();
  }
  return cache[lexicon]!;
}

export function useLexiconIndex(lexicon: LexiconKey): LexiconIndex | null {
  const [index, setIndex] = useState<LexiconIndex | null>(null);
  useEffect(() => {
    let cancelled = false;
    loadLexiconIndex(lexicon).then((idx) => {
      if (!cancelled) setIndex(idx);
    });
    return () => {
      cancelled = true;
    };
  }, [lexicon]);
  return index;
}

export function searchHeadwords(
  index: LexiconIndex,
  query: string,
  limit = 20,
): AutosuggestSuggestion[] {
  const nq = normalizeHebrew(query.trim());
  if (!nq) return [];
  const startsWith: AutosuggestSuggestion[] = [];
  const contains: AutosuggestSuggestion[] = [];
  for (let i = 0; i < index.normalized.length; i++) {
    if (startsWith.length >= limit) break;
    const u = index.normalized[i];
    if (u.startsWith(nq)) {
      startsWith.push({ unvoweled: u, voweled: index.headwords[i] });
    } else if (contains.length < limit && u.includes(nq)) {
      contains.push({ unvoweled: u, voweled: index.headwords[i] });
    }
  }
  return [...startsWith, ...contains].slice(0, limit);
}

function levenshtein(a: string, b: string, max: number): number {
  if (a === b) return 0;
  const al = a.length;
  const bl = b.length;
  if (Math.abs(al - bl) > max) return max + 1;
  let prev = new Array(bl + 1);
  let curr = new Array(bl + 1);
  for (let j = 0; j <= bl; j++) prev[j] = j;
  for (let i = 1; i <= al; i++) {
    curr[0] = i;
    let rowMin = i;
    for (let j = 1; j <= bl; j++) {
      const cost = a.charCodeAt(i - 1) === b.charCodeAt(j - 1) ? 0 : 1;
      curr[j] = Math.min(curr[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost);
      if (curr[j] < rowMin) rowMin = curr[j];
    }
    if (rowMin > max) return max + 1;
    [prev, curr] = [curr, prev];
  }
  return prev[bl];
}

export function findFuzzyMatches(
  index: LexiconIndex,
  query: string,
  limit = 5,
): AutosuggestSuggestion[] {
  const nq = normalizeHebrew(query.trim());
  if (nq.length < 2) return [];
  const firstChar = nq[0];
  const maxDist = nq.length <= 3 ? 1 : 2;
  const candidates: { hw: string; uw: string; dist: number }[] = [];
  for (let i = 0; i < index.normalized.length; i++) {
    const u = index.normalized[i];
    if (u[0] !== firstChar) continue;
    if (Math.abs(u.length - nq.length) > maxDist) continue;
    const d = levenshtein(u, nq, maxDist);
    if (d <= maxDist) {
      candidates.push({ hw: index.headwords[i], uw: u, dist: d });
    }
  }
  candidates.sort((a, b) => a.dist - b.dist || a.hw.length - b.hw.length);
  return candidates.slice(0, limit).map((c) => ({ unvoweled: c.uw, voweled: c.hw }));
}
