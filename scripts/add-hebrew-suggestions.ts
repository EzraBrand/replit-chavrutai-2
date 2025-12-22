/**
 * Script to add Hebrew equivalents to search suggestions and test them
 */

const SEARCH_API = 'http://localhost:5000/api/search/text';

// English terms with their Hebrew equivalents
const TERMS_WITH_HEBREW: Array<{ en: string; he: string }> = [
  { en: "Shekhina", he: "שכינה" },
  { en: "Persian", he: "פרסי" },
  { en: "Gehenna", he: "גיהנם" },
  { en: "Shabbat", he: "שבת" },
  { en: "hasid", he: "חסיד" },
  { en: "Exilarch", he: "ריש גלותא" },
  { en: "Temple", he: "מקדש" },
  { en: "mil", he: "מיל" },
  { en: "heretics", he: "מינים" },
  { en: "Flood", he: "מבול" },
  { en: "Creation", he: "בריאה" },
  { en: "evil eye", he: "עין הרע" },
  { en: "tzitzit", he: "ציצית" },
  { en: "purity", he: "טהרה" },
  { en: "impurity", he: "טומאה" },
  { en: "Torah study", he: "תלמוד תורה" },
  { en: "Torah", he: "תורה" },
  { en: "tithes", he: "מעשרות" },
  { en: "Throne of Glory", he: "כסא הכבוד" },
  { en: "Exodus", he: "יציאת מצרים" },
  { en: "Ten Lost Tribes", he: "עשרת השבטים" },
  { en: "destruction of Jerusalem", he: "חורבן ירושלים" },
  { en: "shofar", he: "שופר" },
  { en: "Seven Noahide Commandments", he: "שבע מצוות בני נח" },
  { en: "Satan", he: "שטן" },
  { en: "Sanhedrin", he: "סנהדרין" },
  { en: "Nasi", he: "נשיא" },
  { en: "mitzvot", he: "מצוות" },
  { en: "Messiah", he: "משיח" },
  { en: "mashal", he: "משל" },
  { en: "manna", he: "מן" },
  { en: "Magus", he: "מגוש" },
  { en: "kohl", he: "כחל" },
  { en: "World-to-Come", he: "עולם הבא" },
  { en: "Hasmoneans", he: "חשמונאים" },
  { en: "Gog and Magog", he: "גוג ומגוג" },
  { en: "Aramaic", he: "ארמית" },
  { en: "tzara'at", he: "צרעת" },
  { en: "First Temple", he: "בית ראשון" },
  { en: "Destruction of the Temple", he: "חורבן הבית" },
  { en: "Shema", he: "שמע" },
  { en: "Shalom", he: "שלום" },
  { en: "rabbinic", he: "רבני" },
  { en: "Mercy", he: "רחמים" },
  { en: "Anger", he: "כעס" },
  { en: "Prayer", he: "תפילה" },
  { en: "Divine Presence", he: "שכינה" },
  { en: "resurrection of the dead", he: "תחיית המתים" },
  { en: "teruma", he: "תרומה" },
  { en: "priest", he: "כהן" },
  { en: "am ha'aretz", he: "עם הארץ" },
  { en: "sin", he: "חטא" },
  { en: "repented", he: "תשובה" },
  { en: "righteous", he: "צדיק" },
  { en: "parable", he: "משל" },
  { en: "Sabbatical", he: "שמיטה" },
  { en: "judgment", he: "דין" },
  { en: "Priestly Benediction", he: "ברכת כהנים" },
  { en: "New Moon", he: "ראש חודש" },
  { en: "wicked", he: "רשע" },
  { en: "Ninth of Av", he: "תשעה באב" },
  { en: "burnt offering", he: "עולה" },
  { en: "offering of the most sacred order", he: "קדשי קדשים" },
  { en: "libations", he: "נסכים" },
  { en: "seventeenth of Tammuz", he: "שבעה עשר בתמוז" },
  { en: "Jubilee", he: "יובל" },
  { en: "Sabbatical cycle", he: "שמיטה" },
  { en: "Second Temple", he: "בית שני" },
  { en: "Jewish people", he: "עם ישראל" },
  { en: "the Temple", he: "בית המקדש" },
  { en: "priestly watches", he: "משמרות כהונה" },
  { en: "the exile", he: "גלות" },
  { en: "the Tabernacle", he: "משכן" },
  { en: "Levites", he: "לויים" },
  { en: "an ancestral field", he: "שדה אחוזה" },
  { en: "valuation", he: "ערכין" },
  { en: "Israelites", he: "ישראל" },
  { en: "malicious speech", he: "לשון הרע" },
  { en: "leprosy", he: "צרעת" },
  { en: "nazirite", he: "נזיר" },
  { en: "sin offering", he: "חטאת" },
  { en: "marriage contract", he: "כתובה" },
  { en: "mitzva", he: "מצוה" },
  { en: "phylacteries", he: "תפילין" },
  { en: "the wilderness", he: "מדבר" },
  { en: "rabbinic law", he: "דרבנן" },
  { en: "ḥaver", he: "חבר" },
  { en: "sky-blue dye", he: "תכלת" },
  { en: "pilgrimage Festival", he: "רגל" },
  { en: "tumtum", he: "טומטום" },
  { en: "hermaphrodite", he: "אנדרוגינוס" },
  { en: "tereifa", he: "טריפה" },
  { en: "levirate marriage", he: "יבום" },
  { en: "a deaf-mute, an imbecile, and a minor", he: "חרש שוטה וקטן" },
  { en: "the Tent of Meeting", he: "אהל מועד" },
  { en: "one who experienced a seminal emission", he: "בעל קרי" },
  { en: "Paschal offering", he: "קרבן פסח" },
  { en: "an unslaughtered carcass", he: "נבילה" },
  { en: "a menstruating woman", he: "נדה" },
  { en: "the Messiah", he: "המשיח" },
  { en: "High Priest", he: "כהן גדול" },
  { en: "mezuza", he: "מזוזה" },
  { en: "sukka", he: "סוכה" },
  { en: "Hanukkah", he: "חנוכה" },
  { en: "mamzer", he: "ממזר" },
  { en: "capital law", he: "דיני נפשות" },
  { en: "monetary law", he: "דיני ממונות" },
  { en: "ministering angels", he: "מלאכי השרת" },
  { en: "the generation of the flood", he: "דור המבול" },
  { en: "the generation of the dispersion", he: "דור הפלגה" },
  { en: "an idolatrous city", he: "עיר הנדחת" },
  { en: "Holy Spirit", he: "רוח הקודש" },
  { en: "sacred tongue", he: "לשון הקודש" },
  { en: "Purim", he: "פורים" },
  { en: "Garden of Eden", he: "גן עדן" },
  { en: "descendants of Noah", he: "בני נח" },
  { en: "Shamir", he: "שמיר" },
  { en: "the seed of Aaron", he: "זרע אהרן" },
  { en: "The son of David", he: "בן דוד" },
  { en: "the sons of Aaron", he: "בני אהרן" },
  { en: "Paschal lamb", he: "קרבן פסח" },
  { en: "sin-offering", he: "חטאת" },
  { en: "guilt-offering", he: "אשם" },
  { en: "burnt-offering", he: "עולה" },
  { en: "peace-offering", he: "שלמים" },
  { en: "gift-offering", he: "מנחה" },
  { en: "Shavuot", he: "שבועות" },
  { en: "Sukkot", he: "סוכות" },
  { en: "Passover", he: "פסח" },
  { en: "thanks-offering", he: "תודה" },
  { en: "Sabbatical Year", he: "שנת שמיטה" },
  { en: "idolatrous worship", he: "עבודה זרה" },
  { en: "karet", he: "כרת" },
  { en: "ḥalitza", he: "חליצה" },
  { en: "aylonit", he: "אילונית" },
  { en: "the Sanctuary", he: "המקדש" },
  { en: "heretic", he: "מין" },
  { en: "apostate", he: "משומד" },
  { en: "informer", he: "מוסר" }
];

