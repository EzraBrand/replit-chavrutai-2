import { formatEnglishText, processHebrewText, processEnglishText } from "@/lib/text-processing";
import type { TalmudText } from "@/types/talmud";

interface SectionedBilingualDisplayProps {
  text: TalmudText;
}

export function SectionedBilingualDisplay({ text }: SectionedBilingualDisplayProps) {
  // Use sections if available, otherwise fall back to combined text
  const hebrewSections = text.hebrewSections || [text.hebrewText];
  const englishSections = text.englishSections || [text.englishText];
  
  // Ensure we have the same number of sections for both languages
  const maxSections = Math.max(hebrewSections.length, englishSections.length);
  
  return (
    <div className="bg-card rounded-lg shadow-sm border border-border p-6">
      <div className="space-y-8">
        {Array.from({ length: maxSections }, (_, index) => {
          const hebrewSection = hebrewSections[index] || '';
          const englishSection = englishSections[index] || '';
          
          // Skip empty sections
          if (!hebrewSection.trim() && !englishSection.trim()) {
            return null;
          }
          
          return (
            <div key={index} className="border-b border-border/50 pb-6 last:border-b-0 last:pb-0">
              {/* Sefaria Link Header */}
              <div className="flex items-center justify-center mb-4">
                <a 
                  href={`https://www.sefaria.org.il/${text.tractate}.${text.folio}${text.side}.${index + 1}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-secondary hover:bg-secondary/80 text-secondary-foreground px-3 py-1 rounded-full text-sm font-semibold transition-colors duration-200 flex items-center gap-1"
                >
                  section {index + 1} <span className="text-xs">↗</span>
                </a>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Hebrew Section (First on Mobile, Right Side on Desktop) */}
                <div className="space-y-3 lg:order-2">
                  {hebrewSection.trim() && (
                    <div className="hebrew-text text-foreground">
                      {processHebrewText(hebrewSection).split('\n').filter(line => line.trim()).map((line, lineIndex) => (
                        <p 
                          key={lineIndex} 
                          className="leading-relaxed mb-2"
                          dangerouslySetInnerHTML={{ __html: line.trim() }}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* English Section (Second on Mobile, Left Side on Desktop) */}
                <div className="space-y-3 lg:order-1">
                  {englishSection.trim() && (
                    <div className="english-text text-foreground">
                      <div 
                        dangerouslySetInnerHTML={{ __html: formatEnglishText(processEnglishText(englishSection)) }}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        
        {/* Next Page Continuation */}
        {text.nextPageFirstSection && (
          <div className="border-t-2 border-border pt-6 mt-6">
            <div className="flex items-center justify-center mb-4">
              <div className="bg-muted text-muted-foreground px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                continued on next page...
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 opacity-60">
              {/* Hebrew Continuation (First on Mobile, Right Side on Desktop) */}
              <div className="space-y-3 lg:order-2">
                {text.nextPageFirstSection.hebrew.trim() && (
                  <div className="hebrew-text text-muted-foreground">
                    {processHebrewText(text.nextPageFirstSection.hebrew).split('\n').filter(line => line.trim()).map((line, lineIndex) => (
                      <p 
                        key={lineIndex} 
                        className="leading-relaxed mb-2"
                        dangerouslySetInnerHTML={{ __html: line.trim() }}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* English Continuation (Second on Mobile, Left Side on Desktop) */}
              <div className="space-y-3 lg:order-1">
                {text.nextPageFirstSection.english.trim() && (
                  <div className="english-text text-muted-foreground">
                    <div 
                      dangerouslySetInnerHTML={{ __html: formatEnglishText(processEnglishText(text.nextPageFirstSection.english)) }}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}