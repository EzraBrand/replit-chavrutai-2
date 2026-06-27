const YEVAMOT_MISSING = new Set([
  '2.5', '4.5', '4.6', '4.14', '5.5', '5.7', '7.2', '8.4', '9.6', '9.7',
]);

export function isYerushalmiHalakhahMissing(
  tractate: string,
  chapter: number,
  halakhah: number,
): boolean {
  switch (tractate) {
    case 'Shabbat':
      return chapter >= 21;
    case 'Makkot':
      return chapter === 3;
    case 'Niddah':
      return chapter === 4 && halakhah >= 2;
    case 'Ketubot':
      return chapter === 4 && halakhah === 5;
    case 'Yevamot':
      return YEVAMOT_MISSING.has(`${chapter}.${halakhah}`);
  }
  return false;
}

export function isYerushalmiChapterEmpty(
  tractate: string,
  chapter: number,
  shapes: number[][],
): boolean {
  const count = shapes[chapter - 1]?.length ?? 0;
  if (count === 0) return true;
  for (let h = 1; h <= count; h++) {
    if (!isYerushalmiHalakhahMissing(tractate, chapter, h)) return false;
  }
  return true;
}

export function findFirstValidHalakhahInChapter(
  tractate: string,
  chapter: number,
  shapes: number[][],
): number | null {
  const count = shapes[chapter - 1]?.length ?? 0;
  for (let h = 1; h <= count; h++) {
    if (!isYerushalmiHalakhahMissing(tractate, chapter, h)) return h;
  }
  return null;
}

export function findNextValidYerushalmiHalakhah(
  tractate: string,
  chapter: number,
  halakhah: number,
  shapes: number[][],
): { chapter: number; halakhah: number } | null {
  let c = chapter;
  let h = halakhah + 1;
  while (c <= shapes.length) {
    const halCount = shapes[c - 1]?.length ?? 0;
    while (h <= halCount) {
      if (!isYerushalmiHalakhahMissing(tractate, c, h)) return { chapter: c, halakhah: h };
      h++;
    }
    c++;
    h = 1;
  }
  return null;
}

export function findPrevValidYerushalmiHalakhah(
  tractate: string,
  chapter: number,
  halakhah: number,
  shapes: number[][],
): { chapter: number; halakhah: number } | null {
  let c = chapter;
  let h = halakhah - 1;
  while (c >= 1) {
    if (h < 1) {
      c--;
      if (c < 1) return null;
      h = shapes[c - 1]?.length ?? 0;
      continue;
    }
    if (!isYerushalmiHalakhahMissing(tractate, c, h)) return { chapter: c, halakhah: h };
    h--;
  }
  return null;
}
