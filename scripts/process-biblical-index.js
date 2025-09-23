#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

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

function parseMarkdownTable(markdownContent, bookName) {
  const lines = markdownContent.split('\n');
  
  // Extract total entries from the first line if available
  const totalEntriesMatch = markdownContent.match(/contains (\d+) entries/);
  const totalEntries = totalEntriesMatch ? parseInt(totalEntriesMatch[1]) : 0;
  
  const chapters = [];
  let currentChapter = null;
  let inTable = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Check for chapter headers
    const chapterMatch = line.match(/^## Chapter (\d+)$/);
    if (chapterMatch) {
      if (currentChapter) {
        chapters.push(currentChapter);
      }
      currentChapter = {
        chapterNumber: parseInt(chapterMatch[1]),
        citations: []
      };
      inTable = false;
      continue;
    }
    
    // Check for table header
    if (line.includes('Bible Verse Location') && line.includes('Talmud Location')) {
      inTable = true;
      i++; // Skip the separator line
      continue;
    }
    
    // Parse table rows
    if (inTable && line.startsWith('|') && currentChapter) {
      const columns = line.split('|').map(col => col.trim()).filter(col => col !== '');
      
      if (columns.length >= 4) {
        const verseLocation = columns[0];
        const verseText = columns[1];
        const talmudLocationCell = columns[2];
        const talmudFullText = columns[3];
        
        // Extract the Talmud location and URL from markdown link format
        // Format: [Chagigah 12a:16](https://chavrutai.com/tractate/chagigah/12a#section-16)
        const linkMatch = talmudLocationCell.match(/\[([^\]]+)\]\(([^)]+)\)/);
        if (linkMatch) {
          const talmudLocation = linkMatch[1];
          const talmudLocationUrl = linkMatch[2];
          
          currentChapter.citations.push({
            verseLocation,
            verseText,
            talmudLocation,
            talmudLocationUrl,
            talmudFullText: talmudFullText.replace(/<[^>]*>/g, '') // Remove HTML tags
          });
        }
      }
    }
    
    // Reset table flag if we hit an empty line or new section
    if (inTable && (line === '' || line.startsWith('#'))) {
      inTable = false;
    }
  }
  
  // Add the last chapter
  if (currentChapter) {
    chapters.push(currentChapter);
  }
  
  return {
    bookName: bookName.replace(/_/g, ' '), // Convert underscores to spaces for display
    totalEntries,
    chapters
  };
}

async function processAllBooks() {
  console.log('Starting to process biblical index files...');
  
  // Ensure the output directory exists
  const outputDir = path.join(__dirname, '..', 'talmud-data', 'biblical-index');
  await fs.mkdir(outputDir, { recursive: true });
  
  const processedBooks = [];
  
  for (const bookName of biblicalBooks) {
    console.log(`Processing ${bookName}...`);
    
    const markdownContent = await fetchMarkdownFromGitHub(bookName);
    if (!markdownContent) {
      console.warn(`Skipping ${bookName} - could not fetch content`);
      continue;
    }
    
    const bookData = parseMarkdownTable(markdownContent, bookName);
    
    // Save individual book file
    const filename = `${bookName.toLowerCase()}.json`;
    const filepath = path.join(outputDir, filename);
    await fs.writeFile(filepath, JSON.stringify(bookData, null, 2));
    
    processedBooks.push(bookName);
    console.log(`✓ Saved ${bookName} with ${bookData.totalEntries} entries across ${bookData.chapters.length} chapters`);
  }
  
  // Create index file
  const indexData = {
    description: "Biblical Citations in the Talmud - Index of all available books",
    totalBooks: processedBooks.length,
    books: processedBooks.map(book => ({
      filename: `${book.toLowerCase()}.json`,
      displayName: book.replace(/_/g, ' ')
    })),
    categories: {
      torah: ['Genesis', 'Exodus', 'Leviticus_part1', 'Leviticus_part2', 'Numbers', 'Deuteronomy_part1', 'Deuteronomy_part2'],
      neviim: ['Joshua', 'Judges', '1_Samuel', '2_Samuel', '1_Kings', '2_Kings', 'Isaiah', 'Jeremiah', 'Ezekiel', 'Hosea', 'Joel', 'Amos', 'Obadiah', 'Jonah', 'Micah', 'Nahum', 'Habakkuk', 'Zephaniah', 'Haggai', 'Zechariah', 'Malachi'],
      ketuvim: ['Psalms', 'Proverbs', 'Job', 'Song_of_Songs', 'Ruth', 'Lamentations', 'Ecclesiastes', 'Esther', 'Daniel', 'Ezra', 'Nehemiah', '1_Chronicles', '2_Chronicles']
    }
  };
  
  await fs.writeFile(
    path.join(outputDir, 'index.json'), 
    JSON.stringify(indexData, null, 2)
  );
  
  console.log(`\n✅ Processing complete!`);
  console.log(`📚 Processed ${processedBooks.length} books`);
  console.log(`📁 Files saved to: talmud-data/biblical-index/`);
}

// Run if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  processAllBooks().catch(console.error);
}

export { processAllBooks, biblicalBooks };