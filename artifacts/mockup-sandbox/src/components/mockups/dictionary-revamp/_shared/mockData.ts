/**
 * Shared mock data for Jastrow + BDB dictionary UX revamp mockups.
 * Keeps each variant focused on layout/UX rather than redoing data plumbing.
 *
 * Real entries adapted (lightly simplified) from BDB and Jastrow so RTL/sense
 * structure feels authentic.
 */

export type Lexicon = "jastrow" | "bdb";

export interface Sense {
  /** Roman numeral / number / letter label, e.g. "1", "I", "a" */
  label?: string;
  /** Definition text — already pre-formatted; may contain inline cross-refs */
  text: string;
  /** Bible / Talmud citations to render as chips */
  refs?: string[];
}

export interface DictEntry {
  lexicon: Lexicon;
  /** Voweled headword (Hebrew/Aramaic) */
  headword: string;
  /** Strong's number (BDB) or homonym label (Jastrow), e.g. "I", "II" */
  homonym?: string;
  /** Part of speech, e.g. "n.m.", "vb.", "f." */
  pos?: string;
  /** Etymology blurb (origin language + cognate) */
  etymology?: string;
  /** Short translation gloss (one-liner) */
  gloss: string;
  senses: Sense[];
  /** Cross references to other headwords */
  crossRefs?: { lexicon: Lexicon; headword: string; gloss: string }[];
  /** Sefaria URL */
  sefariaSlug?: string;
}

/* ─────────────────────────  HEBREW ALPHABET  ───────────────────────── */

export const HEBREW_LETTERS = [
  "א","ב","ג","ד","ה","ו","ז","ח","ט","י","כ",
  "ל","מ","נ","ס","ע","פ","צ","ק","ר","ש","ת",
];

/** Per-letter entry counts (approximated to match real lexicon sizes) */
export const LETTER_COUNTS: Record<Lexicon, Record<string, number>> = {
  bdb: {
    "א": 1342, "ב": 1148, "ג": 612, "ד": 543, "ה": 421, "ו": 87, "ז": 388,
    "ח": 1421, "ט": 327, "י": 612, "כ": 728, "ל": 514, "מ": 1605, "נ": 943,
    "ס": 467, "ע": 1284, "פ": 1067, "צ": 552, "ק": 815, "ר": 962, "ש": 1843, "ת": 854,
  },
  jastrow: {
    "א": 2387, "ב": 2014, "ג": 1421, "ד": 1156, "ה": 1023, "ו": 421, "ז": 924,
    "ח": 2541, "ט": 1212, "י": 1842, "כ": 1734, "ל": 1387, "מ": 3142, "נ": 1845,
    "ס": 1432, "ע": 2618, "פ": 2143, "צ": 1289, "ק": 1742, "ר": 1923, "ש": 3287, "ת": 1654,
  },
};

/* ─────────────────────────  AUTOSUGGEST ROW  ────────────────────────── */

export const AUTOSUGGEST_DAVAR = [
  { voweled: "דָּבָר", unvoweled: "דבר", lexicon: "bdb" as Lexicon },
  { voweled: "דָּבַר", unvoweled: "דבר", lexicon: "bdb" as Lexicon },
  { voweled: "דֶּבֶר", unvoweled: "דבר", lexicon: "bdb" as Lexicon },
  { voweled: "דְּבִיר", unvoweled: "דביר", lexicon: "bdb" as Lexicon },
  { voweled: "דַּבְּרָן", unvoweled: "דברן", lexicon: "jastrow" as Lexicon },
  { voweled: "דִּבְרָה", unvoweled: "דברה", lexicon: "jastrow" as Lexicon },
];

/* ─────────────────────────  ENTRIES  ───────────────────────── */

