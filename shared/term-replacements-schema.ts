import { z } from 'zod';

export const SexualConjugationSchema = z.object({
  prefix: z.string(),
  replacement: z.string()
});

export const TermCategorySchema = z.object({
  description: z.string(),
  terms: z.record(z.string(), z.string()).optional(),
  baseTerms: z.array(z.string()).optional(),
  conjugations: z.array(SexualConjugationSchema).optional()
});

export const TermReplacementsConfigSchema = z.object({
  version: z.string(),
  categories: z.record(z.string(), TermCategorySchema)
});

export type TermReplacementsConfig = z.infer<typeof TermReplacementsConfigSchema>;
export type TermCategory = z.infer<typeof TermCategorySchema>;
export type SexualConjugation = z.infer<typeof SexualConjugationSchema>;

export function loadTermReplacements(config: TermReplacementsConfig): Map<string, string> {
  const termMap = new Map<string, string>();
  
  for (const [categoryName, category] of Object.entries(config.categories)) {
    if (category.terms) {
      for (const [original, replacement] of Object.entries(category.terms)) {
        termMap.set(original.toLowerCase(), replacement);
      }
    }
    
    if (categoryName === 'sexual_conjugations' && category.baseTerms && category.conjugations) {
      for (const conjugation of category.conjugations) {
        for (const baseTerm of category.baseTerms) {
          const original = `${conjugation.prefix} ${baseTerm}`;
          termMap.set(original.toLowerCase(), conjugation.replacement);
        }
      }
    }
  }
  
  return termMap;
}

export function buildCombinedPattern(termMap: Map<string, string>): RegExp {
  const patterns = Array.from(termMap.keys())
    .sort((a, b) => b.length - a.length)
    .map(term => {
      const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const startsWithWord = /^\w/.test(term);
      const endsWithWord = /\w$/.test(term);
      
      const prefix = startsWithWord ? '\\b' : '';
      const suffix = endsWithWord ? '\\b' : '';
      
      return `${prefix}${escaped}${suffix}`;
    })
    .join('|');
  return new RegExp(`(${patterns})`, 'gi');
}
