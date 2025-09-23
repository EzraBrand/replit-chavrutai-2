#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// List of all biblical books from the GitHub repository
const biblicalBooks = [
  // Torah (Five Books of Moses)
  'Genesis',
  'Exodus', 
  'Leviticus_part1',
  'Leviticus_part2',
  'Numbers',
  'Deuteronomy_part1',
  'Deuteronomy_part2',
  
  // Nevi'im (Prophets)
  'Joshua',
  'Judges',
  '1_Samuel',
  '2_Samuel',
  '1_Kings',
  '2_Kings',
  'Isaiah',
  'Jeremiah',
  'Ezekiel',
  'Hosea',
  'Joel',
  'Amos',
  'Obadiah',
  'Jonah',
  'Micah',
  'Nahum',
  'Habakkuk',
  'Zephaniah',
  'Haggai',
  'Zechariah',
  'Malachi',
  
  // Ketuvim (Writings)
  'Psalms',
  'Proverbs',
  'Job',
  'Song_of_Songs',
  'Ruth',
  'Lamentations',
  'Ecclesiastes',
  'Esther',
  'Daniel',
  'Ezra',
  'Nehemiah',
  '1_Chronicles',
  '2_Chronicles'
];

// Expected chapter counts for validation
const expectedChapterCounts = {
  'Genesis': 50,
  'Exodus': 40,
  'Leviticus_part1': 14, // Chapters 1-14
  'Leviticus_part2': 13, // Chapters 15-27
  'Numbers': 36,
  'Deuteronomy_part1': 17, // Chapters 1-17
  'Deuteronomy_part2': 17, // Chapters 18-34
  'Joshua': 24,
  'Judges': 21,
  '1_Samuel': 31,
  '2_Samuel': 24,
  '1_Kings': 22,
  '2_Kings': 25,
  'Isaiah': 66,
  'Jeremiah': 52,
  'Ezekiel': 48,
  'Hosea': 14,
  'Joel': 3,
  'Amos': 9,
  'Obadiah': 1,
  'Jonah': 4,
  'Micah': 7,
  'Nahum': 3,
  'Habakkuk': 3,
  'Zephaniah': 3,
  'Haggai': 2,
  'Zechariah': 14,
  'Malachi': 4,
  'Psalms': 150,
  'Proverbs': 31,
  'Job': 42,
  'Song_of_Songs': 8,
  'Ruth': 4,
  'Lamentations': 5,
  'Ecclesiastes': 12,
  'Esther': 10,
  'Daniel': 12,
  'Ezra': 10,
  'Nehemiah': 13,
  '1_Chronicles': 29,
  '2_Chronicles': 36
};

async function fetchMarkdownFromGitHub(bookName) {
  const url = `https://raw.githubusercontent.com/EzraBrand/bible-rabbinic-index/main/docs/books/${bookName}.md`;
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.warn(`Failed to fetch ${bookName}: ${response.status}`);
      return null;
    }
    return await response.text();
  } catch (error) {
    console.error(`Error fetching ${bookName}:`, error.message);
    return null;
  }
}

function extractCitationsFromTable(tableNode) {
  const citations = [];
  
  // Find table rows (skip header row)
  if (tableNode.children && tableNode.children.length > 1) {
    for (let i = 1; i < tableNode.children.length; i++) {
      const row = tableNode.children[i];
      if (row.type === 'tableRow' && row.children && row.children.length >= 4) {
        const cells = row.children;
        
        // Extract text content from each cell
        const verseLocation = extractTextFromNode(cells[0]);
        const verseText = extractTextFromNode(cells[1]);
        const talmudLocationCell = extractTextFromNode(cells[2], true); // Preserve links
        const talmudFullText = extractTextFromNode(cells[3], true); // Preserve HTML
        
        // Extract the Talmud location and URL from markdown link
        const linkMatch = talmudLocationCell.match(/\[([^\]]+)\]\(([^)]+)\)/);
        if (linkMatch) {
          const talmudLocation = linkMatch[1];
          const talmudLocationUrl = linkMatch[2];
          
          citations.push({
            verseLocation: verseLocation.trim(),
            verseText: verseText.trim(),
            talmudLocation: talmudLocation.trim(),
            talmudLocationUrl: talmudLocationUrl.trim(),
            talmudFullText: talmudFullText.trim()
          });
        }
      }
    }
  }
  
  return citations;
}

function extractTextFromNode(node, preserveFormatting = false) {
  if (!node) return '';
  
  if (node.type === 'text') {
    return node.value;
  }
  
  if (node.type === 'strong' && preserveFormatting) {
    const content = node.children ? node.children.map(child => extractTextFromNode(child, preserveFormatting)).join('') : '';
    return `<b>${content}</b>`;
  }
  
  if (node.type === 'emphasis' && preserveFormatting) {
    const content = node.children ? node.children.map(child => extractTextFromNode(child, preserveFormatting)).join('') : '';
    return `<i>${content}</i>`;
  }
  
  if (node.type === 'link' && preserveFormatting) {
    const content = node.children ? node.children.map(child => extractTextFromNode(child, preserveFormatting)).join('') : '';
    return `[${content}](${node.url})`;
  }
  
  if (node.children) {
    return node.children.map(child => extractTextFromNode(child, preserveFormatting)).join('');
  }
  
  return '';
}

