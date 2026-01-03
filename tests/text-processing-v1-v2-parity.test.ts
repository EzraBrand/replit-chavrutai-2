import { describe, it, expect, beforeAll, vi } from 'vitest';

const testCases = {
  termReplacements: [
    'Rabbi Akiva said to Rabbi Yehuda',
    'The Gemara states that the GEMARA is correct',
    'The Sages taught in a baraita: the law is',
    'The Divine Presence rested upon them',
    'He wore his phylacteries on his head',
    'A gentile came to the gentiles',
    'The maidservant brought the barrels',
    'the Holy One, Blessed be He, said',
    'Master of the Universe, help us',
    'the third day of the fifth month',
    'one-third of the twenty-first portion',
    'engage in sexual intercourse with her',
    'Rabbi, help me with this mishna',
    'The Rabbis disagreed about ritual fringes',
    'divine inspiration came upon him',
    'generation of the flood and the dispersion',
  ],
  
  englishSplitting: [
    'First sentence. Second sentence. Third sentence.',
    'Is this true? Yes it is. But why?',
    'Part one; part two; part three.',
    'This is correct, i.e. it is true.',
    'Fruits, e.g. apples, oranges, etc. are healthy.',
    'Rabbi Yosef, son of Rabbi Hiyya, said: The law is...',
    '<b>MISHNA:</b> The text begins here.',
    '<strong>He said,</strong> "Yes."',
    'The text says... and continues.',
    'He asked "why?" and she replied "because."',
    '<br>New line here<br/>And another.',
    'Long text with multiple periods. Each one splits. Like this.',
  ],
  
  hebrewProcessing: [
    'שָׁלוֹם עוֹלָם. בְּרָכָה.',
    'מתני׳ מאימתי קורין את שמע',
    'גמ׳ מנא הני מילי',
    '<strong><big>מתני׳</big></strong> פרק ראשון',
    'אמר רבי יהודה: הלכה כמותו.',
    'טקסט עם   רווחים   מרובים',
    '״ציטוט״ ועוד טקסט.',
    'שאלה?! ותשובה.',
  ],

  fullPipeline: [
    '<b>Rabbi Akiva</b> said: The law is. <b>Rabbi Yehuda</b> disagrees.',
    'The Sages taught</strong> in a <em>baraita</em>: One who has sexual intercourse...',
    'First, he said. Second, she replied? Third; they agreed.',
    'The gentile brought phylacteries on the third day.',
    'Rabbi, son of Rabbi Yehuda, said: The Divine Presence rested.',
  ],

  edgeCases: [
    '',
    '   ',
    'No special terms here.',
    '.',
    '?',
    ';',
    '<b></b>',
  ]
};

interface TextProcessingModule {
  replaceTerms: (text: string) => string;
  splitEnglishText: (text: string) => string;
  splitHebrewText: (text: string) => string;
  processHebrewTextCore: (text: string) => string;
  processEnglishText: (text: string) => string;
  TEXT_PROCESSING_VERSION: string;
}

const originalEnv = process.env.TEXT_PIPELINE;

async function loadModuleWithPipeline(version: 'v1' | 'v2'): Promise<TextProcessingModule> {
  vi.resetModules();
  
  process.env.TEXT_PIPELINE = version;
  
  const module = await import('../shared/text-processing');
  
  const result = {
    replaceTerms: module.replaceTerms.bind(null),
    splitEnglishText: module.splitEnglishText.bind(null),
    splitHebrewText: module.splitHebrewText.bind(null),
    processHebrewTextCore: module.processHebrewTextCore.bind(null),
    processEnglishText: module.processEnglishText.bind(null),
    TEXT_PROCESSING_VERSION: module.TEXT_PROCESSING_VERSION,
  };
  
  process.env.TEXT_PIPELINE = originalEnv;
  
  return result;
}

