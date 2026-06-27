import React, { useState } from "react";
import { Search, ChevronRight, ExternalLink, Menu } from "lucide-react";

export function Homepage() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        @import url('https://fonts.googleapis.com/css2?family=Frank+Ruhl+Libre:wght@300;400;500;700;900&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Source+Sans+3:ital,wght@0,300..900;1,300..900&display=swap');
        
        :root {
          --ch-bg: hsl(28, 37%, 94%);
          --ch-fg: hsl(25, 12%, 18%);
          --ch-muted: hsl(25, 8%, 42%);
          --ch-border: hsl(25, 18%, 80%);
          --ch-primary: hsl(203, 30%, 26%); /* slate blue */
          --ch-accent: hsl(20, 60%, 35%); /* talmud brown */
          --ch-surface: hsl(28, 30%, 92%);
          
          --font-serif: 'Libre Baskerville', serif;
          --font-sans: 'Source Sans 3', sans-serif;
          --font-hebrew: 'Frank Ruhl Libre', serif;
        }

        .ch-theme {
          background-color: var(--ch-bg);
          color: var(--ch-fg);
          font-family: var(--font-sans);
          min-height: 100vh;
        }

        .ch-serif {
          font-family: var(--font-serif);
        }
        
        .ch-hebrew {
          font-family: var(--font-hebrew);
          direction: rtl;
        }

        .ch-border-t { border-top: 1px solid var(--ch-border); }
        .ch-border-b { border-bottom: 1px solid var(--ch-border); }
        .ch-border-l { border-left: 1px solid var(--ch-border); }
        .ch-border-r { border-right: 1px solid var(--ch-border); }

        .ch-focus-ring:focus-visible {
          outline: 2px solid var(--ch-primary);
          outline-offset: 2px;
        }
      `}} />
      
      <div className="ch-theme flex flex-col selection:bg-[hsl(20,60%,85%)]">
        {/* Top Navigation */}
        <header className="px-6 py-4 flex items-center justify-between ch-border-b max-w-6xl w-full mx-auto">
          <div className="flex items-center gap-4">
            <h1 className="ch-serif text-2xl font-bold tracking-tight text-[var(--ch-accent)]">ChavrutAI</h1>
            <span className="hidden sm:inline-block text-[var(--ch-muted)] text-sm border-l border-[var(--ch-border)] pl-4">
              A Scholarly Platform for Classical Jewish Texts
            </span>
          </div>
          <nav className="flex items-center gap-6 text-sm font-medium">
            <a href="#" className="hover:text-[var(--ch-primary)] transition-colors">Library</a>
            <a href="#" className="hover:text-[var(--ch-primary)] transition-colors">Tools</a>
            <a href="#" className="hover:text-[var(--ch-primary)] transition-colors">About</a>
            <button className="sm:hidden text-[var(--ch-fg)]">
              <Menu size={20} />
            </button>
          </nav>
        </header>

        <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-12 md:py-20 flex flex-col gap-16 md:gap-24">
          
          {/* Masthead & Search */}
          <section className="flex flex-col items-center text-center max-w-3xl mx-auto gap-8">
            <div className="space-y-4">
              <h2 className="ch-serif text-4xl md:text-5xl font-normal leading-tight text-[var(--ch-fg)]">
                Bilingual Critical Editions for the Serious Student
              </h2>
              <p className="text-lg md:text-xl text-[var(--ch-muted)] leading-relaxed max-w-2xl mx-auto">
                Explore the foundational texts of the Jewish tradition with synchronized translations, advanced search, and comprehensive academic tools.
              </p>
            </div>

            <div className="w-full max-w-xl relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search size={18} className="text-[var(--ch-muted)]" />
              </div>
              <input
                type="text"
                className="w-full bg-[var(--ch-surface)] border border-[var(--ch-border)] text-[var(--ch-fg)] text-base rounded-sm py-3 pl-11 pr-4 placeholder:text-[var(--ch-muted)] focus:bg-[var(--ch-bg)] ch-focus-ring transition-colors"
                placeholder="Search texts, concepts, or terms..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <kbd className="hidden sm:inline-block border border-[var(--ch-border)] bg-[var(--ch-bg)] text-[var(--ch-muted)] text-xs px-2 py-0.5 rounded-sm font-sans">
                  /
                </kbd>
              </div>
            </div>
          </section>

          {/* Core Library Sections */}
          <section className="space-y-10">
            <header className="ch-border-b pb-4">
              <h3 className="ch-serif text-2xl text-[var(--ch-accent)]">The Library</h3>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12">
              
              {/* Featured: Bavli */}
              <div className="md:col-span-7 group">
                <a href="#" className="block p-8 bg-[var(--ch-surface)] border border-[var(--ch-border)] hover:border-[var(--ch-primary)] transition-colors h-full flex flex-col">
                  <div className="flex justify-between items-start mb-6">
                    <span className="text-[var(--ch-primary)] text-xs font-bold uppercase tracking-widest">Primary Corpus</span>
                    <span className="ch-hebrew text-2xl text-[var(--ch-accent)]">תלמוד בבלי</span>
                  </div>
                  <h4 className="ch-serif text-3xl mb-3 text-[var(--ch-fg)] group-hover:text-[var(--ch-primary)] transition-colors">Babylonian Talmud</h4>
                  <p className="text-[var(--ch-muted)] leading-relaxed mb-8 flex-1">
                    The complete 37 tractates encompassing over 5,400 pages. Navigate by Seder, tractate, chapter, or individual folio with full bilingual Hebrew-English text, structural outlines, and cross-references.
                  </p>
                  <div className="flex items-center text-[var(--ch-primary)] font-semibold text-sm group-hover:underline underline-offset-4">
                    Enter the Talmud <ChevronRight size={16} className="ml-1" />
                  </div>
                </a>
              </div>

              {/* Other Corpora */}
              <div className="md:col-span-5 flex flex-col gap-6">
                <CorpusItem 
                  title="Tanakh (Hebrew Bible)" 
                  hebrew="תנ״ך" 
                  desc="Torah, Prophets, and Writings with translation and Masoretic text." 
                />
                <div className="h-px bg-[var(--ch-border)] w-full"></div>
                <CorpusItem 
                  title="Mishnah" 
                  hebrew="משנה" 
                  desc="All 63 tractates organized by the six Sedarim." 
                />
                <div className="h-px bg-[var(--ch-border)] w-full"></div>
                <CorpusItem 
                  title="Jerusalem Talmud" 
                  hebrew="תלמוד ירושלמי" 
                  desc="39 tractates organized by Seder and Halakhah." 
                />
                <div className="h-px bg-[var(--ch-border)] w-full"></div>
                <CorpusItem 
                  title="Mishneh Torah" 
                  hebrew="משנה תורה" 
                  desc="Rambam's comprehensive 83-book code of Jewish law." 
                />
              </div>

            </div>
          </section>

          {/* Tools & Entry Points */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-20">
            
            {/* Study Tools */}
            <section className="space-y-6">
              <header className="ch-border-b pb-3">
                <h3 className="ch-serif text-xl text-[var(--ch-accent)]">Study Tools & Dictionaries</h3>
              </header>
              <ul className="space-y-4">
                <ToolItem title="Jastrow Dictionary" desc="Comprehensive lexicon of Talmudic Hebrew & Aramaic." />
                <ToolItem title="BDB Bible Dictionary" desc="Brown-Driver-Briggs lexicon for Biblical Hebrew." />
                <ToolItem title="Sugya Viewer" desc="Isolate and study custom ranges of Talmudic text." />
                <ToolItem title="Biblical Index" desc="Map citations of biblical verses across the Talmud." />
                <ToolItem title="Mishnah Map" desc="Locate where specific Mishnah passages appear in the Gemara." />
                <ToolItem title="J.N. Epstein's Introductions" desc="Academic introductions to Talmudic literature." />
              </ul>
            </section>

            {/* Quick Entry */}
            <section className="space-y-6">
              <header className="ch-border-b pb-3">
                <h3 className="ch-serif text-xl text-[var(--ch-accent)]">Quick Entry</h3>
              </header>
              
              <div className="space-y-6">
                <div className="p-5 border border-[var(--ch-border)] bg-[var(--ch-surface)] hover:border-[var(--ch-primary)] transition-colors group cursor-pointer">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-bold text-[var(--ch-fg)] group-hover:text-[var(--ch-primary)]">Today's Daf Yomi</h4>
                    <span className="text-xs font-semibold text-[var(--ch-muted)] uppercase tracking-wider">Daily Study</span>
                  </div>
                  <p className="ch-serif text-xl text-[var(--ch-accent)] mb-1">Chullin 58</p>
                  <p className="text-sm text-[var(--ch-muted)]">Read today's folio page with English translation.</p>
                </div>

                <div className="p-5 border border-[var(--ch-border)] hover:border-[var(--ch-primary)] transition-colors group cursor-pointer">
                  <h4 className="font-bold text-[var(--ch-fg)] group-hover:text-[var(--ch-primary)] mb-1">Famous Talmud Pages</h4>
                  <p className="text-sm text-[var(--ch-muted)]">A curated selection of well-known passages and foundational sugyot.</p>
                </div>
              </div>
            </section>

          </div>

        </main>

        <footer className="ch-border-t py-10 mt-12 bg-[var(--ch-surface)]">
          <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="md:col-span-1 space-y-3">
              <h2 className="ch-serif text-lg font-bold text-[var(--ch-accent)]">ChavrutAI</h2>
              <p className="text-sm text-[var(--ch-muted)] leading-relaxed">
                A scholarly bilingual study platform for classical Jewish texts.
              </p>
            </div>
            <div>
              <h5 className="font-bold text-sm mb-4 text-[var(--ch-fg)]">Corpora</h5>
              <ul className="space-y-2 text-sm text-[var(--ch-muted)]">
                <li><a href="#" className="hover:text-[var(--ch-primary)]">Babylonian Talmud</a></li>
                <li><a href="#" className="hover:text-[var(--ch-primary)]">Jerusalem Talmud</a></li>
                <li><a href="#" className="hover:text-[var(--ch-primary)]">Mishnah</a></li>
                <li><a href="#" className="hover:text-[var(--ch-primary)]">Mishneh Torah</a></li>
                <li><a href="#" className="hover:text-[var(--ch-primary)]">Tanakh</a></li>
              </ul>
            </div>
            <div>
              <h5 className="font-bold text-sm mb-4 text-[var(--ch-fg)]">Resources</h5>
              <ul className="space-y-2 text-sm text-[var(--ch-muted)]">
                <li><a href="#" className="hover:text-[var(--ch-primary)]">Dictionaries</a></li>
                <li><a href="#" className="hover:text-[var(--ch-primary)]">Study Tools</a></li>
                <li><a href="#" className="hover:text-[var(--ch-primary)]">Academic Works</a></li>
                <li><a href="#" className="hover:text-[var(--ch-primary)]">Blog</a></li>
              </ul>
            </div>
            <div>
              <h5 className="font-bold text-sm mb-4 text-[var(--ch-fg)]">Project</h5>
              <ul className="space-y-2 text-sm text-[var(--ch-muted)]">
                <li><a href="#" className="hover:text-[var(--ch-primary)]">About</a></li>
                <li><a href="#" className="hover:text-[var(--ch-primary)]">API</a></li>
                <li>
                  <a href="#" className="inline-flex items-center hover:text-[var(--ch-primary)]">
                    GitHub <ExternalLink size={12} className="ml-1" />
                  </a>
                </li>
                <li><a href="#" className="hover:text-[var(--ch-primary)]">Privacy Policy</a></li>
              </ul>
            </div>
          </div>
          <div className="max-w-6xl mx-auto px-6 mt-10 pt-6 ch-border-t flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-[var(--ch-muted)]">
            <p>© {new Date().getFullYear()} ChavrutAI Project</p>
            <div className="flex gap-4">
              <button className="hover:text-[var(--ch-fg)] font-medium">Theme: Paper</button>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}

function CorpusItem({ title, hebrew, desc }: { title: string, hebrew: string, desc: string }) {
  return (
    <a href="#" className="group flex justify-between items-start gap-4">
      <div className="flex-1 space-y-1">
        <h4 className="ch-serif text-[1.35rem] text-[var(--ch-fg)] group-hover:text-[var(--ch-primary)] transition-colors leading-tight">
          {title}
        </h4>
        <p className="text-sm text-[var(--ch-muted)] leading-relaxed">{desc}</p>
      </div>
      <div className="ch-hebrew text-xl text-[var(--ch-accent)] pt-1">
        {hebrew}
      </div>
    </a>
  );
}

function ToolItem({ title, desc }: { title: string, desc: string }) {
  return (
    <li>
      <a href="#" className="group block">
        <h4 className="font-bold text-[var(--ch-fg)] group-hover:text-[var(--ch-primary)] transition-colors flex items-center">
          {title}
          <ChevronRight size={14} className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity translate-x-[-4px] group-hover:translate-x-0" />
        </h4>
        <p className="text-sm text-[var(--ch-muted)] mt-0.5">{desc}</p>
      </a>
    </li>
  );
}
