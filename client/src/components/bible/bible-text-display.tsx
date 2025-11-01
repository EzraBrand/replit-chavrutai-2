import { usePreferences } from "@/context/preferences-context";
import type { BibleText } from "@/types/bible";

interface BibleTextDisplayProps {
  text: BibleText;
}

export function BibleTextDisplay({ text }: BibleTextDisplayProps) {
  const { preferences } = usePreferences();
  
  // Get Hebrew font class based on selected font
  const getHebrewFontClass = () => `hebrew-font-${preferences.hebrewFont}`;
  
  // Get text size class
  const getTextSizeClass = () => {
    const sizeMap: Record<string, string> = {
      'extra-small': 'text-xs',
      'small': 'text-sm',
      'medium': 'text-base',
      'large': 'text-lg',
      'x-large': 'text-xl',
      'xx-large': 'text-2xl'
    };
    return sizeMap[preferences.textSize] || 'text-base';
  };
  
  const isSideBySide = preferences.layout === 'side-by-side';
  
  return (
    <div 
      className={`bible-text-display ${isSideBySide ? 'grid grid-cols-1 lg:grid-cols-2 gap-6' : 'flex flex-col gap-6'}`}
      data-testid="bible-text-display"
    >
      {/* Hebrew Section */}
      <div className="hebrew-section">
        <h3 className="text-lg font-semibold mb-4 text-foreground" data-testid="hebrew-section-heading">
          Hebrew
        </h3>
        <div className="space-y-2">
          {text.hebrewVerses.map((verse, index) => (
            <div 
              key={index} 
              className="verse-item flex gap-3"
              data-testid={`hebrew-verse-${index + 1}`}
            >
              <span className="verse-number text-muted-foreground font-mono text-sm flex-shrink-0 w-8 text-right">
                {index + 1}
              </span>
              <p 
                className={`verse-text ${getHebrewFontClass()} ${getTextSizeClass()} leading-relaxed text-right flex-1`}
                dir="rtl"
                lang="he"
              >
                {verse}
              </p>
            </div>
          ))}
        </div>
      </div>
      
      {/* English Section */}
      <div className="english-section">
        <h3 className="text-lg font-semibold mb-4 text-foreground" data-testid="english-section-heading">
          English (JPS 1985)
        </h3>
        <div className="space-y-2">
          {text.englishVerses.map((verse, index) => (
            <div 
              key={index} 
              className="verse-item flex gap-3"
              data-testid={`english-verse-${index + 1}`}
            >
              <span className="verse-number text-muted-foreground font-mono text-sm flex-shrink-0 w-8">
                {index + 1}
              </span>
              <p 
                className={`verse-text ${getTextSizeClass()} leading-relaxed flex-1`}
                lang="en"
              >
                {verse}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
