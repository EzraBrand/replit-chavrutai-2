import { z } from 'zod';

export const WordRangeSchema = z.tuple([
  z.number().int().nonnegative(),
  z.number().int().nonnegative(),
]);

export const CoSegmentationOutputSchema = z.object({
  hebrew_segments: z.array(WordRangeSchema).min(1),
  english_segments: z.array(WordRangeSchema).min(1),
  hebrew_texts: z.array(z.string()).min(1),
  english_texts: z.array(z.string()).min(1),
}).superRefine((value, ctx) => {
  if (value.hebrew_texts && value.hebrew_texts.length !== value.hebrew_segments.length) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['hebrew_texts'],
      message: 'hebrew_texts length must equal hebrew_segments length.',
    });
  }
  if (value.english_texts && value.english_texts.length !== value.english_segments.length) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['english_texts'],
      message: 'english_texts length must equal english_segments length.',
    });
  }
});

export type WordRangeTuple = z.infer<typeof WordRangeSchema>;
export type CoSegmentationOutput = z.infer<typeof CoSegmentationOutputSchema>;

export const CO_SEGMENTATION_JSON_SCHEMA = {
  name: 'co_segmentation_word_indices',
  strict: true,
  schema: {
    type: 'object',
    additionalProperties: false,
    properties: {
      hebrew_segments: {
        type: 'array',
        minItems: 1,
        items: {
          type: 'array',
          minItems: 2,
          maxItems: 2,
          items: { type: 'integer', minimum: 0 },
        },
      },
      english_segments: {
        type: 'array',
        minItems: 1,
        items: {
          type: 'array',
          minItems: 2,
          maxItems: 2,
          items: { type: 'integer', minimum: 0 },
        },
      },
      hebrew_texts: {
        type: 'array',
        minItems: 1,
        items: { type: 'string' },
      },
      english_texts: {
        type: 'array',
        minItems: 1,
        items: { type: 'string' },
      },
    },
    required: ['hebrew_segments', 'english_segments', 'hebrew_texts', 'english_texts'],
  },
} as const;
