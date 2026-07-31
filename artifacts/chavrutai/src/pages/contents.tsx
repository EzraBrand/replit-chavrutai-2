import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { FooterPlaceholder } from "@/components/page-loading";
import { HeaderSimple } from "@/components/layout/header-simple";
import { PageShell, PageHeader, PageSection, SectionHeading } from "@/components/layout";
import { useSEO, generateSEOData } from "@/hooks/use-seo";
import { sefariaAPI } from "@/lib/sefaria";
import { TRACTATE_HEBREW_NAMES } from "@shared/tractates";
import { trackEvent } from "@/lib/analytics";

// Seder organization with Hebrew names
const SEDER_ORGANIZATION = {
  "Seder Zeraim": {
    hebrew: "סדר זרעים",
    description: "Agriculture and blessings",
    tractates: ["Berakhot"]
  },
  "Seder Moed": {
    hebrew: "סדר מועד", 
    description: "Holidays and appointed times",
    tractates: ["Shabbat", "Eruvin", "Pesachim", "Rosh Hashanah", "Yoma", "Sukkah", "Beitzah", "Taanit", "Megillah", "Moed Katan", "Chagigah"]
  },
  "Seder Nashim": {
    hebrew: "סדר נשים",
    description: "Women and family law", 
    tractates: ["Yevamot", "Ketubot", "Nedarim", "Nazir", "Sotah", "Gittin", "Kiddushin"]
  },
  "Seder Nezikin": {
    hebrew: "סדר נזיקין",
    description: "Damages and civil law",
    tractates: ["Bava Kamma", "Bava Metzia", "Bava Batra", "Sanhedrin", "Makkot", "Shevuot", "Avodah Zarah", "Horayot"]
  },
  "Seder Kodashim": {
    hebrew: "סדר קדשים", 
    description: "Holy things and sacrifices",
    tractates: ["Zevachim", "Menachot", "Chullin", "Bekhorot", "Arakhin", "Temurah", "Keritot", "Meilah", "Tamid"]
  },
  "Seder Tohorot": {
    hebrew: "סדר טהרות",
    description: "Ritual purity",
    tractates: ["Niddah"]
  }
};

export default function Contents() {
  // Set up SEO
  useSEO(generateSEOData.contentsPage());

  const { data: tractatesData, isLoading } = useQuery({
    queryKey: ['/api/tractates'],
    queryFn: () => sefariaAPI.getTractates("Talmud Bavli")
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <HeaderSimple />
        <div className="max-w-content mx-auto px-6 py-12">
          <div className="text-center text-muted-foreground">Loading...</div>
        </div>
        <FooterPlaceholder />
      </div>
    );
  }

  const availableTractates = tractatesData || [];

  return (
    <PageShell>
      {/* Page title */}
      <PageHeader
        category="talmud-bavli"
        title="Study Talmud Online"
      >
        <p className="text-muted-foreground">
          <span dir="rtl" lang="he">תלמוד בבלי</span> — all 37 tractates of the Babylonian Talmud with bilingual Hebrew-English text
        </p>
      </PageHeader>

      {/* Seder Sections */}
      <div>
        {Object.entries(SEDER_ORGANIZATION).map(([sederName, sederData]) => {
          // Filter tractates that are available in our data
          const availableSederTractates = sederData.tractates.filter(
            tractate => availableTractates.includes(tractate)
          );

          if (availableSederTractates.length === 0) return null;

          return (
            <PageSection key={sederName}>
              {/* Seder Header */}
              <div className="mb-4 flex items-baseline justify-between gap-4">
                <div>
                  <SectionHeading>
                    {sederName}
                  </SectionHeading>
                  <p className="text-sm text-muted-foreground">{sederData.description}</p>
                </div>
                <span className="text-sm text-muted-foreground font-hebrew" dir="rtl" lang="he">
                  {sederData.hebrew}
                </span>
              </div>

              {/* Tractates Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {availableSederTractates.map((tractate) => (
                  <Link 
                    key={tractate} 
                    href={`/talmud/${encodeURIComponent(tractate.toLowerCase())}`}
                    onClick={() => trackEvent('select_tractate', 'navigation', tractate)}
                    className="block border border-border rounded bg-background p-3 hover:bg-secondary"
                  >
                    <div className="text-primary dark:text-[#5b9fc5] font-medium text-base">{tractate}</div>
                    <div className="text-sm text-muted-foreground font-hebrew" dir="rtl" lang="he">
                      {TRACTATE_HEBREW_NAMES[tractate as keyof typeof TRACTATE_HEBREW_NAMES] || tractate}
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
