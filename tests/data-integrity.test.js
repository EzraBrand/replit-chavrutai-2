#!/usr/bin/env node
/**
 * Data Integrity Testing Suite
 * Validates that all tractate data is properly set up and accessible
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');

// Color output helpers
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

class DataIntegrityTester {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.passed = 0;
    this.failed = 0;
  }

  error(message) {
    this.errors.push(message);
    this.failed++;
    log('red', `✗ ${message}`);
  }

  warning(message) {
    this.warnings.push(message);
    log('yellow', `⚠ ${message}`);
  }

  pass(message) {
    this.passed++;
    log('green', `✓ ${message}`);
  }

  info(message) {
    log('blue', `ℹ ${message}`);
  }

  async loadTractateList() {
    try {
      const tractatesPath = path.join(projectRoot, 'shared', 'tractates.ts');
      const content = fs.readFileSync(tractatesPath, 'utf8');
      
      // Extract Talmud Bavli tractate list from TRACTATE_LISTS
      const talmudBavliMatch = content.match(/"Talmud Bavli":\s*\[([\s\S]*?)\]/);
      if (!talmudBavliMatch) {
        throw new Error('Could not find "Talmud Bavli" array in tractates.ts');
      }
      
      const tractateStrings = talmudBavliMatch[1].match(/"([^"]+)"/g);
      if (!tractateStrings) {
        throw new Error('Could not extract tractate names from Talmud Bavli array');
      }
      
      return tractateStrings.map(s => s.replace(/"/g, ''));
    } catch (error) {
      this.error(`Failed to load tractate list: ${error.message}`);
      return [];
    }
  }

  async testChapterDataFiles() {
    this.info('Testing chapter data files...');
    
    const tractates = await this.loadTractateList();
    const chaptersDir = path.join(projectRoot, 'talmud-data', 'chapters');
    
    if (!fs.existsSync(chaptersDir)) {
      this.error('Chapters directory does not exist');
      return;
    }

    const existingFiles = fs.readdirSync(chaptersDir)
      .filter(file => file.endsWith('.json'))
      .map(file => file.replace('.json', ''));

    // Check each tractate has a corresponding file
    for (const tractate of tractates) {
      const expectedFile = tractate.toLowerCase().replace(/\s+/g, '-');
      const alternativeFile = tractate.toLowerCase().replace(/\s+/g, ' ');
      
      const hasFile = existingFiles.some(file => 
        file === expectedFile || 
        file === alternativeFile ||
        file === tractate.toLowerCase()
      );

      if (hasFile) {
        this.pass(`Chapter data file exists for ${tractate}`);
      } else {
        this.error(`Missing chapter data file for tractate: ${tractate}`);
      }
    }

    // Check for orphaned files
    for (const file of existingFiles) {
      if (file === 'loader') continue; // Skip loader.ts
      
      const matchesTractate = tractates.some(tractate => {
        const variations = [
          tractate.toLowerCase().replace(/\s+/g, '-'),
          tractate.toLowerCase().replace(/\s+/g, ' '),
          tractate.toLowerCase()
        ];
        return variations.includes(file);
      });

      if (!matchesTractate) {
        this.warning(`Orphaned chapter data file: ${file}.json`);
      }
    }
  }

  async testChapterDataStructure() {
    this.info('Testing chapter data structure...');
    
    const chaptersDir = path.join(projectRoot, 'talmud-data', 'chapters');
    const files = fs.readdirSync(chaptersDir).filter(file => 
      file.endsWith('.json') && file !== 'loader.ts'
    );

    for (const file of files) {
      const filePath = path.join(chaptersDir, file);
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        const data = JSON.parse(content);

        if (!Array.isArray(data)) {
          this.error(`${file}: Expected array, got ${typeof data}`);
          continue;
        }

        if (data.length === 0) {
          this.error(`${file}: Empty chapter data (0 chapters)`);
          continue;
        }

        // Validate structure of each chapter
        let validChapters = 0;
        for (const chapter of data) {
          const requiredFields = ['number', 'englishName', 'hebrewName', 'startFolio', 'startSide', 'endFolio', 'endSide'];
          const hasAllFields = requiredFields.every(field => chapter.hasOwnProperty(field));
          
          if (hasAllFields) {
            validChapters++;
          } else {
            this.error(`${file}: Chapter ${chapter.number || 'unknown'} missing required fields`);
          }
        }

        if (validChapters === data.length) {
          this.pass(`${file}: All ${data.length} chapters have valid structure`);
        }

      } catch (error) {
        this.error(`${file}: Failed to parse JSON - ${error.message}`);
      }
    }
  }

  async testChapterDataMapping() {
    this.info('Testing chapter data mapping in chapter-data.ts...');
    
    const chapterDataPath = path.join(projectRoot, 'client', 'src', 'lib', 'chapter-data.ts');
    
    try {
      const content = fs.readFileSync(chapterDataPath, 'utf8');
      const tractates = await this.loadTractateList();

      // Check imports
      for (const tractate of tractates) {
        const expectedImportName = tractate.toLowerCase().replace(/\s+/g, '') + 'Data';
        const importPattern = new RegExp(`import\\s+${expectedImportName}\\s+from`, 'i');
        
        if (content.match(importPattern)) {
          this.pass(`Import found for ${tractate}`);
        } else {
          // Check alternative import patterns
          const alternativePattern = new RegExp(`import\\s+\\w*${tractate.toLowerCase().replace(/\s+/g, '')}\\w*Data\\s+from`, 'i');
          if (content.match(alternativePattern)) {
            this.pass(`Alternative import found for ${tractate}`);
          } else {
            this.error(`Missing import for ${tractate} in chapter-data.ts`);
          }
        }
      }

      // Check JSON_CHAPTER_DATA mappings
      const registryMatch = content.match(/const JSON_CHAPTER_DATA[\s\S]*?}/);
      if (registryMatch) {
        const registryContent = registryMatch[0];
        
        for (const tractate of tractates) {
          const tractateKey = tractate.toLowerCase().replace(/\s+/g, ' ');
          const mappingPattern = new RegExp(`['"]${tractateKey}['"]\\s*:`);
          
          if (registryContent.match(mappingPattern)) {
            this.pass(`Mapping found for ${tractate}`);
          } else {
            this.error(`Missing mapping for ${tractate} in JSON_CHAPTER_DATA`);
          }
        }
      } else {
        this.error('Could not find JSON_CHAPTER_DATA registry in chapter-data.ts');
      }

    } catch (error) {
      this.error(`Failed to read chapter-data.ts: ${error.message}`);
    }
  }

  async testNoZeroChapterIssues() {
    this.info('Testing for zero-chapter issues...');
    
    try {
      // We'll simulate the chapter data loading process
      const chaptersDir = path.join(projectRoot, 'talmud-data', 'chapters');
      const tractates = await this.loadTractateList();

      for (const tractate of tractates) {
        const tractateKey = tractate.toLowerCase().replace(/\s+/g, ' ');
        
        // Try to find the corresponding file
        const possibleFiles = [
          path.join(chaptersDir, `${tractate.toLowerCase().replace(/\s+/g, '-')}.json`),
          path.join(chaptersDir, `${tractate.toLowerCase()}.json`),
          path.join(chaptersDir, `${tractate.toLowerCase().replace(/\s+/g, '')}.json`)
        ];

        let found = false;
        for (const filePath of possibleFiles) {
          if (fs.existsSync(filePath)) {
            try {
              const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
              if (Array.isArray(data) && data.length > 0) {
                this.pass(`${tractate}: ${data.length} chapters found`);
              } else {
                this.error(`${tractate}: 0 chapters found (empty or invalid data)`);
              }
              found = true;
              break;
            } catch (error) {
              this.error(`${tractate}: Failed to parse chapter data - ${error.message}`);
              found = true;
              break;
            }
          }
        }

        if (!found) {
          this.error(`${tractate}: No chapter data file found`);
        }
      }

    } catch (error) {
      this.error(`Failed to test zero-chapter issues: ${error.message}`);
    }
  }

  async runAllTests() {
    console.log('\n' + '='.repeat(60));
    log('blue', 'ChavrutAI Data Integrity Test Suite');
    console.log('='.repeat(60) + '\n');

    await this.testChapterDataFiles();
    console.log();
    await this.testChapterDataStructure();
    console.log();
    await this.testChapterDataMapping();
    console.log();
    await this.testNoZeroChapterIssues();

    // Summary
    console.log('\n' + '='.repeat(60));
    log('blue', 'Test Summary');
    console.log('='.repeat(60));
    
    log('green', `✓ Passed: ${this.passed}`);
    log('red', `✗ Failed: ${this.failed}`);
    log('yellow', `⚠ Warnings: ${this.warnings.length}`);

    if (this.errors.length > 0) {
      console.log('\nErrors:');
      this.errors.forEach((error, i) => {
        log('red', `  ${i + 1}. ${error}`);
      });
    }

    if (this.warnings.length > 0) {
      console.log('\nWarnings:');
      this.warnings.forEach((warning, i) => {
        log('yellow', `  ${i + 1}. ${warning}`);
      });
    }

    console.log();
    return this.failed === 0;
  }
}

// Run tests if this script is called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const tester = new DataIntegrityTester();
  tester.runAllTests().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('Test runner failed:', error);
    process.exit(1);
  });
}

export default DataIntegrityTester;