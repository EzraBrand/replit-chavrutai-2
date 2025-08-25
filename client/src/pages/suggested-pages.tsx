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
    description: "Theological discussion about suffering and divine justice"
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
    description: "Fantastic travel stories"
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
    description: "Proper modesty and moral boundaries"
  },
  // Additional suggested pages from the original comprehensive list
  {
    tractate: "Berakhot",
    folio: "17a",
    title: "Prayers and devotion",
    description: "Teachings about proper prayer and spiritual connection"
  },
  {
    tractate: "Berakhot",
    folio: "28a",
    title: "Rabban Gamliel's leadership",
    description: "Leadership and the balance between authority and humility"
  },
  {
    tractate: "Berakhot",
    folio: "56b",
    title: "The meaning of dreams",
    description: "Dreams and their significance"
  },
  {
    tractate: "Berakhot",
    folio: "62a",
    title: "Outhouse decorum",
    description: "Maintaining human dignity even in the most private moments"
  },
  {
    tractate: "Berakhot",
    folio: "63b",
    title: "The academy at Yavne",
    description: "How Jewish learning was preserved after the Temple's destruction"
  },
  {
    tractate: "Shabbat",
    folio: "32b",
    title: "Divine punishments",
    description: "Understanding suffering and divine justice in the world"
  },
  {
    tractate: "Shabbat",
    folio: "33b",
    title: "Rabbi Shimon's flight from Romans",
    description: "In a time of persecution"
  },
  {
    tractate: "Shabbat",
    folio: "88b",
    title: "The giving of the Torah",
    description: "How the Jewish people accepted the Torah at Mount Sinai"
  },
  {
    tractate: "Shabbat",
    folio: "104a",
    title: "The Hebrew alphabet",
    description: "The mystical significance of Hebrew letters"
  },
  {
    tractate: "Shabbat",
    folio: "109b",
    title: "Dealing with dangerous creatures",
    description: "Practical approaches to handling life's dangers"
  },
  {
    tractate: "Shabbat",
    folio: "152a",
    title: "Old age",
    description: "Homiletic readings related to old age"
  },
  {
    tractate: "Shabbat",
    folio: "156a",
    title: "Free will vs fate",
    description: "The tension between astrology, destiny, and human choice"
  },
  {
    tractate: "Taanit",
    folio: "24b",
    title: "Miracle workers and rainmaking",
    description: "The power of righteous individuals to influence nature through prayer"
  },
  {
    tractate: "Taanit",
    folio: "29a",
    title: "Tisha B'Av mourning",
    description: "Commemorating national tragedies"
  },
  {
    tractate: "Gittin",
    folio: "56a",
    title: "The siege of Jerusalem",
    description: "Historical account of Jerusalem's destruction and its lessons"
  },
  {
    tractate: "Gittin",
    folio: "56b",
    title: "Rabban Yochanan ben Zakkai",
    description: "One leader during the Temple's destruction"
  },
  {
    tractate: "Gittin",
    folio: "58a",
    title: "Roman atrocities and Jewish resilience",
    description: "Stories of persecution"
  },
  {
    tractate: "Gittin",
    folio: "69a",
    title: "Ancient remedies and healing",
    description: "Traditional medicine"
  },
  {
    tractate: "Gittin",
    folio: "70a",
    title: "Remedies and dangerous activities",
    description: "Balancing health and safety"
  },
  {
    tractate: "Kiddushin",
    folio: "70b",
    title: "Jewish lineage and identity",
    description: "Understanding family background"
  },
  {
    tractate: "Kiddushin",
    folio: "72a",
    title: "Babylonian Jewish geography",
    description: "The Jewish world in the Talmudic era"
  },
  {
    tractate: "Kiddushin",
    folio: "82a",
    title: "Choosing a profession",
    description: "Balancing worldly occupation with spiritual values"
  },
  {
    tractate: "Pesachim",
    folio: "49b",
    title: "The Am Ha'aretz",
    description: "Relationships between scholars and common people"
  },
  {
    tractate: "Pesachim",
    folio: "54a",
    title: "Things created before the world",
    description: "Reflections on divine planning and creation"
  },
  {
    tractate: "Pesachim",
    folio: "111b",
    title: "Demons and spiritual protection",
    description: "Understanding unseen forces"
  },
  {
    tractate: "Pesachim",
    folio: "112b",
    title: "Life advice and wisdom",
    description: "Practical guidance"
  },
  {
    tractate: "Pesachim",
    folio: "117a",
    title: "Reciting Hallel",
    description: "When and how to express praise and gratitude to God"
  },
  {
    tractate: "Rosh Hashanah",
    folio: "11a",
    title: "Tishrei vs Nisan",
    description: "The significance of the months from a historical perspective"
  },
  {
    tractate: "Rosh Hashanah",
    folio: "26b",
    title: "Defining key terms",
    description: "Clarifying terms"
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
      <main className="max-w-7xl mx-auto px-4 py-4">
        {/* Breadcrumb Navigation */}
        <BreadcrumbNavigation items={breadcrumbHelpers.suggestedPages()} />

        {/* Quick Navigation */}
        <nav className="mb-6 bg-card border border-border rounded-lg p-4" role="navigation" aria-label="Quick navigation">
          <div className="flex flex-wrap gap-4 justify-center">
            <Link 
              href="/"
              className="text-primary hover:text-primary/80 font-medium inline-flex items-center gap-2 transition-colors"
              data-testid="nav-home"
            >
              🏠 Home & Contents
            </Link>
            <Link 
              href="/about"
              className="text-primary hover:text-primary/80 font-medium inline-flex items-center gap-2 transition-colors"
              data-testid="nav-about"
            >
              ℹ️ About ChavrutAI
            </Link>
            <Link 
              href="/contents/berakhot"
              className="text-primary hover:text-primary/80 font-medium inline-flex items-center gap-2 transition-colors"
              data-testid="nav-berakhot"
            >
              🙏 Berakhot
            </Link>
            <Link 
              href="/contents/shabbat"
              className="text-primary hover:text-primary/80 font-medium inline-flex items-center gap-2 transition-colors"
              data-testid="nav-shabbat"
            >
              🕯️ Shabbat
            </Link>
            <Link 
              href="/contents/sanhedrin"
              className="text-primary hover:text-primary/80 font-medium inline-flex items-center gap-2 transition-colors"
              data-testid="nav-sanhedrin"
            >
              ⚖️ Sanhedrin
            </Link>
          </div>
        </nav>

        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-primary mb-2 text-center">
            Famous Talmud Pages
          </h1>
          <p className="text-lg text-muted-foreground text-center max-w-3xl mx-auto mb-3">
            Start your Talmud journey with these essential teachings, famous stories, and foundational concepts. 
            Perfect introduction for new learners.
          </p>
          <p className="text-sm text-muted-foreground text-center">
            Each page contains centuries of rabbinic wisdom. Click any title to begin reading immediately.
          </p>
        </div>

        {/* Suggested Pages Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          {SUGGESTED_PAGES.map((page, index) => (
            <Link 
              key={index}
              href={`/tractate/${encodeURIComponent(page.tractate.toLowerCase())}/${page.folio}`}
            >
              <Card className="hover:shadow-sm transition-shadow cursor-pointer border-border hover:border-primary/20 bg-card/50">
                <div className="p-3">
                  <div className="text-primary font-medium text-sm mb-1">
                    {page.tractate} {page.folio}
                  </div>
                  <h3 className="text-sm font-semibold text-foreground mb-2 leading-tight">
                    {page.title}
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {page.description}
                  </p>
                </div>
              </Card>
            </Link>
          ))}
        </div>

        {/* Footer note */}
        <div className="mt-6 text-center">
          <p className="text-xs text-muted-foreground">
            A curated selection of the most significant pages in the Talmud.
          </p>
        </div>
      </main>
    </div>
  );
}