export const BDB_DAVAR: DictEntry = {
  lexicon: "bdb",
  headword: "דָּבָר",
  homonym: "I",
  pos: "n.m.",
  gloss: "speech, word, matter, thing",
  etymology: "From the verb דָּבַר (dābar, “to speak, declare”). Cognate with Aramaic דְּבַר, Arabic dabara “to follow after, arrange.”",
  senses: [
    {
      label: "1",
      text: "<strong>speech, discourse, saying, word</strong> — that which is uttered.",
      refs: ["Gen 11:1", "Ex 4:28", "Deut 4:12"],
    },
    {
      label: "2",
      text: "<strong>word of God</strong>, divine communication as a revelatory utterance; oracle.",
      refs: ["1 Sam 3:1", "1 Kgs 18:1", "Jer 1:2", "Hos 1:1"],
    },
    {
      label: "3",
      text: "<strong>matter, affair, business</strong>; concrete subject under discussion.",
      refs: ["Gen 12:17", "Ex 18:16", "1 Sam 10:16"],
    },
    {
      label: "4",
      text: "<strong>thing, object</strong>; <em>any</em> entity (often with כָּל “every”).",
      refs: ["Gen 18:14", "Num 18:7", "Ecc 1:8"],
    },
    {
      label: "5",
      text: "<em>Idiomatic phrases:</em> עַל־דְּבַר “concerning, on account of”; דְּבַר־יוֹם בְּיוֹמוֹ “the daily portion”; אִישׁ דְּבָרִים “a man of words.”",
      refs: ["Gen 12:17", "Ex 5:13", "Ex 4:10"],
    },
  ],
  crossRefs: [
    { lexicon: "bdb", headword: "דָּבַר", gloss: "vb. — to speak" },
    { lexicon: "bdb", headword: "דִּבָּרָה", gloss: "n.f. — cause, reason, manner" },
    { lexicon: "jastrow", headword: "דָּבָר", gloss: "thing, word, command" },
  ],
  sefariaSlug: "BDB,_דָּבָר",
};

export const JASTROW_DAVAR: DictEntry = {
  lexicon: "jastrow",
  headword: "דָּבָר",
  pos: "m.",
  gloss: "thing, word, command, affair",
  etymology: "(b.h.; v. preced. wds.) — biblical Hebrew, from דָּבַר.",
  senses: [
    {
      label: "1",
      text: "<strong>thing, object</strong>. Often paired with another noun: דְּבַר־מָה <em>something, anything</em>.",
      refs: ["Ber. 5a", "Shab. 31a"],
    },
    {
      label: "2",
      text: "<strong>word, speech, saying</strong>; <em>esp.</em> a Scriptural verse or rabbinic dictum.",
      refs: ["B. Bath. 14b", "Sot. 10b"],
    },
    {
      label: "3",
      text: "<strong>command, order, law</strong>; דְּבַר תּוֹרָה <em>a Biblical law</em> (cf. דְּרַבָּנָן).",
      refs: ["Pes. 4a", "Yoma 80a"],
    },
    {
      label: "4",
      text: "<strong>matter, affair, case</strong>; דְּבַר מַלְכוּת <em>state affairs</em>; דְּבַר עֲבֵירָה <em>a sinful matter</em>.",
      refs: ["Sanh. 21b", "Kidd. 2b"],
    },
    {
      label: "5",
      text: "Phrasal: לְכָל דָּבָר <em>in every respect</em>; דְּבָרִים שֶׁבַּלֵּב <em>matters of the heart, mental reservations</em>.",
      refs: ["Ḥul. 9a", "Kidd. 49b"],
    },
  ],
  crossRefs: [
    { lexicon: "jastrow", headword: "דַּבָּר", gloss: "speaker, leader" },
    { lexicon: "jastrow", headword: "דִּבְרָה", gloss: "speech, manner; cause" },
    { lexicon: "bdb", headword: "דָּבָר", gloss: "speech, word, matter" },
  ],
  sefariaSlug: "Jastrow,_דָּבָר",
};

