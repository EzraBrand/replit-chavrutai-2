/**
 * Script to check which search suggestion terms return results
 * and create a filtered list excluding terms with 0 results
 */

const CONCEPTS_URL = 'https://raw.githubusercontent.com/EzraBrand/talmud-nlp-indexer/main/data/talmud_concepts_gazetteer.txt';
const SEARCH_API = 'http://localhost:5000/api/search/text';

interface SearchResponse {
  total: number;
  results: any[];
}

async function fetchConcepts(): Promise<string[]> {
  const response = await fetch(CONCEPTS_URL);
  if (!response.ok) {
    throw new Error(`Failed to fetch concepts: ${response.status}`);
  }
  const text = await response.text();
  return text
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0 && line.toLowerCase() !== 'on');
}

async function checkTerm(term: string): Promise<{ term: string; count: number }> {
  try {
    const params = new URLSearchParams({
      query: term,
      page: '1',
      pageSize: '1',
      type: 'all'
    });
    const response = await fetch(`${SEARCH_API}?${params}`);
    if (!response.ok) {
      console.error(`Error checking "${term}": ${response.status}`);
      return { term, count: -1 };
    }
    const data: SearchResponse = await response.json();
    return { term, count: data.total };
  } catch (error) {
    console.error(`Error checking "${term}":`, error);
    return { term, count: -1 };
  }
}

async function main() {
  console.log('Fetching concepts from gazetteer...');
  const concepts = await fetchConcepts();
  console.log(`Found ${concepts.length} concepts to check\n`);

  const results: { term: string; count: number }[] = [];
  const zeroResults: string[] = [];
  const withResults: string[] = [];

  // Check terms in batches to avoid overwhelming the API
  const batchSize = 5;
  for (let i = 0; i < concepts.length; i += batchSize) {
    const batch = concepts.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(checkTerm));
    
    for (const result of batchResults) {
      results.push(result);
      if (result.count === 0) {
        zeroResults.push(result.term);
        console.log(`❌ "${result.term}" - 0 results`);
      } else if (result.count > 0) {
        withResults.push(result.term);
        console.log(`✓ "${result.term}" - ${result.count} results`);
      } else {
        console.log(`? "${result.term}" - error`);
      }
    }
    
    // Small delay between batches
    if (i + batchSize < concepts.length) {
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }

  console.log('\n=== SUMMARY ===');
  console.log(`Total concepts: ${concepts.length}`);
  console.log(`With results: ${withResults.length}`);
  console.log(`Zero results: ${zeroResults.length}`);
  
  console.log('\n=== TERMS WITH ZERO RESULTS ===');
  zeroResults.forEach(term => console.log(`- ${term}`));

  console.log('\n=== FILTERED CONCEPTS (with results) ===');
  console.log(JSON.stringify(withResults, null, 2));

  // Output as TypeScript constant for easy copy-paste
  console.log('\n=== TYPESCRIPT EXPORT ===');
  console.log('export const SEARCH_SUGGESTIONS = [');
  withResults.forEach((term, i) => {
    const comma = i < withResults.length - 1 ? ',' : '';
    console.log(`  "${term}"${comma}`);
  });
  console.log('];');
}

main().catch(console.error);
