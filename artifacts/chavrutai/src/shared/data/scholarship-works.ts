export interface ScholarshipWork {
  slug: string;
  sefariaKey: string;
  title: string;
  heTitle: string;
  author: string;
  description: string;
  type: "book";
}

export const SCHOLARSHIP_WORKS: ScholarshipWork[] = [
  {
    slug: "introductions-tanaitic",
    sefariaKey: "Introductions_to_Tanaitic_Literature",
    title: "Introductions to Tanaitic Literature",
    heTitle: "מבואות לספרות התנאים",
    author: "Jacob Nahum Epstein",
    description:
      "Epstein's introduction to the Mishnah, Tosefta, and Halakhic Midrashim.",
    type: "book",
  },
  {
    slug: "introductions-amoraic",
    sefariaKey: "Introductions_to_Amoraic_Literature",
    title: "Introductions to Amoraic Literature",
    heTitle: "מבואות לספרות האמוראים",
    author: "Jacob Nahum Epstein",
    description:
      "Epstein's introduction to the Babylonian Talmud and the literature of the Amoraic period.",
    type: "book",
  },
];

export function getScholarshipWork(slug: string): ScholarshipWork | undefined {
  return SCHOLARSHIP_WORKS.find((w) => w.slug === slug);
}

export function isValidScholarshipWork(slug: string): boolean {
  return SCHOLARSHIP_WORKS.some((w) => w.slug === slug);
}
