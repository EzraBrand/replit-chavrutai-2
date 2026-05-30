import { useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Loader2, ChevronDown, ChevronRight } from "lucide-react";
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
  const { data, isLoading, isError } = useQuery<ProbeResult>({
    queryKey: ["/api/bdb/prefix-probe"],
    staleTime: Infinity,
  });

  // Only the grammatically relevant prefix/preposition entries — the ones the
  // live /api/words search misses. Letter-name descriptions are omitted.
  const entries = (data?.entries ?? []).filter((e) => e.type === "prefix");

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
        <h1 className="text-3xl font-bold text-primary mb-1">
          BDB Prefix &amp; Preposition Entries
        </h1>
        <p className="text-sm text-muted-foreground mb-6">
          Single-letter prefix/preposition entries missing from the live search. Click an entry to load it.
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

        <div className="divide-y divide-border border-t border-border">
          {entries.map((entry) => (
            <PrefixEntryRow key={entry.form} meta={entry} />
          ))}
        </div>
      </main>
    </div>
  );
}

// One collapsible row per discovered entry. The full text (which can be 150K+
// chars for לְ) is fetched only when the row is expanded — mirroring how the
// main BDB reader loads an entry only when searched.
function PrefixEntryRow({ meta }: { meta: ProbeEntryMeta }) {
  const [open, setOpen] = useState(false);

  const { data: entry, isLoading } = useQuery<ProbeEntry>({
    queryKey: ["/api/bdb/prefix-entry", meta.form],
    queryFn: async () => {
      const res = await fetch(`/api/bdb/prefix-entry?form=${encodeURIComponent(meta.form)}`);
      if (!res.ok) throw new Error("Failed to fetch entry");
      return res.json();
    },
    enabled: open,
    staleTime: Infinity,
  });

  const rendered = entry ? renderBdbDefinition(entry.text, `probe-${meta.form}`, true) : "";

  return (
    <article className="py-3" data-testid={`entry-${meta.form}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2 text-left hover:opacity-80"
        aria-expanded={open}
        data-testid={`toggle-${meta.form}`}
      >
        {open ? (
          <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
        ) : (
          <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
        )}
        <span className="text-2xl font-bold text-primary" dir="rtl">
          {meta.headword}
        </span>
      </button>

      {open && (
        <div className="mt-3 pl-6">
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
        </div>
      )}
    </article>
  );
}
