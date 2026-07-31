import { useRoute, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageShell } from "@/components/layout/page-shell";
import { useSEO } from "@/hooks/use-seo";
import { getStaticSEO, getYerushalmiTractateSEO } from "@shared/seo-data";
import { BreadcrumbNavigation } from "@/components/navigation/breadcrumb-navigation";
import {
  YERUSHALMI_HEBREW_NAMES,
  normalizeYerushalmiTractateName,
  isValidYerushalmiTractate,
  getYerushalmiTractateInfo,
  getYerushalmiTractateSlug,
} from "@shared/yerushalmi-data";
import {
  isYerushalmiHalakhahMissing,
  findFirstValidHalakhahInChapter,
} from "@shared/yerushalmi-missing";
import NotFound from "@/pages/not-found";


export default function YerushalmiTractate() {
  const [match, params] = useRoute("/yerushalmi/:tractate");
  const tractateParam = params?.tractate || "";
  const tractateDisplayName = normalizeYerushalmiTractateName(tractateParam);

  const tractateInfo = tractateDisplayName ? getYerushalmiTractateInfo(tractateDisplayName) : null;
  const tractateSlug = tractateDisplayName ? getYerushalmiTractateSlug(tractateDisplayName) : "";

  const { data: shapeData } = useQuery<{ shapes: number[][] }>({
    queryKey: ["/api/yerushalmi", tractateParam, "shape"],
    queryFn: () => fetch(`/api/yerushalmi/${tractateParam}/shape`).then(r => r.json()),
    enabled: !!tractateParam && !!tractateDisplayName,
    staleTime: Infinity,
  });

  useSEO(
    tractateSlug
      ? getYerushalmiTractateSEO(tractateSlug, window.location.origin)
      : getStaticSEO("/yerushalmi", window.location.origin)!
  );

  if (!match || !isValidYerushalmiTractate(tractateParam)) {
    return <NotFound />;
  }

  if (!tractateInfo || !tractateDisplayName) {
    return <NotFound />;
  }

  const hebrewName = YERUSHALMI_HEBREW_NAMES[tractateDisplayName] || tractateDisplayName;
  const shapes: number[][] = shapeData?.shapes ?? [];

  return (
    <PageShell mainClassName="max-w-6xl px-4 py-8">
        <BreadcrumbNavigation
          items={[
            { label: "Jerusalem Talmud", href: "/yerushalmi" },
            { label: tractateDisplayName },
          ]}
        />

        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-primary mb-2">
            {tractateDisplayName}
          </h1>
          <h2 className="text-3xl text-primary/80 mb-4 font-hebrew">{hebrewName}</h2>
          <p className="text-xl text-muted-foreground">
            {tractateInfo.chapters} Chapters
          </p>
          <p className="text-sm text-muted-foreground mt-1">Jerusalem Talmud (Yerushalmi)</p>
        </div>

        <div className="grid grid-cols-1 gap-6 max-w-none sm:max-w-lg md:max-w-xl lg:max-w-2xl xl:max-w-3xl mx-auto">
          {Array.from({ length: tractateInfo.chapters }, (_, i) => i + 1).map((chapterNum) => {
            const chapterShape: number[] = shapes[chapterNum - 1] ?? [];
            const halakhotCount = chapterShape.length;
            const validHalakhot = chapterShape
              .map((_, idx) => idx + 1)
              .filter((h) => !isYerushalmiHalakhahMissing(tractateDisplayName, chapterNum, h));
            const validCount = validHalakhot.length;
            const firstValid = findFirstValidHalakhahInChapter(tractateDisplayName, chapterNum, shapes);

            return (
              <Card key={chapterNum} className="hover:shadow-lg transition-shadow duration-200">
                <CardContent className="p-6">
                  <div className="mb-3">
                    <h3 className="text-xl text-primary mb-1">
                      {firstValid ? (
                        <Link href={`/yerushalmi/${tractateSlug}/${chapterNum}.${firstValid}`} className="hover:underline">
                          Chapter {chapterNum}
                        </Link>
                      ) : (
                        <span>Chapter {chapterNum}</span>
                      )}
                    </h3>
                    {halakhotCount > 0 && validCount > 0 && (
                      <p className="text-xs text-muted-foreground">
                        {validCount} {validCount === 1 ? "halakhah" : "halakhot"}
                      </p>
                    )}
                    {halakhotCount > 0 && validCount === 0 && (
                      <p className="text-xs text-muted-foreground italic">
                        No Yerushalmi text for this chapter (Mishnah only)
                      </p>
                    )}
                  </div>

                  {validCount > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5">
                      {validHalakhot.map((halNum) => (
                        <Link
                          key={halNum}
                          href={`/yerushalmi/${tractateSlug}/${chapterNum}.${halNum}`}
                          className="inline-flex items-center justify-center w-8 h-8 rounded border border-border bg-secondary/50 text-secondary-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors text-sm font-medium"
                          title={`Halakhah ${halNum}`}
                        >
                          {halNum}
                        </Link>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
    </PageShell>
  );
}
