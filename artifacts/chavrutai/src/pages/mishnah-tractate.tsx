import { useRoute, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageShell } from "@/components/layout/page-shell";
import { useSEO } from "@/hooks/use-seo";
import { getStaticSEO, getMishnahTractateSEO } from "@workspace/shared-data/seo-data";
import { BreadcrumbNavigation } from "@/components/navigation/breadcrumb-navigation";
import {
  MISHNAH_ONLY_HEBREW_NAMES,
  normalizeMishnahTractateName,
  isValidMishnahTractate,
  getMishnahTractateInfo,
  getMishnahTractateSlug,
} from "@workspace/shared-data/tractates";
import NotFound from "@/pages/not-found";
import { apiRequest } from "@/lib/queryClient";

interface TractateInfoData {
  tractate: string;
  chapters: number;
  mishnayotPerChapter: number[];
}

export default function MishnahTractate() {
  const [match, params] = useRoute("/mishnah/:tractate");
  const tractateParam = params?.tractate || "";
  const tractateDisplayName = normalizeMishnahTractateName(tractateParam);

  const tractateInfo = tractateDisplayName ? getMishnahTractateInfo(tractateDisplayName) : null;
  const tractateSlug = tractateDisplayName ? getMishnahTractateSlug(tractateDisplayName) : "";

  const { data: infoData, isLoading: isInfoLoading } = useQuery<TractateInfoData>({
    queryKey: ['/api/mishnah', tractateSlug, 'info'],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/mishnah/${encodeURIComponent(tractateSlug)}/info`);
      return response.json();
    },
    enabled: !!tractateDisplayName && !!tractateInfo,
    staleTime: 1000 * 60 * 60,
    gcTime: 1000 * 60 * 60 * 24,
  });

  useSEO(
    tractateSlug
      ? getMishnahTractateSEO(tractateSlug, window.location.origin)
      : getStaticSEO("/mishnah", window.location.origin)!
  );

  if (!match || !isValidMishnahTractate(tractateParam)) {
    return <NotFound />;
  }

  if (!tractateInfo || !tractateDisplayName) {
    return <NotFound />;
  }

  const hebrewName = MISHNAH_ONLY_HEBREW_NAMES[tractateDisplayName] || tractateDisplayName;

  return (
    <PageShell mainClassName="max-w-6xl px-4 py-8">
        <BreadcrumbNavigation
          items={[
            { label: "Mishnah", href: "/mishnah" },
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
        </div>

        <div className="grid grid-cols-1 gap-6 max-w-none sm:max-w-lg md:max-w-xl lg:max-w-2xl xl:max-w-3xl mx-auto">
          {Array.from({ length: tractateInfo.chapters }, (_, i) => i + 1).map((chapterNum) => {
            const mishnayotCount = infoData?.mishnayotPerChapter?.[chapterNum - 1];

            return (
              <Card key={chapterNum} className="hover:shadow-lg transition-shadow duration-200">
                <CardContent className="p-6">
                  <div className="mb-4">
                    <h3 className="text-xl text-primary mb-2">
                      Chapter {chapterNum}
                    </h3>
                    {mishnayotCount !== undefined && mishnayotCount > 0 && (
                      <p className="text-sm text-muted-foreground">
                        {mishnayotCount} {mishnayotCount === 1 ? 'mishnah' : 'mishnayot'}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2 justify-items-center">
                    {isInfoLoading ? (
                      Array.from({ length: 6 }, (_, j) => (
                        <div key={j} className="h-10 min-w-[3rem] max-w-[4rem] w-full rounded bg-muted animate-pulse" />
                      ))
                    ) : mishnayotCount !== undefined && mishnayotCount > 0 ? (
                      Array.from({ length: mishnayotCount }, (_, j) => j + 1).map((mishnahNum) => (
                        <Link
                          key={mishnahNum}
                          href={`/mishnah/${tractateSlug}/${chapterNum}#${mishnahNum}`}
                        >
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-10 px-2 text-base font-normal w-full min-w-[3rem] max-w-[4rem] hover:bg-primary hover:text-primary-foreground"
                          >
                            {mishnahNum}
                          </Button>
                        </Link>
                      ))
                    ) : (
                      <Link href={`/mishnah/${tractateSlug}/${chapterNum}`}>
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
