/**
 * Comprehensive test suite for text processing functions
 * 
 * This test suite covers all documented edge cases and known patterns
 * from the Talmudic text processing system.
 */

import { describe, it, expect } from 'vitest';
import {
  splitEnglishText,
  splitHebrewText,
  removeNikud,
  processHebrewText,
  processEnglishText,
  replaceTerms,
  containsHebrew,
  normalizeApiText
} from './text-processing';

describe('English Text Processing', () => {
  describe('Period + Quote Patterns', () => {
    it('should handle period + straight double quote', () => {
      const input = 'from Hodu to Cush." Rav';
      const expected = 'from Hodu to Cush."\nRav';
      expect(splitEnglishText(input)).toBe(expected);
    });

    it('should handle period + curly double quote (U+201D)', () => {
      const input = 'from Hodu to Cush." Rav';
      const expected = 'from Hodu to Cush."\nRav';
      expect(splitEnglishText(input)).toBe(expected);
    });

    it('should handle period + left curly double quote (U+201C)', () => {
      const input = 'from Hodu to Cush." Next';
      const expected = 'from Hodu to Cush."\nNext';
      expect(splitEnglishText(input)).toBe(expected);
    });

    it('should handle period + straight single quote', () => {
      const input = "from Hodu to Cush.' Rav";
      const expected = "from Hodu to Cush.'\nRav";
      expect(splitEnglishText(input)).toBe(expected);
    });

    it('should handle period + curly single quote (U+2019)', () => {
      const input = "from Hodu to Cush.' Rav";
      const expected = "from Hodu to Cush.'\nRav";
      expect(splitEnglishText(input)).toBe(expected);
    });

    it('should handle period + left curly single quote (U+2018)', () => {
      const input = "from Hodu to Cush.' Next";
      const expected = "from Hodu to Cush.'\nNext";
      expect(splitEnglishText(input)).toBe(expected);
    });
  });

  describe('Comma + Quote Patterns', () => {
    it('should handle comma + straight double quote', () => {
      const input = 'detailed exposition," as';
      const expected = 'detailed exposition,"\nas';
      expect(splitEnglishText(input)).toBe(expected);
    });

    it('should handle comma + curly double quote (U+201D)', () => {
      const input = 'detailed exposition," as';
      const expected = 'detailed exposition,"\nas';
      expect(splitEnglishText(input)).toBe(expected);
    });

    it('should handle comma + straight single quote', () => {
      const input = "detailed exposition,' as";
      const expected = "detailed exposition,'\nas";
      expect(splitEnglishText(input)).toBe(expected);
    });

    it('should handle comma + curly single quote (U+2019)', () => {
      const input = "detailed exposition,' as";
      const expected = "detailed exposition,'\nas";
      expect(splitEnglishText(input)).toBe(expected);
    });
  });

  describe('Triple-Punctuation Clusters', () => {
    it('should handle question mark + single quote + double quote (?\'\")', () => {
      const input = 'shall I know?\'" (Genesis';
      const expected = 'shall I know?\'\"\n(Genesis';
      expect(splitEnglishText(input)).toBe(expected);
    });

    it('should handle period + single quote + double quote (.\'\")', () => {
      const input = 'the end.\'" After';
      const expected = 'the end.\'\"\nAfter';
      expect(splitEnglishText(input)).toBe(expected);
    });

    it('should handle comma + single quote + double quote (,\'\")', () => {
      const input = 'he said,\'" but';
      const expected = 'he said,\'\"\nbut';
      expect(splitEnglishText(input)).toBe(expected);
    });

    it('should handle semicolon + single quote + double quote (;\'\")', () => {
      const input = 'thus;\'" however';
      const expected = 'thus;\'\"\nhowever';
      expect(splitEnglishText(input)).toBe(expected);
    });

    it('should handle exclamation + single quote + double quote (!\'\")', () => {
      const input = 'amazing!\'" Then';
      const expected = 'amazing!\'\"\nThen';
      expect(splitEnglishText(input)).toBe(expected);
    });
  });

  describe('Number Preservation', () => {
    it('should NOT split numbers with commas', () => {
      const input = 'The population was 600,000 people.';
      const expected = 'The population was 600,000 people.';
      expect(splitEnglishText(input)).toBe(expected);
    });

    it('should preserve multiple numbers with commas', () => {
      const input = 'There were 1,000 men and 2,500 women.';
      const expected = 'There were 1,000 men and 2,500 women.';
      expect(splitEnglishText(input)).toBe(expected);
    });

    it('should preserve large numbers', () => {
      const input = 'The sum was 1,234,567 shekels.';
      const expected = 'The sum was 1,234,567 shekels.';
      expect(splitEnglishText(input)).toBe(expected);
    });
  });

  describe('Abbreviation Preservation', () => {
    it('should preserve i.e.', () => {
      const input = 'The term, i.e. the word, means something.';
      const expected = 'The term, i.e. the word, means something.';
      expect(splitEnglishText(input)).toBe(expected);
    });

    it('should preserve e.g.', () => {
      const input = 'Some examples, e.g. this one, are clear.';
      const expected = 'Some examples, e.g. this one, are clear.';
      expect(splitEnglishText(input)).toBe(expected);
    });

    it('should preserve etc.', () => {
      const input = 'Things like bread, wine, etc. were consumed.';
      const expected = 'Things like bread, wine, etc. were consumed.';
      expect(splitEnglishText(input)).toBe(expected);
    });

    it('should preserve vs.', () => {
      const input = 'In the case of Hillel vs. Shammai, they disagreed.';
      const expected = 'In the case of Hillel vs. Shammai, they disagreed.';
      expect(splitEnglishText(input)).toBe(expected);
    });

    it('should preserve cf.', () => {
      const input = 'See also, cf. the other passage, for details.';
      const expected = 'See also, cf. the other passage, for details.';
      expect(splitEnglishText(input)).toBe(expected);
    });
  });

  describe('HTML Line Breaks', () => {
    it('should convert <br> to newlines', () => {
      const input = 'First line.<br>Second line.';
      const expected = 'First line.\nSecond line.';
      expect(splitEnglishText(input)).toBe(expected);
    });

    it('should convert <br/> to newlines', () => {
      const input = 'First line.<br/>Second line.';
      const expected = 'First line.\nSecond line.';
      expect(splitEnglishText(input)).toBe(expected);
    });

    it('should convert <br /> (with space) to newlines', () => {
      const input = 'First line.<br />Second line.';
      const expected = 'First line.\nSecond line.';
      expect(splitEnglishText(input)).toBe(expected);
    });

    it('should handle case-insensitive <BR> tags', () => {
      const input = 'First line.<BR>Second line.';
      const expected = 'First line.\nSecond line.';
      expect(splitEnglishText(input)).toBe(expected);
    });
  });

  describe('Bolded Comma/Colon Logic', () => {
    it('should split on bolded comma', () => {
      const input = 'He said<b>,</b> she replied.';
      const expected = 'He said<b>,\n</b> she replied.';
      expect(splitEnglishText(input)).toBe(expected);
    });

    it('should split on bolded colon', () => {
      const input = 'It is stated<b>:</b> "Text follows."';
      const expected = 'It is stated<b>:\n</b> "Text follows."';
      expect(splitEnglishText(input)).toBe(expected);
    });

    it('should split on <strong> comma', () => {
      const input = 'He said<strong>,</strong> she replied.';
      const expected = 'He said<strong>,\n</strong> she replied.';
      expect(splitEnglishText(input)).toBe(expected);
    });

    it('should NOT split bolded comma before quotes', () => {
      const input = 'he said<b>,"</b> but';
      // Comma before quote should NOT split
      const result = splitEnglishText(input);
      expect(result).not.toContain('<b>,\n"</b>');
    });

    it('should NOT split bolded comma in numbers', () => {
      const input = 'There were <b>600,000</b> people.';
      const result = splitEnglishText(input);
      expect(result).toContain('600,000');
      expect(result).not.toContain('600,\n000');
    });
  });

  describe('Question Mark Splitting', () => {
    it('should split on question marks', () => {
      const input = 'Why? Because it is so.';
      const expected = 'Why?\nBecause it is so.';
      expect(splitEnglishText(input)).toBe(expected);
    });

    it('should handle question mark + quote (already tested in patterns)', () => {
      const input = 'Why?" he asked.';
      const expected = 'Why?"\nhe asked.';
      expect(splitEnglishText(input)).toBe(expected);
    });
  });

  describe('Semicolon Splitting', () => {
    it('should split on semicolons', () => {
      const input = 'First clause; second clause.';
      const expected = 'First clause;\nsecond clause.';
      expect(splitEnglishText(input)).toBe(expected);
    });
  });

  describe('Orphaned Quote Cleanup', () => {
    it('should remove orphaned quotes NOT preceded by punctuation', () => {
      const input = 'Some text\n"\nMore text.';
      const expected = 'Some text\nMore text.';
      expect(splitEnglishText(input)).toBe(expected);
    });

    it('should preserve quotes that are part of punctuation clusters', () => {
      const input = 'Text."\nMore text.';
      const expected = 'Text."\nMore text.';
      expect(splitEnglishText(input)).toBe(expected);
    });

    it('should preserve quotes after commas in clusters', () => {
      const input = 'Text,"\nMore text.';
      const expected = 'Text,"\nMore text.';
      expect(splitEnglishText(input)).toBe(expected);
    });
  });

  describe('Complex Real-World Cases', () => {
    it('should handle Megillah 11a pattern', () => {
      const input = 'from Hodu to Cush." Rav and Shmuel disagreed.';
      const expected = 'from Hodu to Cush."\nRav and Shmuel disagreed.';
      expect(splitEnglishText(input)).toBe(expected);
    });

    it('should handle nested quotes', () => {
      const input = 'It is stated: "And he said, \'My Lord, God, by what shall I know?\'"';
      const result = splitEnglishText(input);
      expect(result).toContain('It is stated:\n');
      expect(result).toContain('My Lord');
    });

    it('should handle multiple sentences', () => {
      const input = 'First sentence. Second sentence. Third sentence.';
      const result = splitEnglishText(input);
      const lines = result.split('\n');
      expect(lines.length).toBe(3);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty string', () => {
      expect(splitEnglishText('')).toBe('');
    });

    it('should handle whitespace-only string', () => {
      expect(splitEnglishText('   ')).toBe('');
    });

    it('should handle string with no punctuation', () => {
      const input = 'Just plain text';
      expect(splitEnglishText(input)).toBe('Just plain text');
    });

    it('should preserve HTML formatting tags', () => {
      const input = 'This is <b>bold</b> text. And <i>italic</i> too.';
      const result = splitEnglishText(input);
      expect(result).toContain('<b>bold</b>');
      expect(result).toContain('<i>italic</i>');
    });
  });
});

