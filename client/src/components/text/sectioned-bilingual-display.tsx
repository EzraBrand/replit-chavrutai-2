import { useEffect } from "react";
import { formatEnglishText, processHebrewText, processEnglishText } from "@/lib/text-processing";
import { usePreferences } from "@/context/preferences-context";
import { useGazetteerData, TextHighlighter, type HighlightCategory } from "@/lib/gazetteer";
import type { TalmudText } from "@/types/talmud";

interface SectionedBilingualDisplayProps {
  text: TalmudText;
  onSectionVisible?: (sectionNumber: number) => void;
}

export function SectionedBilingualDisplay({ text, onSectionVisible }: SectionedBilingualDisplayProps) {
  const { preferences } = usePreferences();
  const { data: gazetteerData, isLoading: isGazetteerLoading, error: gazetteerError } = useGazetteerData();

  
  // Use sections if available, otherwise fall back to combined text
  const hebrewSections = text.hebrewSections || [text.hebrewText];
  const englishSections = text.englishSections || [text.englishText];
  
  // Ensure we have the same number of sections for both languages
  const maxSections = Math.max(hebrewSections.length, englishSections.length);
  
  // Get Hebrew font class based on selected font
  const getHebrewFontClass = () => `hebrew-font-${preferences.hebrewFont}`;

  // Function to apply highlighting to text if enabled
  const applyHighlighting = (text: string): string => {
    if (!preferences.highlighting.enabled || !gazetteerData) {
      return text;
    }

    const enabledCategories: HighlightCategory[] = [];
    if (preferences.highlighting.concepts) enabledCategories.push('concept');
    if (preferences.highlighting.names) enabledCategories.push('name');
    if (preferences.highlighting.places) enabledCategories.push('place');

    if (enabledCategories.length === 0) {
      return text;
    }

    try {
      const highlighter = new TextHighlighter(gazetteerData);
      const highlighted = highlighter.applyHighlighting(text, enabledCategories);
      return highlighted;
    } catch (error) {
      console.warn('Failed to apply highlighting:', error);
      return text;
    }
  };
  


  // Handle hash navigation for sections
  useEffect(() => {
    const hash = window.location.hash;
    if (hash && hash.startsWith('#section-')) {
      const sectionNumber = parseInt(hash.replace('#section-', ''));
      if (sectionNumber >= 1 && sectionNumber <= maxSections) {
        // Small delay to ensure DOM is ready
        setTimeout(() => {
          const sectionElement = document.getElementById(`section-${sectionNumber}`);
          if (sectionElement) {
            // Smooth scroll to the section with offset for sticky header
            const headerOffset = 100; // Adjust based on your header height
            const elementPosition = sectionElement.offsetTop;
            const offsetPosition = elementPosition - headerOffset;
            
            window.scrollTo({
              top: offsetPosition,
              behavior: 'smooth'
            });
            
            // Notify parent component about visible section
            onSectionVisible?.(sectionNumber);
          }
        }, 100);
      }
    }
  }, [maxSections, text.tractate, text.folio, text.side, onSectionVisible]);

  // Track hash changes for direct navigation
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash && hash.startsWith('#section-')) {
        const sectionNumber = parseInt(hash.replace('#section-', ''));
        if (sectionNumber >= 1 && sectionNumber <= maxSections) {
          onSectionVisible?.(sectionNumber);
        }
      }
    };

    // Listen for hash changes
    window.addEventListener('hashchange', handleHashChange);
    
    // Check initial hash
    handleHashChange();

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, [maxSections, onSectionVisible]);

  // Passive scroll tracking using scroll events - only when no hash navigation
  useEffect(() => {
    let scrollTimeout: NodeJS.Timeout;
    let isUserScrolling = false;
    let scrollStartTime = 0;
    
    const handleScroll = () => {
      // Mark that user is actively scrolling
      isUserScrolling = true;
      scrollStartTime = Date.now();
      
      // Clear previous timeout
      clearTimeout(scrollTimeout);
      
      // Debounce scroll events to avoid excessive updates
      scrollTimeout = setTimeout(() => {
        // If user scrolled manually while there was a hash, clear the hash
        const currentHash = window.location.hash;
        if (currentHash && currentHash.startsWith('#section-') && isUserScrolling) {
          // Clear hash without affecting history
          const newUrl = window.location.pathname + window.location.search;
          window.history.replaceState(null, '', newUrl);
        }
        
        // Find which section is most visible in the center of the viewport
        const viewportHeight = window.innerHeight;
        const centerY = window.scrollY + viewportHeight / 2;
        
        let closestSection = 1;
        let closestDistance = Infinity;
        
        for (let i = 1; i <= maxSections; i++) {
          const element = document.getElementById(`section-${i}`);
          if (element) {
            const rect = element.getBoundingClientRect();
            const elementCenterY = window.scrollY + rect.top + rect.height / 2;
            const distance = Math.abs(centerY - elementCenterY);
            
            if (distance < closestDistance) {
              closestDistance = distance;
              closestSection = i;
            }
          }
        }
        
        // Only update the indicator
        onSectionVisible?.(closestSection);
        
        // Reset user scrolling flag after a delay
        setTimeout(() => {
          isUserScrolling = false;
        }, 200);
      }, 150); // Slightly longer debounce for stability
    };

    // Add scroll listener
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    // Initial check only if no hash
    if (!window.location.hash) {
      handleScroll();
    }

    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(scrollTimeout);
    };
  }, [maxSections, onSectionVisible]);

  // Copy-paste handler to preserve formatting and ensure Hebrew comes before English
  useEffect(() => {
    const container = document.querySelector('.bg-card.rounded-lg.shadow-sm.border.border-border.p-6');
    if (!container) return;

    const handleCopy = (e: ClipboardEvent) => {
      const selection = window.getSelection();
      if (!selection || !selection.rangeCount) return;

      const range = selection.getRangeAt(0);
      const fragment = range.cloneContents();

      const tempDiv = document.createElement('div');
      tempDiv.appendChild(fragment);

      // Remove the external link arrow symbol (↗) from the copy
      const removeExternalLinkArrow = (element: HTMLElement): void => {
        const walker = document.createTreeWalker(
          element,
          NodeFilter.SHOW_TEXT,
          null
        );
        
        const textNodesToUpdate: { node: Text; newValue: string }[] = [];
        let node: Node | null;
        
        while ((node = walker.nextNode())) {
          if (node.nodeType === Node.TEXT_NODE && node.textContent) {
            const cleaned = node.textContent.replace(/↗/g, '').trim();
            if (cleaned !== node.textContent.trim()) {
              textNodesToUpdate.push({ node: node as Text, newValue: cleaned });
            }
          }
        }
        
        textNodesToUpdate.forEach(({ node, newValue }) => {
          node.textContent = newValue;
        });
      };

      removeExternalLinkArrow(tempDiv);

      // Remove section headers (e.g., "section 1", "section 2", etc.)
      const removeSectionHeaders = (element: HTMLElement): void => {
        const sectionLinks = element.querySelectorAll('[data-testid^="link-sefaria-section-"]');
        sectionLinks.forEach(link => {
          const parent = link.parentElement;
          if (parent) {
            parent.remove();
          }
        });
      };

      removeSectionHeaders(tempDiv);

      // Reorder content so Hebrew comes before English (working only on the clone)
      const reorderHebrewFirst = (element: HTMLElement): void => {
        const textDisplays = element.querySelectorAll('.text-display');
        textDisplays.forEach(display => {
          const englishCol = display.querySelector('.lg\\:order-1');
          const hebrewCol = display.querySelector('.lg\\:order-2');
          
          if (englishCol && hebrewCol && englishCol.parentNode === hebrewCol.parentNode) {
            const parent = englishCol.parentNode;
            if (parent && parent.contains(hebrewCol) && parent.contains(englishCol)) {
              // Clone Hebrew and insert it before English
              const hebrewClone = hebrewCol.cloneNode(true);
              parent.insertBefore(hebrewClone, englishCol);
              // Remove the original Hebrew position (which is after English)
              parent.removeChild(hebrewCol);
            }
          }
        });
      };

      reorderHebrewFirst(tempDiv);

      const stripFormattingExcept = (element: HTMLElement): string => {
        const allowedTags = ['strong', 'b', 'i', 'em', 'p', 'div', 'br', 'span', 'a', 'sup', 'sub', 'small'];
        
        const walker = document.createTreeWalker(
          element,
          NodeFilter.SHOW_ELEMENT,
          null
        );

        const nodesToProcess: Element[] = [];
        let node: Node | null;

        while ((node = walker.nextNode())) {
          nodesToProcess.push(node as Element);
        }

        nodesToProcess.forEach(node => {
          const tagName = node.tagName.toLowerCase();
          
          if (!allowedTags.includes(tagName)) {
            const parent = node.parentNode;
            if (!parent) return;
            while (node.firstChild) {
              parent.insertBefore(node.firstChild, node);
            }
            parent.removeChild(node);
          } else {
            const el = node as HTMLElement;
            const attrsToKeep = ['dir', 'style', 'href', 'target', 'rel', 'class'];
            const attrsToRemove: string[] = [];
            
            for (let i = 0; i < el.attributes.length; i++) {
              const attrName = el.attributes[i].name;
              const isDataAttr = attrName.startsWith('data-');
              if (!attrsToKeep.includes(attrName) && !isDataAttr) {
                attrsToRemove.push(attrName);
              }
            }
            
            attrsToRemove.forEach(attr => el.removeAttribute(attr));
            
            const currentStyle = el.getAttribute('style') || '';
            const styleUpdates: Record<string, string> = {};
            
            if (tagName === 'strong' || tagName === 'b') {
              styleUpdates['font-weight'] = 'bold';
            }
            if (tagName === 'em' || tagName === 'i') {
              styleUpdates['font-style'] = 'italic';
            }
            
            // Check for explicit dir attribute OR hebrew-text class
            const isHebrew = (el.hasAttribute('dir') && el.getAttribute('dir') === 'rtl') || 
                            el.classList.contains('hebrew-text') ||
                            el.closest('.hebrew-text');
            
            if (isHebrew) {
              styleUpdates['direction'] = 'rtl';
              styleUpdates['font-weight'] = 'bold';
            }
            
            if (Object.keys(styleUpdates).length > 0) {
              const existingStyles = currentStyle.split(';')
                .filter(s => s.trim())
                .reduce((acc, style) => {
                  const [key, value] = style.split(':').map(s => s.trim());
                  if (key && value && !styleUpdates.hasOwnProperty(key)) {
                    acc[key] = value;
                  }
                  return acc;
                }, {} as Record<string, string>);
              
              const mergedStyles = { ...existingStyles, ...styleUpdates };
              const newStyle = Object.entries(mergedStyles)
                .map(([key, value]) => `${key}: ${value}`)
                .join('; ');
              
              el.setAttribute('style', newStyle);
            }
          }
        });

        return element.innerHTML;
      };

      const cleanHTML = stripFormattingExcept(tempDiv);
      
      const getPlainText = (element: HTMLElement, isRoot = true): string => {
        let text = '';
        element.childNodes.forEach(node => {
          if (node.nodeType === Node.TEXT_NODE) {
            text += node.textContent;
          } else if (node.nodeType === Node.ELEMENT_NODE) {
            const el = node as HTMLElement;
            const tag = el.tagName.toLowerCase();
            
            if (tag === 'br') {
              text += '\n';
            } else if (tag === 'p' || tag === 'div') {
              text += getPlainText(el, false) + '\n';
            } else {
              text += getPlainText(el, false);
            }
          }
        });
        return isRoot ? text.trimEnd() : text;
      };
      
      const plainText = getPlainText(tempDiv);

      if (e.clipboardData) {
        e.clipboardData.setData('text/html', cleanHTML);
        e.clipboardData.setData('text/plain', plainText);
        e.preventDefault();
      }
    };

    container.addEventListener('copy', handleCopy as EventListener);

    return () => {
      container.removeEventListener('copy', handleCopy as EventListener);
    };
  }, [text]);
  
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
            <div 
              key={index} 
              id={`section-${index + 1}`}
              className="border-b border-border/50 pb-6 last:border-b-0 last:pb-0 scroll-mt-24"
            >
              {/* Section Header - Combined Link to Sefaria */}
              <div className="flex items-center justify-center gap-2 mb-4">
                {/* Combined Section Link to Sefaria */}
                <a 
                  href={`https://www.sefaria.org.il/${text.tractate}.${text.folio}${text.side}.${index + 1}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-secondary hover:bg-secondary/80 text-secondary-foreground px-3 py-1 rounded-full text-sm font-semibold transition-colors duration-200 flex items-center gap-1"
                  data-testid={`link-sefaria-section-${index + 1}`}
                  title={`View section ${index + 1} on Sefaria`}
                >
                  section {index + 1} <span className="text-xs">↗</span>
                </a>
              </div>
              
              <div className="text-display flex flex-col lg:flex-row gap-6">
                {/* English Section (First on Mobile, Left Side on Desktop) */}
                <div className="text-column space-y-3 lg:order-1">
                  {englishSection.trim() && (
                    <div className="english-text text-foreground">
                      <div 
                        dangerouslySetInnerHTML={{ __html: applyHighlighting(formatEnglishText(processEnglishText(englishSection))) }}
                      />
                    </div>
                  )}
                </div>

                {/* Hebrew Section (Second on Mobile, Right Side on Desktop) */}
                <div className="text-column lg:order-2">
                  {hebrewSection.trim() && (
                    <div className={`hebrew-text text-foreground ${getHebrewFontClass()}`}>
                      {processHebrewText(hebrewSection).split('\n').filter(line => line.trim()).map((line, lineIndex) => (
                        <p 
                          key={lineIndex} 
                          className="leading-relaxed"
                          dangerouslySetInnerHTML={{ __html: applyHighlighting(line.trim()) }}
                        />
                      ))}
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
            
            <div className="text-display flex flex-col lg:flex-row gap-6 opacity-60">
              {/* English Continuation (First on Mobile, Left Side on Desktop) */}
              <div className="text-column space-y-3 lg:order-1">
                {text.nextPageFirstSection.english.trim() && (
                  <div className="english-text text-muted-foreground">
                    <div 
                      dangerouslySetInnerHTML={{ __html: formatEnglishText(processEnglishText(text.nextPageFirstSection.english)) }}
                    />
                  </div>
                )}
              </div>

              {/* Hebrew Continuation (Second on Mobile, Right Side on Desktop) */}
              <div className="text-column lg:order-2">
                {text.nextPageFirstSection.hebrew.trim() && (
                  <div className={`hebrew-text text-muted-foreground ${getHebrewFontClass()}`}>
                    {processHebrewText(text.nextPageFirstSection.hebrew).split('\n').filter(line => line.trim()).map((line, lineIndex) => (
                      <p 
                        key={lineIndex} 
                        className="leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: line.trim() }}
                      />
                    ))}
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