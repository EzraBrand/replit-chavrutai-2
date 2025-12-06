import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ExternalLink, Search, BookOpen, FileText, Info } from "lucide-react";
import { TRACTATE_LISTS, TRACTATE_HEBREW_NAMES, normalizeDisplayTractateName, getMaxFolio, isValidTractate } from "@shared/tractates";
import { 
  getAllExternalLinks, 
  getSectionLinks, 
  getPageLinks,
  type TalmudReference, 
  type ExternalLink as ExternalLinkType 
} from "@/lib/external-links";

function ExternalLinksPage() {
  const [location] = useLocation();
  const [tractate, setTractate] = useState<string>("Shabbat");
  const [folio, setFolio] = useState<number>(2);
  const [side, setSide] = useState<'a' | 'b'>('a');
  const [section, setSection] = useState<number | undefined>(undefined);
  const [sectionInput, setSectionInput] = useState<string>("");
  const [links, setLinks] = useState<ExternalLinkType[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");

  useEffect(() => {
    const params = new URLSearchParams(location.split('?')[1] || '');
    const t = params.get('tractate');
    const f = params.get('folio');
    const sec = params.get('section');

    if (t && isValidTractate(t)) {
      setTractate(normalizeDisplayTractateName(t));
    }
    if (f) {
      const match = f.match(/^(\d+)([ab])$/);
      if (match) {
        setFolio(parseInt(match[1]));
        setSide(match[2] as 'a' | 'b');
      }
    }
    if (sec) {
      const sectionNum = parseInt(sec);
      if (!isNaN(sectionNum)) {
        setSection(sectionNum);
        setSectionInput(sec);
      }
    }
  }, [location]);

  useEffect(() => {
    const ref: TalmudReference = {
      tractate,
      folio,
      side,
      section
    };
    setLinks(getAllExternalLinks(ref));
  }, [tractate, folio, side, section]);

  const handleSearch = () => {
    const match = searchQuery.match(/^([a-zA-Z\s]+)\s+(\d+)([ab])(?:\s*,?\s*(?:section\s*)?(\d+))?$/i);
    if (match) {
      const searchTractate = match[1].trim();
      const searchFolio = parseInt(match[2]);
      const searchSide = match[3].toLowerCase() as 'a' | 'b';
      const searchSection = match[4] ? parseInt(match[4]) : undefined;

      if (isValidTractate(searchTractate)) {
        setTractate(normalizeDisplayTractateName(searchTractate));
        setFolio(searchFolio);
        setSide(searchSide);
        setSection(searchSection);
        setSectionInput(searchSection?.toString() || "");
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleSectionChange = (value: string) => {
    setSectionInput(value);
    if (value === '') {
      setSection(undefined);
    } else {
      const num = parseInt(value);
      if (!isNaN(num) && num > 0) {
        setSection(num);
      }
    }
  };

  const maxFolio = getMaxFolio(tractate);
  const currentRef = `${tractate} ${folio}${side}${section ? `, section ${section}` : ''}`;
  const hebrewName = TRACTATE_HEBREW_NAMES[tractate as keyof typeof TRACTATE_HEBREW_NAMES] || '';

  const sectionLinks = getSectionLinks({ tractate, folio, side, section });
  const pageLinks = getPageLinks({ tractate, folio, side, section });

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
            <ExternalLink className="w-8 h-8" />
            External Talmud Links
          </h1>
          <p className="text-muted-foreground">
            Internal testing page for external Talmud resource links
          </p>
        </div>

        <Card className="mb-6">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Info className="w-5 h-5" />
              Related Articles
            </CardTitle>
            <CardDescription>
              Blog posts and articles about digital Talmud resources
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li>
                <a 
                  href="https://www.ezrabrand.com/p/chavrutai-talmud-web-app-launch-review"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                  data-testid="link-chavrutai-review"
                >
                  ChavrutAI Talmud Web App Launch: Review and Comparison with Similar Platforms
                </a>
              </li>
              <li>
                <a 
                  href="https://seforimblog.com/2023/06/from-print-to-pixel-digital-editions-of-the-talmud-bavli/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                  data-testid="link-pixel-article"
                >
                  From Print to Pixel: Digital Editions of the Talmud Bavli (Seforim Blog)
                </a>
              </li>
              <li>
                <a 
                  href="https://www.ezrabrand.com/p/evaluating-al-hatorahs-digital-repository"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                  data-testid="link-alhatorah-review"
                >
                  Evaluating Al HaTorah's Digital Repository
                </a>
              </li>
              <li>
                <a 
                  href="https://www.ezrabrand.com/p/more-on-the-formatting-of-the-talmud"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                  data-testid="link-comparison-blogpost"
                >
                  More on the Formatting of the Talmud (comparison blogpost)
                </a>
              </li>
              <li>
                <a 
                  href="https://www.ezrabrand.com/p/helpful-formatting-of-the-talmud"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                  data-testid="link-helpful-formatting"
                >
                  Helpful Formatting of the Talmud: Ohr Somayach's 'Talmud Navigator'
                </a>
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="w-5 h-5" />
              Quick Search
            </CardTitle>
            <CardDescription>
              Enter a reference like "Shabbat 156a, section 14" or "Berakhot 2a"
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                placeholder="e.g., Shabbat 156a, section 14"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-1"
                data-testid="input-search-query"
              />
              <Button onClick={handleSearch} data-testid="button-search">
                <Search className="w-4 h-4 mr-2" />
                Search
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Manual Selection</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="col-span-2">
                <Label htmlFor="tractate">Tractate</Label>
                <Select value={tractate} onValueChange={setTractate}>
                  <SelectTrigger id="tractate" data-testid="select-tractate">
                    <SelectValue placeholder="Select tractate" />
                  </SelectTrigger>
                  <SelectContent>
                    {TRACTATE_LISTS["Talmud Bavli"].map((t) => (
                      <SelectItem key={t} value={t}>
                        {t} ({TRACTATE_HEBREW_NAMES[t as keyof typeof TRACTATE_HEBREW_NAMES] || ''})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="folio">Folio</Label>
                <Input
                  id="folio"
                  type="number"
                  min={2}
                  max={maxFolio}
                  value={folio}
                  onChange={(e) => setFolio(Math.max(2, Math.min(maxFolio, parseInt(e.target.value) || 2)))}
                  data-testid="input-folio"
                />
              </div>

              <div>
                <Label htmlFor="side">Side</Label>
                <Select value={side} onValueChange={(v) => setSide(v as 'a' | 'b')}>
                  <SelectTrigger id="side" data-testid="select-side">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="a">a (א)</SelectItem>
                    <SelectItem value="b">b (ב)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="col-span-2 md:col-span-1">
                <Label htmlFor="section">Section (optional)</Label>
                <Input
                  id="section"
                  type="number"
                  min={1}
                  placeholder="e.g., 14"
                  value={sectionInput}
                  onChange={(e) => handleSectionChange(e.target.value)}
                  data-testid="input-section"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              Current Reference
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-medium">
              {currentRef}
              {hebrewName && <span className="text-muted-foreground mr-2"> ({hebrewName})</span>}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              ChavrutAI: <a 
                href={`/tractate/${tractate.toLowerCase().replace(/ /g, '-')}/${folio}${side}`}
                className="text-primary hover:underline"
                data-testid="link-chavrutai"
              >
                /tractate/{tractate.toLowerCase().replace(/ /g, '-')}/{folio}{side}
              </a>
              {section && `, section ${section}`}
            </p>
          </CardContent>
        </Card>

        {section !== undefined && sectionLinks.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Section-Level Links
              </CardTitle>
              <CardDescription>
                Links that point to the specific section ({currentRef})
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {sectionLinks.map((link, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <div className="font-medium">{link.name}</div>
                      {link.description && (
                        <div className="text-sm text-muted-foreground">{link.description}</div>
                      )}
                    </div>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-primary hover:underline"
                      data-testid={`link-section-${link.name.toLowerCase().replace(/\s/g, '-')}`}
                    >
                      <ExternalLink className="w-4 h-4" />
                      Open
                    </a>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Page-Level Links
            </CardTitle>
            <CardDescription>
              Links that point to the full page ({tractate} {folio}{side})
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pageLinks.map((link, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <div className="font-medium">{link.name}</div>
                    {link.description && (
                      <div className="text-sm text-muted-foreground">{link.description}</div>
                    )}
                    <div className="text-xs text-muted-foreground mt-1 font-mono break-all max-w-md">
                      {link.url}
                    </div>
                  </div>
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-primary hover:underline flex-shrink-0 ml-4"
                    data-testid={`link-page-${link.name.toLowerCase().replace(/\s/g, '-')}`}
                  >
                    <ExternalLink className="w-4 h-4" />
                    Open
                  </a>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>This is an internal testing page.</p>
        </div>
      </div>
    </div>
  );
}

export default ExternalLinksPage;
