import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { getTractateSlug } from "@workspace/shared-data/tractates";
import { useSEO, generateSEOData } from "@/hooks/use-seo";
import { Footer } from "@/components/footer";

/*
 * Bekiut homepage — "ParchmentScholar" design.
 * Sefaria-inspired: white background, Georgia serif headings only,
 * no icons (except the nav book SVG), text links instead of buttons
 * (except the Search button), near-square corners, 64rem content width.
 * Colors use the sitewide theme variables so Paper / White / Dark /
 * High Contrast themes all apply; category bar colors have their own
 * CSS variables with dark-mode overrides (see index.css).
 */

const CORPORA = [
  {
    title: "Babylonian Talmud",
    hebrew: "תלמוד בבלי",
    href: "/talmud",
    color: "var(--category-talmud-bavli)",
    featured: true,
    description:
      "All 37 tractates with over 5,400 pages. Navigate by Seder, tractate, chapter, or individual folio page with full bilingual Hebrew-English text.",
    testid: "link-browse-talmud",
  },
  {
    title: "Tanakh (Hebrew Bible)",
    hebrew: "תנ״ך",
    href: "/bible",
    color: "var(--category-tanakh)",
    description:
      "Torah, Prophets, and Writings. Each book includes Hebrew text with English translation.",
    testid: "link-browse-tanakh",
  },
  {
    title: "Mishnah",
    hebrew: "משנה",
    href: "/mishnah",
    color: "var(--category-mishnah)",
    description:
      "All 63 tractates organized by the six Sedarim with bilingual Hebrew-English text.",
    testid: "link-browse-mishnah",
  },
  {
    title: "Jerusalem Talmud",
    hebrew: "תלמוד ירושלמי",
    href: "/yerushalmi",
    color: "var(--category-talmud-yerushalmi)",
    description: "39 tractates with bilingual Hebrew-English text organized by Seder.",
    testid: "link-browse-yerushalmi",
  },
  {
    title: "Mishneh Torah",
    hebrew: "משנה תורה",
    href: "/rambam",
    color: "var(--category-mishneh-torah)",
    description:
      "All 83 Books of the Rambam's code of Jewish law with bilingual Hebrew-English text.",
    testid: "link-browse-rambam",
  },
];

const TOOLS = [
  { title: "Sugya Viewer", href: "/sugya-viewer", description: "Study custom Talmud text ranges", testid: "link-tool-sugya-viewer" },
  { title: "Biblical Index", href: "/biblical-index", description: "Find where biblical verses are cited in the Talmud", testid: "link-tool-biblical-index" },
  { title: "Mishnah Map", href: "/mishnah-map", description: "Locate Mishnah passages in the Talmud", testid: "link-tool-mishnah-map" },
  { title: "Jastrow Dictionary", href: "/jastrow", description: "Talmudic Hebrew & Aramaic", testid: "link-tool-jastrow" },
  { title: "BDB Bible Dictionary", href: "/bdb", description: "Brown-Driver-Briggs Hebrew lexicon", testid: "link-tool-bdb" },
  { title: "J.N. Epstein's Introductions", href: "/scholarship", description: "Academic introductions to Talmudic literature", testid: "link-tool-scholarship" },
  { title: "Talmud Term Index", href: "/term-index", description: "Browse recurring Talmudic terms", testid: "link-tool-term-index" },
];

interface DafYomiData {
  titleEn: string;
  ref: string;
}

function parseDafYomiRef(ref: string): { tractate: string; folio: string } | null {
  const match = ref.match(/^([A-Za-z\s]+)\s+(\d+)([ab])?$/);
  if (match) {
    return {
      tractate: getTractateSlug(match[1].trim()),
      folio: `${match[2]}${match[3] || "a"}`,
    };
  }
  return null;
}

