const fs = require('fs');
const path = require('path');

console.log('Starting blog post processing...\n');

// Read CSV to get metadata
const csvPath = 'attached_assets/extracted_posts/posts/posts.csv';
const csvContent = fs.readFileSync(csvPath, 'utf-8');
const csvLines = csvContent.split('\n').filter(line => line.trim());
const headers = csvLines[0].split(',');

console.log(`Found ${csvLines.length - 1} entries in CSV`);

// Parse CSV into map: postId → metadata
const postMetadata = {};
for (let i = 1; i < csvLines.length; i++) {
  const line = csvLines[i];
  if (!line.trim()) continue;
  
  // Simple CSV parsing (handles basic cases)
  const values = [];
  let current = '';
  let inQuotes = false;
  
  for (let char of line) {
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      values.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  values.push(current);
  
  if (values.length < 2) continue;
  
  const fullId = values[0];
  const postId = fullId.split('.')[0]; // Extract ID from "179222342.pt3-..."
  
  postMetadata[postId] = {
    fullId: fullId,
    publishDate: values[1],
    isPublished: values[2] === 'true',
    title: values[7] || '',
    subtitle: values[8] || ''
  };
}

console.log(`Parsed metadata for ${Object.keys(postMetadata).length} posts\n`);

// Read existing blog-posts.json for tractate/location data
const blogPostsJson = JSON.parse(
  fs.readFileSync('talmud-data/outlines/blog-posts.json', 'utf-8')
);

console.log(`Loaded ${blogPostsJson.entries.length} entries from blog-posts.json`);

// Create map: title → location data
const locationMap = {};
blogPostsJson.entries.forEach(entry => {
  locationMap[entry.title] = {
    tractate: entry.tractate,
    location: entry.talmudLocation,
    blogUrl: entry.blogUrl,
    caiLink: entry.caiLink,
    keywords: entry.keywords
  };
});

// Process HTML files
const htmlDir = 'attached_assets/extracted_posts/posts';
const htmlFiles = fs.readdirSync(htmlDir).filter(f => f.endsWith('.html'));

console.log(`Found ${htmlFiles.length} HTML files to process\n`);

const processedPosts = [];
let processed = 0;
let skipped = 0;

htmlFiles.forEach((filename, index) => {
  const postId = filename.replace('.html', '').split('.')[0];
  const htmlPath = path.join(htmlDir, filename);
  const htmlContent = fs.readFileSync(htmlPath, 'utf-8');
  
  const metadata = postMetadata[postId];
  if (!metadata) {
    skipped++;
    return;
  }
  
  // Skip unpublished posts
  if (!metadata.isPublished) {
    skipped++;
    return;
  }
  
  const locationData = locationMap[metadata.title];
  if (!locationData) {
    skipped++;
    return;
  }
  
  // Extract text from HTML (remove scripts, styles, and tags)
  let textContent = htmlContent
    .replace(/<script[^>]*>.*?<\/script>/gis, '')
    .replace(/<style[^>]*>.*?<\/style>/gis, '')
    .replace(/<head[^>]*>.*?<\/head>/gis, '')
    .replace(/<nav[^>]*>.*?<\/nav>/gis, '')
    .replace(/<footer[^>]*>.*?<\/footer>/gis, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
  
  // Generate keywords from title and existing keywords
  const titleWords = metadata.title
    .split(/[:\-,()"]/)
    .flatMap(part => part.split(/\s+/))
    .map(word => word.trim())
    .filter(word => word.length > 3)
    .slice(0, 15);
  
  const existingKeywords = locationData.keywords
    .split(/[,\s]+/)
    .map(k => k.trim())
    .filter(k => k.length > 0);
  
  const allKeywords = [...new Set([...titleWords, ...existingKeywords])];
  
  processedPosts.push({
    id: postId,
    title: metadata.title,
    subtitle: metadata.subtitle,
    tractate: locationData.tractate,
    location: locationData.location,
    keywords: allKeywords,
    blogUrl: locationData.blogUrl,
    caiLink: locationData.caiLink,
    publishDate: metadata.publishDate,
    contentText: textContent,
    contentHtml: htmlContent,
    excerpt: textContent.slice(0, 500),
    wordCount: textContent.split(/\s+/).length
  });
  
  processed++;
  
  if ((index + 1) % 50 === 0) {
    console.log(`Processed ${index + 1}/${htmlFiles.length} files...`);
  }
});

console.log(`\nProcessing complete:`);
console.log(`  - Successfully processed: ${processed}`);
console.log(`  - Skipped: ${skipped}`);

// Write output
const output = {
  version: "1.0",
  generated: new Date().toISOString(),
  totalPosts: processedPosts.length,
  posts: processedPosts
};

fs.mkdirSync('public/data', { recursive: true });
const outputPath = 'public/data/blog-posts-full.json';
fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));

console.log(`\nWrote ${processedPosts.length} blog posts to ${outputPath}`);
console.log(`File size: ${(fs.statSync(outputPath).size / 1024 / 1024).toFixed(2)} MB\n`);

// Print sample
if (processedPosts.length > 0) {
  const sample = processedPosts[0];
  console.log('Sample post:');
  console.log(`  ID: ${sample.id}`);
  console.log(`  Title: ${sample.title}`);
  console.log(`  Tractate: ${sample.tractate}`);
  console.log(`  Location: ${sample.location}`);
  console.log(`  Keywords: ${sample.keywords.slice(0, 5).join(', ')}...`);
  console.log(`  Excerpt: ${sample.excerpt.slice(0, 100)}...`);
}

console.log('\nDone!');
