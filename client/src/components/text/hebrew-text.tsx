interface HebrewTextProps {
  text: string;
  className?: string;
}

export function HebrewText({ text, className = "" }: HebrewTextProps) {
  // Split text into paragraphs and format
  const paragraphs = text.split('\n\n').filter(p => p.trim());
  
  return (
    <div className={`hebrew-text space-y-4 text-gray-800 ${className}`}>
      {paragraphs.map((paragraph, index) => (
        <p key={index} className="leading-relaxed">
          {paragraph}
        </p>
      ))}
    </div>
  );
}