describe('Hebrew Text Processing', () => {
  describe('Nikud Removal', () => {
    it('should remove Hebrew vowel points', () => {
      const input = 'שָׁלוֹם';
      const expected = 'שלום';
      expect(removeNikud(input)).toBe(expected);
    });

    it('should remove cantillation marks', () => {
      const input = 'בְּרֵאשִׁ֖ית';
      const result = removeNikud(input);
      expect(result).not.toContain('\u0591');
      expect(result).not.toContain('\u05B0');
    });

    it('should preserve Hebrew letters', () => {
      const input = 'אָמַר רַבִּי';
      const result = removeNikud(input);
      expect(result).toContain('א');
      expect(result).toContain('מ');
      expect(result).toContain('ר');
    });
  });

  describe('Hebrew Punctuation Splitting', () => {
    it('should split on colons', () => {
      const input = 'אמר רבי יוחנן: מאי דכתיב';
      const result = splitHebrewText(input);
      expect(result).toContain(':\n');
    });

    it('should split on question marks', () => {
      const input = 'מאי דכתיב? וכו';
      const result = splitHebrewText(input);
      expect(result).toContain('?\n');
    });

    it('should split on periods', () => {
      const input = 'כך אמר. ואח"כ';
      const result = splitHebrewText(input);
      expect(result).toContain('.\n');
    });

    it('should split on commas', () => {
      const input = 'ראשון, שני, שלישי';
      const result = splitHebrewText(input);
      const lines = result.split('\n');
      expect(lines.length).toBeGreaterThan(1);
    });

    it('should split on semicolons', () => {
      const input = 'חלק ראשון; חלק שני';
      const result = splitHebrewText(input);
      expect(result).toContain(';\n');
    });
  });

  describe('Hebrew Irony Punctuation', () => {
    it('should handle ?! as a unit', () => {
      const input = 'באמת?! כן';
      const result = splitHebrewText(input);
      expect(result).toContain('?!\n');
      expect(result).not.toContain('?\n!\n');
    });

    it('should NOT split ? when followed by !', () => {
      const input = 'כן?! לא';
      const result = splitHebrewText(input);
      expect(result).toContain('?!');
      // Should not have separate ? and !
      const lines = result.split('\n');
      expect(lines.some(line => line.endsWith('?'))).toBe(false);
    });
  });

  describe('Hebrew Special Characters', () => {
    it('should split on Hebrew quotation mark', () => {
      const input = 'אמר ״ שלום';
      const result = splitHebrewText(input);
      expect(result).toContain('״');
    });

    it('should split on SOF PASUQ (׃)', () => {
      const input = 'בראשית׃ ויהי';
      const result = splitHebrewText(input);
      expect(result).toContain('׃\n');
    });

    it('should split on M-dash', () => {
      const input = 'ראשון – שני';
      const result = splitHebrewText(input);
      expect(result).toContain('–\n');
    });

    it('should split on dash with spaces', () => {
      const input = 'כך - ככה';
      const result = splitHebrewText(input);
      expect(result).toContain(' - \n');
    });
  });

  describe('Hebrew Punctuation Clusters', () => {
    it('should NOT split on end quote + space + em-dash (Niddah 47a.9)', () => {
      const input = 'word״ — nextword';
      const result = splitHebrewText(input);
      // Should remain as one line, no split
      expect(result).toBe('word״ — nextword');
      expect(result).not.toContain('\n');
    });

    it('should NOT split on end quote + em-dash (no space)', () => {
      const input = 'word״— nextword';
      const result = splitHebrewText(input);
      expect(result).toBe('word״— nextword');
      expect(result).not.toContain('\n');
    });

    it('should NOT split on end quote + space + n-dash', () => {
      const input = 'word״ – nextword';
      const result = splitHebrewText(input);
      expect(result).toBe('word״ – nextword');
      expect(result).not.toContain('\n');
    });

    it('should split on standalone end quote (not followed by dash)', () => {
      const input = 'word״ nextword';
      const result = splitHebrewText(input);
      expect(result).toContain('״ \n');
    });

    it('should split on standalone em-dash (not preceded by end quote)', () => {
      const input = 'word — nextword';
      const result = splitHebrewText(input);
      expect(result).toContain('—\n');
    });
  });

  describe('Hebrew Text Cleanup', () => {
    it('should remove consecutive line breaks', () => {
      const input = 'אחד.\n\nשניים.';
      const result = splitHebrewText(input);
      expect(result).not.toContain('\n\n');
    });

    it('should trim whitespace', () => {
      const input = '  אמר רבי  ';
      const result = splitHebrewText(input);
      expect(result).toBe(result.trim());
    });

    it('should remove leading spaces on new lines', () => {
      const input = 'אחד.\n  שניים';
      const result = splitHebrewText(input);
      expect(result).not.toMatch(/\n\s+\w/);
    });
  });

  describe('Hebrew Edge Cases', () => {
    it('should handle empty string', () => {
      expect(splitHebrewText('')).toBe('');
    });

    it('should handle string with no punctuation', () => {
      const input = 'שלום עליכם';
      const result = splitHebrewText(input);
      expect(result).toBe('שלום עליכם');
    });
  });
});