export default function Home() {
  useSEO(generateSEOData.homePage());
  const [query, setQuery] = useState("");
  const [, navigate] = useLocation();

  const { data: dafYomi } = useQuery<DafYomiData>({ queryKey: ["/api/daf-yomi"] });
  const parsedDaf = dafYomi ? parseDafYomiRef(dafYomi.ref) : null;
  const dafLink = parsedDaf ? `/talmud/${parsedDaf.tractate}/${parsedDaf.folio}` : "/talmud";

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      {/* Nav */}
      <header className="border-b border-border bg-background">
        <div className="max-w-content mx-auto px-6 py-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <Link
            href="/"
            className="flex items-center gap-2"
            data-testid="header-logo-link"
          >
            <img
              src="/hebrew-book-icon.png"
              alt="Bekiut logo"
              className="w-8 h-8 object-cover"
              width={32}
              height={32}
            />
            <span className="text-xl font-semibold text-primary dark:text-[#5b9fc5]">
              Bekiut
            </span>
          </Link>
          <nav className="flex items-center gap-4 sm:gap-6 text-sm text-muted-foreground">
            <a href="#library" className="hover:text-foreground" data-testid="nav-link-library">Library</a>
            <Link href="/search" className="hover:text-foreground" data-testid="nav-link-search">Search</Link>
            <a href="#tools" className="hover:text-foreground" data-testid="nav-link-tools">Tools</a>
            <Link href="/about" className="hover:text-foreground" data-testid="nav-link-about">About Bekiut</Link>
          </nav>
        </div>
      </header>

      <main className="max-w-content mx-auto px-6">
        {/* Rebrand notice */}
        <div
          className="mt-6 rounded border border-border bg-secondary/50 px-4 py-2.5 text-center text-sm text-muted-foreground"
          data-testid="rebrand-notice"
        >
          ChavrutAI is now <strong className="text-foreground">Bekiut</strong> — same
          site, new name and home at bekiut.com.{" "}
          <Link href="/about" className="text-primary hover:underline">
            Learn more
          </Link>
        </div>

        {/* Hero */}
        <section className="pt-16 pb-12 text-center" data-testid="hero-section">
          <h1 className="font-georgia text-4xl md:text-5xl text-foreground mb-4">
            Study Classical Jewish Texts
          </h1>
          <p className="text-muted-foreground mb-8">
            The Talmud, Tanakh, Mishnah, and more — with bilingual Hebrew-English text
          </p>
          <form
            onSubmit={handleSearch}
            className="flex max-w-xl mx-auto"
            data-testid="hero-search-form"
          >
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search the Talmud, Tanakh, and more…"
              className="flex-1 border border-input rounded-l px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground bg-background focus:outline-none focus:border-ring"
              data-testid="hero-search-input"
            />
            <button
              type="submit"
              className="px-5 py-2.5 text-sm font-medium rounded-r bg-primary text-primary-foreground"
              data-testid="hero-search-button"
            >
              Search
            </button>
          </form>
        </section>

        {/* Browse the Library */}
        <section id="library" className="py-12 border-t border-border" data-testid="library-section">
          <h2 className="font-georgia text-2xl mb-8">Browse the Library</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {CORPORA.map((c) => (
              <Link
                key={c.href}
                href={c.href}
                className="block border border-border rounded bg-card p-6 hover:bg-secondary"
                data-testid={c.testid}
              >
                <div
                  className="mb-3"
                  style={{ width: "2.5rem", height: "2px", backgroundColor: c.color }}
                  aria-hidden="true"
                />
                <div className="flex items-baseline justify-between gap-4">
                  <h3 className="font-georgia text-lg text-foreground">{c.title}</h3>
                  <span className="text-sm text-muted-foreground" dir="rtl" lang="he">
                    {c.hebrew}
                  </span>
                </div>
                {c.featured && (
                  <div
                    className="text-xs font-semibold uppercase tracking-wider mt-1"
                    style={{ color: c.color }}
                  >
                    Featured
                  </div>
                )}
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{c.description}</p>
              </Link>
            ))}
          </div>
        </section>

        {/* Quick access */}
        <section className="py-12 border-t border-border" data-testid="quick-access-section">
          <div className="grid md:grid-cols-3 md:divide-x md:divide-border">
            <div className="md:pr-8 py-4 md:py-0">
              <h3 className="font-georgia text-lg mb-2">Daf Yomi</h3>
              <p className="text-sm text-muted-foreground mb-3">
                {dafYomi?.titleEn
                  ? `Today's page: ${dafYomi.titleEn}.`
                  : "Join the worldwide daily page of Talmud study."}
              </p>
              <Link
                href={dafLink}
                className="text-sm hover:underline text-primary dark:text-[#5b9fc5]"
                data-testid="link-daf-yomi"
              >
                Today's daf ›
              </Link>
            </div>
            <div className="md:px-8 py-4 md:py-0 border-t border-border md:border-t-0">
              <h3 className="font-georgia text-lg mb-2">Famous Pages</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Discover well-known passages of the Talmud.
              </p>
              <Link
                href="/suggested-pages"
                className="text-sm hover:underline text-primary dark:text-[#5b9fc5]"
                data-testid="link-famous-pages"
              >
                Explore famous pages ›
              </Link>
            </div>
            <div className="md:pl-8 py-4 md:py-0 border-t border-border md:border-t-0">
              <h3 className="font-georgia text-lg mb-2">Search Texts</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Full-text search across the Talmud and Tanakh.
              </p>
              <Link
                href="/search"
                className="text-sm hover:underline text-primary dark:text-[#5b9fc5]"
                data-testid="link-search-texts"
              >
                Search texts ›
              </Link>
            </div>
          </div>
        </section>

        {/* Study Tools */}
        <section id="tools" className="py-12 border-t border-border" data-testid="tools-section">
          <h2 className="font-georgia text-2xl mb-8">Study Tools</h2>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-6">
            {TOOLS.map((t) => (
              <div key={t.href}>
                <Link
                  href={t.href}
                  className="text-sm font-medium hover:underline text-primary dark:text-[#5b9fc5]"
                  data-testid={t.testid}
                >
                  {t.title}
                </Link>
                <p className="text-sm text-muted-foreground mt-1">{t.description}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Sitewide footer */}
      <div className="mt-8 [&>footer]:mt-0">
        <Footer />
      </div>
    </div>
  );
}