describe('V1 vs V2 Parity Tests', () => {
  let v1Module: TextProcessingModule;
  let v2Module: TextProcessingModule;
  
  beforeAll(async () => {
    v1Module = await loadModuleWithPipeline('v1');
    v2Module = await loadModuleWithPipeline('v2');
    
    console.log('V1 version:', v1Module.TEXT_PROCESSING_VERSION);
    console.log('V2 version:', v2Module.TEXT_PROCESSING_VERSION);
  });

  describe('Version verification', () => {
    it('loads V1 module correctly', () => {
      expect(v1Module.TEXT_PROCESSING_VERSION).toBe('v1');
    });
    
    it('loads V2 module correctly', () => {
      expect(v2Module.TEXT_PROCESSING_VERSION).toBe('v2');
    });
    
    it('V1 and V2 are distinct module instances', () => {
      expect(v1Module.TEXT_PROCESSING_VERSION).not.toBe(v2Module.TEXT_PROCESSING_VERSION);
    });
  });

  describe('replaceTerms parity', () => {
    testCases.termReplacements.forEach((input, index) => {
      it(`case ${index + 1}: "${input.substring(0, 40)}..."`, () => {
        const v1Result = v1Module.replaceTerms(input);
        const v2Result = v2Module.replaceTerms(input);
        
        expect(v2Result).toBe(v1Result);
      });
    });
  });

  describe('splitEnglishText parity', () => {
    testCases.englishSplitting.forEach((input, index) => {
      it(`case ${index + 1}: "${input.substring(0, 40)}..."`, () => {
        const v1Result = v1Module.splitEnglishText(input);
        const v2Result = v2Module.splitEnglishText(input);
        
        expect(v2Result).toBe(v1Result);
      });
    });
  });

  describe('processHebrewTextCore parity', () => {
    testCases.hebrewProcessing.forEach((input, index) => {
      it(`case ${index + 1}`, () => {
        const v1Result = v1Module.processHebrewTextCore(input);
        const v2Result = v2Module.processHebrewTextCore(input);
        
        expect(v2Result).toBe(v1Result);
      });
    });
  });

  describe('processEnglishText full pipeline parity', () => {
    testCases.fullPipeline.forEach((input, index) => {
      it(`case ${index + 1}`, () => {
        const v1Result = v1Module.processEnglishText(input);
        const v2Result = v2Module.processEnglishText(input);
        
        expect(v2Result).toBe(v1Result);
      });
    });
  });

  describe('Edge cases parity', () => {
    testCases.edgeCases.forEach((input, index) => {
      it(`case ${index + 1}: "${input}"`, () => {
        const v1English = v1Module.processEnglishText(input);
        const v2English = v2Module.processEnglishText(input);
        expect(v2English).toBe(v1English);
        
        const v1Hebrew = v1Module.processHebrewTextCore(input);
        const v2Hebrew = v2Module.processHebrewTextCore(input);
        expect(v2Hebrew).toBe(v1Hebrew);
      });
    });
  });
});

describe('Specific Term Replacement Accuracy', () => {
  let v1Module: TextProcessingModule;
  let v2Module: TextProcessingModule;
  
  beforeAll(async () => {
    v1Module = await loadModuleWithPipeline('v1');
    v2Module = await loadModuleWithPipeline('v2');
  });
  
  const specificTests = [
    { input: 'Rabbi Akiva', expected: "R' Akiva" },
    { input: 'Gemara', expected: 'Talmud' },
    { input: 'GEMARA', expected: 'Talmud' },
    { input: 'phylacteries', expected: 'tefillin' },
    { input: 'gentile', expected: 'non-Jew' },
    { input: 'gentiles', expected: 'non-Jews' },
    { input: 'Divine Presence', expected: 'Shekhina' },
    { input: 'Divine Voice', expected: 'bat kol' },
    { input: 'third', expected: '3rd' },
    { input: 'twentieth', expected: '20th' },
    { input: 'twenty-first', expected: '21st' },
    { input: 'one-third', expected: '1/3rd' },
    { input: 'two-thirds', expected: '2/3rds' },
    { input: 'the Holy One, Blessed be He', expected: 'God' },
    { input: 'Master of the Universe', expected: 'God!' },
    { input: 'ritual fringes', expected: 'tzitzit' },
    { input: 'ritual bath', expected: 'mikveh' },
    { input: 'engage in sexual intercourse', expected: 'have sex' },
  ];
  
  specificTests.forEach(({ input, expected }) => {
    it(`V1: "${input}" -> "${expected}"`, () => {
      const result = v1Module.replaceTerms(input);
      expect(result).toContain(expected);
    });
    
    it(`V2: "${input}" -> "${expected}"`, () => {
      const result = v2Module.replaceTerms(input);
      expect(result).toContain(expected);
    });
    
    it(`Parity: "${input}"`, () => {
      const v1Result = v1Module.replaceTerms(input);
      const v2Result = v2Module.replaceTerms(input);
      expect(v2Result).toBe(v1Result);
    });
  });
});