export const BDB_HESED: DictEntry = {
  lexicon: "bdb",
  headword: "חֶסֶד",
  pos: "n.m.",
  gloss: "goodness, kindness, lovingkindness",
  etymology: "Root חסד “to be kind, faithful.” Cognate with Aramaic חַסְדָּא, Arabic ḥasada (in opposite sense, “envy”).",
  senses: [
    {
      label: "1",
      text: "<strong>kindness</strong>, of people one toward another; in the form of acts of mercy or favors.",
      refs: ["Gen 21:23", "Josh 2:12", "1 Sam 20:8"],
    },
    {
      label: "2",
      text: "<strong>kindness of God</strong>, esp. in covenant fidelity; loyal love, steadfast covenant love.",
      refs: ["Ex 20:6", "Ps 86:15", "Lam 3:22"],
    },
    {
      label: "3",
      text: "<strong>kindness rendered</strong> as a piety, beauty (of human kindness Isa 40:6).",
      refs: ["Isa 40:6", "Hos 6:4"],
    },
  ],
  crossRefs: [
    { lexicon: "bdb", headword: "חָסַד", gloss: "vb. — be kind" },
    { lexicon: "bdb", headword: "חָסִיד", gloss: "adj. — kind, pious" },
  ],
  sefariaSlug: "BDB,_חֶסֶד",
};

export const JASTROW_GEMARA: DictEntry = {
  lexicon: "jastrow",
  headword: "גְּמָרָא",
  pos: "f.",
  gloss: "tradition, study, the Gemara",
  etymology: "From גְּמַר (gemar, “to complete, learn by tradition”).",
  senses: [
    {
      label: "1",
      text: "<strong>completion, conclusion, decision</strong>.",
      refs: ["B. Bath. 130b"],
    },
    {
      label: "2",
      text: "<strong>traditional learning</strong>, esp. legal traditions handed down from teacher to student. Distinct from מִשְׁנָה.",
      refs: ["Ḥag. 14a", "B. Mets. 33a"],
    },
    {
      label: "3",
      text: "<strong>The Gemara</strong>, the analytical layer of the Talmud expanding on the Mishnah.",
      refs: ["Ber. 64a"],
    },
  ],
  crossRefs: [
    { lexicon: "jastrow", headword: "גָּמַר", gloss: "vb. — to complete, conclude" },
    { lexicon: "jastrow", headword: "מִשְׁנָה", gloss: "the Mishnah, oral teaching" },
  ],
  sefariaSlug: "Jastrow,_גְּמָרָא",
};

/* ─────────────────────────  HEADWORD INDEX  ───────────────────────── */

/** Scrollable headword index for letter ד (used by sidebar variants) */
export const HEADWORDS_DALET: { lexicon: Lexicon; voweled: string; gloss: string }[] = [
  { lexicon: "bdb", voweled: "דָּא",       gloss: "this (Aram.)" },
  { lexicon: "bdb", voweled: "דָּאַב",     gloss: "to languish, faint" },
  { lexicon: "bdb", voweled: "דְּאָבָה",   gloss: "languishing, sorrow" },
  { lexicon: "bdb", voweled: "דָּאַג",     gloss: "to be anxious" },
  { lexicon: "bdb", voweled: "דְּאָגָה",   gloss: "anxiety, care" },
  { lexicon: "bdb", voweled: "דָּאָה",     gloss: "to fly swiftly, dart" },
  { lexicon: "bdb", voweled: "דָּב",       gloss: "bear" },
  { lexicon: "bdb", voweled: "דָּבָה",     gloss: "evil report, defamation" },
  { lexicon: "bdb", voweled: "דִּבָּה",    gloss: "whispering, slander" },
  { lexicon: "bdb", voweled: "דְּבוֹרָה",  gloss: "bee" },
  { lexicon: "bdb", voweled: "דָּבַק",     gloss: "to cling, cleave" },
  { lexicon: "bdb", voweled: "דָּבַר",     gloss: "vb. — to speak" },
  { lexicon: "bdb", voweled: "דָּבָר",     gloss: "speech, word, matter, thing" },
  { lexicon: "bdb", voweled: "דֶּבֶר",     gloss: "pestilence" },
  { lexicon: "bdb", voweled: "דְּבִיר",    gloss: "innermost room of Temple" },
  { lexicon: "bdb", voweled: "דְּבַשׁ",    gloss: "honey" },
  { lexicon: "bdb", voweled: "דָּג",       gloss: "fish" },
  { lexicon: "bdb", voweled: "דָּגָה",     gloss: "to multiply" },
  { lexicon: "bdb", voweled: "דֶּגֶל",     gloss: "banner, standard" },
  { lexicon: "bdb", voweled: "דָּגָן",     gloss: "grain, corn" },
  { lexicon: "bdb", voweled: "דַּד",       gloss: "breast" },
  { lexicon: "bdb", voweled: "דּוֹד",      gloss: "beloved, uncle" },
  { lexicon: "bdb", voweled: "דּוֹדַי",    gloss: "love-apple, mandrake" },
  { lexicon: "bdb", voweled: "דָּוִד",     gloss: "David (proper name)" },
  { lexicon: "bdb", voweled: "דָּוָה",     gloss: "to be ill, faint" },
  { lexicon: "bdb", voweled: "דּוֹר",      gloss: "generation, period" },
  { lexicon: "bdb", voweled: "דָּחָה",     gloss: "to thrust, push" },
  { lexicon: "bdb", voweled: "דַּי",       gloss: "sufficiency, enough" },
  { lexicon: "bdb", voweled: "דָּלַל",     gloss: "to hang, dangle, be low" },
  { lexicon: "bdb", voweled: "דֶּלֶת",     gloss: "door" },
  { lexicon: "bdb", voweled: "דָּם",       gloss: "blood" },
  { lexicon: "bdb", voweled: "דָּמַם",     gloss: "to be silent, still" },
  { lexicon: "bdb", voweled: "דֶּרֶךְ",    gloss: "way, road, journey, manner" },
  { lexicon: "bdb", voweled: "דָּרַשׁ",    gloss: "to seek, inquire, study" },
  { lexicon: "bdb", voweled: "דֶּשֶׁא",    gloss: "tender grass, vegetation" },
];

