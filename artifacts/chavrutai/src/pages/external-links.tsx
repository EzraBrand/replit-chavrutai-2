import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageShell, PageHeader, PageSection, SectionHeading } from "@/components/layout";
import { useSEO } from "@/hooks/use-seo";
import { TRACTATE_LISTS, TRACTATE_HEBREW_NAMES, normalizeDisplayTractateName, isValidTractate, getTractateSlug } from "@shared/tractates";
import { getMaxFolio, getStartFolio, getStartSide } from "@shared/talmud-navigation";
import {
  getAllExternalLinks,
  getSectionLinks,
  getPageLinks,
  type TalmudReference,
  type ExternalLink as ExternalLinkType
} from "@/lib/external-links";

const RELATED_ARTICLES: { href: string; label: string; source?: string; testId: string }[] = [
  {
    href: "https://www.ezrabrand.com/p/chavrutai-talmud-web-app-launch-review",
    label: "Bekiut Talmud Web App Launch: Review and Comparison with Similar Platforms",
    testId: "link-chavrutai-review",
  },
  {
    href: "https://seforimblog.com/2023/06/from-print-to-pixel-digital-editions-of-the-talmud-bavli/",
    label: "From Print to Pixel: Digital Editions of the Talmud Bavli",
    source: "Seforim Blog",
    testId: "link-pixel-article",
  },
  {
    href: "https://www.academia.edu/83334340/Guide_to_Online_Resources_for_Scholarly_Jewish_Study_and_Research_2023",
    label: "Guide to Online Resources for Scholarly Jewish Study and Research - 2023",
    source: "Academia.edu",
    testId: "link-academia-guide",
  },
  {
    href: "https://www.ezrabrand.com/p/evaluating-al-hatorahs-digital-repository",
    label: "Evaluating Al HaTorah's Digital Repository",
    testId: "link-alhatorah-review",
  },
  {
    href: "https://www.ezrabrand.com/p/more-on-the-formatting-of-the-talmud",
    label: "More on the Formatting of the Talmud",
    testId: "link-comparison-blogpost",
  },
  {
    href: "https://www.ezrabrand.com/p/helpful-formatting-of-the-talmud",
    label: "Helpful Formatting of the Talmud: Ohr Somayach's 'Talmud Navigator'",
    testId: "link-helpful-formatting",
  },
];

function LinkRow({
  name,
  description,
  url,
  href,
  sameTab,
  testId,
}: {
  name: string;
  description?: string;
  url: string;
  href: string;
  sameTab?: boolean;
  testId: string;
}) {
  return (
    <div className="flex items-center justify-between py-3 border-t border-border hover:bg-secondary px-2 -mx-2">
      <div>
        <div className="font-medium flex items-center gap-2">
          {name}
          <span className="text-xs text-muted-foreground">
            {sameTab ? "same tab" : "new tab"}
          </span>
        </div>
        {description && (
          <div className="text-sm text-muted-foreground">{description}</div>
        )}
        <div className="text-xs text-muted-foreground mt-1 font-mono break-all max-w-md">
          {url}
        </div>
      </div>
      <a
        href={href}
        {...(sameTab ? {} : { target: "_blank", rel: "noopener noreferrer" })}
        className="text-primary dark:text-[#5b9fc5] hover:underline flex-shrink-0 ml-4 text-sm"
        data-testid={testId}
      >
        Open →
      </a>
    </div>
  );
}

