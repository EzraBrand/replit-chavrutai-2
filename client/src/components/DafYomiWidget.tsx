import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { BookOpen } from "lucide-react";

interface DafYomiData {
  titleEn: string;
  titleHe: string;
  ref: string;
  url: string;
  date: string;
}

interface DafYomiWidgetProps {
  className?: string;
}

function parseDafYomiRef(ref: string): { tractate: string; folio: string } | null {
  const match = ref.match(/^([A-Za-z\s]+)\s+(\d+)([ab])?$/);
  if (match) {
    const tractate = match[1].trim().toLowerCase().replace(/\s+/g, '-');
    const folioNum = match[2];
    const side = match[3] || 'a';
    return { tractate, folio: `${folioNum}${side}` };
  }
  return null;
}

export function DafYomiWidget({ className = "" }: DafYomiWidgetProps) {
  const { data: dafYomi, isLoading } = useQuery<DafYomiData>({
    queryKey: ["/api/daf-yomi"],
  });

  if (isLoading) {
    return (
      <div className={`animate-pulse bg-secondary/50 rounded-lg p-6 ${className}`}>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-5 h-5 bg-secondary rounded"></div>
          <div className="h-6 bg-secondary rounded w-40"></div>
        </div>
        <div className="h-8 bg-secondary rounded w-1/2 mb-3"></div>
        <div className="h-6 bg-secondary rounded w-1/3"></div>
      </div>
    );
  }

  if (!dafYomi) {
    return (
      <div className={`bg-secondary/30 rounded-lg p-6 ${className}`} data-testid="daf-yomi-widget-empty">
        <div className="flex items-center gap-2 mb-4">
          <BookOpen className="w-5 h-5 text-muted-foreground" />
          <h3 className="text-lg font-semibold text-foreground">Today's Daf Yomi</h3>
        </div>
        <p className="text-muted-foreground">
          Unable to load today's daf. Please try again later.
        </p>
      </div>
    );
  }

  const parsed = parseDafYomiRef(dafYomi.ref);
  const studyLink = parsed 
    ? `/tractate/${parsed.tractate}/${parsed.folio}`
    : `/contents`;

  return (
    <div className={`bg-secondary/30 rounded-lg p-6 ${className}`} data-testid="daf-yomi-widget">
      <div className="flex items-center gap-2 mb-4">
        <BookOpen className="w-5 h-5 text-blue-600" />
        <h3 className="text-lg font-semibold text-foreground">Today's Daf Yomi</h3>
      </div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-2xl font-semibold text-foreground mb-1" data-testid="daf-yomi-title-en">
            {dafYomi.titleEn}
          </p>
          <p className="text-xl text-muted-foreground font-hebrew" dir="rtl" data-testid="daf-yomi-title-he">
            {dafYomi.titleHe}
          </p>
        </div>
        <Link
          href={studyLink}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          data-testid="daf-yomi-study-link"
        >
          Study Now
        </Link>
      </div>
    </div>
  );
}
