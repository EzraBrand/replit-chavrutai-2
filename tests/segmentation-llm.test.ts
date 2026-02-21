import { describe, expect, it } from 'vitest';
import { parseCoSegmentationJson, validateCoSegmentationOutput } from '../server/lib/segmentation-llm';

describe('co-segmentation structured output', () => {
  it('parses valid structured JSON', () => {
    const json = JSON.stringify({
      hebrew_segments: [
        [0, 1],
        [2, 3],
      ],
      english_segments: [
        [0, 2],
        [3, 5],
      ],
      hebrew_texts: ['foo', 'bar'],
      english_texts: ['one', 'two'],
    });

    const parsed = parseCoSegmentationJson(json);
    expect(parsed.hebrew_segments.length).toBe(2);
    expect(parsed.english_segments.length).toBe(2);
  });

  it('rejects malformed JSON shape', () => {
    const json = JSON.stringify({
      hebrew_boundaries: [1, 2],
      english_boundaries: [1, 2],
    });

    expect(() => parseCoSegmentationJson(json)).toThrow();
  });

  it('rejects providing only one verification text array', () => {
    const json = JSON.stringify({
      hebrew_segments: [[0, 1]],
      english_segments: [[0, 1]],
      hebrew_texts: ['א ב'],
    });

    expect(() => parseCoSegmentationJson(json)).toThrow();
  });

  it('validates output and reconstructs exact original text', () => {
    const input = {
      hebrewText: 'וַיֹּאמֶר אֱלֹהִים יְהִי אוֹר',
      englishText: 'And God said, Let there be light.',
    };

    const output = {
      hebrew_segments: [
        [0, 1],
        [2, 3],
      ] as [number, number][],
      english_segments: [
        [0, 2],
        [3, 6],
      ] as [number, number][],
      hebrew_texts: ['וַיֹּאמֶר אֱלֹהִים ', 'יְהִי אוֹר'],
      english_texts: ['And God said, ', 'Let there be light.'],
    };

    const result = validateCoSegmentationOutput(input, output);
    expect(result.hebrewSegments.length).toBe(2);
    expect(result.englishSegments.length).toBe(2);
    expect(result.hebrewSegments.map((s) => s.text).join('')).toBe(input.hebrewText);
    expect(result.englishSegments.map((s) => s.text).join('')).toBe(input.englishText);
  });

  it('rejects segment-count mismatch', () => {
    const input = {
      hebrewText: 'א ב ג ד',
      englishText: 'a b c d',
    };

    const output = {
      hebrew_segments: [[0, 1], [2, 3]] as [number, number][],
      english_segments: [[0, 3]] as [number, number][],
      hebrew_texts: ['א ב ', 'ג ד'],
      english_texts: ['a b c d'],
    };

    expect(() => validateCoSegmentationOutput(input, output)).toThrow('Segment count mismatch');
  });

  it('rejects non-contiguous ranges', () => {
    const input = {
      hebrewText: 'א ב ג ד',
      englishText: 'a b c d',
    };

    const output = {
      hebrew_segments: [[0, 0], [2, 3]] as [number, number][],
      english_segments: [[0, 1], [2, 3]] as [number, number][],
      hebrew_texts: ['א ', 'ג ד'],
      english_texts: ['a b ', 'c d'],
    };

    expect(() => validateCoSegmentationOutput(input, output)).toThrow('Invalid hebrew_segments');
  });

  it('recovers ranges from exact verification texts when indices are wrong', () => {
    const input = {
      hebrewText: 'א ב ג ד',
      englishText: 'a b c d',
    };

    const output = {
      hebrew_segments: [[0, 0], [2, 3]] as [number, number][],
      english_segments: [[0, 1], [2, 2]] as [number, number][],
      hebrew_texts: ['א ב ', 'ג ד'],
      english_texts: ['a b ', 'c d'],
    };

    const result = validateCoSegmentationOutput(input, output);
    expect(result.raw.hebrew_segments).toEqual([
      [0, 1],
      [2, 3],
    ]);
    expect(result.raw.english_segments).toEqual([
      [0, 1],
      [2, 3],
    ]);
    expect(result.hebrewSegments.map((s) => s.text).join('')).toBe(input.hebrewText);
    expect(result.englishSegments.map((s) => s.text).join('')).toBe(input.englishText);
  });

  it('does not recover when verification texts do not reconstruct source exactly', () => {
    const input = {
      hebrewText: 'א ב ג ד',
      englishText: 'a b c d',
    };

    const output = {
      hebrew_segments: [[0, 0], [2, 3]] as [number, number][],
      english_segments: [[0, 1], [2, 2]] as [number, number][],
      hebrew_texts: ['א ב', 'ג ד'],
      english_texts: ['a b', 'c d'],
    };

    expect(() => validateCoSegmentationOutput(input, output)).toThrow('Invalid hebrew_segments');
  });

  it('auto-repairs trailing under-coverage on contiguous ranges', () => {
    const input = {
      hebrewText: 'א ב ג ד ה',
      englishText: 'a b c d e',
    };

    const output = {
      hebrew_segments: [[0, 1], [2, 3]] as [number, number][],
      english_segments: [[0, 1], [2, 3]] as [number, number][],
      hebrew_texts: ['א ב ', 'ג ד ה'],
      english_texts: ['a b ', 'c d e'],
    };

    const result = validateCoSegmentationOutput(input, output);
    expect(result.raw.hebrew_segments).toEqual([
      [0, 1],
      [2, 4],
    ]);
    expect(result.raw.english_segments).toEqual([
      [0, 1],
      [2, 4],
    ]);
    expect(result.hebrewSegments.map((s) => s.text).join('')).toBe(input.hebrewText);
    expect(result.englishSegments.map((s) => s.text).join('')).toBe(input.englishText);
  });
});