function ExternalLinksPage() {
  useSEO({
    title: "External Links - Talmud Cross-References | Bekiut",
    description: "Find external links to Talmud pages on Sefaria, Al HaTorah, Wikisource, and Daf Yomi resources. Cross-reference any tractate, page, and section.",
    canonical: `${window.location.origin}/external-links`,
    robots: "index, follow",
  });

  const [location] = useLocation();
  const [tractate, setTractate] = useState<string>("Shabbat");
  const [folio, setFolio] = useState<number>(2);
  const [side, setSide] = useState<'a' | 'b'>('a');
  const [section, setSection] = useState<number | undefined>(2);
  const [sectionInput, setSectionInput] = useState<string>("2");
  const [links, setLinks] = useState<ExternalLinkType[]>([]);

  useEffect(() => {
    const params = new URLSearchParams(location.split('?')[1] || '');
    const t = params.get('tractate');
    const f = params.get('folio');
    const sec = params.get('section');

    if (t && isValidTractate(t)) {
      setTractate(normalizeDisplayTractateName(t));
    }
    if (f) {
      const match = f.match(/^(\d+)([ab])$/);
      if (match) {
        setFolio(parseInt(match[1]));
        setSide(match[2] as 'a' | 'b');
      }
    }
    if (sec) {
      const sectionNum = parseInt(sec);
      if (!isNaN(sectionNum)) {
        setSection(sectionNum);
        setSectionInput(sec);
      }
    }
  }, [location]);

  useEffect(() => {
    const ref: TalmudReference = {
      tractate,
      folio,
      side,
      section
    };
    setLinks(getAllExternalLinks(ref));
  }, [tractate, folio, side, section]);

  // Reset folio and side to valid values when tractate changes
  useEffect(() => {
    const newStartFolio = getStartFolio(tractate);
    const newStartSide = getStartSide(tractate);
    const newMaxFolio = getMaxFolio(tractate);

    // If current folio is out of range, reset to start
    if (folio < newStartFolio || folio > newMaxFolio) {
      setFolio(newStartFolio);
      setSide(newStartSide);
    } else if (folio === newStartFolio && newStartSide === 'b' && side === 'a') {
      // If on start folio but side 'a' doesn't exist (like Tamid 25a)
      setSide('b');
    }
  }, [tractate]);

  const handleSectionChange = (value: string) => {
    setSectionInput(value);
    if (value === '') {
      setSection(undefined);
    } else {
      const num = parseInt(value);
      if (!isNaN(num) && num > 0) {
        setSection(num);
      }
    }
  };

  const maxFolio = getMaxFolio(tractate);
  const startFolio = getStartFolio(tractate);
  const startSide = getStartSide(tractate);
  const currentRef = `${tractate} ${folio}${side}${section ? `, section ${section}` : ''}`;

  const sectionLinks = getSectionLinks({ tractate, folio, side, section });
  const pageLinks = getPageLinks({ tractate, folio, side, section });

  return (
    <PageShell>
      <PageHeader title="Links to Talmud Pages, by Platform" titleClassName="mb-4">
        <div className="text-sm text-muted-foreground space-y-2">
          <p>
            This page provides links to the same Talmud pages and sections across different websites.
            Select a tractate, folio, and side below, then use the provided links to view that page
            on any of the following websites: Bekiut, Sefaria, Al HaTorah, Wikisource, or 'Daf Yomi' (tzurat hadaf).
          </p>
          <p>
            Optionally add a section number to get links that point directly to a specific paragraph.
            Bekiut links open in the same tab; all other links open in a new tab.
          </p>
        </div>
      </PageHeader>

      <PageSection>
        <SectionHeading className="mb-1">Related Articles</SectionHeading>
        <p className="text-sm text-muted-foreground mb-4">
            Blog posts and articles about digital Talmud resources:
          </p>
          <ul className="space-y-2 text-sm">
            {RELATED_ARTICLES.map((a) => (
              <li key={a.testId}>
                <a
                  href={a.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary dark:text-[#5b9fc5] hover:underline"
                  data-testid={a.testId}
                >
                  {a.label}
                </a>
                {a.source && <span className="text-muted-foreground"> ({a.source})</span>}
              </li>
            ))}
          </ul>
      </PageSection>

      <PageSection>
        <SectionHeading className="mb-4">Selection</SectionHeading>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="col-span-2">
              <Label htmlFor="tractate">Tractate</Label>
              <Select value={tractate} onValueChange={setTractate}>
                <SelectTrigger id="tractate" className="rounded" data-testid="select-tractate">
                  <SelectValue placeholder="Select tractate" />
                </SelectTrigger>
                <SelectContent>
                  {TRACTATE_LISTS["Talmud Bavli"].map((t) => (
                    <SelectItem key={t} value={t}>
                      {t} ({TRACTATE_HEBREW_NAMES[t as keyof typeof TRACTATE_HEBREW_NAMES] || ''})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="folio">Folio</Label>
              <Input
                id="folio"
                type="number"
                min={startFolio}
                max={maxFolio}
                value={folio}
                onChange={(e) => setFolio(Math.max(startFolio, Math.min(maxFolio, parseInt(e.target.value) || startFolio)))}
                className="rounded"
                data-testid="input-folio"
              />
            </div>

            <div>
              <Label htmlFor="side">Side</Label>
              <Select value={side} onValueChange={(v) => setSide(v as 'a' | 'b')}>
                <SelectTrigger id="side" className="rounded" data-testid="select-side">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="a">a (א)</SelectItem>
                  <SelectItem value="b">b (ב)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-2 md:col-span-1">
              <Label htmlFor="section">Section (optional)</Label>
              <Input
                id="section"
                type="number"
                min={1}
                placeholder="e.g., 14"
                value={sectionInput}
                onChange={(e) => handleSectionChange(e.target.value)}
                className="rounded"
                data-testid="input-section"
              />
            </div>
          </div>
      </PageSection>

      {section !== undefined && (
        <PageSection>
          <SectionHeading className="mb-1">Section-Level Links</SectionHeading>
            <p className="text-sm text-muted-foreground mb-4">
              Links that point to the specific section ({currentRef})
            </p>
            <div>
              <LinkRow
                name="Bekiut"
                description="Bekiut Talmud Reader - section anchor"
                url={`/talmud/${getTractateSlug(tractate)}/${folio}${side}#section-${section}`}
                href={`/talmud/${getTractateSlug(tractate)}/${folio}${side}#section-${section}`}
                sameTab
                testId="link-section-chavrutai"
              />
              {sectionLinks.map((link, index) => (
                <LinkRow
                  key={index}
                  name={link.name}
                  description={link.description}
                  url={link.url}
                  href={link.url}
                  testId={`link-section-${link.name.toLowerCase().replace(/\s/g, '-')}`}
                />
              ))}
            </div>
        </PageSection>
      )}

      <PageSection>
        <SectionHeading className="mb-1">Page-Level Links</SectionHeading>
          <p className="text-sm text-muted-foreground mb-4">
            Links that point to the full page ({tractate} {folio}{side})
          </p>
          <div>
            <LinkRow
              name="Bekiut"
              description="Bekiut Talmud Reader"
              url={`/talmud/${getTractateSlug(tractate)}/${folio}${side}`}
              href={`/talmud/${getTractateSlug(tractate)}/${folio}${side}`}
              sameTab
              testId="link-page-chavrutai"
            />
            {pageLinks.map((link, index) => (
              <LinkRow
                key={index}
                name={link.name}
                description={link.description}
                url={link.url}
                href={link.url}
                testId={`link-page-${link.name.toLowerCase().replace(/\s/g, '-')}`}
              />
            ))}
          </div>
      </PageSection>
    </PageShell>
  );
}

export default ExternalLinksPage;