interface SearchResponse {
  total: number;
  results: any[];
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
  console.log('Testing all terms (English + Hebrew)...\n');

  // Collect all unique terms
  const allTerms: string[] = [];
  for (const pair of TERMS_WITH_HEBREW) {
    allTerms.push(pair.en);
    if (pair.he && !allTerms.includes(pair.he)) {
      allTerms.push(pair.he);
    }
  }

  console.log(`Total terms to check: ${allTerms.length}\n`);

  const withResults: string[] = [];
  const zeroResults: string[] = [];

  // Check terms in batches
  const batchSize = 5;
  for (let i = 0; i < allTerms.length; i += batchSize) {
    const batch = allTerms.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(checkTerm));
    
    for (const result of batchResults) {
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
    
    if (i + batchSize < allTerms.length) {
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }

  console.log('\n=== SUMMARY ===');
  console.log(`Total terms: ${allTerms.length}`);
  console.log(`With results: ${withResults.length}`);
  console.log(`Zero results: ${zeroResults.length}`);
  
  console.log('\n=== TERMS WITH ZERO RESULTS ===');
  zeroResults.forEach(term => console.log(`- ${term}`));

  // Output as TypeScript constant
  console.log('\n=== TYPESCRIPT EXPORT ===');
  console.log('export const SEARCH_SUGGESTIONS = [');
  withResults.forEach((term, i) => {
    const comma = i < withResults.length - 1 ? ',' : '';
    console.log(`  "${term}"${comma}`);
  });
  console.log('];');
}

main().catch(console.error);
