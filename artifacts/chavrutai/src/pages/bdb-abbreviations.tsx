import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { useSEO } from "@/hooks/use-seo";
import { getStaticSEO } from "@shared/seo-data";
import { PageShell, PageHeader } from "@/components/layout";
import bdbMappings from "@shared/data/lexicon-mappings/bdb.json";

type SortKey = "abbr" | "expansion";

interface Row {
  abbr: string;
  expansion: string;
}

export default function BdbAbbreviations() {
  const seo = getStaticSEO("/bdb/abbreviations", window.location.origin);
  useSEO(seo!);

  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("abbr");
  const [sortAsc, setSortAsc] = useState(true);

  const rows = useMemo<Row[]>(() => {
    const m = (bdbMappings as { mappings: Record<string, string> }).mappings;
    return Object.entries(m)
      .filter(([k]) => !k.startsWith("//"))
      .map(([abbr, expansion]) => ({ abbr, expansion }));
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = q
      ? rows.filter(
          (r) =>
            r.abbr.toLowerCase().includes(q) ||
            r.expansion.toLowerCase().includes(q),
        )
      : rows;
    const sorted = [...base].sort((a, b) => {
      const av = a[sortKey].toLowerCase();
      const bv = b[sortKey].toLowerCase();
      if (av < bv) return sortAsc ? -1 : 1;
      if (av > bv) return sortAsc ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [rows, query, sortKey, sortAsc]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortAsc((v) => !v);
    } else {
      setSortKey(key);
      setSortAsc(true);
    }
  };

  const arrow = (key: SortKey) =>
    sortKey === key ? (sortAsc ? " ▲" : " ▼") : "";

  return (
    <PageShell testId="bdb-abbreviations-page">
        <PageHeader
          breadcrumbs={[
            { label: "BDB Dictionary", href: "/bdb" },
            { label: "Abbreviations" },
          ]}
          title="BDB Abbreviations"
        >
          <p className="text-sm text-muted-foreground mb-3">
            The full list of abbreviations expanded inline by the Bekiut BDB
            reader. {rows.length.toLocaleString()} entries. These mappings cover
            scholar surnames, grammatical shorthand, Latin logic phrases, cognate
            languages, biblical book references, and BDB-specific symbols.
          </p>
          <p className="text-sm text-muted-foreground">
            For the original list of abbreviations as published in BDB itself, see{" "}
            <a
              href="https://www.sefaria.org.il/BDB%2C_Abbrevations"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary dark:text-[#5b9fc5] hover:underline"
              data-testid="link-sefaria-abbreviations"
            >
              BDB's own abbreviations list (digitized by Sefaria) →
            </a>
          </p>
        </PageHeader>

        <div className="border-t border-border pt-6 mb-4">
          <Input
            type="search"
            placeholder="Filter abbreviations or expansions…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            data-testid="input-filter"
            className="max-w-md rounded"
          />
          <p className="text-xs text-muted-foreground mt-2">
            Showing {filtered.length.toLocaleString()} of{" "}
            {rows.length.toLocaleString()}
          </p>
        </div>

        <div className="overflow-x-auto border-t border-border mb-12">
          <table className="w-full text-sm" data-testid="abbreviations-table">
            <thead className="text-left">
              <tr>
                <th className="px-4 py-2 font-medium w-1/3">
                  <button
                    type="button"
                    onClick={() => toggleSort("abbr")}
                    className="hover:text-foreground"
                    data-testid="sort-abbr"
                  >
                    Abbreviation{arrow("abbr")}
                  </button>
                </th>
                <th className="px-4 py-2 font-medium">
                  <button
                    type="button"
                    onClick={() => toggleSort("expansion")}
                    className="hover:text-foreground"
                    data-testid="sort-expansion"
                  >
                    Expansion{arrow("expansion")}
                  </button>
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row, i) => (
                <tr
                  key={`${row.abbr}-${i}`}
                  className="border-t border-border hover:bg-secondary"
                  data-testid={`row-${i}`}
                >
                  <td className="px-4 py-2 font-mono align-top whitespace-pre">
                    {row.abbr}
                  </td>
                  <td className="px-4 py-2 align-top">{row.expansion}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={2}
                    className="px-4 py-6 text-center text-muted-foreground"
                  >
                    No matches.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
    </PageShell>
  );
}
