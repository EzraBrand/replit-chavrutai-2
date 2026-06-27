import { processHebrewText, formatEnglishText } from "@/lib/text-processing";
import { HighlightedText } from "./highlighted-text";

interface HebrewTextProps {
  text: string;
  className?: string;
}

export function HebrewText({ text, className = "" }: HebrewTextProps) {
  // Process Hebrew text to remove nikud and normalize formatting
  const processedText = processHebrewText(text);
  // Apply same formatting logic as English text for consistency
  const formattedText = formatEnglishText(processedText);
  
  // Split text into paragraphs and format
  const paragraphs = formattedText.split('\n\n').filter(p => p.trim());
  
  return (
    <div className={`hebrew-text space-y-4 text-gray-800 ${className}`}>
      {paragraphs.map((paragraph, index) => (
        <p key={index} className="leading-relaxed">
          <HighlightedText 
            text={paragraph}
          />
        </p>
      ))}
    </div>
  );
}
