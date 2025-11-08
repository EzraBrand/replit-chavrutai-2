import { usePreferences } from "@/context/preferences-context";
import { processBibleHebrewText, processBibleEnglishText, formatEnglishText } from "@/lib/text-processing";
import type { BibleText } from "@/types/bible";

interface BibleTextDisplayProps {
  text: BibleText;
}

export function BibleTextDisplay({ text }: BibleTextDisplayProps) {
  const { preferences } = usePreferences();

  // Get Hebrew font class based on selected font
  const getHebrewFontClass = () => `hebrew-font-${preferences.hebrewFont}`;

  // Safety check for verses array
  if (!text.verses || !Array.isArray(text.verses)) {
    return (
      <div className="bg-card rounded-lg shadow-sm border border-border p-6">
        <p className="text-muted-foreground">Loading verses...</p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg shadow-sm border border-border p-6" data-testid="bible-text-display">
      <div className="space-y-8">
        {text.verses.map((verse) => {
          // Skip empty verses
          if (verse.hebrewSegments.length === 0 && verse.englishSegments.length === 0) {
            return null;
          }

          return (
            <div
              key={verse.verseNumber}
              id={`verse-${verse.verseNumber}`}
              className="border-b border-border/50 pb-6 last:border-b-0 last:pb-0 scroll-mt-24"
            >
              {/* Verse Header - Link to Sefaria */}
              <div className="flex items-center justify-center gap-2 mb-4">
                <a
                  href={`https://www.sefaria.org/${text.sefariaRef}.${verse.verseNumber}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-secondary hover:bg-secondary/80 text-secondary-foreground px-3 py-1 rounded-full text-sm font-semibold transition-colors duration-200 flex items-center gap-1"
                  data-testid={`link-sefaria-verse-${verse.verseNumber}`}
                  title={`View verse ${verse.verseNumber} on Sefaria`}
                >
                  verse {verse.verseNumber} <span className="text-xs">↗</span>
                </a>
              </div>

              <div className="text-display flex flex-col lg:flex-row gap-6">
                {/* English Segments Column (First on Mobile, Left Side on Desktop) */}
                <div className="text-column space-y-3 lg:order-1">
                  {verse.englishSegments.length > 0 && (
                    <div className="english-text text-foreground space-y-3">
                      {verse.englishSegments.map((segment, index) => (
                        <div
                          key={index}
                          dangerouslySetInnerHTML={{ __html: formatEnglishText(processBibleEnglishText(segment)) }}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Hebrew Segments Column (Second on Mobile, Right Side on Desktop) */}
                <div className="text-column space-y-3 lg:order-2">
                  {verse.hebrewSegments.length > 0 && (
                    <div className={`hebrew-text text-foreground ${getHebrewFontClass()} space-y-3`}>
                      {verse.hebrewSegments.map((segment, segIndex) => (
                        <div key={segIndex}>
                          <p className="leading-relaxed">
                            {processBibleHebrewText(segment)}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
