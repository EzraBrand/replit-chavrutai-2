import { useMemo } from "react";
import { useGazetteerData, TextHighlighter, type HighlightCategory } from "@/lib/gazetteer";
import { usePreferences } from "@/context/preferences-context";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface HighlightedTextProps {
  text: string;
  className?: string;
}

export function HighlightedText({ text, className = "" }: HighlightedTextProps) {
  const { preferences } = usePreferences();
  const { data: gazetteerData, isLoading, error } = useGazetteerData();

  // Determine which categories should be highlighted
  const enabledCategories = useMemo((): HighlightCategory[] => {
    if (!preferences.highlighting.enabled) return [];
    
    const categories: HighlightCategory[] = [];
    if (preferences.highlighting.concepts) categories.push('concept');
    if (preferences.highlighting.names) categories.push('name');
    if (preferences.highlighting.places) categories.push('place');
    
    return categories;
  }, [preferences.highlighting]);

  // Create the highlighter instance and process text
  const processedText = useMemo(() => {
    // If highlighting is disabled or data isn't available, return original text
    if (!preferences.highlighting.enabled || !gazetteerData || enabledCategories.length === 0) {
      return text;
    }

    try {
      const highlighter = new TextHighlighter(gazetteerData);
      return highlighter.applyHighlighting(text, enabledCategories);
    } catch (error) {
      console.warn('Failed to apply text highlighting:', error);
      return text;
    }
  }, [text, gazetteerData, enabledCategories, preferences.highlighting.enabled]);

  // Show loading state while fetching gazetteer data (only if highlighting is enabled)
  if (preferences.highlighting.enabled && isLoading) {
    return (
      <div className={`relative ${className}`}>
        <div dangerouslySetInnerHTML={{ __html: text }} />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-50/50 to-transparent animate-pulse pointer-events-none" />
      </div>
    );
  }

  // Show error state (fallback to original text)
  if (preferences.highlighting.enabled && error) {
    console.warn('Failed to load gazetteer data:', error);
  }

  return (
    <div 
      className={`highlighted-text ${className}`}
      dangerouslySetInnerHTML={{ __html: processedText }}
    />
  );
}

// Enhanced version with tooltips for highlighted terms
export function HighlightedTextWithTooltips({ text, className = "" }: HighlightedTextProps) {
  const { preferences } = usePreferences();
  const { data: gazetteerData, isLoading, error } = useGazetteerData();

  // Determine which categories should be highlighted
  const enabledCategories = useMemo((): HighlightCategory[] => {
    if (!preferences.highlighting.enabled) return [];
    
    const categories: HighlightCategory[] = [];
    if (preferences.highlighting.concepts) categories.push('concept');
    if (preferences.highlighting.names) categories.push('name');
    if (preferences.highlighting.places) categories.push('place');
    
    return categories;
  }, [preferences.highlighting]);

  // Create the highlighter instance and get matches
  const matches = useMemo(() => {
    if (!preferences.highlighting.enabled || !gazetteerData || enabledCategories.length === 0) {
      return [];
    }

    try {
      const highlighter = new TextHighlighter(gazetteerData);
      return highlighter.findMatches(text, enabledCategories);
    } catch (error) {
      console.warn('Failed to find text matches:', error);
      return [];
    }
  }, [text, gazetteerData, enabledCategories, preferences.highlighting.enabled]);

  // Render text with interactive tooltips
  const renderTextWithTooltips = () => {
    if (matches.length === 0) {
      return text;
    }

    const parts: JSX.Element[] = [];
    let lastIndex = 0;

    matches.forEach((match, index) => {
      // Add text before the match
      if (match.startIndex > lastIndex) {
        parts.push(
          <span key={`text-${index}`}>
            {text.substring(lastIndex, match.startIndex)}
          </span>
        );
      }

      // Add the highlighted term with tooltip
      const categoryInfo = {
        concept: { label: 'Concept', color: 'blue' },
        name: { label: 'Name', color: 'yellow' },
        place: { label: 'Place', color: 'green' },
      };

      const info = categoryInfo[match.category];
      const highlightClass = {
        concept: 'bg-blue-100 dark:bg-blue-900/30 text-blue-900 dark:text-blue-100',
        name: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-900 dark:text-yellow-100',
        place: 'bg-green-100 dark:bg-green-900/30 text-green-900 dark:text-green-100',
      }[match.category];

      parts.push(
        <Tooltip key={`tooltip-${index}`}>
          <TooltipTrigger asChild>
            <span 
              className={`${highlightClass} rounded px-1 cursor-help transition-colors hover:shadow-sm`}
              data-term={match.term}
              data-category={match.category}
              data-testid={`highlighted-term-${match.category}`}
            >
              {text.substring(match.startIndex, match.endIndex)}
            </span>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs">
            <p className="font-medium">{match.term}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Category: {info.label}
            </p>
          </TooltipContent>
        </Tooltip>
      );

      lastIndex = match.endIndex;
    });

    // Add remaining text
    if (lastIndex < text.length) {
      parts.push(
        <span key="text-end">
          {text.substring(lastIndex)}
        </span>
      );
    }

    return parts;
  };

  // Show loading state while fetching gazetteer data (only if highlighting is enabled)
  if (preferences.highlighting.enabled && isLoading) {
    return (
      <div className={`relative ${className}`}>
        <span>{text}</span>
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-50/50 to-transparent animate-pulse pointer-events-none" />
      </div>
    );
  }

  // Show error state (fallback to original text)
  if (preferences.highlighting.enabled && error) {
    console.warn('Failed to load gazetteer data:', error);
  }

  return (
    <span className={`highlighted-text-with-tooltips ${className}`}>
      {renderTextWithTooltips()}
    </span>
  );
}