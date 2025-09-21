import fs from 'fs';
import path from 'path';

// Traditional tractate order from the codebase
const TRACTATE_ORDER = {
  // Seder Zeraim
  'Berakhot': 1,
  
  // Seder Moed  
  'Shabbat': 2,
  'Eruvin': 3,
  'Pesachim': 4,
  'Rosh_Hashanah': 5,
  'Yoma': 6,
  'Sukkah': 7,
  'Beitza': 8,
  'Taanit': 9,
  'Megillah': 10,
  'Moed_Katan': 11,
  'Chagigah': 12,
  
  // Seder Nashim
  'Yevamot': 13,
  'Ketubot': 14,
  'Nedarim': 15,
  'Nazir': 16,
  'Sotah': 17,
  'Gittin': 18,
  'Kiddushin': 19,
  
  // Seder Nezikin
  'Bava_Kamma': 20,
  'Bava_Metzia': 21,
  'Bava_Batra': 22,
  'Sanhedrin': 23,
  'Makkot': 24,
  'Shevuot': 25,
  'Avodah_Zarah': 26,
  'Horayot': 27,
  
  // Seder Kodashim
  'Zevachim': 28,
  'Menachot': 29,
  'Chullin': 30,
  'Bekhorot': 31,
  'Arachin': 32,
  'Temurah': 33,
  'Keritot': 34,
  'Meilah': 35,
  'Tamid': 36,
  'Middot': 37,
  'Kinnim': 38,
  
  // Seder Tohorot
  'Niddah': 39
};

function parseCSV(csvText) {
  const lines = csvText.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim());
  const data = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const values = parseCSVLine(line);
    
    if (values.length >= 4) {
      const entry = {
        title: values[0].replace(/^"(.*)"$/, '$1').trim(),
        talmudLocation: values[1].trim(),
        fullBlogUrl: values[2].trim(),
        caiHyperlink: values[3].trim()
      };
      data.push(entry);
    }
  }
  
  return data;
}

function parseCSVLine(line) {
  const values = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"' && (i === 0 || line[i-1] === ',')) {
      inQuotes = true;
    } else if (char === '"' && inQuotes && (i === line.length - 1 || line[i+1] === ',')) {
      inQuotes = false;
    } else if (char === ',' && !inQuotes) {
      values.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  
  values.push(current);
  return values;
}

function extractTractateInfo(talmudLocation) {
  // Parse location like "Horayot.11b.7-12a.14" or "Rosh_Hashanah.10b.10-12a.9"
  const parts = talmudLocation.split('.');
  const tractate = parts[0];
  
  // Extract page info for sorting
  let startPage = '';
  let startSection = '';
  
  if (parts.length >= 3) {
    const pageAndSection = parts[1] + '.' + parts[2];
    const match = pageAndSection.match(/^(\d+)([ab])\.(\d+)/);
    if (match) {
      startPage = parseInt(match[1]);
      const side = match[2] === 'a' ? 0 : 1;
      startSection = parseInt(match[3]);
      
      // Create sortable key: page * 1000 + side * 100 + section
      const sortKey = startPage * 1000 + side * 100 + startSection;
      return {
        tractate,
        sortKey,
        startPage: match[1] + match[2],
        startSection: match[3]
      };
    }
  }
  
  return {
    tractate,
    sortKey: 0,
    startPage: '',
    startSection: ''
  };
}

function sortEntries(entries) {
  return entries.sort((a, b) => {
    const aInfo = extractTractateInfo(a.talmudLocation);
    const bInfo = extractTractateInfo(b.talmudLocation);
    
    // First sort by tractate order
    const aTractateOrder = TRACTATE_ORDER[aInfo.tractate] || 999;
    const bTractateOrder = TRACTATE_ORDER[bInfo.tractate] || 999;
    
    if (aTractateOrder !== bTractateOrder) {
      return aTractateOrder - bTractateOrder;
    }
    
    // Then sort by page within tractate
    return aInfo.sortKey - bInfo.sortKey;
  });
}

function convertToJSON(entries) {
  const sortedEntries = sortEntries(entries);
  
  const blogPosts = {
    title: "Blog Posts by Talmud Location",
    description: "Blog posts organized by Talmud tractate and page location",
    totalPosts: sortedEntries.length,
    entries: sortedEntries.map((entry, index) => {
      const tractateInfo = extractTractateInfo(entry.talmudLocation);
      
      // Create keywords from the title - extract key terms
      const keywords = extractKeywords(entry.title);
      
      return {
        rowNumber: index + 1,
        title: entry.title,
        tractate: tractateInfo.tractate,
        talmudLocation: entry.talmudLocation,
        blogUrl: entry.fullBlogUrl,
        caiLink: entry.caiHyperlink,
        keywords: keywords.join(', ')
      };
    })
  };
  
  return blogPosts;
}

function extractKeywords(title) {
  // Remove common words and extract meaningful terms
  const commonWords = ['the', 'and', 'or', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'shall', 'can'];
  
  // Extract words, remove punctuation, and filter
  const words = title
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => 
      word.length > 2 && 
      !commonWords.includes(word) &&
      !word.match(/^\d+$/)
    )
    .slice(0, 6); // Take first 6 meaningful words
  
  // Capitalize first letter of each word
  return words.map(word => word.charAt(0).toUpperCase() + word.slice(1));
}

// Read and process the CSV
const csvPath = './attached_assets/All blogposts - extract passage hyperlink sefaria - 600 posts - FINAL - 207 posts - 21-Sep-25 - Sheet3_1758458686128.csv';
const csvText = fs.readFileSync(csvPath, 'utf-8');

const parsedData = parseCSV(csvText);
console.log(`Parsed ${parsedData.length} entries`);

const jsonData = convertToJSON(parsedData);
console.log(`Converted to JSON with ${jsonData.entries.length} entries`);

// Create the outlines directory if it doesn't exist
const outlinesDir = './talmud-data/outlines';
if (!fs.existsSync('./talmud-data')) {
  fs.mkdirSync('./talmud-data');
}
if (!fs.existsSync(outlinesDir)) {
  fs.mkdirSync(outlinesDir);
}

// Write the JSON file
const outputPath = path.join(outlinesDir, 'blog-posts.json');
fs.writeFileSync(outputPath, JSON.stringify(jsonData, null, 2));

console.log(`JSON data written to ${outputPath}`);
console.log(`\nBreakdown by tractate:`);

// Show breakdown by tractate
const tractateCount = {};
jsonData.entries.forEach(entry => {
  if (!tractateCount[entry.tractate]) {
    tractateCount[entry.tractate] = 0;
  }
  tractateCount[entry.tractate]++;
});

Object.keys(tractateCount).forEach(tractate => {
  console.log(`${tractate}: ${tractateCount[tractate]} posts`);
});