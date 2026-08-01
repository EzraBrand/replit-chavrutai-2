import { Link } from "wouter";
import { PageShell, PageHeader, PageSection, SectionHeading } from "@/components/layout";
import { useSEO } from "@/hooks/use-seo";
import { BreadcrumbNavigation } from "@/components/navigation/breadcrumb-navigation";
import {
  YERUSHALMI_TRACTATES,
  YERUSHALMI_HEBREW_NAMES,
  getYerushalmiTractateSlug,
} from "@workspace/shared-data/yerushalmi-data";
import { getStaticSEO } from "@workspace/shared-data/seo-data";

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
    <PageShell>
      <div className="pt-6">
        <BreadcrumbNavigation
          items={[
            { label: "Jerusalem Talmud" },
          ]}
        />
      </div>

      {/* Page title */}
      <PageHeader
        category="talmud-yerushalmi"
        title="Study Jerusalem Talmud Online"
        className="pt-4 pb-8"
      >
        <p className="text-muted-foreground">
          <span dir="rtl" lang="he">תלמוד ירושלמי</span> — 39 tractates across four Sedarim, with bilingual Hebrew-English text
        </p>
        <p className="text-sm text-muted-foreground mt-3">
          English translation by Heinrich W. Guggenheimer (ed. Guggenheimer) via{' '}
          <a href="https://www.sefaria.org" target="_blank" rel="noopener noreferrer" className="text-primary dark:text-[#5b9fc5] hover:underline">Sefaria</a>.
        </p>
      </PageHeader>

      <div>
          {Object.entries(YERUSHALMI_TRACTATES).map(([seder, tractates]) => {
            const info = SEDER_INFO[seder];
            const displayName = SEDER_DISPLAY_NAMES[seder];
            return (
              <PageSection key={seder}>
                <div className="mb-4 flex items-baseline justify-between gap-4">
                  <div>
                    <SectionHeading>{displayName}</SectionHeading>
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
              </PageSection>
            );
          })}
        </div>
    </PageShell>
  );
}
