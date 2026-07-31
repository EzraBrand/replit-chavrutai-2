import { Link } from "wouter";
import { useSEO } from "@/hooks/use-seo";
import { PageShell } from "@/components/layout";

export default function NotFound() {
  useSEO({
    title: "Page Not Found - Bekiut",
    description: "The page you're looking for doesn't exist or has been moved. Return to Bekiut to continue studying Talmud and Jewish texts.",
    noindex: true,
  });
  return (
    <PageShell>
      <div className="pt-16 pb-12 max-w-xl">
        <h1 className="font-georgia text-3xl md:text-4xl text-foreground mb-3">
          404 — Page Not Found
        </h1>
        <p className="text-muted-foreground mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>

        <div className="border-t border-border pt-6 space-y-3">
          <p>
            <Link
              href="/"
              className="text-primary dark:text-[#5b9fc5] hover:underline"
              data-testid="link-home"
            >
              Return to the homepage →
            </Link>
          </p>
          <p className="text-sm text-muted-foreground">
            If errors persist, contact{" "}
            <a
              href="mailto:ezra@chavrutai.com"
              className="text-primary dark:text-[#5b9fc5] hover:underline"
              data-testid="link-contact-support"
            >
              ezra@chavrutai.com
            </a>
          </p>
        </div>
      </div>
    </PageShell>
  );
}
