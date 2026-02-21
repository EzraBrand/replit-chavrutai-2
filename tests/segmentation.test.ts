import { describe, expect, it } from 'vitest';
import {
  boundariesToWordRanges,
  buildSegmentsFromWordRanges,
  getWordSpans,
  validateSegmentationIntegrity,
  validateWordRanges,
} from '../shared/segmentation';

describe('segmentation pipeline', () => {
  it('extracts stable word spans with offsets', () => {
    const text = 'And God said, Let there be light.';
    const spans = getWordSpans(text);

    expect(spans.length).toBe(7);
    expect(spans[0].token).toBe('And');
    expect(spans[2].token).toBe('said,');
    expect(text.slice(spans[2].start, spans[2].end)).toBe('said,');
  });

  it('converts boundaries to contiguous ranges', () => {
    const ranges = boundariesToWordRanges([2, 5], 7);
    expect(ranges).toEqual([
      [0, 2],
      [3, 5],
      [6, 6],
    ]);
  });

  it('rejects out-of-range boundaries', () => {
    expect(() => boundariesToWordRanges([6], 7)).toThrow();
  });

  it('validates contiguous full coverage', () => {
    const valid = validateWordRanges(
      [
        [0, 1],
        [2, 4],
      ],
      5,
    );
    expect(valid.isValid).toBe(true);

    const invalid = validateWordRanges(
      [
        [0, 1],
        [3, 4],
      ],
      5,
    );
    expect(invalid.isValid).toBe(false);
    expect(invalid.errors.join(' ')).toContain('expected 2');
  });

  it('reconstructs original text exactly from generated segments', () => {
    const text = 'And God said, Let there be light: and there was light.';
    const ranges = boundariesToWordRanges([2, 6], getWordSpans(text).length);
    const segments = buildSegmentsFromWordRanges(text, ranges);

    expect(segments.map((s) => s.text)).toEqual([
      'And God said, ',
      'Let there be light: ',
      'and there was light.',
    ]);
    expect(validateSegmentationIntegrity(text, segments)).toBe(true);
  });

  it('handles Hebrew text and preserves exact spacing/punctuation', () => {
    const text = 'וַיֹּאמֶר אֱלֹהִים יְהִי אוֹר וַיְהִי אוֹר';
    const ranges = boundariesToWordRanges([1, 3], getWordSpans(text).length);
    const segments = buildSegmentsFromWordRanges(text, ranges);

    expect(segments.length).toBe(3);
    expect(validateSegmentationIntegrity(text, segments)).toBe(true);
  });

  it('keeps HTML tags untouched while segmenting by word indices', () => {
    const text = '<b>Abaye</b> said: And <i>it</i> provokes Torah scholars.';
    const ranges = boundariesToWordRanges([1, 4], getWordSpans(text).length);
    const segments = buildSegmentsFromWordRanges(text, ranges);

    expect(segments[0].text).toBe('<b>Abaye</b> said: ');
    expect(segments[1].text).toBe('And <i>it</i> provokes ');
    expect(segments[2].text).toBe('Torah scholars.');
    expect(validateSegmentationIntegrity(text, segments)).toBe(true);
  });
});