describe('Term Replacement', () => {
  describe('Basic Term Replacements', () => {
    it('should replace GEMARA with Talmud', () => {
      expect(replaceTerms('The GEMARA says')).toContain('Talmud');
    });

    it('should replace Gemara with Talmud', () => {
      expect(replaceTerms('The Gemara says')).toContain('Talmud');
    });

    it('should replace Rabbi with R\'', () => {
      expect(replaceTerms('Rabbi Akiva')).toContain('R\' Akiva');
    });

    it('should replace The Sages taught with A baraita states', () => {
      expect(replaceTerms('The Sages taught this')).toContain('A baraita states');
    });

    it('should replace Divine Presence with Shekhina', () => {
      expect(replaceTerms('the Divine Presence descended')).toContain('Shekhina');
    });

    it('should replace the Holy One, Blessed be He with God', () => {
      expect(replaceTerms('the Holy One, Blessed be He, said')).toContain('God said');
    });
  });

  describe('Ordinal Number Replacements', () => {
    it('should replace third with 3rd', () => {
      expect(replaceTerms('the third day')).toContain('3rd');
    });

    it('should replace twenty-first with 21st', () => {
      expect(replaceTerms('the twenty-first century')).toContain('21st');
    });

    it('should replace thirty-third with 33rd', () => {
      expect(replaceTerms('the thirty-third year')).toContain('33rd');
    });

    it('should handle compound ordinals', () => {
      expect(replaceTerms('twenty-second')).toContain('22nd');
      expect(replaceTerms('twenty second')).toContain('22nd');
    });
  });

  describe('Sexual Term Replacements', () => {
    it('should replace engage in intercourse with have sex', () => {
      expect(replaceTerms('they engage in intercourse')).toContain('have sex');
    });

    it('should replace sexual relations with sex', () => {
      expect(replaceTerms('sexual relations')).toContain('sex');
    });

    it('should handle conjugations', () => {
      expect(replaceTerms('engages in intimacy')).toContain('has sex');
      expect(replaceTerms('engaged in sexual intercourse')).toContain('had sex');
      expect(replaceTerms('engaging in intercourse')).toContain('having sex');
    });
  });

  describe('Case Sensitivity', () => {
    it('should be case-insensitive for most terms', () => {
      expect(replaceTerms('gemara')).toContain('Talmud');
      expect(replaceTerms('RABBI')).toContain('R\'');
    });
  });
});

