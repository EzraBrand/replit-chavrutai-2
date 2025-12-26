import { useParams } from 'wouter';
import { ArrowLeft, BookOpen } from "lucide-react";
import { Link } from "wouter";
import { OutlineTable } from "@/components/outline/outline-table";
import { Footer } from "@/components/footer";
import { sanhedrin10Outline } from "@/lib/outline-data";
import { useSEO } from "@/hooks/use-seo";
import type { ChapterOutline } from '@shared/schema';

// For now, we'll use static data. Later this can be fetched from an API
const getOutlineData = (tractate: string, chapter: string): ChapterOutline | null => {
  if (tractate.toLowerCase() === 'sanhedrin' && chapter === '10') {
    return sanhedrin10Outline;
  }
  return null;
};

export default function TractateOutlinePage() {
  const params = useParams<{ tractate: string; chapter: string }>();
  const { tractate, chapter } = params;

  if (!tractate || !chapter) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="text-center">
          <h2 className="text-2xl text-sepia-800 dark:text-sepia-200 mb-4">
            Invalid Outline Request
          </h2>
          <p className="text-sepia-600 dark:text-sepia-400 mb-6">
            Please specify both tractate and chapter for the outline.
          </p>
          <Link 
            href="/talmud"
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            ← Return to Contents
          </Link>
        </div>
      </div>
    );
  }

  const outline = getOutlineData(tractate, chapter);

  if (!outline) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="text-center">
          <h2 className="text-2xl text-sepia-800 dark:text-sepia-200 mb-4">
            Outline Not Available
          </h2>
          <p className="text-sepia-600 dark:text-sepia-400 mb-6">
            The outline for {tractate.charAt(0).toUpperCase() + tractate.slice(1)} chapter {chapter} is not yet available.
          </p>
          <div className="space-x-4">
            <Link 
              href={`/tractate/${tractate.toLowerCase()}`}
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              ← View {tractate.charAt(0).toUpperCase() + tractate.slice(1)} Contents
            </Link>
            <Link 
              href="/talmud"
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              All Tractates
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // SEO optimization
  useSEO({
    title: `Outline of ${outline.tractate} ${outline.chapter}${outline.chapterName ? ` (${outline.chapterName})` : ''}`,
    description: `Detailed topic-based outline and analysis of ${outline.tractate} chapter ${outline.chapter}. Navigate through key discussions, themes, and rabbinic debates with structured organization.`,
    keywords: `Talmud outline, Talmud table of contents, ${outline.tractate}, Jewish learning, Talmudic analysis`,
    canonical: `${window.location.origin}/outline/${outline.tractate.toLowerCase()}/${outline.chapter}`,
    robots: 'index, follow'
  });

  return (
    <div className="max-w-5xl mx-auto px-6 py-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Link 
            href="/"
            className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-2"
            data-testid="link-home"
          >
            <ArrowLeft className="h-4 w-4" />
            Home
          </Link>
        </div>

        <div className="flex items-center gap-3 mb-2">
          <BookOpen className="h-6 w-6 text-sepia-600 dark:text-sepia-400" />
          <h1 className="text-3xl text-sepia-800 dark:text-sepia-200">
            Outline of {outline.tractate} {outline.chapter}
            {outline.chapterName && (
              <span className="text-sepia-600 dark:text-sepia-400 ml-2">
                ({outline.chapterName})
              </span>
            )}
          </h1>
        </div>
        
        <p className="text-sepia-600 dark:text-sepia-400 max-w-3xl">
          Topic-based analysis and navigation guide for {outline.tractate} chapter {outline.chapter}. 
          Click on location ranges to jump to the corresponding text sections.
        </p>
      </div>

      {/* Outline Table */}
      <div className="bg-white dark:bg-sepia-900 rounded-lg shadow-lg p-6">
        <div className="mb-4">
          <h2 className="text-xl text-sepia-800 dark:text-sepia-200 mb-2">
            Chapter Outline
          </h2>
          <div className="text-sm text-sepia-600 dark:text-sepia-400">
            {outline.entries.length} sections • Total of {outline.entries.reduce((sum, entry) => sum + entry.sectionCount, 0)} subsections
          </div>
        </div>
        
        <OutlineTable outline={outline} />
      </div>

      <Footer />
    </div>
  );
}