import OpenAI from 'openai';
import { CO_SEGMENTATION_JSON_SCHEMA, CoSegmentationOutputSchema, type CoSegmentationOutput } from '@shared/segmentation-schema';
import {
  buildSegmentsFromWordRanges,
  getWordSpans,
  validateSegmentationIntegrity,
  validateWordRanges,
  type WordSegment,
} from '@shared/segmentation';

export interface CoSegmentationInput {
  hebrewText: string;
  englishText: string;
}

export interface CoSegmentationResult {
  hebrewSegments: WordSegment[];
  englishSegments: WordSegment[];
  raw: CoSegmentationOutput;
}

export interface CoSegmentationOptions {
  model?: string;
  temperature?: number;
  maxAttempts?: number;
}

function toIndexedWordList(text: string): string {
  return getWordSpans(text)
    .map((word) => `[${word.index}]${word.token}`)
    .join(' ');
}

function buildPrompt(input: CoSegmentationInput): string {
  const hebrewWordCount = getWordSpans(input.hebrewText).length;
  const englishWordCount = getWordSpans(input.englishText).length;

  return [
    'Segment both texts into aligned phrase units using word-index ranges.',
    'Return ONLY JSON.',
    '',
    'Rules:',
    '1) Preserve source text exactly; do not rewrite text.',
    '2) Use contiguous ranges that cover all words exactly once.',
    '3) Use inclusive word ranges: [startIndex, endIndex].',
    '4) Keep strict 1:1 segment counts between Hebrew and English.',
    '5) Also return hebrew_texts and english_texts arrays with exact segment substrings in order.',
    '6) Never split inside a word token.',
    '',
    `Hebrew word count: ${hebrewWordCount} (valid word indices 0..${Math.max(hebrewWordCount - 1, 0)})`,
    `English word count: ${englishWordCount} (valid word indices 0..${Math.max(englishWordCount - 1, 0)})`,
    '',
    'Hebrew indexed words:',
    toIndexedWordList(input.hebrewText),
    '',
    'English indexed words:',
    toIndexedWordList(input.englishText),
    '',
    'JSON shape:',
    '{"hebrew_segments":[[0,2],[3,4]],"english_segments":[[0,4],[5,7]],"hebrew_texts":["...","..."],"english_texts":["...","..."]}',
  ].join('\n');
}

function buildRepairPrompt(input: CoSegmentationInput, previousOutput: CoSegmentationOutput, validationError: string): string {
  return [
    'Your previous JSON failed validation.',
    `Validation error: ${validationError}`,
    '',
    'Fix the segmentation JSON. Keep strict contiguous coverage and 1:1 segment count.',
    'Return ONLY corrected JSON.',
    '',
    'Hebrew indexed words:',
    toIndexedWordList(input.hebrewText),
    '',
    'English indexed words:',
    toIndexedWordList(input.englishText),
    '',
    'Previous JSON:',
    JSON.stringify(previousOutput),
  ].join('\n');
}

export function parseCoSegmentationJson(content: string): CoSegmentationOutput {
  const parsed = JSON.parse(content);
  return CoSegmentationOutputSchema.parse(parsed);
}

function validateAndBuild(input: CoSegmentationInput, output: CoSegmentationOutput): CoSegmentationResult {
  const recovered = recoverRangesFromVerificationTexts(input, output);
  const effectiveOutput = recovered ?? output;

  const hebrewWordCount = getWordSpans(input.hebrewText).length;
  const englishWordCount = getWordSpans(input.englishText).length;
  const normalizedHebrewRanges = normalizeTrailingCoverage(effectiveOutput.hebrew_segments, hebrewWordCount);
  const normalizedEnglishRanges = normalizeTrailingCoverage(effectiveOutput.english_segments, englishWordCount);

  const hebrewValidation = validateWordRanges(normalizedHebrewRanges, hebrewWordCount);
  if (!hebrewValidation.isValid) {
    throw new Error(`Invalid hebrew_segments: ${hebrewValidation.errors.join(' | ')}`);
  }

  const englishValidation = validateWordRanges(normalizedEnglishRanges, englishWordCount);
  if (!englishValidation.isValid) {
    throw new Error(`Invalid english_segments: ${englishValidation.errors.join(' | ')}`);
  }

  if (normalizedHebrewRanges.length !== normalizedEnglishRanges.length) {
    throw new Error(
      `Segment count mismatch: hebrew=${normalizedHebrewRanges.length}, english=${normalizedEnglishRanges.length}.`,
    );
  }

  const hebrewSegments = buildSegmentsFromWordRanges(input.hebrewText, normalizedHebrewRanges);
  const englishSegments = buildSegmentsFromWordRanges(input.englishText, normalizedEnglishRanges);

  if (!validateSegmentationIntegrity(input.hebrewText, hebrewSegments)) {
    throw new Error('Hebrew segmentation failed integrity check.');
  }
  if (!validateSegmentationIntegrity(input.englishText, englishSegments)) {
    throw new Error('English segmentation failed integrity check.');
  }

  return {
    hebrewSegments,
    englishSegments,
    raw: {
      ...effectiveOutput,
      hebrew_segments: normalizedHebrewRanges,
      english_segments: normalizedEnglishRanges,
    },
  };
}

