import { Skeleton } from "@/components/ui/skeleton";

export function FooterPlaceholder() {
  return (
    <footer className="border-t border-border bg-card mt-12 min-h-[280px]">
      <div className="container mx-auto px-4 py-10">
        <div className="flex justify-center mb-8">
          <Skeleton className="h-10 w-48" />
        </div>
        <div className="grid grid-cols-[1.4fr_1fr] gap-4 sm:gap-8 max-w-2xl mx-auto mb-8">
          <div className="space-y-3">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-32" />
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-3 w-36" />
          </div>
          <div className="space-y-3">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-18" />
          </div>
        </div>
        <div className="border-t border-border pt-6">
          <div className="flex flex-col items-center gap-4">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-8 w-16" />
          </div>
        </div>
      </div>
    </footer>
  );
}

export function PageLoading() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-8 w-24" />
          </div>
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="space-y-6">
          <Skeleton className="h-10 w-3/4 mx-auto" />
          <Skeleton className="h-6 w-1/2 mx-auto" />
          <div className="space-y-4 mt-8">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        </div>
        <FooterPlaceholder />
      </main>
    </div>
  );
}