/* ─────────────────────────  RECENT LOOKUPS  ───────────────────────── */

export const RECENT_LOOKUPS = [
  { lexicon: "bdb" as Lexicon,     voweled: "חֶסֶד",     gloss: "lovingkindness" },
  { lexicon: "jastrow" as Lexicon, voweled: "גְּמָרָא",  gloss: "the Gemara" },
  { lexicon: "bdb" as Lexicon,     voweled: "דֶּרֶךְ",   gloss: "way, road" },
  { lexicon: "jastrow" as Lexicon, voweled: "אַגָּדָה",  gloss: "narrative tradition" },
  { lexicon: "bdb" as Lexicon,     voweled: "תּוֹרָה",   gloss: "instruction, law" },
];

/* ─────────────────────────  SHARED STYLE TOKENS  ───────────────────────── */

export const TYPE = {
  hebrew: "'SBL Hebrew', 'Frank Ruhl Libre', 'Times New Roman', serif",
  serif: "'Source Serif Pro', 'Cormorant Garamond', Georgia, serif",
  sans: "Inter, 'SF Pro Text', system-ui, sans-serif",
  ui: "Inter, system-ui, sans-serif",
};

export const PALETTE = {
  // Modern web feel (used by Three-Pane and Cards)
  modern: {
    bg: "hsl(0, 0%, 99%)",
    surface: "hsl(0, 0%, 100%)",
    surfaceAlt: "hsl(220, 14%, 96%)",
    border: "hsl(220, 13%, 90%)",
    borderStrong: "hsl(220, 13%, 78%)",
    text: "hsl(222, 47%, 11%)",
    textMuted: "hsl(220, 10%, 45%)",
    accent: "hsl(207, 70%, 45%)",
    accentSoft: "hsl(207, 70%, 95%)",
    headword: "hsl(15, 75%, 35%)",
  },
  // Classical / manuscript feel
  manuscript: {
    bg: "hsl(40, 35%, 94%)",            // ivory paper
    paper: "hsl(40, 50%, 97%)",
    border: "hsl(30, 25%, 78%)",
    rule: "hsl(28, 30%, 65%)",
    text: "hsl(25, 30%, 18%)",
    textMuted: "hsl(25, 12%, 38%)",
    accent: "hsl(0, 55%, 32%)",         // burgundy
    accentSoft: "hsl(0, 40%, 92%)",
    gold: "hsl(38, 60%, 38%)",
    headword: "hsl(0, 60%, 28%)",       // deep red headwords
  },
};
