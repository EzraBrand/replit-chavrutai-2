export interface WordSpan {
  index: number;
  start: number;
  end: number;
  token: string;
}

export interface WordSegment {
  id: number;
  wordStart: number;
  wordEnd: number;
  start: number;
  end: number;
  text: string;
}

export type WordRange = [number, number];

export interface SegmentationValidationResult {
  isValid: boolean;
  errors: string[];
}

const WORD_PATTERN = /\S+/g;

/**
 * Tokenize text into non-whitespace word spans with character offsets.
 * Offsets are [start, end) where end is exclusive.
 */
export function getWordSpans(text: string): WordSpan[] {
  const spans: WordSpan[] = [];
  const pattern = new RegExp(WORD_PATTERN);
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(text)) !== null) {
    const token = match[0];
    const start = match.index;
    spans.push({
      index: spans.length,
      start,
      end: start + token.length,
      token,
    });
  }
  return spans;
}

/**
 * Convert split boundaries (split after these word indices) to ranges.
 * Example boundaries [3, 7] with 10 words => [0,3], [4,7], [8,9]
 */
export function boundariesToWordRanges(boundaries: number[], wordCount: number): WordRange[] {
  if (wordCount <= 0) return [];
  if (boundaries.length === 0) return [[0, wordCount - 1]];

  const deduped: number[] = [];
  const seen: Record<number, true> = {};
  for (let i = 0; i < boundaries.length; i += 1) {
    const boundary = boundaries[i];
    if (!seen[boundary]) {
      seen[boundary] = true;
      deduped.push(boundary);
    }
  }
  const sorted = deduped.sort((a, b) => a - b);
  const ranges: WordRange[] = [];
  let currentStart = 0;

  for (let i = 0; i < sorted.length; i += 1) {
    const boundary = sorted[i];
    if (boundary < 0 || boundary >= wordCount - 1) {
      throw new Error(`Boundary ${boundary} out of range for ${wordCount} words.`);
    }
    if (boundary < currentStart) {
      throw new Error(`Boundary ${boundary} overlaps previous segment.`);
    }
    ranges.push([currentStart, boundary]);
    currentStart = boundary + 1;
  }

  ranges.push([currentStart, wordCount - 1]);
  return ranges;
}

/**
 * Validate word ranges are contiguous and fully cover all words.
 */
export function validateWordRanges(ranges: WordRange[], wordCount: number): SegmentationValidationResult {
  const errors: string[] = [];

  if (wordCount === 0) {
    if (ranges.length > 0) errors.push('No words in text, but ranges were provided.');
    return { isValid: errors.length === 0, errors };
  }

  if (ranges.length === 0) {
    errors.push('At least one range is required when text has words.');
    return { isValid: false, errors };
  }

  let expectedStart = 0;

  ranges.forEach(([start, end], i) => {
    if (!Number.isInteger(start) || !Number.isInteger(end)) {
      errors.push(`Range ${i} must use integer indices.`);
      return;
    }
    if (start < 0 || end < 0 || start >= wordCount || end >= wordCount) {
      errors.push(`Range ${i} [${start}, ${end}] is outside [0, ${wordCount - 1}].`);
      return;
    }
    if (start > end) {
      errors.push(`Range ${i} [${start}, ${end}] has start > end.`);
      return;
    }
    if (start !== expectedStart) {
      errors.push(`Range ${i} starts at ${start}, expected ${expectedStart} for contiguous coverage.`);
      return;
    }
    expectedStart = end + 1;
  });

  if (expectedStart !== wordCount) {
    errors.push(`Ranges end at word ${expectedStart - 1}, expected ${wordCount - 1}.`);
  }

  return { isValid: errors.length === 0, errors };
}

/**
 * Build exact text segments from contiguous word ranges.
 * Segment boundaries are based on starts of next ranges, so joining
 * all segment.text values reconstructs the original text byte-for-byte.
 */
export function buildSegmentsFromWordRanges(text: string, ranges: WordRange[]): WordSegment[] {
  const words = getWordSpans(text);
  const validation = validateWordRanges(ranges, words.length);
  if (!validation.isValid) {
    throw new Error(`Invalid word ranges: ${validation.errors.join(' | ')}`);
  }

  return ranges.map(([wordStart, wordEnd], i) => {
    const start = i === 0 ? 0 : words[wordStart].start;
    const nextRange = ranges[i + 1];
    const end = nextRange ? words[nextRange[0]].start : text.length;
    return {
      id: i + 1,
      wordStart,
      wordEnd,
      start,
      end,
      text: text.slice(start, end),
    };
  });
}

/**
 * Integrity guard: reconstructed text must exactly equal original text.
 */
export function validateSegmentationIntegrity(originalText: string, segments: Pick<WordSegment, 'text'>[]): boolean {
  const reconstructed = segments.map((segment) => segment.text).join('');
  return reconstructed === originalText;
}