function normalizeTrailingCoverage(ranges: [number, number][], wordCount: number): [number, number][] {
  if (wordCount <= 0 || ranges.length === 0) return ranges;

  // Require contiguous start-to-end structure before applying any repair.
  if (ranges[0][0] !== 0) return ranges;
  for (let i = 0; i < ranges.length; i += 1) {
    const [start, end] = ranges[i];
    if (!Number.isInteger(start) || !Number.isInteger(end)) return ranges;
    if (start > end || start < 0) return ranges;
    if (i > 0 && start !== ranges[i - 1][1] + 1) return ranges;
  }

  const fixed = ranges.map(([start, end]) => [start, end] as [number, number]);
  const last = fixed[fixed.length - 1];
  const targetLast = wordCount - 1;

  // Handle common off-by-one where model treats end as exclusive.
  if (last[1] === wordCount) {
    last[1] = targetLast;
    return fixed;
  }

  // Handle under-coverage where final words are omitted.
  if (last[1] < targetLast) {
    last[1] = targetLast;
    return fixed;
  }

  return ranges;
}

function rangesFromExactSegmentTexts(sourceText: string, segmentTexts: string[]): [number, number][] | null {
  if (segmentTexts.length === 0) return null;
  if (segmentTexts.join('') !== sourceText) return null;

  const allWords = getWordSpans(sourceText);
  if (allWords.length === 0) return null;

  const ranges: [number, number][] = [];
  let cursor = 0;

  for (let i = 0; i < segmentTexts.length; i += 1) {
    const segmentWordCount = getWordSpans(segmentTexts[i]).length;
    if (segmentWordCount <= 0) return null;

    const start = cursor;
    const end = cursor + segmentWordCount - 1;
    if (end >= allWords.length) return null;

    ranges.push([start, end]);
    cursor = end + 1;
  }

  if (cursor !== allWords.length) return null;
  return ranges;
}

function recoverRangesFromVerificationTexts(
  input: CoSegmentationInput,
  output: CoSegmentationOutput,
): CoSegmentationOutput | null {
  if (!output.hebrew_texts || !output.english_texts) return null;

  const recoveredHebrew = rangesFromExactSegmentTexts(input.hebrewText, output.hebrew_texts);
  const recoveredEnglish = rangesFromExactSegmentTexts(input.englishText, output.english_texts);
  if (!recoveredHebrew || !recoveredEnglish) return null;
  if (recoveredHebrew.length !== recoveredEnglish.length) return null;

  return {
    ...output,
    hebrew_segments: recoveredHebrew,
    english_segments: recoveredEnglish,
  };
}

export async function coSegmentWithOpenAI(
  input: CoSegmentationInput,
  options: CoSegmentationOptions = {},
): Promise<CoSegmentationResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is required for co-segmentation.');
  }

  const model = options.model ?? process.env.OPENAI_MODEL ?? 'gpt-4o-mini';
  const temperature = options.temperature ?? 0;
  const maxAttempts = options.maxAttempts ?? 2;
  const client = new OpenAI({ apiKey });

  let lastError: string = 'Unknown segmentation error.';
  let lastParsed: CoSegmentationOutput | null = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const userPrompt =
      attempt === 1 || !lastParsed
        ? buildPrompt(input)
        : buildRepairPrompt(input, lastParsed, lastError);

    const completion = await client.chat.completions.create({
      model,
      temperature,
      messages: [
        {
          role: 'system',
          content:
            'You segment parallel Hebrew-English text. Return only valid JSON that matches the schema exactly.',
        },
        {
          role: 'user',
          content: userPrompt,
        },
      ],
      response_format: {
        type: 'json_schema',
        json_schema: CO_SEGMENTATION_JSON_SCHEMA,
      },
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      lastError = 'OpenAI returned empty segmentation response.';
      continue;
    }

    try {
      const parsed = parseCoSegmentationJson(content);
      lastParsed = parsed;
      return validateAndBuild(input, parsed);
    } catch (error) {
      lastError = error instanceof Error ? error.message : 'Segmentation parse/validation failed.';
    }
  }

  throw new Error(`Co-segmentation failed after ${maxAttempts} attempts. Last error: ${lastError}`);
}

export function validateCoSegmentationOutput(
  input: CoSegmentationInput,
  output: CoSegmentationOutput,
): CoSegmentationResult {
  return validateAndBuild(input, output);
}
