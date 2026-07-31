import { Link } from "wouter";
import { PageShell, PageHeader, PageSection, SectionHeading } from "@/components/layout";
import { useSEO } from "@/hooks/use-seo";
import { BreadcrumbNavigation } from "@/components/navigation/breadcrumb-navigation";
import {
  MISHNAH_ONLY_TRACTATES,
  MISHNAH_ONLY_HEBREW_NAMES,
  getMishnahTractateSlug,
} from "@shared/tractates";
import { getStaticSEO } from "@shared/seo-data";

const SEDER_INFO: Record<string, { hebrew: string; description: string }> = {
  zeraim: { hebrew: "סדר זרעים", description: "Agriculture and blessings" },
  moed: { hebrew: "סדר מועד", description: "Holidays and appointed times" },
  nezikin: { hebrew: "סדר נזיקין", description: "Damages and civil law" },
  kodashim: { hebrew: "סדר קדשים", description: "Holy things and sacrifices" },
  tohorot: { hebrew: "סדר טהרות", description: "Ritual purity" },
};

const SEDER_DISPLAY_NAMES: Record<string, string> = {
  zeraim: "Seder Zeraim",
  moed: "Seder Moed",
  nezikin: "Seder Nezikin",
  kodashim: "Seder Kodashim",
  tohorot: "Seder Tohorot",
};

export default function MishnahContents() {
  useSEO(getStaticSEO("/mishnah", window.location.origin)!);

  return (
    <PageShell>
      <div className="pt-6">
        <BreadcrumbNavigation
          items={[
            { label: "Mishnah" },
          ]}
        />
      </div>

      {/* Page title */}
      <PageHeader
        category="mishnah"
        title="Study Mishnah Online"
        className="pt-4 pb-8"
      >
        <p className="text-muted-foreground">
          <span dir="rtl" lang="he">משנה</span> — 26 tractates not covered by the Babylonian Talmud, with Hebrew-English text
        </p>
        <p className="text-sm text-muted-foreground mt-3">
          English translation by Dr. Joshua Kulp, "Mishnah Yomit" (CC-BY) via{' '}
          <a href="https://www.sefaria.org" target="_blank" rel="noopener noreferrer" className="text-primary dark:text-[#5b9fc5] hover:underline">Sefaria</a>.{' '}
          Hebrew text: Torat Emet.
        </p>
      </PageHeader>

      <div>
          {Object.entries(MISHNAH_ONLY_TRACTATES).map(([seder, tractates]) => {
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
                      href={`/mishnah/${getMishnahTractateSlug(tractate.name)}`}
                      className="block border border-border rounded bg-background p-3 hover:bg-secondary"
                    >
                      <div className="text-primary dark:text-[#5b9fc5] font-medium text-base">{tractate.name}</div>
                      <div className="text-sm text-muted-foreground font-hebrew" dir="rtl" lang="he">
                        {MISHNAH_ONLY_HEBREW_NAMES[tractate.name] || tractate.name}
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
