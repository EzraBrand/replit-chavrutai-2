import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { useSEO } from "@/hooks/use-seo";
import { getStaticSEO } from "@shared/seo-data";
import { PageShell, PageHeader, SectionHeading } from "@/components/layout";
import termReplacements from "@workspace/text-processing/data/term-replacements.json";

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
    const cats = (termReplacements as unknown as { categories: Record<string, CategoryData> })
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
    <PageShell testId="talmud-term-replacements-page">
        <PageHeader
          breadcrumbs={[
            { label: "About", href: "/about" },
            { label: "Talmud Term Replacements" },
          ]}
          title="Talmud Term Replacements"
        >
          <p className="text-sm text-muted-foreground">
            The full list of inline terminology updates Bekiut applies to the
            English translation of the Talmud. {rows.length.toLocaleString()}{" "}
            replacements across {categories.length} categories. These are targeted
            improvements designed to make the text more accessible and accurate —
            archaic terms become contemporary ones (e.g. <em>phylacteries</em> →{" "}
            <em>tefillin</em>), lengthy circumlocutions are simplified (e.g.{" "}
            <em>The Holy One, Blessed be He</em> → <em>God</em>), and personal
            names use modern Hebrew spellings (e.g. <em>Jehudah</em> →{" "}
            <em>Yehuda</em>).
          </p>
        </PageHeader>

        <div className="border-t border-border pt-6 mb-8">
          <Input
            type="search"
            placeholder="Filter replacements…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            data-testid="input-filter"
            className="max-w-md rounded"
          />
          <p className="text-xs text-muted-foreground mt-2">
            Showing {filteredTotal.toLocaleString()} of{" "}
            {totalCount.toLocaleString()}
          </p>
        </div>

        <div className="pb-12">
          {filteredCategories.map((cat) => (
            <section
              key={cat.key}
              className="py-6 border-t border-border"
              data-testid={`category-${cat.key}`}
            >
              <SectionHeading className="mb-1">
                {cat.label}{" "}
                <span className="text-sm font-normal text-muted-foreground font-sans">
                  ({cat.rows.length.toLocaleString()})
                </span>
              </SectionHeading>
              {cat.description && (
                <p className="text-sm text-muted-foreground mb-3">
                  {cat.description}
                </p>
              )}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-left">
                    <tr>
                      <th className="px-4 py-2 font-medium w-1/2">Original</th>
                      <th className="px-4 py-2 font-medium">Replacement</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cat.rows.map((row, i) => (
                      <tr
                        key={`${cat.key}-${i}`}
                        className="border-t border-border hover:bg-secondary"
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
            </section>
          ))}
          {filteredCategories.length === 0 && (
            <p className="text-center text-muted-foreground py-8">No matches.</p>
          )}
        </div>
    </PageShell>
  );
}
