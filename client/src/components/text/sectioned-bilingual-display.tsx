import { formatEnglishText, processHebrewText } from "@/lib/text-processing";
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
    <div className="bg-white rounded-lg shadow-sm border border-sepia-200 p-6">
      <div className="space-y-8">
        {Array.from({ length: maxSections }, (_, index) => {
          const hebrewSection = hebrewSections[index] || '';
          const englishSection = englishSections[index] || '';
          
          // Skip empty sections
          if (!hebrewSection.trim() && !englishSection.trim()) {
            return null;
          }
          
          return (
            <div key={index} className="border-b border-sepia-100 pb-6 last:border-b-0 last:pb-0">
              {/* Section Number Header */}
              <div className="flex items-center justify-center mb-4">
                <span className="bg-sepia-100 text-gray-800 px-3 py-1 rounded-full text-sm font-semibold">
                  Section {index + 1}
                </span>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* English Section (Left Side) */}
                <div className="space-y-3">
                  <h4 className="text-base font-semibold text-gray-800 border-b border-sepia-200 pb-1">
                    English Translation
                  </h4>
                  {englishSection.trim() && (
                    <div className="english-text text-gray-800">
                      {formatEnglishText(englishSection).split('\n\n').filter(p => p.trim()).map((paragraph, pIndex) => (
                        <p 
                          key={pIndex} 
                          className="leading-relaxed mb-3"
                          dangerouslySetInnerHTML={{ __html: paragraph }}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Hebrew Section (Right Side) */}
                <div className="space-y-3">
                  <h4 className="text-base font-semibold text-gray-800 border-b border-sepia-200 pb-1">
                    טקסט עברי
                  </h4>
                  {hebrewSection.trim() && (
                    <div className="hebrew-text text-gray-800">
                      {processHebrewText(hebrewSection).split('\n').filter(line => line.trim()).map((line, lineIndex) => (
                        <p 
                          key={lineIndex} 
                          className="leading-relaxed mb-2"
                        >
                          {line.trim()}
                        </p>
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