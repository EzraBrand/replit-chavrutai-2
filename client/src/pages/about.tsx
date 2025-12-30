import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { SharedLayout } from "@/components/layout";
import { useSEO, generateSEOData } from "@/hooks/use-seo";
import { ExternalLink, Rss } from "lucide-react";
import { DafYomiWidget } from "@/components/DafYomiWidget";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface RssFeedItem {
  title: string;
  link: string;
  pubDate: string;
  description: string;
}

export default function About() {
  useSEO(generateSEOData.aboutPage());

  const { data: rssFeed, isLoading: rssLoading } = useQuery<{
    items: RssFeedItem[];
  }>({
    queryKey: ["/api/rss-feed"],
  });

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <SharedLayout variant="simple" mainMaxWidth="container">
      <div className="max-w-4xl mx-auto">
        <div className="bg-card rounded-lg shadow-sm border border-border p-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            About ChavrutAI
          </h1>
          <p className="text-lg text-muted-foreground mb-8">
            A free platform for studying classical Jewish texts in Hebrew and
            English
          </p>

          <div className="space-y-10">
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">
                What is ChavrutAI?
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                ChavrutAI is a free website for studying the Babylonian Talmud
                and Tanakh (Hebrew Bible). It displays Hebrew text alongside
                English translation, making these classical texts accessible to
                learners at all levels.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Whether you're new to Talmud study or an experienced learner,
                ChavrutAI provides a clean, distraction-free reading experience.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">
                Available Texts
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-secondary/30 rounded-lg p-4">
                  <h3 className="font-medium text-foreground mb-2">
                    Babylonian Talmud
                  </h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    All 37 tractates with standard page numbering based on the
                    standard printed edition. Navigate by Seder (order),
                    tractate, chapter, or individual page.
                  </p>
                  <Link
                    href="/talmud"
                    className="text-blue-600 hover:text-blue-800 underline text-sm font-medium"
                    data-testid="link-talmud-contents"
                  >
                    Browse Talmud Contents
                  </Link>
                </div>
                <div className="bg-secondary/30 rounded-lg p-4">
                  <h3 className="font-medium text-foreground mb-2">
                    Tanakh (Hebrew Bible)
                  </h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Torah, Prophets, and Writings with chapter-by-chapter
                    navigation. Each book includes Hebrew text with English
                    translation.
                  </p>
                  <Link
                    href="/bible"
                    className="text-blue-600 hover:text-blue-800 underline text-sm font-medium"
                    data-testid="link-tanakh-contents"
                  >
                    Browse Tanakh Contents
                  </Link>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">
                Frequently Asked Questions
              </h2>
              <Accordion type="single" collapsible className="w-full" data-testid="faq-accordion">
                <AccordionItem value="free">
                  <AccordionTrigger className="text-left">
                    Is ChavrutAI free?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    Yes, ChavrutAI is completely free to use. There are no subscriptions, 
                    paywalls, or hidden costs. All texts and features are accessible to everyone.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="translation">
                  <AccordionTrigger className="text-left">
                    Where does the translation come from?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    The English translations are sourced from the Sefaria library, which uses 
                    Rabbi Adin Steinsaltz's acclaimed translation of the Babylonian Talmud 
                    and various translations for the Tanakh. ChavrutAI is not affiliated with Sefaria.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="different">
                  <AccordionTrigger className="text-left">
                    How is ChavrutAI different from other Talmud sites?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    ChavrutAI focuses on providing a clean, distraction-free reading experience 
                    with thoughtful text processing. It applies targeted improvements to make 
                    translations more accessible while preserving accuracy. Features include 
                    term highlighting, customizable fonts and themes, and study tools like 
                    the Sugya Viewer and Biblical Citations Index.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="processing">
                  <AccordionTrigger className="text-left">
                    What text processing improvements are made?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    ChavrutAI applies carefully targeted terminology updates to make the text 
                    more accessible. For example, archaic terms like "phylacteries" become 
                    "tefillin," lengthy phrases like "The Holy One, Blessed be He" become 
                    simply "God," and euphemistic language is simplified to match the 
                    directness of the original. These changes reduce visual clutter while 
                    bringing readers closer to the original Hebrew terminology.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="customize">
                  <AccordionTrigger className="text-left">
                    How do I customize my reading experience?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    Use the menu (hamburger icon) in the top-left corner to access settings. 
                    You can choose from multiple themes (Paper, White, Dark, High Contrast), 
                    adjust text size, select Hebrew and English fonts, switch between 
                    side-by-side or stacked layouts, and enable term highlighting for 
                    concepts, rabbi names, and place names.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">
                Featured Articles at 'Talmud & Tech' Blog About ChavrutAI
              </h2>
              <div className="space-y-3">
                <a
                  href="https://www.ezrabrand.com/p/chavrutais-talmud-translation-processing"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block bg-secondary/30 hover:bg-secondary/50 rounded-lg p-4 transition-colors"
                  data-testid="article-translation-processing"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-medium text-foreground text-sm leading-snug">
                        ChavrutAI's Talmud Translation Processing Approach
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        Dec 29, 2025
                      </p>
                    </div>
                    <ExternalLink className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                  </div>
                </a>
                <a
                  href="https://www.ezrabrand.com/p/chavrutais-new-homepage-a-fresh-entry"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block bg-secondary/30 hover:bg-secondary/50 rounded-lg p-4 transition-colors"
                  data-testid="article-new-homepage"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-medium text-foreground text-sm leading-snug">
                        ChavrutAI's New Homepage: A Fresh Entry Point for the Study of Classical Jewish Texts
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        Dec 28, 2025
                      </p>
                    </div>
                    <ExternalLink className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                  </div>
                </a>
                <a
                  href="https://www.ezrabrand.com/p/chavrutai-talmud-web-app-launch-review"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block bg-secondary/30 hover:bg-secondary/50 rounded-lg p-4 transition-colors"
                  data-testid="article-launch-review"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-medium text-foreground text-sm leading-snug">
                        ChavrutAI Talmud Web App Launch: Review and Comparison with Similar Platforms
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        Aug 05, 2025
                      </p>
                    </div>
                    <ExternalLink className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                  </div>
                </a>
              </div>
            </section>

            <section className="pt-6 border-t border-border">
              <h2 className="text-xl font-semibold text-foreground mb-4">
                About This Project
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                ChavrutAI is a project of{" "}
                <a
                  href="https://www.ezrabrand.com/"
                  className="text-blue-600 hover:text-blue-800 underline"
                >
                  Talmud & Tech
                </a>
                . Text content is sourced from the Sefaria library (ChavrutAI is
                not affiliated with Sefaria).
              </p>
              <p className="text-muted-foreground leading-relaxed">
                For questions, feedback, or to report an issue:{" "}
                <a
                  href="mailto:ezra@chavrutai.com"
                  className="text-blue-600 hover:text-blue-800 underline"
                >
                  ezra@chavrutai.com
                </a>
              </p>
            </section>

            <section className="pt-6 border-t border-border">
              <h2 className="text-xl font-semibold text-foreground mb-4">
                Stay Updated
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-6">
                Subscribe to the{" "}
                <a
                  href="https://www.ezrabrand.com/"
                  className="text-blue-600 hover:text-blue-800 underline"
                >
                  Talmud & Tech
                </a>{" "}
                blog for updates on ChavrutAI and analyses of Talmud and other
                Jewish classical texts:
              </p>
              <div className="flex justify-center">
                <iframe
                  src="https://www.ezrabrand.com/embed"
                  width="480"
                  height="320"
                  style={{ border: "1px solid #EEE", background: "white" }}
                  frameBorder="0"
                  scrolling="no"
                  data-testid="subscribe-iframe"
                ></iframe>
              </div>

              <div className="mt-8">
                <h3 className="text-lg font-medium text-foreground mb-4 flex items-center gap-2">
                  <Rss className="w-5 h-5 text-orange-500" />
                  Latest Posts
                </h3>
                {rssLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="animate-pulse bg-secondary/50 rounded-lg p-4"
                      >
                        <div className="h-4 bg-secondary rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-secondary rounded w-1/4"></div>
                      </div>
                    ))}
                  </div>
                ) : rssFeed?.items && rssFeed.items.length > 0 ? (
                  <div className="space-y-3" data-testid="rss-feed-list">
                    {rssFeed.items.map((item, index) => (
                      <a
                        key={index}
                        href={item.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block bg-secondary/30 hover:bg-secondary/50 rounded-lg p-4 transition-colors"
                        data-testid={`rss-item-${index}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-medium text-foreground text-sm leading-snug">
                            {item.title}
                          </h4>
                          <ExternalLink className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDate(item.pubDate)}
                        </p>
                      </a>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No posts available.
                  </p>
                )}
              </div>
            </section>

            <section className="pt-6 border-t border-border">
              <DafYomiWidget />
            </section>
          </div>
        </div>
      </div>
    </SharedLayout>
  );
}
