import { formatEnglishText } from "@/lib/text-processing";
import { HighlightedText } from "./highlighted-text";

interface EnglishTextProps {
  text: string;
  className?: string;
}

export function EnglishText({ text, className = "" }: EnglishTextProps) {
  console.log('EnglishText rendering with text length:', text.length);
  
  // Process text for enhanced formatting
  const formattedText = formatEnglishText(text);
  
  // Split text into paragraphs and format
  const paragraphs = formattedText.split('\n\n').filter(p => p.trim());
  
  console.log('EnglishText paragraphs:', paragraphs.length);
  
  return (
    <div className={`english-text space-y-4 text-gray-800 ${className}`}>
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
