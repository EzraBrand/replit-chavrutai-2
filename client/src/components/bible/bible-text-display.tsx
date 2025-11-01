import { usePreferences } from "@/context/preferences-context";
import { processHebrewText, processEnglishText, formatEnglishText } from "@/lib/text-processing";
import type { BibleText } from "@/types/bible";

interface BibleTextDisplayProps {
  text: BibleText;
}

export function BibleTextDisplay({ text }: BibleTextDisplayProps) {
  const { preferences } = usePreferences();
  
  // Get Hebrew font class based on selected font
  const getHebrewFontClass = () => `hebrew-font-${preferences.hebrewFont}`;
  
  const maxVerses = Math.max(text.hebrewVerses.length, text.englishVerses.length);
  
  return (
    <div className="bg-card rounded-lg shadow-sm border border-border p-6" data-testid="bible-text-display">
      <div className="space-y-8">
        {Array.from({ length: maxVerses }, (_, index) => {
          const hebrewVerse = text.hebrewVerses[index] || '';
          const englishVerse = text.englishVerses[index] || '';
          
          // Skip empty verses
          if (!hebrewVerse.trim() && !englishVerse.trim()) {
            return null;
          }
          
          const verseNumber = index + 1;
          
          return (
            <div 
              key={index} 
              id={`verse-${verseNumber}`}
              className="border-b border-border/50 pb-6 last:border-b-0 last:pb-0 scroll-mt-24"
            >
              {/* Verse Header - Link to Sefaria */}
              <div className="flex items-center justify-center gap-2 mb-4">
                <a 
                  href={`https://www.sefaria.org/${text.sefariaRef}.${verseNumber}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-secondary hover:bg-secondary/80 text-secondary-foreground px-3 py-1 rounded-full text-sm font-semibold transition-colors duration-200 flex items-center gap-1"
                  data-testid={`link-sefaria-verse-${verseNumber}`}
                  title={`View verse ${verseNumber} on Sefaria`}
                >
                  verse {verseNumber} <span className="text-xs">↗</span>
                </a>
              </div>
              
              <div className="text-display flex flex-col lg:flex-row gap-6">
                {/* English Verse (First on Mobile, Left Side on Desktop) */}
                <div className="text-column space-y-3 lg:order-1">
                  {englishVerse.trim() && (
                    <div className="english-text text-foreground">
                      <div 
                        dangerouslySetInnerHTML={{ __html: formatEnglishText(processEnglishText(englishVerse)) }}
                      />
                    </div>
                  )}
                </div>

                {/* Hebrew Verse (Second on Mobile, Right Side on Desktop) */}
                <div className="text-column space-y-3 lg:order-2">
                  {hebrewVerse.trim() && (
                    <div className={`hebrew-text text-foreground ${getHebrewFontClass()}`}>
                      {processHebrewText(hebrewVerse).split('\n').filter(line => line.trim()).map((line, lineIndex, array) => (
                        <p 
                          key={lineIndex} 
                          className={`leading-relaxed ${lineIndex < array.length - 1 ? 'mb-6 lg:mb-8' : 'mb-2'}`}
                          dangerouslySetInnerHTML={{ __html: line.trim() }}
                        />
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
