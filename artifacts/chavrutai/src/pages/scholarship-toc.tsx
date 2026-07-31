import { Link, useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useSEO } from "@/hooks/use-seo";
import { apiRequest } from "@/lib/queryClient";
import { isValidScholarshipWork } from "@shared/data/scholarship-works";
import NotFound from "@/pages/not-found";
import { PageShell, Breadcrumbs, SectionHeading, type BreadcrumbItem } from "@/components/layout";

interface ScholarshipSection {
  key: string;
  slug: string;
  title: string;
  heTitle: string;
}

interface ScholarshipBook {
  title: string;
  heTitle: string;
  sections: ScholarshipSection[];
}

interface WorkIndexData {
  title: string;
  heTitle: string;
  author: string;
  description: string;
  topLevelSections: ScholarshipSection[];
  books: ScholarshipBook[];
}

export default function ScholarshipToc() {
  const [match, params] = useRoute("/scholarship/:workSlug");
  const workSlug = params?.workSlug || "";

  const { data, isLoading, error, refetch } = useQuery<WorkIndexData>({
    queryKey: ["/api/scholarship", workSlug, "index"],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/scholarship/${encodeURIComponent(workSlug)}/index`);
      if (!res.ok) throw new Error("Failed to load");
      return res.json();
    },
    enabled: !!workSlug && isValidScholarshipWork(workSlug),
    staleTime: Infinity,
    gcTime: 1000 * 60 * 60 * 24,
  });

  useSEO(
    data
      ? {
          title: `${data.title} | ChavrutAI`,
          description: data.description,
          canonical: `${window.location.origin}/scholarship/${workSlug}`,
        }
      : {
          title: "Modern Scholarship | ChavrutAI",
          description: "Academic scholarship on classical Jewish texts.",
          canonical: `${window.location.origin}/scholarship/${workSlug}`,
        }
  );

  if (!match || !isValidScholarshipWork(workSlug)) return <NotFound />;

  const breadcrumbs: BreadcrumbItem[] = [
    { label: "Home", href: "/" },
    { label: "Modern Scholarship", href: "/scholarship" },
    ...(data ? [{ label: data.title }] : []),
  ];

  return (
    <PageShell>
        <Breadcrumbs items={breadcrumbs} className="pt-10 mb-6" />

        {isLoading && (
          <div className="space-y-4 pb-12">
            <div className="h-8 w-3/4 bg-muted animate-pulse rounded" />
            <div className="h-5 w-1/3 bg-muted animate-pulse rounded" />
            <div className="h-4 w-full bg-muted animate-pulse rounded mt-6" />
            <div className="h-4 w-5/6 bg-muted animate-pulse rounded" />
            <div className="mt-8 space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-14 bg-muted animate-pulse rounded" />
              ))}
            </div>
          </div>
        )}

        {error && (
          <div className="border border-border rounded p-4 mb-6 flex items-center justify-between text-sm">
            <span className="text-destructive">Failed to load table of contents.</span>
            <button
              onClick={() => refetch()}
              className="text-primary dark:text-[#5b9fc5] hover:underline"
            >
              Retry
            </button>
          </div>
        )}

        {data && (
          <div className="pb-12">
            {/* Work header */}
            <div className="mb-8">
              <h1 className="font-georgia text-3xl md:text-4xl text-foreground mb-2 leading-tight">{data.title}</h1>
              <div
                className="text-xl text-muted-foreground font-hebrew mb-3"
                dir="rtl"
                style={{ textAlign: "right" }}
                lang="he"
              >
                {data.heTitle}
              </div>
              <div className="text-sm text-muted-foreground mb-4">{data.author}</div>
              <p className="text-sm text-muted-foreground leading-relaxed">{data.description}</p>
            </div>

            <div className="border-t border-border pt-8">
              <SectionHeading className="mb-5">
                Table of Contents
              </SectionHeading>

              <div className="space-y-1">
                {/* Top-level standalone sections */}
                {data.topLevelSections.map((section) => (
                  <SectionRow key={section.slug} section={section} workSlug={workSlug} />
                ))}

                {/* Books — always expanded */}
                {data.books.map((book, bookIdx) => (
                  <div key={book.title + bookIdx} className="pt-4 first:pt-0">
                    {/* Book heading */}
                    <div className="px-1 pb-2">
                      <div className="text-sm font-semibold text-foreground">{book.title}</div>
                      <div
                        className="text-xs text-muted-foreground font-hebrew mt-0.5"
                        dir="rtl"
                        lang="he"
                      >
                        {book.heTitle}
                      </div>
                    </div>

                    {/* Sections under this book */}
                    <div className="border-l border-border ml-1 pl-4 space-y-1">
                      {book.sections.map((section, secIdx) => (
                        <SectionRow
                          key={section.slug}
                          section={section}
                          workSlug={workSlug}
                          index={secIdx + 1}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
    </PageShell>
  );
}

function SectionRow({
  section,
  workSlug,
  index,
}: {
  section: ScholarshipSection;
  workSlug: string;
  index?: number;
}) {
  return (
    <Link href={`/scholarship/${workSlug}/${section.slug}`}>
      <div className="flex items-center justify-between px-3 py-2.5 rounded hover:bg-secondary cursor-pointer group">
        <div className="flex items-center gap-3 min-w-0">
          {index !== undefined && (
            <span className="text-xs text-muted-foreground/50 w-5 text-right flex-shrink-0 select-none">
              {index}
            </span>
          )}
          <div className="min-w-0">
            <div className="text-sm text-foreground">{section.title}</div>
            <div
              className="text-xs text-muted-foreground font-hebrew mt-0.5"
              dir="rtl"
              lang="he"
            >
              {section.heTitle}
            </div>
          </div>
        </div>
        <span className="text-xs text-muted-foreground/40 group-hover:text-primary ml-4 flex-shrink-0">
          →
        </span>
      </div>
    </Link>
  );
}
