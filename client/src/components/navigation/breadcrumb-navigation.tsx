import { Home } from "lucide-react";
import { Link } from "wouter";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

interface BreadcrumbNavigationItem {
  label: string;
  href?: string;
}

interface BreadcrumbNavigationProps {
  items: BreadcrumbNavigationItem[];
}

export function BreadcrumbNavigation({ items }: BreadcrumbNavigationProps) {
  return (
    <Breadcrumb className="mb-6">
      <BreadcrumbList>
        {/* Home link */}
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href="/" className="flex items-center">
              <Home className="h-4 w-4" />
              <span className="sr-only">Home</span>
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        
        {/* Separator after home */}
        {items.length > 0 && <BreadcrumbSeparator />}
        
        {/* Breadcrumb items */}
        {items.map((item, index) => (
          <div key={index} className="flex items-center">
            <BreadcrumbItem>
              {item.href ? (
                <BreadcrumbLink asChild>
                  <Link href={item.href} className="truncate max-w-[150px] sm:max-w-none" title={item.label}>
                    {item.label}
                  </Link>
                </BreadcrumbLink>
              ) : (
                <BreadcrumbPage className="truncate max-w-[150px] sm:max-w-none" title={item.label}>
                  {item.label}
                </BreadcrumbPage>
              )}
            </BreadcrumbItem>
            
            {/* Separator between items (not after the last item) */}
            {index < items.length - 1 && <BreadcrumbSeparator />}
          </div>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

// Helper function to generate breadcrumb items for different page types
export const breadcrumbHelpers = {
  // Tractate view breadcrumbs (main text page)
  tractateView: (tractate: string, folio: number, side: 'a' | 'b'): BreadcrumbNavigationItem[] => [
    { label: "Contents", href: "/contents" },
    { label: tractate, href: `/contents/${tractate.toLowerCase().replace(/\s+/g, '-')}` },
    { label: `${folio}${side}` }
  ],

  // Contents page breadcrumbs
  contents: (): BreadcrumbNavigationItem[] => [
    { label: "Contents" }
  ],

  // Tractate contents page breadcrumbs  
  tractateContents: (tractate: string): BreadcrumbNavigationItem[] => [
    { label: "Contents", href: "/contents" },
    { label: tractate }
  ],

  // About page breadcrumbs
  about: (): BreadcrumbNavigationItem[] => [
    { label: "About" }
  ]
};