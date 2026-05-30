import { useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import bdbMappings from "@shared/data/lexicon-mappings/bdb.json";
import {
  dictionaryStyles,
  convertSefariaLinksToInternal,
  convertBdbInternalLinks,
  convertJastrowInternalLinks,
  annotateTransliterationsInHtml,
  convertSupTagsToParens,
  convertBdbSubFrequencyCounts,
  prependBdbCircaMarker,
  splitIntoParagraphsBdb,
  convertSuperscriptLetters,
  expandAbbreviations,
} from "@/lib/dictionary-format";

interface ProbeEntryMeta {
  form: string;
  ref: string;
  type: "letter" | "prefix";
  headword: string;
  length: number;
}

interface ProbeEntry extends ProbeEntryMeta {
  text: string;
}

interface ProbeResult {
  generatedAt: string;
  probed: number;
  found: number;
  entries: ProbeEntryMeta[];
}

// Greek sub-marker wrapping — mirrors bdb.tsx so α./β./(α) markers get anchor
// spans before downstream transforms run.
const GREEK_LETTERS = "αβγδεζηθικλμνξοπρστυφχψω";
const GREEK_MARKER_RE = new RegExp(
  `(^|[\\s;(>—–:\\-])([${GREEK_LETTERS}])(\\.|\\))`,
  "g",
);

function wrapGreekMarkers(html: string, idPrefix: string): string {
  const occCount: Record<string, number> = {};
  return html.replace(GREEK_MARKER_RE, (_match, lead: string, letter: string, trailer: string) => {
    const occ = (occCount[letter] = (occCount[letter] ?? -1) + 1);
    const id = `${idPrefix}-greek-${letter}-${occ}`;
    if (trailer === ".") {
      return `${lead}<span id="${id}" class="scroll-mt-20">${letter}.</span>`;
    }
    return `${lead}<span id="${id}" class="scroll-mt-20">${letter}</span>)`;
  });
}

// Mirror of bdb.tsx renderDefinition() — applies the exact same transformation
// pipeline the live BDB reader uses, so we can preview how prefix/preposition
// entries (which /api/words omits) would look once rendered. The v3 texts API
// returns each entry as one blob (the entry's start), so it's treated as the
// first sense (circa marker always restored).
function renderBdbDefinition(
  definition: string,
  idPrefix: string,
  splitBySemicolon: boolean,
): string {
  let prepared = convertBdbSubFrequencyCounts(definition);
  prepared = prependBdbCircaMarker(prepared);
  return annotateTransliterationsInHtml(
    convertSefariaLinksToInternal(
      convertJastrowInternalLinks(
        convertBdbInternalLinks(
          expandAbbreviations(
            convertSuperscriptLetters(
              convertSupTagsToParens(
                splitIntoParagraphsBdb(
                  wrapGreekMarkers(prepared, idPrefix),
                  splitBySemicolon,
                ),
              ),
            ),
            bdbMappings.mappings,
          ),
        ),
      ),
    ),
  );
}

export default function BdbPrefixTest() {
  const [selected, setSelected] = useState<ProbeEntryMeta | null>(null);

  const { data, isLoading, isError } = useQuery<ProbeResult>({
    queryKey: ["/api/bdb/prefix-probe"],
    staleTime: Infinity,
  });

  const entries = data?.entries ?? [];

  return (
    <div className="min-h-screen bg-background">
      <style dangerouslySetInnerHTML={{ __html: dictionaryStyles }} />

      <header className="sticky top-0 z-50 bg-card border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/bdb" className="text-xl font-semibold text-primary font-roboto hover:opacity-80">
            ChavrutAI · BDB
          </Link>
          <span className="text-sm text-muted-foreground">Prefix entry probe (internal)</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-6">
        <h1 className="text-3xl font-bold text-primary mb-2">
          BDB Single-Letter &amp; Prefix Entries
        </h1>
        <p className="text-sm text-muted-foreground mb-6">
          {entries.length} entries (prefixes/prepositions + single-letter descriptions) that the
          live search misses. Click any headword to look it up.
        </p>

        {isLoading && (
          <div className="flex items-center gap-2 text-muted-foreground py-12">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading…
          </div>
        )}

        {isError && (
          <div className="text-destructive py-12">Failed to load entries.</div>
        )}

        {entries.length > 0 && (
          <ul
            className="columns-2 sm:columns-3 md:columns-4 gap-x-6 [&>li]:break-inside-avoid mb-8"
            dir="rtl"
          >
            {entries.map((entry) => (
              <li key={entry.form} className="mb-1">
                <a
                  href={`#${encodeURIComponent(entry.form)}`}
                  onClick={(e) => {
                    e.preventDefault();
                    setSelected(entry);
                  }}
                  className={`font-hebrew text-base hover:underline ${
                    selected?.form === entry.form
                      ? "text-blue-800 dark:text-blue-300 font-bold"
                      : "text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                  }`}
                  data-testid={`headword-${entry.form}`}
                >
                  {entry.headword}
                </a>
              </li>
            ))}
          </ul>
        )}

        {selected && <EntryView meta={selected} />}
      </main>
    </div>
  );
}

// Renders the selected entry. The full text (which can be 150K+ chars for לְ) is
// fetched on demand — mirroring how the main BDB reader loads an entry only when
// it is looked up.
function EntryView({ meta }: { meta: ProbeEntryMeta }) {
  const { data: entry, isLoading } = useQuery<ProbeEntry>({
    queryKey: ["/api/bdb/prefix-entry", meta.form],
    queryFn: async () => {
      const res = await fetch(`/api/bdb/prefix-entry?form=${encodeURIComponent(meta.form)}`);
      if (!res.ok) throw new Error("Failed to fetch entry");
      return res.json();
    },
    staleTime: Infinity,
  });

  const rendered = entry ? renderBdbDefinition(entry.text, `probe-${meta.form}`, true) : "";

  return (
    <article className="border-t border-border pt-6" data-testid={`entry-${meta.form}`}>
      <h2 className="text-3xl font-bold text-primary mb-4" dir="rtl">
        {meta.headword}
      </h2>
      {isLoading && (
        <div className="flex items-center gap-2 text-muted-foreground py-2 text-sm">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading entry…
        </div>
      )}
      {entry && (
        <div
          className="dictionary-content leading-relaxed"
          dangerouslySetInnerHTML={{ __html: rendered }}
        />
      )}
    </article>
  );
}
