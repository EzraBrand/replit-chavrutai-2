import { useMemo } from "react";
import { Link, Redirect } from "wouter";
import { Footer } from "@/components/footer";
import { useSEO } from "@/hooks/use-seo";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { HEBREW_ALPHABET, isHebrewLetter } from "@shared/hebrew-alphabet";
import {
  useLexiconIndex,
  normalizeHebrew,
  type LexiconKey,
} from "@/lib/lexicon-index";

interface LexiconMeta {
  key: LexiconKey;
  routePrefix: string;
  shortName: string;
  longName: string;
  byline: string;
}

const LEXICON_META: Record<LexiconKey, LexiconMeta> = {
  bdb: {
    key: "bdb",
    routePrefix: "/bdb",
    shortName: "BDB",
    longName: "BDB Hebrew Bible Dictionary",
    byline:
      "Brown, Driver, and Briggs — A Hebrew and English Lexicon of the Old Testament (1906)",
  },
  jastrow: {
    key: "jastrow",
    routePrefix: "/jastrow",
    shortName: "Jastrow",
    longName: "Jastrow Talmud Dictionary",
    byline:
      "Marcus Jastrow — A Dictionary of the Targumim, the Talmud Babli and Yerushalmi, and the Midrashic Literature (1903)",
  },
};

interface Props {
  lexiconKey: LexiconKey;
  letter?: string;
}

export default function LexiconHeadwords({ lexiconKey, letter }: Props) {
  const meta = LEXICON_META[lexiconKey];
  const index = useLexiconIndex(lexiconKey);

  // If a letter param was supplied but isn't a known Hebrew letter, we want to
  // redirect to the canonical headword index instead of silently rendering
  // (avoids duplicate-content URLs for SEO). Defer the early return until
  // after all hooks have run so the call order stays stable across renders.
  const invalidLetter = letter !== undefined && !isHebrewLetter(letter);
  const activeLetter = !invalidLetter && letter && isHebrewLetter(letter) ? letter : "";

  const letterHeadwords = useMemo(() => {
    if (!index || !activeLetter) return [];
    const out: string[] = [];
    for (let i = 0; i < index.headwords.length; i++) {
      if (index.normalized[i].startsWith(activeLetter)) {
        out.push(index.headwords[i]);
      }
    }
    return out;
  }, [index, activeLetter]);

  const totalCount = index?.total ?? 0;

  const seoTitle = activeLetter
    ? `${meta.shortName} Headwords starting with ${activeLetter} | ChavrutAI`
    : `${meta.longName} — Complete Headword Index | ChavrutAI`;

  const seoDescription = activeLetter
    ? `Browse all ${meta.shortName} dictionary headwords starting with the Hebrew letter ${activeLetter}. ${letterHeadwords.length} entries with direct lookup links.`
    : `Complete A-to-Z headword index for the ${meta.longName}. Browse all ${totalCount.toLocaleString()} entries by Hebrew letter on ChavrutAI.`;

  const canonical = activeLetter
    ? `${typeof window !== "undefined" ? window.location.origin : ""}${meta.routePrefix}/headwords/${encodeURIComponent(activeLetter)}`
    : `${typeof window !== "undefined" ? window.location.origin : ""}${meta.routePrefix}/headwords`;

  useSEO({
    title: seoTitle,
    description: seoDescription,
    ogTitle: seoTitle.replace(" | ChavrutAI", ""),
    ogDescription: seoDescription,
    canonical,
    robots: "index, follow",
  });

  if (invalidLetter) {
    return <Redirect to={`${meta.routePrefix}/headwords`} replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-card border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-center">
            <Link
              href="/"
              className="flex items-center space-x-2 flex-shrink-0 hover:opacity-80 transition-opacity duration-200"
              data-testid="header-logo-link"
            >
              <div className="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden">
                <img
                  src="/hebrew-book-icon.png"
                  alt="ChavrutAI Logo"
                  className="w-10 h-10 object-cover"
                />
              </div>
              <div className="text-xl font-semibold text-primary font-roboto">
                ChavrutAI
              </div>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-6">
        <nav className="text-sm text-muted-foreground mb-4 flex items-center gap-2 flex-wrap">
          <Link href={meta.routePrefix} className="hover:text-foreground inline-flex items-center gap-1" data-testid="link-back-reader">
            <ArrowLeft className="h-3.5 w-3.5" />
            {meta.shortName}
          </Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <Link href={`${meta.routePrefix}/headwords`} className="hover:text-foreground" data-testid="link-headword-index">
            Headword Index
          </Link>
          {activeLetter && (
            <>
              <ChevronRight className="h-3.5 w-3.5" />
              <span className="font-hebrew text-base text-foreground">{activeLetter}</span>
            </>
          )}
        </nav>

        <h1 className="text-3xl font-bold text-primary mb-2">
          {activeLetter
            ? `${meta.shortName} Headwords — `
            : `${meta.longName} — Headword Index`}
          {activeLetter && (
            <span className="font-hebrew text-3xl">{activeLetter}</span>
          )}
        </h1>
        <p className="text-sm text-muted-foreground mb-6">
          {activeLetter
            ? `${letterHeadwords.length.toLocaleString()} entries starting with ${activeLetter}. Click any headword to look it up.`
            : `Complete A-to-Z directory of all ${totalCount.toLocaleString()} ${meta.shortName} entries. Pick a letter to browse.`}
        </p>
        {!activeLetter && (
          <p className="text-xs text-muted-foreground mb-6">{meta.byline}</p>
        )}

        <div className="mb-8">
          <div className="grid grid-cols-8 sm:grid-cols-11 gap-2">
            {HEBREW_ALPHABET.map((L) => {
              const count = index?.perLetterCounts[L];
              const isActive = L === activeLetter;
              return (
                <Link
                  key={L}
                  href={`${meta.routePrefix}/headwords/${encodeURIComponent(L)}`}
                  data-testid={`letter-link-${L}`}
                  className={`h-12 inline-flex flex-col items-center justify-center gap-0 rounded-md border text-lg font-hebrew transition-colors ${
                    isActive
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border hover:bg-accent"
                  }`}
                >
                  <span className="leading-none">{L}</span>
                  {count !== undefined && (
                    <span className="text-[10px] tabular-nums leading-none mt-0.5 opacity-70">
                      {count.toLocaleString()}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>

        {activeLetter && (
          <div>
            {!index ? (
              <p className="text-sm text-muted-foreground">Loading headwords…</p>
            ) : letterHeadwords.length === 0 ? (
              <p className="text-sm text-muted-foreground">No headwords found for {activeLetter}.</p>
            ) : (
              <ul
                className="columns-2 sm:columns-3 md:columns-4 gap-x-6 [&>li]:break-inside-avoid"
                dir="rtl"
              >
                {letterHeadwords.map((hw, i) => (
                  <li key={`${hw}-${i}`} className="mb-1">
                    <Link
                      href={`${meta.routePrefix}?q=${encodeURIComponent(hw)}`}
                      className="font-hebrew text-base text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:underline"
                      data-testid={`headword-${i}`}
                    >
                      {hw}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {!activeLetter && index && (
          <div className="mt-8">
            <h2 className="text-lg font-semibold mb-2">About this index</h2>
            <p className="text-sm text-muted-foreground">
              Every headword in this index links directly into the {meta.shortName} reader.
              Headwords are sourced from Sefaria's lexicon API and refreshed periodically;
              counts shown above each letter reflect the most recent snapshot.
            </p>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