describe('Complete Processing Pipelines', () => {
  describe('processEnglishText', () => {
    it('should apply term replacement and splitting', () => {
      const input = 'The GEMARA says this. Rabbi Akiva agreed.';
      const result = processEnglishText(input);
      expect(result).toContain('Talmud');
      expect(result).toContain('R\'');
      expect(result).toContain('\n');
    });

    it('should normalize line endings', () => {
      const input = 'Line one.\r\nLine two.';
      const result = processEnglishText(input);
      expect(result).not.toContain('\r\n');
      expect(result).toContain('\n');
    });

    it('should handle multiple consecutive line breaks', () => {
      const input = 'Text.\n\n\n\nMore text.';
      const result = processEnglishText(input);
      expect(result).not.toContain('\n\n\n');
    });
  });

  describe('processHebrewText', () => {
    it('should remove nikud and split', () => {
      const input = 'שָׁלוֹם: עָלֵיכֶם';
      const result = processHebrewText(input);
      expect(result).not.toContain('\u05B0'); // No nikud
      expect(result).toContain(':'); // Colon preserved
    });

    it('should normalize whitespace', () => {
      const input = 'אחד.   שניים';
      const result = processHebrewText(input);
      expect(result).not.toContain('   ');
    });
  });
});

describe('Utility Functions', () => {
  describe('containsHebrew', () => {
    it('should detect Hebrew characters', () => {
      expect(containsHebrew('שלום')).toBe(true);
      expect(containsHebrew('אבגד')).toBe(true);
    });

    it('should return false for English text', () => {
      expect(containsHebrew('Hello world')).toBe(false);
    });

    it('should return false for numbers only', () => {
      expect(containsHebrew('12345')).toBe(false);
    });

    it('should detect Hebrew in mixed text', () => {
      expect(containsHebrew('Hello שלום world')).toBe(true);
    });
  });

  describe('normalizeApiText', () => {
    it('should join array with double newlines', () => {
      const input = ['First', 'Second', 'Third'];
      const expected = 'First\n\nSecond\n\nThird';
      expect(normalizeApiText(input)).toBe(expected);
    });

    it('should return string as-is', () => {
      const input = 'Just a string';
      expect(normalizeApiText(input)).toBe(input);
    });

    it('should handle empty array', () => {
      expect(normalizeApiText([])).toBe('');
    });

    it('should handle empty string', () => {
      expect(normalizeApiText('')).toBe('');
    });
  });
});

