import { useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { PageShell } from "@/components/layout/page-shell";
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
  type: "letter" | "prefix" | "two-letter";
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

const GROUPS: { key: ProbeEntryMeta["type"]; label: string }[] = [
  { key: "two-letter", label: "Two-letter headwords (under review)" },
  { key: "prefix", label: "Prefixes & prepositions" },
  { key: "letter", label: "Single letters" },
];

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
    <PageShell
      footer={null}
      header={
        <header className="sticky top-0 z-50 bg-background border-b border-border">
          <div className="max-w-content mx-auto px-6 py-4 flex items-center justify-between">
            <Link href="/bdb" className="text-xl font-semibold text-primary hover:opacity-80">
              Bekiut · BDB
            </Link>
            <span className="text-sm text-muted-foreground">Prefix entry probe (internal)</span>
          </div>
        </header>
      }
    >
        <style dangerouslySetInnerHTML={{ __html: dictionaryStyles }} />
        <div className="pt-10 pb-8">
          <h1 className="font-georgia text-3xl md:text-4xl text-foreground mb-2">
            BDB Single-Letter &amp; Prefix Entries
          </h1>
          <p className="text-sm text-muted-foreground">
            {entries.length} entries (two-letter headwords + prefixes/prepositions + single-letter
            descriptions) that the live search misses. Click any headword to look it up.
          </p>
        </div>

        {isLoading && (
          <div className="text-muted-foreground py-12">Loading…</div>
        )}

        {isError && (
          <div className="text-destructive py-12">Failed to load entries.</div>
        )}

        {entries.length > 0 &&
          GROUPS.map(({ key, label }) => {
            const groupEntries = entries.filter((e) => e.type === key);
            if (groupEntries.length === 0) return null;
            return (
              <section key={key} className="py-6 border-t border-border">
                <h2 className="font-georgia text-xl text-foreground mb-3">
                  {label}{" "}
                  <span className="text-sm font-normal text-muted-foreground">
                    ({groupEntries.length})
                  </span>
                </h2>
                <ul
                  className="columns-2 sm:columns-3 md:columns-4 gap-x-6 [&>li]:break-inside-avoid"
                  dir="rtl"
                >
                  {groupEntries.map((entry) => (
                    <li key={entry.form} className="mb-1">
                      <a
                        href={`#${encodeURIComponent(entry.form)}`}
                        onClick={(e) => {
                          e.preventDefault();
                          setSelected(entry);
                        }}
                        className={`font-hebrew text-base hover:underline text-primary dark:text-[#5b9fc5] ${
                          selected?.form === entry.form ? "font-bold" : ""
                        }`}
                        data-testid={`headword-${entry.form}`}
                      >
                        {entry.headword}
                      </a>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}

        {selected && <EntryView meta={selected} />}
    </PageShell>
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
      <h2 className="text-3xl font-hebrew mb-4" dir="rtl">
        <a
          href={`https://www.sefaria.org.il/BDB%2C_${encodeURIComponent(meta.form)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary dark:text-[#5b9fc5] hover:underline"
          title="View this entry on Sefaria"
        >
          {meta.headword}
        </a>
      </h2>
      {isLoading && (
        <div className="text-muted-foreground py-2 text-sm">Loading entry…</div>
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
