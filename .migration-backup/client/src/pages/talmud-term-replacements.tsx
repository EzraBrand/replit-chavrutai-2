import { useMemo, useState } from "react";
import { Link } from "wouter";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useSEO } from "@/hooks/use-seo";
import { getStaticSEO } from "@shared/seo-data";
import { Footer } from "@/components/footer";
import termReplacements from "@shared/data/term-replacements.json";

interface CategoryData {
  description: string;
  terms: Record<string, string>;
}

interface Row {
  category: string;
  from: string;
  to: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  divine: "Divine references",
  talmudic: "Talmudic terms & phrases",
  bible_books: "Bible book names",
  hebrew_terms: "Hebrew terms",
  people: "Personal names",
  animals: "Animal names",
  objects: "Objects & artifacts",
  time_general: "Time — general",
  time_hebrew_dates: "Time — Hebrew calendar",
  time_ordinals: "Time — ordinals",
  events: "Events & festivals",
  sexual_base: "Sexual / euphemistic — base terms",
  sexual_conjugations: "Sexual / euphemistic — conjugations",
  ordinals_basic: "Ordinals — basic",
  ordinals_compound: "Ordinals — compound",
  ordinals_fractional: "Ordinals — fractional",
};

export default function TalmudTermReplacements() {
  const seo = getStaticSEO(
    "/talmud/term-replacements",
    window.location.origin,
  );
  useSEO(seo!);

  const [query, setQuery] = useState("");

  const { categories, totalCount, rows } = useMemo(() => {
    const cats = (termReplacements as { categories: Record<string, CategoryData> })
      .categories;
    const allRows: Row[] = [];
    const catList: Array<{ key: string; label: string; description: string; rows: Row[] }> = [];
    for (const [key, cat] of Object.entries(cats)) {
      const catRows: Row[] = Object.entries(cat.terms || {}).map(
        ([from, to]) => ({ category: key, from, to }),
      );
      allRows.push(...catRows);
      catList.push({
        key,
        label: CATEGORY_LABELS[key] ?? key,
        description: cat.description ?? "",
        rows: catRows,
      });
    }
    return { categories: catList, totalCount: allRows.length, rows: allRows };
  }, []);

  const filteredCategories = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return categories;
    return categories
      .map((c) => ({
        ...c,
        rows: c.rows.filter(
          (r) =>
            r.from.toLowerCase().includes(q) ||
            r.to.toLowerCase().includes(q),
        ),
      }))
      .filter((c) => c.rows.length > 0);
  }, [categories, query]);

  const filteredTotal = useMemo(
    () => filteredCategories.reduce((sum, c) => sum + c.rows.length, 0),
    [filteredCategories],
  );

  return (
    <div className="min-h-screen flex flex-col">
    <main
      className="max-w-4xl mx-auto px-4 py-8 flex-1 w-full"
      data-testid="talmud-term-replacements-page"
    >
      <nav className="text-sm text-muted-foreground mb-4" aria-label="Breadcrumb">
        <Link href="/about" className="hover:text-foreground underline">
          About
        </Link>
        <span className="mx-2">/</span>
        <span>Talmud Term Replacements</span>
      </nav>

      <h1 className="text-2xl font-semibold mb-2">Talmud Term Replacements</h1>
      <p className="text-sm text-muted-foreground mb-6">
        The full list of inline terminology updates ChavrutAI applies to the
        English translation of the Talmud. {rows.length.toLocaleString()}{" "}
        replacements across {categories.length} categories. These are targeted
        improvements designed to make the text more accessible and accurate —
        archaic terms become contemporary ones (e.g. <em>phylacteries</em> →{" "}
        <em>tefillin</em>), lengthy circumlocutions are simplified (e.g.{" "}
        <em>The Holy One, Blessed be He</em> → <em>God</em>), and personal
        names use modern Hebrew spellings (e.g. <em>Jehudah</em> →{" "}
        <em>Yehuda</em>).
      </p>

      <div className="mb-6">
        <Input
          type="search"
          placeholder="Filter replacements…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          data-testid="input-filter"
          className="max-w-md"
        />
        <p className="text-xs text-muted-foreground mt-2">
          Showing {filteredTotal.toLocaleString()} of{" "}
          {totalCount.toLocaleString()}
        </p>
      </div>

      <div className="space-y-6">
        {filteredCategories.map((cat) => (
          <section key={cat.key} data-testid={`category-${cat.key}`}>
            <h2 className="text-lg font-semibold text-foreground mb-1">
              {cat.label}{" "}
              <span className="text-sm font-normal text-muted-foreground">
                ({cat.rows.length.toLocaleString()})
              </span>
            </h2>
            {cat.description && (
              <p className="text-sm text-muted-foreground mb-3">
                {cat.description}
              </p>
            )}
            <Card className="border-border">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-secondary/40 text-left">
                      <tr>
                        <th className="px-4 py-2 font-medium w-1/2">
                          Original
                        </th>
                        <th className="px-4 py-2 font-medium">
                          Replacement
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {cat.rows.map((row, i) => (
                        <tr
                          key={`${cat.key}-${i}`}
                          className="border-t border-border hover:bg-secondary/20"
                          data-testid={`row-${cat.key}-${i}`}
                        >
                          <td className="px-4 py-2 align-top whitespace-pre-wrap">
                            {row.from}
                          </td>
                          <td className="px-4 py-2 align-top whitespace-pre-wrap">
                            {row.to}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </section>
        ))}
        {filteredCategories.length === 0 && (
          <p className="text-center text-muted-foreground py-8">No matches.</p>
        )}
      </div>
    </main>
      <Footer />
    </div>
  );
}