describe('Regression Tests - Known Issues', () => {
  it('should handle Megillah 11a section 1 correctly', () => {
    const input = 'from Hodu to Cush." Rav and Shmuel disagreed.';
    const result = splitEnglishText(input);
    expect(result).toBe('from Hodu to Cush."\nRav and Shmuel disagreed.');
  });

  it('should handle Megillah 11a section 22 correctly', () => {
    const input = 'detailed exposition," as it is stated.';
    const result = splitEnglishText(input);
    expect(result).toBe('detailed exposition,"\nas it is stated.');
  });

  it('should handle Berakhot 7b section 1 correctly', () => {
    const input = 'by what shall I know?\'" (Genesis';
    const result = splitEnglishText(input);
    expect(result).toContain('?\'"\n');
  });

  it('should handle Berakhot 7a section 36 correctly', () => {
    const input = 'There were 600,000 people.';
    const result = splitEnglishText(input);
    expect(result).toBe('There were 600,000 people.');
  });

  it('should handle Berakhot 7a section 3 HTML breaks', () => {
    const input = 'First part.<br>Second part.';
    const result = splitEnglishText(input);
    expect(result).toBe('First part.\nSecond part.');
  });

  it('should handle Berakhot 7b section 5 single quotes', () => {
    const input = "he said.' After";
    const result = splitEnglishText(input);
    expect(result).toBe("he said.'\nAfter");
  });
});
