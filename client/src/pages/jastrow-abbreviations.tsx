import { useMemo, useState } from "react";
import { Link } from "wouter";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useSEO } from "@/hooks/use-seo";
import { getStaticSEO } from "@shared/seo-data";
import jastrowMappings from "@shared/data/lexicon-mappings/jastrow.json";

type SortKey = "abbr" | "expansion";

interface Row {
  abbr: string;
  expansion: string;
}

export default function JastrowAbbreviations() {
  const seo = getStaticSEO("/jastrow/abbreviations", window.location.origin);
  useSEO(seo!);

  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("abbr");
  const [sortAsc, setSortAsc] = useState(true);

  const rows = useMemo<Row[]>(() => {
    const m = (jastrowMappings as { mappings: Record<string, string> }).mappings;
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
    <main className="max-w-4xl mx-auto px-4 py-8" data-testid="jastrow-abbreviations-page">
      <nav className="text-sm text-muted-foreground mb-4" aria-label="Breadcrumb">
        <Link href="/jastrow" className="hover:text-foreground underline">
          Jastrow Dictionary
        </Link>
        <span className="mx-2">/</span>
        <span>Abbreviations</span>
      </nav>

      <h1 className="text-2xl font-semibold mb-2">Jastrow Abbreviations</h1>
      <p className="text-sm text-muted-foreground mb-3">
        The full list of abbreviations expanded inline by the ChavrutAI Jastrow
        reader. {rows.length.toLocaleString()} entries. These mappings cover
        rabbinic source abbreviations (tractates, midrashic works), grammatical
        shorthand, Latin logic phrases, and scholar surnames.
      </p>
      <p className="text-sm text-muted-foreground mb-6">
        For the original list of abbreviations as published in Jastrow itself,
        see{" "}
        <a
          href="https://www.sefaria.org/Jastrow%2C_Abbreviations"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-foreground transition-colors"
          data-testid="link-sefaria-abbreviations"
        >
          Jastrow's own abbreviations list (digitized by Sefaria) →
        </a>
      </p>

      <div className="mb-4">
        <Input
          type="search"
          placeholder="Filter abbreviations or expansions…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          data-testid="input-filter"
          className="max-w-md"
        />
        <p className="text-xs text-muted-foreground mt-2">
          Showing {filtered.length.toLocaleString()} of{" "}
          {rows.length.toLocaleString()}
        </p>
      </div>

      <Card className="border-border">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm" data-testid="abbreviations-table">
              <thead className="bg-secondary/40 text-left">
                <tr>
                  <th className="px-4 py-2 font-medium w-1/3">
                    <button
                      type="button"
                      onClick={() => toggleSort("abbr")}
                      className="hover:text-foreground transition-colors"
                      data-testid="sort-abbr"
                    >
                      Abbreviation{arrow("abbr")}
                    </button>
                  </th>
                  <th className="px-4 py-2 font-medium">
                    <button
                      type="button"
                      onClick={() => toggleSort("expansion")}
                      className="hover:text-foreground transition-colors"
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
                    className="border-t border-border hover:bg-secondary/20"
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
        </CardContent>
      </Card>
    </main>
  );
}
