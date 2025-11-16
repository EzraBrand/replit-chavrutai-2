import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Search, Copy } from "lucide-react";
import { formatEnglishText, processHebrewText } from "@/lib/text-processing";
import { TRACTATE_LISTS } from "@shared/tractates";

const tractates = TRACTATE_LISTS["Talmud Bavli"];
const pages = Array.from({ length: 180 }, (_, i) => i + 2).flatMap(num => [`${num}a`, `${num}b`]);
const sections = Array.from({ length: 50 }, (_, i) => i + 1);

interface SefariaResponse {
  tractate: string;
  page: string;
  section?: number;
  hebrewSections: string[];
  englishSections: string[];
  span: string;
  error?: string;
}

export default function SefariaFetchPage() {
  const [inputMethod, setInputMethod] = useState<"dropdown" | "url">("dropdown");
  const [tractate, setTractate] = useState<string>(tractates[0]);
  const [page, setPage] = useState<string>("2a");
  const [section, setSection] = useState<string>("all");
  const [url, setUrl] = useState<string>("");
  const [shouldFetch, setShouldFetch] = useState(false);

  const { data, isLoading, error, refetch } = useQuery<SefariaResponse>({
    queryKey: ['/api/sefaria-fetch', inputMethod, tractate, page, section, url],
    queryFn: async () => {
      const params = new URLSearchParams({
        inputMethod,
        tractate,
        page,
        section,
        url
      });
      const response = await fetch(`/api/sefaria-fetch?${params}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || 'Failed to fetch text');
      }
      return response.json();
    },
    enabled: shouldFetch,
    refetchOnWindowFocus: false,
    retry: false
  });

  const handleFetch = () => {
    setShouldFetch(true);
    refetch();
  };

  const handleSelectAll = () => {
    const container = document.getElementById('text-display-container');
    if (!container) return;
    
    // Create a hidden div with content optimized for Google Docs
    const copyDiv = document.createElement('div');
    copyDiv.style.position = 'fixed';
    copyDiv.style.left = '-9999px';
    copyDiv.style.top = '-9999px';
    copyDiv.style.fontFamily = 'Calibri, sans-serif';
    copyDiv.style.fontSize = '12pt';
    copyDiv.style.lineHeight = '1.15';
    
    // Build HTML string manually to ensure proper formatting
    let htmlContent = '';
    
    // Process each section
    if (data?.hebrewSections && data?.englishSections) {
      data.hebrewSections.forEach((hebrewText: string, i: number) => {
        const englishText = data.englishSections[i] || '';
        
        // Add Hebrew text (bold)
        if (hebrewText) {
          const hebrewLines = hebrewText.split('\n').filter(line => line.trim());
          hebrewLines.forEach((line) => {
            htmlContent += `<span style="font-family: Calibri, sans-serif; font-size: 12pt; font-weight: bold; direction: rtl;">${line}</span><br>`;
          });
        }
        
        // Add English text with formatting preserved
        if (englishText) {
          const formattedEnglish = formatEnglishText(englishText);
          const englishParagraphs = formattedEnglish.split('\n\n').filter(p => p.trim());
          
          englishParagraphs.forEach((paragraph) => {
            // Convert HTML tags to inline styles
            let processedParagraph = paragraph
              // Handle nested bold tags
              .replace(/<strong[^>]*>(.*?)<\/strong>/gi, '<span style="font-weight: bold;">$1</span>')
              .replace(/<b[^>]*>(.*?)<\/b>/gi, '<span style="font-weight: bold;">$1</span>')
              .replace(/<big[^>]*>(.*?)<\/big>/gi, '<span style="font-weight: bold;">$1</span>')
              // Handle italic tags
              .replace(/<em[^>]*>(.*?)<\/em>/gi, '<span style="font-style: italic;">$1</span>')
              .replace(/<i[^>]*>(.*?)<\/i>/gi, '<span style="font-style: italic;">$1</span>');
            
            htmlContent += `<span style="font-family: Calibri, sans-serif; font-size: 12pt;">${processedParagraph}</span><br>`;
          });
        }
      });
    }
    
    copyDiv.innerHTML = htmlContent;
    document.body.appendChild(copyDiv);
    
    // Select the content
    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(copyDiv);
    selection?.removeAllRanges();
    selection?.addRange(range);
    
    // Copy
    try {
      document.execCommand('copy');
      
      // Show visual feedback on the actual content
      setTimeout(() => {
        const visibleRange = document.createRange();
        visibleRange.selectNodeContents(container);
        selection?.removeAllRanges();
        selection?.addRange(visibleRange);
      }, 100);
    } catch (err) {
      console.error('Copy failed:', err);
    }
    
    // Clean up
    document.body.removeChild(copyDiv);
  };

  const renderSections = () => {
    if (!data || data.error) return null;

    const hebrewSections = data.hebrewSections || [];
    const englishSections = data.englishSections || [];
    const maxSections = Math.max(hebrewSections.length, englishSections.length);

    return (
      <div className="space-y-8">
        {data.span && (
          <div className="font-semibold text-lg border-b pb-2">
            {data.span}
          </div>
        )}
        
        {Array.from({ length: maxSections }).map((_, i) => {
          const hebrewText = hebrewSections[i] || '';
          const englishText = englishSections[i] || '';

          if (!hebrewText && !englishText) return null;

          // Process text using the same functions as the main Talmud app
          const formattedEnglish = formatEnglishText(englishText);
          const englishParagraphs = formattedEnglish.split('\n\n').filter(p => p.trim());

          return (
            <div key={i} className="space-y-4">
              {hebrewText && (
                <div 
                  dir="rtl" 
                  className="text-gray-900"
                  style={{ 
                    fontFamily: 'Calibri, sans-serif', 
                    fontSize: '12pt',
                    fontWeight: 'bold',
                    lineHeight: '1.15'
                  }}
                >
                  {hebrewText.split('\n').filter(line => line.trim()).map((line, idx) => (
                    <p key={idx} style={{ margin: 0, padding: 0, lineHeight: '1.15' }}>{line}</p>
                  ))}
                </div>
              )}
              
              {englishText && (
                <div 
                  className="english-text text-gray-800"
                  style={{ 
                    fontFamily: 'Calibri, sans-serif', 
                    fontSize: '12pt',
                    lineHeight: '1.15'
                  }}
                >
                  {englishParagraphs.map((paragraph, idx) => (
                    <p 
                      key={idx}
                      style={{ margin: 0, padding: 0, lineHeight: '1.15' }}
                      dangerouslySetInnerHTML={{ __html: paragraph }}
                    />
                  ))}
                </div>
              )}
              
              {i < maxSections - 1 && <hr className="my-6" />}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Sefaria Text Fetcher</CardTitle>
            <CardDescription>
              Fetch Talmud texts from Sefaria using dropdowns or URL
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <Label>Input Method</Label>
              <RadioGroup 
                value={inputMethod} 
                onValueChange={(value: "dropdown" | "url") => setInputMethod(value)}
                data-testid="radio-input-method"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="dropdown" id="dropdown" data-testid="radio-dropdown" />
                  <Label htmlFor="dropdown" className="cursor-pointer">Dropdown Selection</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="url" id="url" data-testid="radio-url" />
                  <Label htmlFor="url" className="cursor-pointer">Sefaria URL</Label>
                </div>
              </RadioGroup>
            </div>

            {inputMethod === "dropdown" ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tractate">Tractate</Label>
                  <Select value={tractate} onValueChange={setTractate}>
                    <SelectTrigger id="tractate" data-testid="select-tractate">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {tractates.map((t) => (
                        <SelectItem key={t} value={t} data-testid={`option-tractate-${t}`}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="page">Page</Label>
                  <Select value={page} onValueChange={setPage}>
                    <SelectTrigger id="page" data-testid="select-page">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {pages.map((p) => (
                        <SelectItem key={p} value={p} data-testid={`option-page-${p}`}>
                          {p}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="section">Section (Optional)</Label>
                  <Select value={section} onValueChange={setSection}>
                    <SelectTrigger id="section" data-testid="select-section">
                      <SelectValue placeholder="All sections" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all" data-testid="option-section-all">All sections</SelectItem>
                      {sections.map((s) => (
                        <SelectItem key={s} value={s.toString()} data-testid={`option-section-${s}`}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="sefaria-url">Sefaria URL</Label>
                <Input
                  id="sefaria-url"
                  placeholder="e.g., https://www.sefaria.org/Sanhedrin.43b.9"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  data-testid="input-sefaria-url"
                />
              </div>
            )}

            <Button 
              onClick={handleFetch} 
              className="w-full md:w-auto"
              data-testid="button-fetch"
            >
              <Search className="mr-2 h-4 w-4" />
              Fetch Text
            </Button>
          </CardContent>
        </Card>

        {isLoading && (
          <Card>
            <CardContent className="pt-6 space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </CardContent>
          </Card>
        )}

        {error && (
          <Alert variant="destructive" data-testid="alert-error">
            <AlertDescription>
              {error instanceof Error ? error.message : 'An error occurred while fetching the text'}
            </AlertDescription>
          </Alert>
        )}

        {data?.error && (
          <Alert variant="destructive" data-testid="alert-data-error">
            <AlertDescription>{data.error}</AlertDescription>
          </Alert>
        )}

        {data && !data.error && (
          <Card>
            <CardContent className="pt-6 space-y-4">
              <Button 
                onClick={handleSelectAll} 
                variant="outline"
                data-testid="button-select-all"
              >
                <Copy className="mr-2 h-4 w-4" />
                Select All Text (for copy/paste)
              </Button>
              
              <div 
                id="text-display-container"
                className="bg-white border rounded-lg p-6" 
                data-testid="text-display-container"
                style={{ 
                  fontFamily: 'Calibri, sans-serif', 
                  fontSize: '12pt',
                  lineHeight: '1.15'
                }}
              >
                {renderSections()}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
