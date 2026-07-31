import { useMemo, useState } from "react";
import { Link } from "wouter";
import { Input } from "@/components/ui/input";
import { useSEO } from "@/hooks/use-seo";
import { getStaticSEO } from "@shared/seo-data";
import { Footer } from "@/components/footer";
import { HeaderSimple } from "@/components/layout/header-simple";
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
    <div className="min-h-screen flex flex-col bg-background text-foreground font-sans">
      <HeaderSimple />
      <main
        className="max-w-content mx-auto px-6 flex-1 w-full"
        data-testid="jastrow-abbreviations-page"
      >
        <div className="pt-10 pb-8">
          <nav className="text-sm text-muted-foreground mb-4" aria-label="Breadcrumb">
            <Link href="/jastrow" className="hover:text-foreground">
              Jastrow Dictionary
            </Link>
            <span className="mx-2">›</span>
            <span className="text-foreground">Abbreviations</span>
          </nav>

          <h1 className="font-georgia text-3xl md:text-4xl text-foreground mb-2">
            Jastrow Abbreviations
          </h1>
          <p className="text-sm text-muted-foreground mb-3">
            The full list of abbreviations expanded inline by the ChavrutAI Jastrow
            reader. {rows.length.toLocaleString()} entries. These mappings cover
            rabbinic source abbreviations (tractates, midrashic works), grammatical
            shorthand, Latin logic phrases, and scholar surnames.
          </p>
          <p className="text-sm text-muted-foreground">
            For the original list of abbreviations as published in Jastrow itself,
            see{" "}
            <a
              href="https://www.sefaria.org.il/Jastrow%2C_List_of_Abbreviations"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary dark:text-[#5b9fc5] hover:underline"
              data-testid="link-sefaria-abbreviations"
            >
              Jastrow's own abbreviations list (digitized by Sefaria) →
            </a>
          </p>
        </div>

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
      </main>
      <Footer />
    </div>
  );
}
