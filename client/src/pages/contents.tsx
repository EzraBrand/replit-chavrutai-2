import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HamburgerMenu } from "@/components/navigation/hamburger-menu";
import { BreadcrumbNavigation, breadcrumbHelpers } from "@/components/navigation/breadcrumb-navigation";
import { Footer } from "@/components/footer";
import { useSEO, generateSEOData } from "@/hooks/use-seo";
import { sefariaAPI } from "@/lib/sefaria";
import { TRACTATE_LISTS, TRACTATE_HEBREW_NAMES } from "@shared/tractates";
import { trackEvent } from "@/lib/analytics";
import hebrewBookIcon from "@/assets/hebrew-book-icon.png";
import type { TalmudLocation } from "@/types/talmud";

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
    tractates: ["Shabbat", "Eruvin", "Pesachim", "Rosh Hashanah", "Yoma", "Sukkah", "Beitza", "Taanit", "Megillah", "Moed Katan", "Chagigah"]
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
    tractates: ["Zevachim", "Menachot", "Chullin", "Bekhorot", "Arachin", "Temurah", "Keritot", "Meilah", "Tamid", "Middot", "Kinnim"]
  },
  "Seder Tohorot": {
    hebrew: "סדר טהרות",
    description: "Ritual purity",
    tractates: ["Niddah"]
  }
};