describe('HTML Preservation Parity', () => {
  let v1Module: TextProcessingModule;
  let v2Module: TextProcessingModule;
  
  beforeAll(async () => {
    v1Module = await loadModuleWithPipeline('v1');
    v2Module = await loadModuleWithPipeline('v2');
  });
  
  const htmlTests = [
    '<b>Bold text</b>',
    '<strong>Strong text</strong>',
    '<i>Italic</i>',
    '<em>Emphasis</em>',
    '<b>Bold. With period.</b>',
    '<span class="test">Span content</span>',
  ];
  
  htmlTests.forEach((input) => {
    it(`preserves HTML in: ${input}`, () => {
      const v1English = v1Module.splitEnglishText(input);
      const v2English = v2Module.splitEnglishText(input);
      expect(v2English).toBe(v1English);
      
      const v1Hebrew = v1Module.splitHebrewText(input);
      const v2Hebrew = v2Module.splitHebrewText(input);
      expect(v2Hebrew).toBe(v1Hebrew);
    });
  });
});

describe('Regression Tests', () => {
  let v1Module: TextProcessingModule;
  let v2Module: TextProcessingModule;
  
  beforeAll(async () => {
    v1Module = await loadModuleWithPipeline('v1');
    v2Module = await loadModuleWithPipeline('v2');
  });

  describe('Bug #40: baraita double replacement', () => {
    const text = 'The Sages taught in a baraita: The rule is...';
    
    it('V1 does not produce "A baraita states in a baraita"', () => {
      const result = v1Module.replaceTerms(text);
      expect(result).not.toContain('A baraita states in a baraita');
      expect(result).toContain('A baraita states');
    });
    
    it('V2 does not produce "A baraita states in a baraita"', () => {
      const result = v2Module.replaceTerms(text);
      expect(result).not.toContain('A baraita states in a baraita');
      expect(result).toContain('A baraita states');
    });
    
    it('V1 and V2 produce same output', () => {
      const v1Result = v1Module.replaceTerms(text);
      const v2Result = v2Module.replaceTerms(text);
      expect(v2Result).toBe(v1Result);
    });
  });

  describe('Bug #40: italic baraita', () => {
    const text = 'The Sages taught in a <i>baraita</i>: The rule';
    
    it('V1 handles italic baraita correctly', () => {
      const result = v1Module.replaceTerms(text);
      expect(result).not.toContain('in a');
    });
    
    it('V2 handles italic baraita correctly', () => {
      const result = v2Module.replaceTerms(text);
      expect(result).not.toContain('in a');
    });
    
    it('V1 and V2 produce same output', () => {
      const v1Result = v1Module.replaceTerms(text);
      const v2Result = v2Module.replaceTerms(text);
      expect(v2Result).toBe(v1Result);
    });
  });

  describe('Bug #78: etc. followed by comma', () => {
    const text = 'apples, oranges, etc., and more.';
    
    it('V1 does not split etc. when followed by comma', () => {
      const result = v1Module.splitEnglishText(text);
      expect(result).toContain('etc.,');
    });
    
    it('V2 does not split etc. when followed by comma', () => {
      const result = v2Module.splitEnglishText(text);
      expect(result).toContain('etc.,');
    });
    
    it('V1 and V2 produce same output', () => {
      const v1Result = v1Module.splitEnglishText(text);
      const v2Result = v2Module.splitEnglishText(text);
      expect(v2Result).toBe(v1Result);
    });
  });
});
