import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Footer } from "@/components/footer";
import { useSEO } from "@/hooks/use-seo";
import { getStaticSEO } from "@shared/seo-data";
import { apiRequest } from "@/lib/queryClient";

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
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-card border-b border-border shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-center">
            <Link
              href="/"
              className="flex items-center space-x-2 flex-shrink-0 hover:opacity-80 transition-opacity duration-200"
            >
              <div className="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden">
                <img src="/hebrew-book-icon.png" alt="ChavrutAI Logo" className="w-10 h-10 object-cover" />
              </div>
              <div className="text-xl font-semibold text-primary font-roboto">ChavrutAI</div>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-10">
        <div className="mb-10">
          <nav className="text-sm text-muted-foreground mb-4">
            <Link href="/" className="hover:text-primary transition-colors">Home</Link>
            <span className="mx-2">›</span>
            <span className="text-foreground">Modern Scholarship</span>
          </nav>
          <h1 className="text-3xl font-bold text-foreground mb-2">Modern Scholarship</h1>
          <p className="text-muted-foreground leading-relaxed">
            Academic introductions and critical studies of classical Jewish texts, drawn from Sefaria's digital library.
          </p>
        </div>

        {isLoading && (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        )}

        {works && (
          <div className="space-y-4">
            {works.map((work) => (
              <Link key={work.slug} href={`/scholarship/${work.slug}`}>
                <div className="border border-border rounded-lg p-6 hover:shadow-md hover:border-primary/40 transition-all duration-200 cursor-pointer bg-card">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h2 className="text-lg font-semibold text-foreground mb-1 leading-tight">
                        {work.title}
                      </h2>
                      <div
                        className="text-base text-muted-foreground mb-3 font-serif"
                        style={{ direction: "rtl", textAlign: "right" }}
                      >
                        {work.heTitle}
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed mb-2">
                        {work.description}
                      </p>
                      <span className="text-xs text-muted-foreground">{work.author}</span>
                    </div>
                    <span className="text-sm text-primary flex-shrink-0 mt-1">Browse →</span>
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
