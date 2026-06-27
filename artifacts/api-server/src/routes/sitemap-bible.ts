import { Request, Response } from 'express';

export function generateBibleSitemap(req: Request, res: Response) {
  // Use production URL for deployed site
  const baseUrl = process.env.NODE_ENV === 'production' 
    ? 'https://chavrutai.com' 
    : req.protocol + '://' + req.get('host');
  
  const currentDate = new Date().toISOString().split('T')[0];
  
  // Bible books with their chapter counts (39 books in Protestant/English order)
  const bibleBooks = [
    // Torah (Pentateuch) - 5 books
    { name: 'Genesis', slug: 'genesis', chapters: 50 },
    { name: 'Exodus', slug: 'exodus', chapters: 40 },
    { name: 'Leviticus', slug: 'leviticus', chapters: 27 },
    { name: 'Numbers', slug: 'numbers', chapters: 36 },
    { name: 'Deuteronomy', slug: 'deuteronomy', chapters: 34 },
    
    // Nevi'im Rishonim (Former Prophets) - 6 books
    { name: 'Joshua', slug: 'joshua', chapters: 24 },
    { name: 'Judges', slug: 'judges', chapters: 21 },
    { name: 'I Samuel', slug: 'i-samuel', chapters: 31 },
    { name: 'II Samuel', slug: 'ii-samuel', chapters: 24 },
    { name: 'I Kings', slug: 'i-kings', chapters: 22 },
    { name: 'II Kings', slug: 'ii-kings', chapters: 25 },
    
    // Nevi'im Acharonim (Latter Prophets) - 15 books
    { name: 'Isaiah', slug: 'isaiah', chapters: 66 },
    { name: 'Jeremiah', slug: 'jeremiah', chapters: 52 },
    { name: 'Ezekiel', slug: 'ezekiel', chapters: 48 },
    { name: 'Hosea', slug: 'hosea', chapters: 14 },
    { name: 'Joel', slug: 'joel', chapters: 4 },
    { name: 'Amos', slug: 'amos', chapters: 9 },
    { name: 'Obadiah', slug: 'obadiah', chapters: 1 },
    { name: 'Jonah', slug: 'jonah', chapters: 4 },
    { name: 'Micah', slug: 'micah', chapters: 7 },
    { name: 'Nahum', slug: 'nahum', chapters: 3 },
    { name: 'Habakkuk', slug: 'habakkuk', chapters: 3 },
    { name: 'Zephaniah', slug: 'zephaniah', chapters: 3 },
    { name: 'Haggai', slug: 'haggai', chapters: 2 },
    { name: 'Zechariah', slug: 'zechariah', chapters: 14 },
    { name: 'Malachi', slug: 'malachi', chapters: 3 },
    
    // Ketuvim (Writings) - 13 books
    { name: 'Psalms', slug: 'psalms', chapters: 150 },
    { name: 'Proverbs', slug: 'proverbs', chapters: 31 },
    { name: 'Job', slug: 'job', chapters: 42 },
    { name: 'Song of Songs', slug: 'song-of-songs', chapters: 8 },
    { name: 'Ruth', slug: 'ruth', chapters: 4 },
    { name: 'Lamentations', slug: 'lamentations', chapters: 5 },
    { name: 'Ecclesiastes', slug: 'ecclesiastes', chapters: 12 },
    { name: 'Esther', slug: 'esther', chapters: 10 },
    { name: 'Daniel', slug: 'daniel', chapters: 12 },
    { name: 'Ezra', slug: 'ezra', chapters: 10 },
    { name: 'Nehemiah', slug: 'nehemiah', chapters: 13 },
    { name: 'I Chronicles', slug: 'i-chronicles', chapters: 29 },
    { name: 'II Chronicles', slug: 'ii-chronicles', chapters: 36 },
  ];
  
  let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- Bible Main Page -->
  <url>
    <loc>${baseUrl}/bible</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
`;

  // Generate URLs for each book and its chapters
  bibleBooks.forEach(book => {
    // Book overview page
    sitemap += `  <url>
    <loc>${baseUrl}/bible/${book.slug}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
`;
    
    // Individual chapter pages
    for (let chapter = 1; chapter <= book.chapters; chapter++) {
      sitemap += `  <url>
    <loc>${baseUrl}/bible/${book.slug}/${chapter}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>yearly</changefreq>
    <priority>0.6</priority>
  </url>
`;
    }
  });

  sitemap += `</urlset>`;

  res.set('Content-Type', 'application/xml');
  res.send(sitemap);
}
