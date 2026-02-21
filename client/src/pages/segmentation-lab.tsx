import { useMemo, useState } from "react";
import { SharedLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { useSEO } from "@/hooks/use-seo";

type Segment = {
  id: number;
  wordStart: number;
  wordEnd: number;
  start: number;
  end: number;
  text: string;
};

type SegmentationResponse = {
  hebrewSegments: Segment[];
  englishSegments: Segment[];
  alignmentCount: number;
  raw: {
    hebrew_segments: [number, number][];
    english_segments: [number, number][];
  };
};

const SAMPLE_HEBREW = "וַיֹּאמֶר אֱלֹהִים יְהִי אוֹר וַיְהִי אוֹר";
const SAMPLE_ENGLISH = "And God said, Let there be light: and there was light.";
const SAMPLE_SEFARIA_URL = "https://www.sefaria.org.il/Shabbat.31a.5";

export default function SegmentationLabPage() {
  const [sefariaUrl, setSefariaUrl] = useState(SAMPLE_SEFARIA_URL);
  const [isFetchingSefaria, setIsFetchingSefaria] = useState(false);
  const [sefariaInfo, setSefariaInfo] = useState("");
  const [hebrewText, setHebrewText] = useState(SAMPLE_HEBREW);
  const [englishText, setEnglishText] = useState(SAMPLE_ENGLISH);
  const [model, setModel] = useState("");
  const [temperature, setTemperature] = useState("0");
  const [maxAttempts, setMaxAttempts] = useState("2");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<SegmentationResponse | null>(null);

  useSEO({
    title: "Segmentation Lab | ChavrutAI",
    description: "Test co-segmentation of Hebrew-English text with word-index aligned output.",
    canonical: `${window.location.origin}/segmentation-lab`,
    robots: "noindex, nofollow",
  });

  const rows = useMemo(() => {
    if (!result) return [];
    return result.hebrewSegments.map((segment, index) => ({
      index: index + 1,
      hebrew: segment,
      english: result.englishSegments[index],
    }));
  }, [result]);

  async function loadFromSefariaUrl() {
    setIsFetchingSefaria(true);
    setError("");
    setSefariaInfo("");

    try {
      const params = new URLSearchParams({
        inputMethod: "url",
        tractate: "",
        page: "",
        section: "all",
        url: sefariaUrl.trim().split("#")[0],
      });

      const response = await fetch(`/api/sefaria-fetch?${params.toString()}`);
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "Failed to fetch from Sefaria URL");
      }

      const hebrewSections = Array.isArray(data.hebrewSections) ? data.hebrewSections : [];
      const englishSections = Array.isArray(data.englishSections) ? data.englishSections : [];
      if (hebrewSections.length === 0 || englishSections.length === 0) {
        throw new Error("No text sections returned from Sefaria");
      }

      setHebrewText(hebrewSections.join("\n\n"));
      setEnglishText(englishSections.join("\n\n"));
      setResult(null);
      setSefariaInfo(`${data.span} (${englishSections.length} section${englishSections.length === 1 ? "" : "s"})`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch from Sefaria URL";
      setError(message);
    } finally {
      setIsFetchingSefaria(false);
    }
  }

  async function runSegmentation() {
    setIsLoading(true);
    setError("");

    try {
      const parsedTemp = Number(temperature);
      const parsedAttempts = Number(maxAttempts);
      const payload: { hebrewText: string; englishText: string; model?: string; temperature?: number; maxAttempts?: number } = {
        hebrewText,
        englishText,
      };

      if (model.trim()) payload.model = model.trim();
      if (!Number.isNaN(parsedTemp)) payload.temperature = parsedTemp;
      if (!Number.isNaN(parsedAttempts)) payload.maxAttempts = parsedAttempts;

      const response = await fetch("/api/segment/co-segment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "Segmentation failed");
      }

      setResult(data as SegmentationResponse);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Segmentation failed";
      setError(message);
      setResult(null);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <SharedLayout variant="simple" mainMaxWidth="max-w-6xl">
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Segmentation Lab</h1>
          <p className="text-muted-foreground">
            Paste raw Hebrew and English, run co-segmentation, and inspect aligned segments.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Input</CardTitle>
            <CardDescription>Raw source text. The API returns word-index ranges and exact sliced segments.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-[1fr_220px]">
              <div className="space-y-2">
                <label className="text-sm font-medium">Sefaria URL</label>
                <input
                  className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={sefariaUrl}
                  onChange={(e) => setSefariaUrl(e.target.value)}
                  placeholder="https://www.sefaria.org.il/Shabbat.31a.5"
                />
              </div>
              <div className="flex items-end">
                <Button onClick={loadFromSefariaUrl} disabled={isFetchingSefaria || !sefariaUrl.trim()}>
                  {isFetchingSefaria ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Load From Sefaria URL
                </Button>
              </div>
            </div>

            {sefariaInfo ? <p className="text-sm text-muted-foreground">Loaded: {sefariaInfo}</p> : null}

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Hebrew Text</label>
                <Textarea
                  dir="rtl"
                  className="min-h-36"
                  value={hebrewText}
                  onChange={(e) => setHebrewText(e.target.value)}
                  placeholder="הכנס טקסט בעברית..."
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">English Text</label>
                <Textarea
                  className="min-h-36"
                  value={englishText}
                  onChange={(e) => setEnglishText(e.target.value)}
                  placeholder="Enter English text..."
                />
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-[1fr_120px_140px_220px]">
              <div className="space-y-2">
                <label className="text-sm font-medium">Model (optional)</label>
                <input
                  className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder="e.g. gpt-4o-mini"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Temperature</label>
                <input
                  className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={temperature}
                  onChange={(e) => setTemperature(e.target.value)}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Max Attempts</label>
                <input
                  className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={maxAttempts}
                  onChange={(e) => setMaxAttempts(e.target.value)}
                  placeholder="2"
                />
              </div>
              <div className="flex items-end gap-2">
                <Button onClick={runSegmentation} disabled={isLoading || !hebrewText.trim() || !englishText.trim()}>
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Run Segmentation
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setHebrewText(SAMPLE_HEBREW);
                    setEnglishText(SAMPLE_ENGLISH);
                  }}
                >
                  Load Sample
                </Button>
              </div>
            </div>

            {error ? <p className="text-sm text-destructive">{error}</p> : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Aligned Segments</CardTitle>
            <CardDescription>{result ? `${result.alignmentCount} aligned segment pairs` : "No results yet"}</CardDescription>
          </CardHeader>
          <CardContent>
            {!result ? (
              <p className="text-sm text-muted-foreground">Run segmentation to view output.</p>
            ) : (
              <div className="space-y-3">
                {rows.map((row) => (
                  <div key={row.index} className="grid gap-3 rounded-md border p-3 md:grid-cols-[64px_1fr_1fr]">
                    <div className="text-sm font-medium text-muted-foreground">#{row.index}</div>
                    <div className="space-y-1" dir="rtl">
                      <p className="text-xs text-muted-foreground">
                        words [{row.hebrew.wordStart}, {row.hebrew.wordEnd}]
                      </p>
                      <p className="whitespace-pre-wrap">{row.hebrew.text}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">
                        words [{row.english.wordStart}, {row.english.wordEnd}]
                      </p>
                      <p className="whitespace-pre-wrap">{row.english.text}</p>
                    </div>
                  </div>
                ))}

                <details className="rounded-md border p-3">
                  <summary className="cursor-pointer text-sm font-medium">Raw JSON output</summary>
                  <pre className="mt-2 overflow-x-auto text-xs">{JSON.stringify(result.raw, null, 2)}</pre>
                </details>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </SharedLayout>
  );
}
