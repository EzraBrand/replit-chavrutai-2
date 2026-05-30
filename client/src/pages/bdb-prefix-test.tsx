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
  const [splitBySemicolon, setSplitBySemicolon] = useState(true);
  const [showRaw, setShowRaw] = useState(false);
  const [typeFilter, setTypeFilter] = useState<"all" | "prefix" | "letter">("prefix");

  const { data, isLoading, isError } = useQuery<ProbeResult>({
    queryKey: ["/api/bdb/prefix-probe"],
    staleTime: Infinity,
  });

  const entries = (data?.entries ?? []).filter((e) =>
    typeFilter === "all" ? true : e.type === typeFilter,
  );

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
          BDB Single-Letter / Prefix Probe
        </h1>
        <p className="text-sm text-muted-foreground mb-4">
          Internal test page. Probes every Hebrew letter + prefix/preposition headword via Sefaria's
          v3 texts API (<code className="text-xs bg-muted px-1 rounded">/api/v3/texts/BDB,_X</code>) —
          the entries the live <code className="text-xs bg-muted px-1 rounded">/api/words</code> search
          silently omits — and renders each through the live BDB transformation pipeline.
        </p>

        {data && (
          <div className="text-sm text-muted-foreground mb-4">
            Probed {data.probed} forms · found {data.found} entries ·
            {" "}{data.entries.filter((e) => e.type === "prefix").length} prefix/preposition ·
            {" "}{data.entries.filter((e) => e.type === "letter").length} letter descriptions
          </div>
        )}

        <div className="flex flex-wrap gap-4 mb-6 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Show:</span>
            {(["prefix", "letter", "all"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTypeFilter(t)}
                className={`px-2 py-1 rounded border ${
                  typeFilter === t
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border text-muted-foreground hover:text-foreground"
                }`}
                data-testid={`filter-${t}`}
              >
                {t === "prefix" ? "Prefixes & prepositions" : t === "letter" ? "Letter descriptions" : "All"}
              </button>
            ))}
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={splitBySemicolon}
              onChange={(e) => setSplitBySemicolon(e.target.checked)}
              data-testid="toggle-semicolon"
            />
            <span className="text-muted-foreground">Split by semicolon</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showRaw}
              onChange={(e) => setShowRaw(e.target.checked)}
              data-testid="toggle-raw"
            />
            <span className="text-muted-foreground">Show raw HTML</span>
          </label>
        </div>

        {isLoading && (
          <div className="flex items-center gap-2 text-muted-foreground py-12">
            <Loader2 className="h-5 w-5 animate-spin" />
            Probing Sefaria for BDB prefix entries… (first load can take ~10s)
          </div>
        )}

        {isError && (
          <div className="text-destructive py-12">Failed to load probe results.</div>
        )}

        <div className="divide-y divide-border border-t border-border">
          {entries.map((entry) => (
            <PrefixEntryRow
              key={entry.form}
              meta={entry}
              splitBySemicolon={splitBySemicolon}
              showRaw={showRaw}
            />
          ))}
        </div>
      </main>
    </div>
  );
}

// One collapsible row per discovered entry. The full text (which can be 150K+
// chars for לְ) is fetched only when the row is expanded — mirroring how the
// main BDB reader loads an entry only when searched.
function PrefixEntryRow({
  meta,
  splitBySemicolon,
  showRaw,
}: {
  meta: ProbeEntryMeta;
  splitBySemicolon: boolean;
  showRaw: boolean;
}) {
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

  const rendered =
    entry && !showRaw
      ? renderBdbDefinition(entry.text, `probe-${meta.form}`, splitBySemicolon)
      : "";

  return (
    <article className="py-3" data-testid={`entry-${meta.form}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-2 text-left hover:opacity-80"
        aria-expanded={open}
        data-testid={`toggle-${meta.form}`}
      >
        <div className="flex items-center gap-2">
          {open ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
          )}
          <span className="text-2xl font-bold text-primary" dir="rtl">
            {meta.headword}
          </span>
        </div>
        <div className="text-xs text-muted-foreground space-x-3">
          <span
            className={`px-2 py-0.5 rounded ${
              meta.type === "prefix" ? "bg-secondary text-secondary-foreground" : "bg-muted"
            }`}
          >
            {meta.type}
          </span>
          <span>{meta.ref}</span>
          <span>{meta.length.toLocaleString()} chars</span>
        </div>
      </button>

      {open && (
        <div className="mt-3 pl-6">
          {isLoading && (
            <div className="flex items-center gap-2 text-muted-foreground py-2 text-sm">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading entry…
            </div>
          )}
          {entry && showRaw && (
            <pre className="text-xs bg-muted p-3 rounded overflow-x-auto whitespace-pre-wrap break-words">
              {entry.text}
            </pre>
          )}
          {entry && !showRaw && (
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
