import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HamburgerMenu } from "@/components/navigation/hamburger-menu";
import { BreadcrumbNavigation, breadcrumbHelpers } from "@/components/navigation/breadcrumb-navigation";
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

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Breadcrumbs */}
        <BreadcrumbNavigation items={breadcrumbHelpers.contents()} />
        
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-primary mb-2">Study Talmud Online Free</h1>
          <h2 className="text-2xl text-primary/80 mb-4">תלמוד בבלי - Babylonian Talmud</h2>
          <p className="text-lg text-muted-foreground mb-4">Complete digital collection of all 37 tractates with Hebrew-English text display</p>
          <div className="max-w-2xl mx-auto text-sm text-muted-foreground leading-relaxed">
            <p>Access the full Babylonian Talmud for free. Navigate through traditional Seder organization, explore famous teachings, and study with modern digital tools designed for learners at all levels.</p>
          </div>
        </div>

        {/* Quick Links Section */}
        <div className="mb-12 bg-card border border-border rounded-lg p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-primary mb-2">New to Talmud Study?</h3>
              <p className="text-sm text-muted-foreground mb-3">Start with the most famous and accessible teachings.</p>
              <Link 
                href="/suggested-pages"
                className="inline-flex items-center text-primary hover:text-primary/80 font-medium text-sm"
                data-testid="link-suggested-pages"
              >
                Explore Famous Pages →
              </Link>
            </div>
            <div className="text-center">
              <h3 className="text-lg font-semibold text-primary mb-2">Learn More</h3>
              <p className="text-sm text-muted-foreground mb-3">Discover ChavrutAI's features and approach to digital learning.</p>
              <Link 
                href="/about"
                className="inline-flex items-center text-primary hover:text-primary/80 font-medium text-sm"
                data-testid="link-about"
              >
                About ChavrutAI →
              </Link>
            </div>
            <div className="text-center">
              <h3 className="text-lg font-semibold text-primary mb-2">Popular Tractates</h3>
              <p className="text-sm text-muted-foreground mb-3">Begin with the most studied tractates.</p>
              <Link 
                href="/contents/berakhot"
                className="inline-flex items-center text-primary hover:text-primary/80 font-medium text-sm"
                data-testid="link-berakhot"
              >
                Start with Berakhot →
              </Link>
            </div>
          </div>
        </div>

        {/* Seder Sections */}
        <div className="space-y-8">
          {Object.entries(SEDER_ORGANIZATION).map(([sederName, sederData]) => {
            // Filter tractates that are available in our data
            const availableSederTractates = sederData.tractates.filter(
              tractate => availableTractates.includes(tractate)
            );

            if (availableSederTractates.length === 0) return null;

            return (
              <div key={sederName} className="space-y-4">
                {/* Seder Header */}
                <div className="text-center border-b border-border pb-4">
                  <h3 className="text-2xl font-semibold text-primary">
                    {sederName}
                  </h3>
                  <p className="text-lg text-primary/70 font-hebrew">
                    {sederData.hebrew}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {sederData.description}
                  </p>
                </div>

                {/* Tractates Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {availableSederTractates.map((tractate) => (
                    <Link 
                      key={tractate} 
                      href={`/contents/${encodeURIComponent(tractate.toLowerCase())}`}
                      onClick={() => trackEvent('select_tractate', 'navigation', tractate)}
                    >
                      <Card className="h-full hover:shadow-md transition-shadow cursor-pointer border-border hover:border-primary/20">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-lg">
                            <div className="text-primary">{tractate}</div>
                            <div className="text-sm text-primary/70 font-hebrew mt-1">
                              {TRACTATE_HEBREW_NAMES[tractate as keyof typeof TRACTATE_HEBREW_NAMES] || tractate}
                            </div>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground">
                            Click to view chapters and pages
                          </p>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}