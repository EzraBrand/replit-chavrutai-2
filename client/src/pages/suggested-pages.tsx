import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BreadcrumbNavigation, breadcrumbHelpers } from "@/components/navigation/breadcrumb-navigation";
import { HamburgerMenu } from "@/components/navigation/hamburger-menu";
import { useSEO, generateSEOData } from "@/hooks/use-seo";
import hebrewBookIcon from "@/assets/hebrew-book-icon.png";
import type { TalmudLocation } from "@/types/talmud";

// Suggested pages for exploration - famous and significant folios
const SUGGESTED_PAGES = [
  {
    tractate: "Berakhot",
    folio: "2a",
    title: "When do we recite the evening Shema?",
    description: "The opening question of the Talmud - the very first discussion that begins the entire Babylonian Talmud"
  },
  {
    tractate: "Berakhot", 
    folio: "5a",
    title: "Why do the righteous suffer?",
    description: "Deep theological discussion about suffering and divine justice"
  },
  {
    tractate: "Berakhot",
    folio: "31a", 
    title: "Hannah's prayer",
    description: "The paradigm for proper prayer, derived from Hannah's silent devotion"
  },
  {
    tractate: "Shabbat",
    folio: "31a",
    title: "Hillel and the Golden Rule", 
    description: "The famous story of Hillel teaching the entire Torah while standing on one foot"
  },
  {
    tractate: "Shabbat",
    folio: "118b",
    title: "The joy of Shabbat",
    description: "Celebrating Shabbat with proper joy and the spiritual rewards it brings"
  },
  {
    tractate: "Shabbat",
    folio: "133b",
    title: "Imitating God's attributes",
    description: "How humans should emulate divine qualities of kindness and compassion"
  },
  {
    tractate: "Eruvin", 
    folio: "13b",
    title: "Hillel vs Shammai",
    description: "The great debate over whose teachings should be followed and why"
  },
  {
    tractate: "Pesachim",
    folio: "50a",
    title: "This world vs the next",
    description: "Fundamental differences between our current reality and the world to come"
  },
  {
    tractate: "Yoma",
    folio: "85b",
    title: "Saving a life overrides Shabbat",
    description: "The principle that pikuach nefesh (saving life) takes precedence over almost all other laws"
  },
  {
    tractate: "Sukkah",
    folio: "52a",
    title: "The evil inclination",
    description: "Understanding the yetzer hara and strategies for overcoming negative impulses"
  },
  {
    tractate: "Rosh Hashanah",
    folio: "16b",
    title: "Divine judgment",
    description: "How God judges humanity on Rosh Hashanah and the books of life"
  },
  {
    tractate: "Taanit",
    folio: "23a",
    title: "Honi the Circle Drawer",
    description: "The righteous man who could bring rain through his prayers"
  },
  {
    tractate: "Bava Batra",
    folio: "74a",
    title: "Rabbah bar bar Hana's tales",
    description: "Fantastic travel stories with deep allegorical meanings"
  },
  {
    tractate: "Sanhedrin",
    folio: "37a",
    title: "The value of a single life", 
    description: "Why every human life is infinitely precious - saving one life saves an entire world"
  },
  {
    tractate: "Sanhedrin",
    folio: "74a",
    title: "Martyrdom vs life",
    description: "When one must choose death over violating religious principles"
  },
  {
    tractate: "Avoda Zara",
    folio: "20a",
    title: "Modesty and purity",
    description: "The spiritual benefits of living with proper modesty and moral boundaries"
  }
];

export default function SuggestedPages() {
  // Set up SEO
  useSEO(generateSEOData.suggestedPages());

  // Navigation handler for hamburger menu
  const handleLocationChange = (newLocation: TalmudLocation) => {
    const tractateSlug = encodeURIComponent(newLocation.tractate.toLowerCase());
    const folioSlug = `${newLocation.folio}${newLocation.side}`;
    window.location.href = `/tractate/${tractateSlug}/${folioSlug}`;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Hamburger Menu */}
            <HamburgerMenu onLocationChange={handleLocationChange} />
            
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-3">
              <img 
                src={hebrewBookIcon} 
                alt="ChavrutAI" 
                className="h-8 w-8 object-contain"
              />
              <h1 className="text-xl font-bold text-foreground">ChavrutAI</h1>
            </Link>
            
            {/* Spacer for centering */}
            <div className="w-[40px]" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Breadcrumb Navigation */}
        <BreadcrumbNavigation items={breadcrumbHelpers.suggestedPages()} />

        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-4">
            Suggested Pages
          </h1>
          <p className="text-lg text-muted-foreground">
            Explore some of the most famous and significant discussions in the Talmud. 
            These pages contain foundational teachings, inspiring stories, and profound wisdom 
            that have shaped Jewish thought for centuries.
          </p>
        </div>

        {/* Suggested Pages Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {SUGGESTED_PAGES.map((page, index) => (
            <Link 
              key={index}
              href={`/tractate/${encodeURIComponent(page.tractate.toLowerCase())}/${page.folio}`}
            >
              <Card className="h-full hover:shadow-md transition-shadow cursor-pointer border-border hover:border-primary/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">
                    {page.tractate} {page.folio}
                  </CardTitle>
                  <h3 className="text-base font-semibold text-primary">
                    {page.title}
                  </h3>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {page.description}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Footer note */}
        <div className="mt-12 text-center">
          <p className="text-sm text-muted-foreground">
            These selections represent just a small sample of the wisdom contained in the Talmud. 
            Each page opens doorways to deeper understanding and connection with centuries of Jewish learning.
          </p>
        </div>
      </main>
    </div>
  );
}