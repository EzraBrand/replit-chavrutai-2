interface EnglishTextProps {
  text: string;
  className?: string;
}

export function EnglishText({ text, className = "" }: EnglishTextProps) {
  // Split text into paragraphs and format
  const paragraphs = text.split('\n\n').filter(p => p.trim());
  
  return (
    <div className={`english-text space-y-4 text-gray-800 ${className}`}>
      {paragraphs.map((paragraph, index) => (
        <p key={index} className="leading-relaxed">
          {paragraph}
        </p>
      ))}
    </div>
  );
}
