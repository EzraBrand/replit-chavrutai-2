import { Link } from "wouter";
import { ScrollText, BookOpen, Search, Star, BookMarked, Languages, MapPin } from "lucide-react";
import { Footer } from "@/components/footer";
import { DafYomiWidget } from "@/components/DafYomiWidget";
import { QuickSearch } from "@/components/QuickSearch";
import { useSEO, generateSEOData } from "@/hooks/use-seo";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function Home() {
  useSEO(generateSEOData.homePage());

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-card border-b border-border shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-center">
            <Link 
              href="/"
              className="flex items-center space-x-2 flex-shrink-0 hover:opacity-80 transition-opacity duration-200"
              data-testid="header-logo-link"
            >
              <div className="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden">
                <img 
                  src="/images/hebrew-book-icon.png" 
                  alt="ChavrutAI Logo" 
                  className="w-10 h-10 object-cover"
                />
              </div>
              <div className="text-xl font-semibold text-primary font-roboto">ChavrutAI</div>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <section className="text-center mb-10" data-testid="hero-section">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
            Study Classical Jewish Texts
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Explore the Babylonian Talmud and Hebrew Bible with bilingual Hebrew-English text
          </p>
        </section>

        <section className="grid md:grid-cols-2 gap-6 mb-10" data-testid="primary-texts-section">
          <Card className="hover:shadow-lg transition-shadow duration-200">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                  <ScrollText className="w-6 h-6 text-amber-700 dark:text-amber-400" />
                </div>
                <h2 className="text-xl font-semibold text-foreground">Babylonian Talmud</h2>
              </div>
              <p className="text-muted-foreground mb-4">
                All 37 tractates with over 5,400 folio pages. Navigate by Seder, tractate, chapter, or individual page.
              </p>
              <Link href="/contents">
                <Button variant="default" className="w-full" data-testid="button-browse-talmud">
                  Browse Talmud
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow duration-200">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <BookOpen className="w-6 h-6 text-blue-700 dark:text-blue-400" />
                </div>
                <h2 className="text-xl font-semibold text-foreground">Tanakh (Hebrew Bible)</h2>
              </div>
              <p className="text-muted-foreground mb-4">
                Torah, Prophets, and Writings. Each book includes Hebrew text with English translation.
              </p>
              <Link href="/bible">
                <Button variant="default" className="w-full" data-testid="button-browse-tanakh">
                  Browse Tanakh
                </Button>
              </Link>
            </CardContent>
          </Card>
        </section>

        <section className="mb-10" data-testid="search-section">
          <div className="bg-card rounded-lg border border-border p-6">
            <div className="flex items-center gap-2 mb-4">
              <Search className="w-5 h-5 text-muted-foreground" />
              <h2 className="text-lg font-semibold text-foreground">Search Texts</h2>
            </div>
            <QuickSearch />
          </div>
        </section>

        <section className="mb-10" data-testid="suggested-pages-section">
          <Card className="hover:shadow-lg transition-shadow duration-200">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                    <Star className="w-6 h-6 text-yellow-700 dark:text-yellow-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-foreground">Famous Talmud Pages</h2>
                    <p className="text-muted-foreground text-sm">Discover well-known passages and essential readings</p>
                  </div>
                </div>
                <Link href="/suggested-pages">
                  <Button variant="outline" data-testid="button-suggested-pages">
                    Explore
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="mb-10" data-testid="daf-yomi-section">
          <DafYomiWidget />
        </section>

        <section className="mb-10" data-testid="tools-section">
          <h2 className="text-xl font-semibold text-foreground mb-4">Study Tools</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link href="/sugya-viewer" className="block">
              <Card className="h-full hover:shadow-lg transition-shadow duration-200 cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <BookMarked className="w-5 h-5 text-purple-600" />
                    <h3 className="font-medium text-foreground">Sugya Viewer</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">Study custom text ranges</p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/dictionary" className="block">
              <Card className="h-full hover:shadow-lg transition-shadow duration-200 cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Languages className="w-5 h-5 text-green-600" />
                    <h3 className="font-medium text-foreground">Dictionary</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">Jastrow Talmud Dictionary</p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/biblical-index" className="block">
              <Card className="h-full hover:shadow-lg transition-shadow duration-200 cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <BookOpen className="w-5 h-5 text-indigo-600" />
                    <h3 className="font-medium text-foreground">Biblical Index</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">Bible-to-Talmud citations</p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/mishnah-map" className="block">
              <Card className="h-full hover:shadow-lg transition-shadow duration-200 cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="w-5 h-5 text-red-600" />
                    <h3 className="font-medium text-foreground">Mishnah Map</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">Mishnah-Talmud mapping</p>
                </CardContent>
              </Card>
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