function parseMarkdownWithRemark(markdownContent, bookName) {
  console.log(`Parsing ${bookName} with remark...`);
  
  const processor = unified()
    .use(remarkParse)
    .use(remarkGfm);
  
  const tree = processor.parse(markdownContent);
  
  // Extract total entries from the first paragraph if available
  const totalEntriesMatch = markdownContent.match(/contains (\d+) entries/);
  const totalEntries = totalEntriesMatch ? parseInt(totalEntriesMatch[1]) : 0;
  
  const chapters = [];
  let currentChapter = null;
  
  function walkTree(node) {
    if (node.type === 'heading' && node.depth === 2) {
      // Look for chapter headers: "## Chapter X"
      const headingText = extractTextFromNode(node);
      const chapterMatch = headingText.match(/Chapter\s+(\d+)/i);
      
      if (chapterMatch) {
        // Save previous chapter if exists
        if (currentChapter) {
          chapters.push(currentChapter);
        }
        
        currentChapter = {
          chapterNumber: parseInt(chapterMatch[1]),
          citations: []
        };
        console.log(`  Found Chapter ${chapterMatch[1]}`);
      }
    } else if (node.type === 'table' && currentChapter) {
      // Extract citations from this table
      const tableCitations = extractCitationsFromTable(node);
      currentChapter.citations.push(...tableCitations);
      console.log(`    Added ${tableCitations.length} citations to Chapter ${currentChapter.chapterNumber}`);
    }
    
    // Recursively process children
    if (node.children) {
      node.children.forEach(walkTree);
    }
  }
  
  walkTree(tree);
  
  // Add the last chapter
  if (currentChapter) {
    chapters.push(currentChapter);
  }
  
  console.log(`  Parsed ${chapters.length} chapters with ${chapters.reduce((sum, ch) => sum + ch.citations.length, 0)} total citations`);
  
  return {
    bookName: bookName.replace(/_/g, ' '), // Convert underscores to spaces for display
    totalEntries: Math.max(totalEntries, chapters.reduce((sum, ch) => sum + ch.citations.length, 0)),
    chapters
  };
}

async function processAllBooks() {
  console.log('Starting to process biblical index files with robust parsing...');
  
  // Ensure the output directory exists
  const outputDir = path.join(__dirname, '..', 'talmud-data', 'biblical-index');
  await fs.mkdir(outputDir, { recursive: true });
  
  const processedBooks = [];
  const validationErrors = [];
  
  for (const bookName of biblicalBooks) {
    console.log(`\nProcessing ${bookName}...`);
    
    const markdownContent = await fetchMarkdownFromGitHub(bookName);
    if (!markdownContent) {
      console.warn(`Skipping ${bookName} - could not fetch content`);
      continue;
    }
    
    const bookData = parseMarkdownWithRemark(markdownContent, bookName);
    
    // Validation
    const expectedChapters = expectedChapterCounts[bookName];
    if (expectedChapters && bookData.chapters.length < expectedChapters * 0.8) {
      validationErrors.push(`${bookName}: Expected ~${expectedChapters} chapters, got ${bookData.chapters.length}`);
    }
    
    if (bookData.totalEntries === 0) {
      validationErrors.push(`${bookName}: No citations found (0 entries)`);
    }
    
    // Save individual book file
    const filename = `${bookName.toLowerCase()}.json`;
    const filepath = path.join(outputDir, filename);
    await fs.writeFile(filepath, JSON.stringify(bookData, null, 2));
    
    processedBooks.push(bookName);
    console.log(`✓ Saved ${bookName} with ${bookData.totalEntries} entries across ${bookData.chapters.length} chapters`);
  }
  
  // Create index file based on actually processed books
  const indexData = {
    description: "Biblical Citations in the Talmud - Index of all available books",
    totalBooks: processedBooks.length,
    books: processedBooks.map(book => ({
      filename: `${book.toLowerCase()}.json`,
      displayName: book.replace(/_/g, ' ')
    })),
    categories: {
      torah: ['Genesis', 'Exodus', 'Leviticus_part1', 'Leviticus_part2', 'Numbers', 'Deuteronomy_part1', 'Deuteronomy_part2'].filter(book => processedBooks.includes(book)),
      neviim: ['Joshua', 'Judges', '1_Samuel', '2_Samuel', '1_Kings', '2_Kings', 'Isaiah', 'Jeremiah', 'Ezekiel', 'Hosea', 'Joel', 'Amos', 'Obadiah', 'Jonah', 'Micah', 'Nahum', 'Habakkuk', 'Zephaniah', 'Haggai', 'Zechariah', 'Malachi'].filter(book => processedBooks.includes(book)),
      ketuvim: ['Psalms', 'Proverbs', 'Job', 'Song_of_Songs', 'Ruth', 'Lamentations', 'Ecclesiastes', 'Esther', 'Daniel', 'Ezra', 'Nehemiah', '1_Chronicles', '2_Chronicles'].filter(book => processedBooks.includes(book))
    }
  };
  
  await fs.writeFile(
    path.join(outputDir, 'index.json'), 
    JSON.stringify(indexData, null, 2)
  );
  
  console.log(`\n✅ Processing complete!`);
  console.log(`📚 Processed ${processedBooks.length} books`);
  console.log(`📁 Files saved to: talmud-data/biblical-index/`);
  
  if (validationErrors.length > 0) {
    console.log(`\n⚠️  Validation warnings:`);
    validationErrors.forEach(error => console.log(`   ${error}`));
  }
  
  return { processedBooks, validationErrors };
}

// Run if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  processAllBooks().catch(console.error);
}

export { processAllBooks, biblicalBooks };