import { useEffect } from "react";
import { useRoute, Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageShell } from "@/components/layout/page-shell";
import { useSEO } from "@/hooks/use-seo";
import { BreadcrumbNavigation } from "@/components/navigation/breadcrumb-navigation";
import { getRambamHilchotInfo, isValidRambamHilchot } from "@shared/rambam-data";
import { getStaticSEO, getRambamHilchotSEO } from "@shared/seo-data";
import NotFound from "@/pages/not-found";
import { apiRequest } from "@/lib/queryClient";

interface RambamInfoData {
  hilchot: string;
  chapters: number;
  halachotPerChapter: number[];
}

export default function RambamTractate() {
  const [match, params] = useRoute("/rambam/:hilchot");
  const hilchotParam = params?.hilchot || "";
  const info = getRambamHilchotInfo(hilchotParam);
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (info?.isFlat) {
      setLocation(`/rambam/${info.slug}/1`, { replace: true });
    }
  }, [info]);

  const { data: infoData, isLoading: isInfoLoading } = useQuery<RambamInfoData>({
    queryKey: ['/api/rambam', hilchotParam, 'info'],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/rambam/${encodeURIComponent(hilchotParam)}/info`);
      return response.json();
    },
    enabled: !!info,
    staleTime: 1000 * 60 * 60,
    gcTime: 1000 * 60 * 60 * 24,
  });

  useSEO(
    info
      ? getRambamHilchotSEO(hilchotParam, window.location.origin)
      : getStaticSEO("/rambam", window.location.origin)!
  );

  if (!match || !isValidRambamHilchot(hilchotParam)) {
    return <NotFound />;
  }

  if (!info) {
    return <NotFound />;
  }

  return (
    <PageShell mainClassName="max-w-6xl px-4 py-8">
        <BreadcrumbNavigation
          items={[
            { label: "Mishneh Torah", href: "/rambam" },
            { label: info.book, href: `/rambam#${info.book.toLowerCase().replace(/\s+/g, '-')}` },
            { label: info.displayName },
          ]}
        />

        <div className="text-center mb-8">
          <p className="text-sm text-muted-foreground mb-1">{info.book}</p>
          <h1 className="text-4xl font-bold text-primary mb-2">
            {info.displayName}
          </h1>
          <h2 className="text-2xl text-primary/80 mb-4 font-hebrew">{info.hebrewName}</h2>
          <p className="text-xl text-muted-foreground">
            {info.chapters} Chapters
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 max-w-none sm:max-w-lg md:max-w-xl lg:max-w-2xl xl:max-w-3xl mx-auto">
          {Array.from({ length: info.chapters }, (_, i) => i + 1).map((chapterNum) => {
            const halachotCount = infoData?.halachotPerChapter?.[chapterNum - 1];

            return (
              <Card key={chapterNum} className="hover:shadow-lg transition-shadow duration-200">
                <CardContent className="p-6">
                  <div className="mb-4">
                    <h3 className="text-xl text-primary mb-2">
                      Chapter {chapterNum}
                    </h3>
                    {halachotCount !== undefined && halachotCount > 0 && (
                      <p className="text-sm text-muted-foreground">
                        {halachotCount} {halachotCount === 1 ? 'halacha' : 'halachot'}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2 justify-items-center">
                    {isInfoLoading ? (
                      Array.from({ length: 6 }, (_, j) => (
                        <div key={j} className="h-10 min-w-[3rem] max-w-[4rem] w-full rounded bg-muted animate-pulse" />
                      ))
                    ) : halachotCount !== undefined && halachotCount > 0 ? (
                      Array.from({ length: halachotCount }, (_, j) => j + 1).map((halachaNum) => (
                        <Link
                          key={halachaNum}
                          href={`/rambam/${info.slug}/${chapterNum}#${halachaNum}`}
                        >
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-10 px-2 text-base font-normal w-full min-w-[3rem] max-w-[4rem] hover:bg-primary hover:text-primary-foreground"
                          >
                            {halachaNum}
                          </Button>
                        </Link>
                      ))
                    ) : (
                      <Link href={`/rambam/${info.slug}/${chapterNum}`}>
                        <Button
                          variant="outline"
                          className="hover:bg-primary hover:text-primary-foreground"
                        >
                          Read Chapter {chapterNum}
                        </Button>
                      </Link>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
    </PageShell>
  );
}
