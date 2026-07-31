import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Footer } from "@/components/footer";
import { useSEO } from "@/hooks/use-seo";
import { getStaticSEO } from "@shared/seo-data";
import { apiRequest } from "@/lib/queryClient";
import { HeaderSimple } from "@/components/layout/header-simple";

interface WorkEntry {
  slug: string;
  title: string;
  heTitle: string;
  author: string;
  description: string;
  type: string;
}

export default function ScholarshipHome() {
  useSEO(getStaticSEO("/scholarship", window.location.origin)!);

  const { data: works, isLoading } = useQuery<WorkEntry[]>({
    queryKey: ["/api/scholarship/works"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/scholarship/works");
      return res.json();
    },
    staleTime: Infinity,
  });

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      <HeaderSimple />

      <main className="max-w-content mx-auto px-6">
        <div className="pt-10 pb-8">
          <nav className="text-sm text-muted-foreground mb-4" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-foreground">Home</Link>
            <span className="mx-2">›</span>
            <span className="text-foreground">J.N. Epstein's Introductions</span>
          </nav>
          <h1 className="font-georgia text-3xl md:text-4xl text-foreground mb-2">
            J.N. Epstein's Introductions
          </h1>
          <p className="text-muted-foreground">
            Epstein's academic introductions to the Mishnah, Tosefta, Halakhic Midrashim, and Babylonian Talmud.
          </p>
        </div>

        {isLoading && (
          <div className="space-y-4 pb-12">
            {[1, 2].map((i) => (
              <div key={i} className="h-32 bg-muted animate-pulse rounded" />
            ))}
          </div>
        )}

        {works && (
          <div className="pb-12">
            {works.map((work) => (
              <Link key={work.slug} href={`/scholarship/${work.slug}`}>
                <div className="border-t border-border py-6 px-2 -mx-2 hover:bg-secondary cursor-pointer">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h2 className="font-georgia text-xl text-foreground mb-1 leading-tight">
                        {work.title}
                      </h2>
                      <div
                        className="text-base text-muted-foreground mb-3 font-hebrew"
                        dir="rtl"
                        style={{ textAlign: "right" }}
                        lang="he"
                      >
                        {work.heTitle}
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed mb-2">
                        {work.description}
                      </p>
                      <span className="text-xs text-muted-foreground">{work.author}</span>
                    </div>
                    <span className="text-sm text-primary dark:text-[#5b9fc5] flex-shrink-0 mt-1">
                      Browse →
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
