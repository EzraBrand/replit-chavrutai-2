import { useEffect, useState } from "react";
import { Link } from "wouter";
import { PageShell, PageHeader, SectionHeading } from "@/components/layout";
import { useSEO } from "@/hooks/use-seo";
import { BreadcrumbNavigation } from "@/components/navigation/breadcrumb-navigation";
import { RAMBAM_BOOKS, RAMBAM_PREFATORY } from "@shared/rambam-data";
import { getStaticSEO } from "@shared/seo-data";

export default function RambamContents() {
  const [prefaceOpen, setPrefaceOpen] = useState(false);

  // Scroll to the book anchor when navigating here from another page (e.g. breadcrumb links)
  useEffect(() => {
    const hash = window.location.hash;
    if (hash) {
      const id = hash.slice(1);
      setTimeout(() => {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, []);

  useSEO(getStaticSEO("/rambam", window.location.origin)!);

  return (
    <PageShell>
      <div className="pt-6">
        <BreadcrumbNavigation
          items={[
            { label: "Mishneh Torah" },
          ]}
        />
      </div>

      {/* Page title */}
      <PageHeader
        category="mishneh-torah"
        title="Study Mishneh Torah Online"
        className="pt-4 pb-8"
      >
        <p className="text-muted-foreground">
          <span dir="rtl" lang="he">משנה תורה</span> — the Rambam's code of Jewish law with bilingual Hebrew-English text
        </p>
        <p className="text-sm text-muted-foreground mt-3">
          English translation by Rabbi Eliyahu Touger (Moznaim) via{' '}
          <a href="https://www.sefaria.org" target="_blank" rel="noopener noreferrer" className="text-primary dark:text-[#5b9fc5] hover:underline">Sefaria</a>.
        </p>

        <div className="mt-3 text-sm text-muted-foreground">
          <button
            onClick={() => setPrefaceOpen(!prefaceOpen)}
            className="hover:text-foreground transition-colors text-left"
          >
            {prefaceOpen ? '▾' : '▸'} Additional prefatory material not included here
          </button>
          {prefaceOpen && (
            <div className="mt-2 pl-4 space-y-1">
              <p>The <a href="https://www.sefaria.org/Mishneh_Torah,_Overview_of_Mishneh_Torah_Contents" target="_blank" rel="noopener noreferrer" className="text-primary dark:text-[#5b9fc5] hover:underline">Overview of Contents</a> (the mitzvot covered in each section) can be found on Sefaria.</p>
            </div>
          )}
        </div>

        <div className="mt-4">
          <p className="text-sm text-muted-foreground mb-2">Jump to Sefer:</p>
          <div className="flex flex-wrap gap-x-4 gap-y-1.5">
            {RAMBAM_BOOKS.map((book) => (
              <a
                key={book.name}
                href={`#${book.name.toLowerCase().replace(/\s+/g, '-')}`}
                className="text-sm text-primary dark:text-[#5b9fc5] hover:underline"
              >
                {book.name.replace(/^Sefer\s+/, '')}
              </a>
            ))}
          </div>
        </div>
      </PageHeader>

      <div>
        <section id="introduction" className="py-8 border-t border-border">
          <div className="mb-4 flex items-baseline justify-between gap-4">
            <SectionHeading>Introduction</SectionHeading>
            <span className="text-sm text-muted-foreground font-hebrew" dir="rtl" lang="he">הקדמה</span>
          </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {RAMBAM_PREFATORY.map((item) => (
                <Link
                  key={item.slug}
                  href={`/rambam/${item.slug}/1`}
                  className="block border border-border rounded bg-background p-3 hover:bg-secondary"
                >
                  <div className="text-primary dark:text-[#5b9fc5] font-medium text-sm leading-snug">{item.displayName}</div>
                  <div className="text-sm text-muted-foreground font-hebrew mt-0.5" dir="rtl" lang="he">
                    {item.hebrewName}
                  </div>
                </Link>
              ))}
            </div>
          </section>

          {RAMBAM_BOOKS.map((book) => (
            <section key={book.name} id={book.name.toLowerCase().replace(/\s+/g, '-')} className="py-8 border-t border-border">
              <div className="mb-4 flex items-baseline justify-between gap-4">
                <SectionHeading>{book.name}</SectionHeading>
                <span className="text-sm text-muted-foreground font-hebrew" dir="rtl" lang="he">{book.hebrewName}</span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {book.hilchot.map((hilchot) => (
                  <Link
                    key={hilchot.slug}
                    href={`/rambam/${hilchot.slug}`}
                    className="block border border-border rounded bg-background p-3 hover:bg-secondary"
                  >
                    <div className="text-primary dark:text-[#5b9fc5] font-medium text-sm leading-snug">{hilchot.displayName}</div>
                    <div className="text-sm text-muted-foreground font-hebrew mt-0.5" dir="rtl" lang="he">
                      {hilchot.hebrewName}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {hilchot.chapters} chapters
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
    </PageShell>
  );
}
