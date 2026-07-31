import { Link } from "wouter";
import { Footer } from "@/components/footer";
import { HeaderSimple } from "@/components/layout/header-simple";
import { useSEO } from "@/hooks/use-seo";
import { BreadcrumbNavigation } from "@/components/navigation/breadcrumb-navigation";
import {
  YERUSHALMI_TRACTATES,
  YERUSHALMI_HEBREW_NAMES,
  getYerushalmiTractateSlug,
} from "@shared/yerushalmi-data";
import { getStaticSEO } from "@shared/seo-data";

const SEDER_INFO: Record<string, { hebrew: string; description: string }> = {
  zeraim: { hebrew: "סדר זרעים", description: "Agriculture and blessings" },
  moed: { hebrew: "סדר מועד", description: "Holidays and appointed times" },
  nashim: { hebrew: "סדר נשים", description: "Family law and vows" },
  nezikin: { hebrew: "סדר נזיקין", description: "Damages and civil law" },
};

const SEDER_DISPLAY_NAMES: Record<string, string> = {
  zeraim: "Seder Zeraim",
  moed: "Seder Moed",
  nashim: "Seder Nashim",
  nezikin: "Seder Nezikin",
};

export default function YerushalmiContents() {
  useSEO(getStaticSEO("/yerushalmi", window.location.origin)!);

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      <HeaderSimple />

      <main className="max-w-content mx-auto px-6">
        <div className="pt-6">
          <BreadcrumbNavigation
            items={[
              { label: "Jerusalem Talmud" },
            ]}
          />
        </div>

        {/* Page title */}
        <div className="pt-4 pb-8">
          <div className="mb-3 h-[2px] w-10" style={{ backgroundColor: "var(--category-talmud-yerushalmi)" }} aria-hidden="true" />
          <h1 className="font-georgia text-3xl md:text-4xl text-foreground mb-2">Study Jerusalem Talmud Online</h1>
          <p className="text-muted-foreground">
            <span dir="rtl" lang="he">תלמוד ירושלמי</span> — 39 tractates across four Sedarim, with bilingual Hebrew-English text
          </p>
          <p className="text-sm text-muted-foreground mt-3">
            English translation by Heinrich W. Guggenheimer (ed. Guggenheimer) via{' '}
            <a href="https://www.sefaria.org" target="_blank" rel="noopener noreferrer" className="text-primary dark:text-[#5b9fc5] hover:underline">Sefaria</a>.
          </p>
        </div>

        <div>
          {Object.entries(YERUSHALMI_TRACTATES).map(([seder, tractates]) => {
            const info = SEDER_INFO[seder];
            const displayName = SEDER_DISPLAY_NAMES[seder];
            return (
              <section key={seder} className="py-8 border-t border-border">
                <div className="mb-4 flex items-baseline justify-between gap-4">
                  <div>
                    <h2 className="font-georgia text-xl text-foreground">{displayName}</h2>
                    <p className="text-sm text-muted-foreground">{info.description}</p>
                  </div>
                  <span className="text-sm text-muted-foreground font-hebrew" dir="rtl" lang="he">
                    {info.hebrew}
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                  {tractates.map((tractate) => (
                    <Link
                      key={tractate.name}
                      href={`/yerushalmi/${getYerushalmiTractateSlug(tractate.name)}`}
                      className="block border border-border rounded bg-background p-3 hover:bg-secondary"
                    >
                      <div className="text-primary dark:text-[#5b9fc5] font-medium text-base">{tractate.name}</div>
                      <div className="text-sm text-muted-foreground font-hebrew" dir="rtl" lang="he">
                        {YERUSHALMI_HEBREW_NAMES[tractate.name] || tractate.name}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {tractate.chapters} chapters
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </main>

      <Footer />
    </div>
  );
}