export default function Contents() {
  // Set up SEO
  useSEO(generateSEOData.homePage());

  const { data: tractatesData, isLoading } = useQuery({
    queryKey: ['/api/tractates'],
    queryFn: () => sefariaAPI.getTractates("Talmud Bavli")
  });

  // Navigation handler for hamburger menu
  const handleLocationChange = (newLocation: TalmudLocation) => {
    // Navigate to clean URL
    const tractateSlug = newLocation.tractate.toLowerCase().replace(/\s+/g, '-');
    const folioSlug = `${newLocation.folio}${newLocation.side}`;
    window.location.href = `/tractate/${tractateSlug}/${folioSlug}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="sticky top-0 z-50 bg-card border-b border-border shadow-sm">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              {/* Hamburger Menu */}
              <HamburgerMenu onLocationChange={handleLocationChange} />
              
              {/* Logo */}
              <div className="flex items-center space-x-2 flex-shrink-0">
                <div className="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden">
                  <img 
                    src={hebrewBookIcon} 
                    alt="ChavrutAI Logo" 
                    className="w-10 h-10 object-cover"
                  />
                </div>
                <h1 className="text-xl font-semibold text-primary font-roboto">ChavrutAI</h1>
              </div>
              
              {/* Empty space for balance */}
              <div className="w-10 flex-shrink-0"></div>
            </div>
          </div>
        </header>
        
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="text-center">Loading...</div>
        </div>
      </div>
    );
  }

  const availableTractates = tractatesData || [];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Hamburger Menu */}
            <HamburgerMenu onLocationChange={handleLocationChange} />
            
            {/* Logo */}
            <div className="flex items-center space-x-2 flex-shrink-0">
              <div className="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden">
                <img 
                  src={hebrewBookIcon} 
                  alt="ChavrutAI Logo" 
                  className="w-10 h-10 object-cover"
                />
              </div>
              <h1 className="text-xl font-semibold text-primary font-roboto">ChavrutAI</h1>
            </div>
            
            {/* Empty space for balance */}
            <div className="w-10 flex-shrink-0"></div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-4">
        {/* Breadcrumbs */}
        <BreadcrumbNavigation items={breadcrumbHelpers.contents()} />
        
        {/* Header */}
        <div className="text-center mb-4">
          <h1 className="text-3xl font-bold text-primary mb-1">Study Talmud Online</h1>
          <h2 className="text-xl text-primary/80 mb-2">תלמוד בבלי - Babylonian Talmud</h2>
          <p className="text-base text-muted-foreground">Complete digital collection of all 37 tractates with Hebrew-English text display</p>
        </div>

        {/* Main Navigation Section */}
        <nav className="mb-8" role="navigation" aria-label="Main study sections">
          <h2 className="text-lg font-semibold text-primary mb-4 text-center">Study Options</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Link 
              href="/suggested-pages"
              className="group block"
              onClick={() => trackEvent('select_main_nav', 'navigation', 'suggested_pages')}
              data-testid="nav-suggested-pages"
            >
              <Card className="hover:shadow-md transition-all duration-200 cursor-pointer border-border hover:border-primary/30 bg-card/50 group-hover:bg-card h-full">
                <div className="p-6 text-center">
                  <div className="text-3xl mb-3">📚</div>
                  <h3 className="text-xl font-semibold text-primary mb-2">Famous Pages</h3>
                  <p className="text-sm text-muted-foreground mb-3">Start with the most significant and well-known Talmud passages</p>
                  <p className="text-xs text-primary/70">Perfect for beginners</p>
                </div>
              </Card>
            </Link>
            
            <Link 
              href="/contents/berakhot"
              className="group block"
              onClick={() => trackEvent('select_main_nav', 'navigation', 'berakhot')}
              data-testid="nav-berakhot"
            >
              <Card className="hover:shadow-md transition-all duration-200 cursor-pointer border-border hover:border-primary/30 bg-card/50 group-hover:bg-card h-full">
                <div className="p-6 text-center">
                  <div className="text-3xl mb-3">🙏</div>
                  <h3 className="text-xl font-semibold text-primary mb-2">Start with Berakhot</h3>
                  <p className="text-sm text-muted-foreground mb-3">Begin your study with blessings and prayers</p>
                  <p className="text-xs text-primary/70">Traditional starting point</p>
                </div>
              </Card>
            </Link>
            
            <Link 
              href="/about"
              className="group block"
              onClick={() => trackEvent('select_main_nav', 'navigation', 'about')}
              data-testid="nav-about"
            >
              <Card className="hover:shadow-md transition-all duration-200 cursor-pointer border-border hover:border-primary/30 bg-card/50 group-hover:bg-card h-full">
                <div className="p-6 text-center">
                  <div className="text-3xl mb-3">ℹ️</div>
                  <h3 className="text-xl font-semibold text-primary mb-2">About ChavrutAI</h3>
                  <p className="text-sm text-muted-foreground mb-3">Learn about our platform and features</p>
                  <p className="text-xs text-primary/70">Get started guide</p>
                </div>
              </Card>
            </Link>
          </div>
          
          {/* Popular Tractates Quick Access */}
          <div className="bg-card border border-border rounded-lg p-4">
            <h3 className="text-base font-semibold text-primary mb-3 text-center">Popular Tractates</h3>
            <div className="flex flex-wrap justify-center gap-3">
              {["Shabbat", "Sanhedrin", "Bava Metzia", "Yoma", "Pesachim"].map((tractate) => (
                <Link 
                  key={tractate}
                  href={`/contents/${tractate.toLowerCase().replace(/\s+/g, '-')}`}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-primary/10 hover:bg-primary/20 text-primary rounded-full text-sm font-medium transition-colors"
                  onClick={() => trackEvent('select_popular_tractate', 'navigation', tractate)}
                  data-testid={`popular-${tractate.toLowerCase()}`}
                >
                  {tractate}
                </Link>
              ))}
            </div>
          </div>
        </nav>

        {/* Seder Sections */}
        <div className="space-y-4">
          {Object.entries(SEDER_ORGANIZATION).map(([sederName, sederData]) => {
            // Filter tractates that are available in our data
            const availableSederTractates = sederData.tractates.filter(
              tractate => availableTractates.includes(tractate)
            );

            if (availableSederTractates.length === 0) return null;

            return (
              <div key={sederName} className="space-y-2">
                {/* Seder Header */}
                <div className="text-center border-b border-border pb-2">
                  <h3 className="text-xl font-semibold text-primary">
                    {sederName}
                  </h3>
                  <p className="text-base text-primary/70 font-hebrew">
                    {sederData.hebrew}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {sederData.description}
                  </p>
                </div>

                {/* Tractates Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                  {availableSederTractates.map((tractate) => (
                    <Link 
                      key={tractate} 
                      href={`/contents/${encodeURIComponent(tractate.toLowerCase())}`}
                      onClick={() => trackEvent('select_tractate', 'navigation', tractate)}
                    >
                      <Card className="hover:shadow-sm transition-shadow cursor-pointer border-border hover:border-primary/20 bg-card/50">
                        <div className="p-3">
                          <div className="text-primary font-medium text-base">{tractate}</div>
                          <div className="text-sm text-primary/70 font-hebrew">
                            {TRACTATE_HEBREW_NAMES[tractate as keyof typeof TRACTATE_HEBREW_NAMES] || tractate}
                          </div>
                        </div>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      <Footer />
    </div>
  );
}