import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { formatEnglishText, processHebrewText } from "@/lib/text-processing";
import { TRACTATE_LISTS } from "@workspace/shared-data/tractates";
import { BlogPostSelector } from "@/components/sefaria/blog-post-selector";
import { locationToSefariaUrl } from "@/lib/blog-post-utils";
import { PageShell, PageHeader } from "@/components/layout/page-shell";
import { ChatPanel } from "@/components/sefaria/chat-panel";
import type { ChatContext } from "@/hooks/use-chat";
import { useSEO } from "@/hooks/use-seo";
import { getStaticSEO } from "@workspace/shared-data/seo-data";

const tractates = TRACTATE_LISTS["Talmud Bavli"];
const pages = Array.from({ length: 180 }, (_, i) => i + 2).flatMap(num => [`${num}a`, `${num}b`]);
const sections = Array.from({ length: 50 }, (_, i) => i + 1);

interface SefariaResponse {
  tractate: string;
  page: string;
  section?: number;
  hebrewSections: string[];
  englishSections: string[];
  sectionRefs?: { page: string; sectionNum: number }[];
  span: string;
  error?: string;
}

export default function SefariaFetchPage() {
  useSEO({
    ...getStaticSEO("/sugya-viewer", window.location.origin)!,
    structuredData: {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name: "Sugya Viewer",
      description: "Tool for viewing custom Talmud text ranges with Hebrew-English bilingual display",
      url: `${window.location.origin}/sugya-viewer`,
      applicationCategory: "EducationalApplication",
      operatingSystem: "Web",
      publisher: {
        "@type": "Organization",
        name: "Bekiut",
        url: window.location.origin,
      },
    },
  });

  const [tractate, setTractate] = useState<string>(tractates[0]);
  const [page, setPage] = useState<string>("2a");
  const [section, setSection] = useState<string>("all");
  const [url, setUrl] = useState<string>("");
  const [showBlogPostSelector, setShowBlogPostSelector] = useState<boolean>(false);
  const [showAbout, setShowAbout] = useState<boolean>(false);

  // Range selection (within a single tractate)
  const [rangeTractate, setRangeTractate] = useState<string>(tractates[0]);
  const [rangeFromPage, setRangeFromPage] = useState<string>("2a");
  const [rangeFromSection, setRangeFromSection] = useState<string>("1");
  const [rangeToPage, setRangeToPage] = useState<string>("2b");
  const [rangeToSection, setRangeToSection] = useState<string>("1");

  const MAX_AMUDIM_RANGE = 10;
  const rangeFromIdx = pages.indexOf(rangeFromPage);
  const rangeToIdx = pages.indexOf(rangeToPage);
  const amudimSpan = rangeToIdx - rangeFromIdx + 1;
  const sameAmud = rangeFromIdx === rangeToIdx;
  const rangeOrderValid =
    rangeToIdx > rangeFromIdx ||
    (sameAmud && Number(rangeToSection) >= Number(rangeFromSection));
  const rangeWithinLimit = amudimSpan >= 1 && amudimSpan <= MAX_AMUDIM_RANGE;
  const rangeValid = rangeOrderValid && rangeWithinLimit;
  const rangeErrorMsg = !rangeOrderValid
    ? "End must come after start."
    : !rangeWithinLimit
      ? `Range too large — max ${MAX_AMUDIM_RANGE} amudim (you selected ${amudimSpan}).`
      : "";

  const buildRangeRef = (t: string, fp: string, fs: string, tp: string, ts: string) =>
    `${t}.${fp}.${fs}-${tp}.${ts}`;

  interface FetchParams {
    inputMethod: "dropdown" | "url";
    tractate: string;
    page: string;
    section: string;
    url: string;
  }
  const [fetchParams, setFetchParams] = useState<FetchParams | null>(null);

  const buildRefFromDropdowns = (t: string, p: string, s: string) =>
    `${t}.${p}${s !== 'all' ? '.' + s : ''}`;

  const convertChavrutaiRef = (input: string): string => {
    let working = input.trim();

    const urlMatch = working.match(/^https?:\/\/(?:www\.)?(?:bekiut|chavrutai)\.com\/talmud\/([^#?]+?)(?:#(\d+))?$/);
    if (urlMatch) {
      const pathParts = urlMatch[1].split('/');
      const tractate = pathParts.slice(0, -1).join('_').replace(/_/g, ' ');
      const page = pathParts[pathParts.length - 1];
      const section = urlMatch[2];
      return `${tractate}.${page}${section ? '.' + section : ''}`;
    }

    const shortMatch = working.match(/^([A-Za-z_\s]+)\/([\d]+[ab](?:\.\d+(?:-[\d]+[ab](?:\.\d+)?)?)?)(?:#(\d+))?$/);
    if (shortMatch) {
      const tractate = shortMatch[1].trim().replace(/_/g, ' ');
      const section = shortMatch[3];
      return `${tractate}.${shortMatch[2]}${section ? '.' + section : ''}`;
    }

    return input;
  };

  const extractRef = (rawUrl: string): string => {
    const chavrutaiConverted = convertChavrutaiRef(rawUrl);
    if (chavrutaiConverted !== rawUrl) return chavrutaiConverted;

    const stripped = rawUrl
      .replace(/^https?:\/\/www\.sefaria\.org\.il\//, '')
      .replace(/^https?:\/\/www\.sefaria\.org\//, '')
      .split('?')[0];
    return stripped.includes('/') ? stripped.split('/').pop() || stripped : stripped;
  };

  const pushUrlParams = (ref: string) => {
    if (ref) {
      window.history.pushState({}, '', `${window.location.pathname}?${ref}`);
    }
  };

  useEffect(() => {
    const search = window.location.search;
    if (!search) return;
    const raw = search.slice(1);

    if (raw.startsWith('method=')) {
      // Backward compat: old format
      const params = new URLSearchParams(raw);
      const method = params.get('method');
      if (method === 'dropdown') {
        const t = params.get('tractate') || tractates[0];
        const p = params.get('page') || '2a';
        const s = params.get('section') || 'all';
        const resolvedTractate = (tractates as readonly string[]).includes(t) ? t : tractates[0];
        setTractate(resolvedTractate);
        setPage(p);
        setSection(s);
        const ref = buildRefFromDropdowns(resolvedTractate, p, s);
        setUrl(ref);
        setFetchParams({ inputMethod: 'url', tractate: resolvedTractate, page: p, section: s, url: `https://www.sefaria.org/${ref}` });
      } else if (method === 'url') {
        const ref = params.get('ref');
        if (ref) {
          setUrl(ref);
          setFetchParams({ inputMethod: 'url', tractate: tractates[0], page: '2a', section: 'all', url: `https://www.sefaria.org/${ref}` });
        }
      }
    } else if (raw && !raw.includes('=')) {
      // New Sefaria-style format: ?Menachot.65a.4-66a.8 (decode for multi-word tractates)
      let decodedRef = raw;
      try { decodedRef = decodeURIComponent(raw); } catch { /* keep raw */ }
      setUrl(decodedRef);
      setFetchParams({ inputMethod: 'url', tractate: tractates[0], page: '2a', section: 'all', url: `https://www.sefaria.org/${decodedRef}` });
    }
  }, []);

  const { data, isLoading, error } = useQuery<SefariaResponse>({
    queryKey: ['/api/sefaria-fetch', fetchParams],
    queryFn: async () => {
      if (!fetchParams) throw new Error('No params');
      const params = new URLSearchParams({
        inputMethod: fetchParams.inputMethod,
        tractate: fetchParams.tractate,
        page: fetchParams.page,
        section: fetchParams.section,
        url: fetchParams.url
      });
      const response = await fetch(`/api/sefaria-fetch?${params}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || 'Failed to fetch text');
      }
      return response.json();
    },
    enabled: fetchParams !== null,
    refetchOnWindowFocus: false,
    retry: false
  });

  const handleFetch = () => {
    let ref = url.trim();
    if (!ref) {
      ref = buildRefFromDropdowns(tractate, page, section);
      setUrl(ref);
    }
    const cleanRef = extractRef(ref);
    pushUrlParams(cleanRef);
    setFetchParams({ inputMethod: 'url', tractate, page, section, url: `https://www.sefaria.org/${cleanRef}` });
  };

  const handleFetchRange = () => {
    if (!rangeValid) return;
    const ref = buildRangeRef(rangeTractate, rangeFromPage, rangeFromSection, rangeToPage, rangeToSection);
    setUrl(ref);
    pushUrlParams(ref);
    setFetchParams({ inputMethod: 'url', tractate: rangeTractate, page: rangeFromPage, section: rangeFromSection, url: `https://www.sefaria.org/${ref}` });
  };

  useEffect(() => {
    const container = document.getElementById('text-display-container');
    if (!container) return;

    const handleCopy = (e: ClipboardEvent) => {
      const selection = window.getSelection();
      if (!selection || !selection.rangeCount) return;

      const range = selection.getRangeAt(0);
      const fragment = range.cloneContents();

      const tempDiv = document.createElement('div');
      tempDiv.appendChild(fragment);

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
          const el = node as HTMLElement;
          
          if (el.hasAttribute('data-no-copy')) {
            const parent = el.parentNode;
            if (parent) {
              parent.removeChild(el);
            }
            return;
          }
          
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
            
            // Only preserve specific styles we want to keep
            const allowedStyles: Record<string, string> = {};
            
            if (tagName === 'strong' || tagName === 'b') {
              allowedStyles['font-weight'] = 'bold';
            }
            if (tagName === 'em' || tagName === 'i') {
              allowedStyles['font-style'] = 'italic';
            }
            
            if (el.hasAttribute('dir') && el.getAttribute('dir') === 'rtl') {
              allowedStyles['direction'] = 'rtl';
              allowedStyles['font-weight'] = 'bold';
            }
            
            // Remove all inline styles and only set the allowed ones
            if (Object.keys(allowedStyles).length > 0) {
              const newStyle = Object.entries(allowedStyles)
                .map(([key, value]) => `${key}: ${value}`)
                .join('; ');
              el.setAttribute('style', newStyle);
            } else {
              el.removeAttribute('style');
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
            if (el.hasAttribute('data-no-copy')) {
              return;
            }
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
  }, [data]);

  const handleSelectAll = () => {
    const container = document.getElementById('text-display-container');
    if (!container) return;
    
    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(container);
    selection?.removeAllRanges();
    selection?.addRange(range);
  };

  const getCleanHtml = (container: HTMLElement): string => {
    const clone = container.cloneNode(true) as HTMLElement;
    
    clone.querySelectorAll('[data-no-copy]').forEach(el => el.remove());
    clone.querySelectorAll('hr').forEach(el => el.remove());
    
    const allowedTags = ['strong', 'b', 'i', 'em', 'p', 'div', 'br', 'span', 'sup', 'sub', 'small'];
    
    const processNode = (element: HTMLElement) => {
      const children = Array.from(element.children);
      children.forEach(child => {
        const el = child as HTMLElement;
        const tagName = el.tagName.toLowerCase();
        
        if (!allowedTags.includes(tagName)) {
          while (el.firstChild) {
            el.parentNode?.insertBefore(el.firstChild, el);
          }
          el.parentNode?.removeChild(el);
        } else {
          const computedStyle = window.getComputedStyle(el);
          const isBold = computedStyle.fontWeight === 'bold' || parseInt(computedStyle.fontWeight) >= 700;
          const isItalic = computedStyle.fontStyle === 'italic';
          const isRtl = el.getAttribute('dir') === 'rtl' || computedStyle.direction === 'rtl';
          
          const attrsToRemove: string[] = [];
          const hasSticky = el.classList.contains('sticky');
          for (let i = 0; i < el.attributes.length; i++) {
            const attrName = el.attributes[i].name;
            if (!['dir', 'class'].includes(attrName)) {
              attrsToRemove.push(attrName);
            }
          }
          attrsToRemove.forEach(attr => el.removeAttribute(attr));
          if (hasSticky) {
            el.className = 'sticky';
          } else {
            el.removeAttribute('class');
          }
          
          const styles: string[] = [];
          if (isBold) styles.push('font-weight: bold');
          if (isItalic) styles.push('font-style: italic');
          if (isRtl) {
            el.setAttribute('dir', 'rtl');
          }
          if (styles.length > 0) {
            el.setAttribute('style', styles.join('; '));
          }
          
          if (el.children.length > 0) {
            processNode(el);
          }
        }
      });
    };
    
    processNode(clone);
    return clone.innerHTML;
  };

  const htmlToMarkdown = (html: string): string => {
    let md = html;
    
    md = md.replace(/<div[^>]*class\s*=\s*"[^"]*sticky[^"]*"[^>]*>([\s\S]*?)<\/div>/gi, (match, content) => {
      const innerContent = content.replace(/<[^>]+>/g, '').trim();
      return `${innerContent}\n\n`;
    });
    
    md = md.replace(/<div[^>]*\s+dir\s*=\s*"rtl"[^>]*>([\s\S]*?)<\/div>/gi, (match, content) => {
      let innerContent = content
        .replace(/<\/p>/gi, '\n')
        .replace(/<p[^>]*>/gi, '')
        .replace(/<br[^>]*>/gi, '\n')
        .replace(/<[^>]+>/g, '')
        .trim();
      const lines = innerContent.split('\n').filter((line: string) => line.trim());
      return lines.map((line: string) => `**${line.trim()}**`).join('\n\n') + '\n\n';
    });
    md = md.replace(/<p[^>]*\s+dir\s*=\s*"rtl"[^>]*>([\s\S]*?)<\/p>/gi, (match, content) => {
      const innerContent = content.replace(/<[^>]+>/g, '').trim();
      return `**${innerContent}**\n\n`;
    });
    
    md = md.replace(/<[^>]*style\s*=\s*"[^"]*font-weight:\s*bold[^"]*"[^>]*>([\s\S]*?)<\/[^>]+>/gi, '**$1**');
    md = md.replace(/<[^>]*style\s*=\s*"[^"]*font-style:\s*italic[^"]*"[^>]*>([\s\S]*?)<\/[^>]+>/gi, '*$1*');
    
    md = md.replace(/<strong[^>]*>([\s\S]*?)<\/strong>/gi, '**$1**');
    md = md.replace(/<b[^>]*>([\s\S]*?)<\/b>/gi, '**$1**');
    md = md.replace(/<em[^>]*>([\s\S]*?)<\/em>/gi, '*$1*');
    md = md.replace(/<i[^>]*>([\s\S]*?)<\/i>/gi, '*$1*');
    
    md = md.replace(/<hr[^>]*>/gi, '');
    md = md.replace(/<br[^>]*>/gi, '\n');
    md = md.replace(/<\/p>/gi, '\n\n');
    md = md.replace(/<p[^>]*>/gi, '');
    md = md.replace(/<\/div>/gi, '\n');
    md = md.replace(/<div[^>]*>/gi, '');
    
    md = md.replace(/<[^>]+>/g, '');
    
    md = md.replace(/&nbsp;/g, ' ');
    md = md.replace(/&amp;/g, '&');
    md = md.replace(/&lt;/g, '<');
    md = md.replace(/&gt;/g, '>');
    md = md.replace(/&quot;/g, '"');
    
    md = md.replace(/\n{3,}/g, '\n\n');
    md = md.trim();
    
    return md;
  };

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportMarkdown = () => {
    const container = document.getElementById('text-display-container');
    if (!container || !data) return;
    
    const cleanHtml = getCleanHtml(container);
    const markdown = htmlToMarkdown(cleanHtml);
    
    const filename = `${data.tractate}_${data.span || data.page}.md`.replace(/[^a-zA-Z0-9._-]/g, '_');
    downloadFile(markdown, filename, 'text/markdown');
  };

  const handleExportHtml = () => {
    const container = document.getElementById('text-display-container');
    if (!container || !data) return;
    
    const cleanHtml = getCleanHtml(container);
    
    const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${data.tractate} ${data.span || data.page}</title>
  <style>
    body { font-family: sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; line-height: 1.6; }
    [dir="rtl"] { font-weight: bold; }
  </style>
</head>
<body>
${cleanHtml}
</body>
</html>`;
    
    const filename = `${data.tractate}_${data.span || data.page}.html`.replace(/[^a-zA-Z0-9._-]/g, '_');
    downloadFile(fullHtml, filename, 'text/html');
  };

  const renderSections = () => {
    if (!data || data.error) return null;

    const hebrewSections = data.hebrewSections || [];
    const englishSections = data.englishSections || [];
    const maxSections = Math.max(hebrewSections.length, englishSections.length);

    return (
      <div className="space-y-8">
        {data.span && (
          <div className="sticky top-0 bg-background z-10 font-semibold text-lg border-b border-border pb-2 mb-4 -mx-6 px-6 pt-2">
            {data.span}
          </div>
        )}
        
        {Array.from({ length: maxSections }).map((_, i) => {
          const hebrewText = hebrewSections[i] || '';
          const englishText = englishSections[i] || '';

          if (!hebrewText && !englishText) return null;

          // Process text using the same functions as the main Talmud app
          const formattedEnglish = formatEnglishText(englishText);
          const englishParagraphs = formattedEnglish.split('\n\n').filter(p => p.trim());

          const ref = data.sectionRefs?.[i];
          const sectionLabel = ref
            ? `${data.tractate} ${ref.page}:${ref.sectionNum}`
            : data.section
              ? `${data.tractate} ${data.page}:${data.section}`
              : `${data.tractate} ${data.page}:${i + 1}`;

          return (
            <div key={i} className="space-y-4">
              <div
                data-no-copy
                className="text-xs font-mono text-muted-foreground"
                style={{ marginBottom: '4px' }}
              >
                {sectionLabel}
              </div>
              {hebrewText && (
                <div 
                  dir="rtl" 
                  className="text-gray-900"
                  style={{ 
                    fontFamily: 'Assistant, sans-serif', 
                    fontSize: '12pt',
                    fontWeight: 'bold',
                    lineHeight: '1.15'
                  }}
                >
                  {hebrewText.split('\n').filter(line => line.trim()).map((line, idx) => (
                    <p key={idx} style={{ margin: '0 0 12px 0', padding: 0, lineHeight: '1.15' }}>{line}</p>
                  ))}
                </div>
              )}
              
              {englishText && (
                <div 
                  className="text-gray-800"
                  style={{ 
                    fontFamily: 'Roboto, sans-serif', 
                    fontSize: '11pt',
                    lineHeight: '1.15'
                  }}
                >
                  {englishParagraphs.map((paragraph, idx) => (
                    <p 
                      key={idx}
                      style={{ margin: '0 0 12px 0', padding: 0, lineHeight: '1.15' }}
                      dangerouslySetInnerHTML={{ __html: paragraph }}
                    />
                  ))}
                </div>
              )}
              
              {i < maxSections - 1 && <hr className="my-6" />}
            </div>
          );
        })}
      </div>
    );
  };

  // Create chat context from fetched data
  const chatContext: ChatContext | undefined = data && !data.error ? {
    tractate: data.tractate,
    page: data.page,
    section: data.section,
    range: data.span,
    hebrewText: data.hebrewSections.join('\n\n'),
    englishText: data.englishSections.join('\n\n')
  } : undefined;

  return (
    <PageShell>
        <PageHeader category="talmud-bavli" title="Sugya Viewer">
          <p className="text-muted-foreground">
            View custom Talmud text ranges with bilingual Hebrew-English display
          </p>
        </PageHeader>

        <section className="py-8 border-t border-border">
          <button
            onClick={() => setShowAbout(v => !v)}
            className="text-sm text-primary hover:text-foreground transition-colors"
          >
            {showAbout ? "▲" : "▼"} About This Tool
          </button>

          {showAbout && (
            <div className="mt-4 text-sm text-secondary-foreground space-y-3">
                <p>
                  This page displays Talmud text by a user-specified range, as opposed to the main Talmud reader, which always displays a single Talmud page. 
                  You can specify a range using one of five options:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li><strong>Bekiut Reference:</strong> Use slash-separated format, optionally with a section (e.g., <code className="text-xs bg-muted px-1 rounded">Shabbat/89b</code> or <code className="text-xs bg-muted px-1 rounded">Rosh_Hashanah/17a#11</code>)</li>
                  <li><strong>Bekiut URL:</strong> Paste a Bekiut URL (e.g., <code className="text-xs bg-muted px-1 rounded">https://bekiut.com/talmud/Rosh_Hashanah/17a#11</code>)</li>
                  <li><strong>Sefaria Reference:</strong> Use dot-separated format (e.g., <code className="text-xs bg-muted px-1 rounded">Menachot.65a.4-66a.8</code>)</li>
                  <li><strong>Sefaria URL:</strong> Paste a Sefaria URL (can span multiple pages, e.g., <code className="text-xs bg-muted px-1 rounded">https://www.sefaria.org/Berakhot.16b.18-17a.12</code>)</li>
                  <li><strong>Blog Post Selection:</strong> Choose from a dropdown list of blog post titles and ranges of specific sugyot to auto-fill the reference</li>
                </ul>
                <p>
                  You can also use the <strong>Dropdown Selection</strong> to pick a tractate and page. Press <strong>Enter</strong> or click <strong>Fetch Text</strong> to load.
                </p>
                <p>
                  Use the AI assistant (at the bottom on mobile, on the right side on desktop) to explore the text. The AI assistant will see the displayed Talmud text (Hebrew and English), and has access to 125 published Talmud & Tech blog posts.
                </p>
            </div>
          )}
        </section>

        <section className="py-8 border-t border-border">
          <h2 className="font-georgia text-xl mb-6">Display Talmud Text by Custom Range</h2>
          <div className="space-y-6">
            {/* URL / Reference input */}
            <div className="space-y-2">
              <Label htmlFor="sefaria-url" className="text-sm font-semibold">
                Bekiut / Sefaria Reference or URL
              </Label>
              <Input
                id="sefaria-url"
                placeholder="e.g., Shabbat/89b, Rosh_Hashanah/17a#11, or https://bekiut.com/talmud/..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleFetch(); }}
                data-testid="input-sefaria-url"
                className="text-base"
              />
              <p className="text-xs text-muted-foreground">
                Paste a Bekiut or Sefaria URL, or type a reference directly (e.g. <code className="bg-muted px-1 rounded">Shabbat/89b</code> or <code className="bg-muted px-1 rounded">Rosh_Hashanah/17a#11</code>). Ranges spanning multiple pages are also supported.
              </p>
            </div>

            {/* Dropdowns — always visible, auto-populate the URL field */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold">
                Dropdown Selection
              </Label>
              <p className="text-xs text-muted-foreground -mt-1">
                Choose tractate, page, and optional section — updates the reference above automatically.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tractate" className="text-xs text-muted-foreground">Tractate</Label>
                  <Select
                    value={tractate}
                    onValueChange={(v) => {
                      setTractate(v);
                      setUrl(buildRefFromDropdowns(v, page, section));
                    }}
                  >
                    <SelectTrigger id="tractate" data-testid="select-tractate">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {tractates.map((t) => (
                        <SelectItem key={t} value={t} data-testid={`option-tractate-${t}`}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="page" className="text-xs text-muted-foreground">Page</Label>
                  <Select
                    value={page}
                    onValueChange={(v) => {
                      setPage(v);
                      setUrl(buildRefFromDropdowns(tractate, v, section));
                    }}
                  >
                    <SelectTrigger id="page" data-testid="select-page">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {pages.map((p) => (
                        <SelectItem key={p} value={p} data-testid={`option-page-${p}`}>
                          {p}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="section" className="text-xs text-muted-foreground">Section (Optional)</Label>
                  <Select
                    value={section}
                    onValueChange={(v) => {
                      setSection(v);
                      setUrl(buildRefFromDropdowns(tractate, page, v));
                    }}
                  >
                    <SelectTrigger id="section" data-testid="select-section">
                      <SelectValue placeholder="All sections" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all" data-testid="option-section-all">All sections</SelectItem>
                      {sections.map((s) => (
                        <SelectItem key={s} value={s.toString()} data-testid={`option-section-${s}`}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Range Selection */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold">
                Range Selection
              </Label>
              <p className="text-xs text-muted-foreground -mt-1">
                Choose a range within a single tractate (up to {MAX_AMUDIM_RANGE} amudim).
              </p>

              <div className="space-y-2">
                <Label htmlFor="range-tractate" className="text-xs text-muted-foreground">Tractate</Label>
                <Select
                  value={rangeTractate}
                  onValueChange={(v) => setRangeTractate(v)}
                >
                  <SelectTrigger id="range-tractate" data-testid="select-range-tractate">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {tractates.map((t) => (
                      <SelectItem key={t} value={t} data-testid={`option-range-tractate-${t}`}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="space-y-2 border border-border rounded p-3">
                  <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">From</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label htmlFor="range-from-page" className="text-xs text-muted-foreground">Page</Label>
                      <Select
                        value={rangeFromPage}
                        onValueChange={(v) => setRangeFromPage(v)}
                      >
                        <SelectTrigger id="range-from-page" data-testid="select-range-from-page">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {pages.map((p) => (
                            <SelectItem key={p} value={p} data-testid={`option-range-from-page-${p}`}>
                              {p}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="range-from-section" className="text-xs text-muted-foreground">Section</Label>
                      <Select
                        value={rangeFromSection}
                        onValueChange={(v) => setRangeFromSection(v)}
                      >
                        <SelectTrigger id="range-from-section" data-testid="select-range-from-section">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {sections.map((s) => (
                            <SelectItem key={s} value={s.toString()} data-testid={`option-range-from-section-${s}`}>
                              {s}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 border border-border rounded p-3">
                  <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">To</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label htmlFor="range-to-page" className="text-xs text-muted-foreground">Page</Label>
                      <Select
                        value={rangeToPage}
                        onValueChange={(v) => setRangeToPage(v)}
                      >
                        <SelectTrigger id="range-to-page" data-testid="select-range-to-page">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {pages.map((p) => (
                            <SelectItem key={p} value={p} data-testid={`option-range-to-page-${p}`}>
                              {p}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="range-to-section" className="text-xs text-muted-foreground">Section</Label>
                      <Select
                        value={rangeToSection}
                        onValueChange={(v) => setRangeToSection(v)}
                      >
                        <SelectTrigger id="range-to-section" data-testid="select-range-to-section">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {sections.map((s) => (
                            <SelectItem key={s} value={s.toString()} data-testid={`option-range-to-section-${s}`}>
                              {s}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col md:flex-row md:items-center gap-2 pt-2">
                <Button
                  onClick={handleFetchRange}
                  variant="outline"
                  disabled={!rangeValid}
                  data-testid="button-fetch-range"
                >
                  Fetch Range
                </Button>
                {rangeValid ? (
                  <p className="text-xs text-muted-foreground">
                    Reference:{" "}
                    <code className="bg-muted px-1 rounded">
                      {buildRangeRef(rangeTractate, rangeFromPage, rangeFromSection, rangeToPage, rangeToSection)}
                    </code>
                  </p>
                ) : (
                  <p className="text-xs text-destructive" data-testid="range-error">
                    {rangeErrorMsg}
                  </p>
                )}
              </div>
            </div>

            {/* Blog post selector — collapsible */}
            <div className="border border-border rounded">
              <button
                type="button"
                className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold hover:bg-secondary transition-colors rounded"
                onClick={() => setShowBlogPostSelector((v) => !v)}
                data-testid="toggle-blogpost"
              >
                <span>Blog Post Selection</span>
                <span aria-hidden="true">{showBlogPostSelector ? "▲" : "▼"}</span>
              </button>
              {showBlogPostSelector && (
                <div className="px-4 pb-4 pt-1">
                  <BlogPostSelector
                    onSelectPost={(location, blogUrl) => {
                      const sefariaUrl = locationToSefariaUrl(location);
                      const ref = extractRef(sefariaUrl);
                      setUrl(ref);
                      setShowBlogPostSelector(false);
                      pushUrlParams(ref);
                      setFetchParams({ inputMethod: "url", tractate, page, section, url: sefariaUrl });
                    }}
                  />
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleFetch}
                className="w-full md:w-auto"
                data-testid="button-fetch"
              >
                Fetch Text
              </Button>
              {(fetchParams || url) && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setUrl("");
                    setTractate(tractates[0]);
                    setPage("2a");
                    setSection("all");
                    setFetchParams(null);
                    window.history.pushState({}, '', window.location.pathname);
                  }}
                  className="w-full md:w-auto"
                >
                  Clear
                </Button>
              )}
            </div>
          </div>
        </section>

        {isLoading && (
          <section className="py-8 border-t border-border space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </section>
        )}

        {error && (
          <Alert variant="destructive" data-testid="alert-error">
            <AlertDescription>
              {error instanceof Error ? error.message : 'An error occurred while fetching the text'}
            </AlertDescription>
          </Alert>
        )}

        {data?.error && (
          <Alert variant="destructive" data-testid="alert-data-error">
            <AlertDescription>{data.error}</AlertDescription>
          </Alert>
        )}

        {data && !data.error && (
          <section className="py-8 border-t border-border grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
                <div className="flex flex-wrap gap-4 text-sm">
                  <button
                    onClick={handleSelectAll}
                    data-testid="button-select-all"
                    className="text-primary hover:underline"
                  >
                    Select All Text (for copy/paste)
                  </button>

                  <button
                    onClick={handleExportMarkdown}
                    data-testid="button-export-md"
                    className="text-primary hover:underline"
                  >
                    Export .md
                  </button>

                  <button
                    onClick={handleExportHtml}
                    data-testid="button-export-html"
                    className="text-primary hover:underline"
                  >
                    Export .html
                  </button>
                </div>

                {data && !data.error && (
                  <div className="flex items-center gap-3 py-3 border-t border-border">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground mb-1">Open in the main Talmud reader</p>
                      <p className="text-xs text-muted-foreground">Study this passage with the full Bekiut reader</p>
                    </div>
                    <a
                      href={`/talmud/${encodeURIComponent(data.tractate.toLowerCase())}/${data.page}${data.section ? `#section-${data.section}` : ''}`}
                      className="flex-shrink-0 text-primary hover:underline text-sm font-medium"
                    >
                      {data.tractate} {data.page}{data.section ? `:${data.section}` : ''} →
                    </a>
                  </div>
                )}

                <div 
                  id="text-display-container"
                  className="bg-secondary border border-border rounded p-6" 
                  data-testid="text-display-container"
                  style={{ 
                    fontSize: '12pt',
                    lineHeight: '1.15'
                  }}
                >
                  {renderSections()}
                </div>
            </div>

            <div className="lg:sticky lg:top-4 lg:h-[calc(100vh-8rem)]">
              <ChatPanel context={chatContext} />
            </div>
          </section>
        )}
    </PageShell>
  );
}
