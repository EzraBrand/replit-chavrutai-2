import { ExternalLink as ExternalLinkIcon } from "lucide-react";
import { getBibleChapterLinks, type BibleReference } from "@/lib/bible-external-links";

interface BibleExternalLinksFooterProps {
  book: string;
  chapter: number;
}

export function BibleExternalLinksFooter({ book, chapter }: BibleExternalLinksFooterProps) {
  const reference: BibleReference = { book, chapter };
  const chapterLinks = getBibleChapterLinks(reference);
  
  return (
    <div className="mt-8 pt-6 border-t border-border" data-testid="bible-external-links-footer">
      <div className="flex flex-wrap items-center gap-4">
        <span className="text-lg font-semibold text-foreground">External Links:</span>
        {chapterLinks.map((link) => (
          <a
            key={link.name}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
            data-testid={`link-bible-external-${link.name.toLowerCase().replace(/\s+/g, '-')}`}
            title={link.description}
          >
            {link.name}
            <ExternalLinkIcon className="w-3.5 h-3.5" />
          </a>
        ))}
      </div>
    </div>
  );
}
