import type { ReactNode } from "react";
import { Link } from "wouter";
import { HeaderSimple } from "@/components/layout/header-simple";
import { Footer } from "@/components/footer";
import { cn } from "@/lib/utils";

/*
 * Shared page primitives — ParchmentScholar design (see DESIGN.md).
 *
 * These encode the standard secondary-page anatomy so pages don't repeat
 * the same shell/title/section markup by hand:
 *
 *   <PageShell>
 *     <PageHeader category="talmud-bavli" breadcrumbs={[...]} title="...">
 *       <p className="text-muted-foreground">subtitle…</p>
 *     </PageHeader>
 *     <PageSection>
 *       <SectionHeading>…</SectionHeading>
 *       …
 *     </PageSection>
 *   </PageShell>
 */

/** Corpus slugs matching the `--category-*` CSS variables (DESIGN.md palette). */
export type CategorySlug =
  | "talmud-bavli"
  | "tanakh"
  | "mishnah"
  | "talmud-yerushalmi"
  | "mishneh-torah";

interface PageShellProps {
  children: ReactNode;
  /** data-testid applied to <main>. */
  testId?: string;
  /** Custom footer (e.g. <FooterPlaceholder /> while loading). Defaults to <Footer />. */
  footer?: ReactNode;
  /** Extra classes for <main>. */
  mainClassName?: string;
}

/** Full-page shell: sticky header, 64rem main column, footer pinned to bottom. */
export function PageShell({ children, testId, footer, mainClassName }: PageShellProps) {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground font-sans">
      <HeaderSimple />
      <main
        className={cn("max-w-content mx-auto px-6 flex-1 w-full", mainClassName)}
        data-testid={testId}
      >
        {children}
      </main>
      {footer !== undefined ? footer : <Footer />}
    </div>
  );
}

/** The 2px × 2.5rem colored corpus bar placed above a title (never a badge/pill). */
export function CategoryBar({
  category,
  className,
}: {
  category: CategorySlug;
  className?: string;
}) {
  return (
    <div
      className={cn("mb-3 h-[2px] w-10", className)}
      style={{ backgroundColor: `var(--category-${category})` }}
      aria-hidden="true"
    />
  );
}

export interface BreadcrumbItem {
  label: ReactNode;
  /** Omit href for the current (last) page. */
  href?: string;
}

/** Muted text breadcrumb trail: Home › Section › Current. */
export function Breadcrumbs({
  items,
  className,
}: {
  items: BreadcrumbItem[];
  className?: string;
}) {
  return (
    <nav className={cn("text-sm text-muted-foreground mb-4", className)} aria-label="Breadcrumb">
      {items.map((item, i) => (
        <span key={i}>
          {i > 0 && <span className="mx-2">›</span>}
          {item.href ? (
            <Link href={item.href} className="hover:text-foreground">
              {item.label}
            </Link>
          ) : (
            <span className="text-foreground">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}

interface PageHeaderProps {
  /** Renders the corpus CategoryBar above the title. */
  category?: CategorySlug;
  /** Renders a Breadcrumbs trail above the title. */
  breadcrumbs?: BreadcrumbItem[];
  title: ReactNode;
  /** Extra classes for the <h1> (e.g. "mb-4" when the intro needs more room). */
  titleClassName?: string;
  titleTestId?: string;
  /** Subtitle / intro content rendered below the title. */
  children?: ReactNode;
  /** Extra classes for the wrapper (defaults include pt-10 pb-8). */
  className?: string;
}

/** Standard page title block: pt-10/pb-8 wrapper, optional bar + breadcrumbs, Georgia h1. */
export function PageHeader({
  category,
  breadcrumbs,
  title,
  titleClassName,
  titleTestId,
  children,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn("pt-10 pb-8", className)}>
      {category && <CategoryBar category={category} />}
      {breadcrumbs && breadcrumbs.length > 0 && <Breadcrumbs items={breadcrumbs} />}
      <h1
        className={cn("font-georgia text-3xl md:text-4xl text-foreground mb-2", titleClassName)}
        data-testid={titleTestId}
      >
        {title}
      </h1>
      {children}
    </div>
  );
}

/** Georgia section heading (h2 by default). */
export function SectionHeading({
  children,
  className,
  as: Tag = "h2",
}: {
  children: ReactNode;
  className?: string;
  as?: "h2" | "h3";
}) {
  return <Tag className={cn("font-georgia text-xl text-foreground", className)}>{children}</Tag>;
}

/** Content section separated by a hairline top border. */
export function PageSection({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <section className={cn("py-8 border-t border-border", className)}>{children}</section>;
}
