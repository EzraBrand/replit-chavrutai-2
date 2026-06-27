import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Menu, Settings2, ExternalLink, MoreVertical, Search, BookOpen } from 'lucide-react';

export function ReadingPage() {
  const [activeTab, setActiveTab] = useState("text");

  return (
    <div 
      className="min-h-screen w-full flex flex-col font-sans"
      style={{ 
        backgroundColor: "hsl(28, 37%, 94%)", 
        color: "hsl(25, 12%, 18%)",
        fontFamily: "'Inter', sans-serif"
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Frank+Ruhl+Libre:wght@400;500;700;900&family=Merriweather:ital,wght@0,300;0,400;0,700;1,300;1,400&family=Inter:wght@400;500;600&display=swap');

        .font-hebrew { font-family: 'Frank Ruhl Libre', serif; }
        .font-serif-en { font-family: 'Merriweather', serif; }
        
        .border-warm { border-color: hsl(25, 18%, 80%); }
        .text-warm-muted { color: hsl(25, 8%, 42%); }
        .bg-warm-hover:hover { background-color: hsl(28, 25%, 90%); }
        .text-slate-blue { color: hsl(203, 30%, 26%); }
        .text-talmud-brown { color: hsl(20, 60%, 35%); }
        
        .talmud-text-column {
          position: relative;
        }
      `}</style>

      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-50 border-b border-warm bg-[hsl(28,37%,94%)]/95 backdrop-blur-sm px-4 py-3 flex items-center justify-between shadow-sm shadow-[hsl(25,18%,80%)]/20">
        <div className="flex items-center gap-4">
          <button className="p-2 rounded bg-warm-hover text-warm-muted transition-colors" aria-label="Menu">
            <Menu size={20} />
          </button>
          
          <nav className="hidden lg:flex items-center text-sm font-medium text-warm-muted">
            <a href="#" className="hover:text-slate-blue transition-colors">Home</a>
            <span className="mx-2 opacity-50">/</span>
            <a href="#" className="hover:text-slate-blue transition-colors">Talmud</a>
            <span className="mx-2 opacity-50">/</span>
            <a href="#" className="hover:text-slate-blue transition-colors text-[hsl(25,12%,18%)] font-semibold">Berakhot</a>
            <span className="mx-2 opacity-50">/</span>
            <a href="#" className="hover:text-slate-blue transition-colors">Chapter 1: Me'eimatay</a>
            <span className="mx-2 opacity-50">/</span>
            <span className="text-[hsl(25,12%,18%)] font-bold">2a</span>
          </nav>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          {/* Folio Navigation */}
          <div className="flex items-center border border-warm rounded overflow-hidden shadow-sm shadow-[hsl(25,18%,80%)]/20">
            <button className="px-3 py-1.5 flex items-center gap-1 text-sm font-medium hover:bg-warm-hover transition-colors border-r border-warm text-warm-muted">
              <ChevronLeft size={16} />
              <span className="hidden sm:inline">Previous</span>
            </button>
            <div className="px-4 py-1.5 text-sm font-bold bg-[hsl(28,25%,90%)] text-[hsl(25,12%,18%)] border-r border-warm flex flex-col items-center">
              <span>2a</span>
            </div>
            <button className="px-3 py-1.5 flex items-center gap-1 text-sm font-medium hover:bg-warm-hover transition-colors text-warm-muted">
              <span className="hidden sm:inline">Next 2b</span>
              <ChevronRight size={16} />
            </button>
          </div>

          <div className="w-px h-6 bg-[hsl(25,18%,80%)] mx-1 hidden sm:block"></div>

          <button className="p-2 rounded bg-warm-hover text-warm-muted transition-colors" title="Search Tractate">
            <Search size={18} />
          </button>
          <button className="p-2 rounded bg-warm-hover text-warm-muted transition-colors" title="Reading Preferences">
            <Settings2 size={18} />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-[1400px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-16">
        
        {/* Chapter Header */}
        <header className="mb-16 text-center">
          <h2 className="text-xs font-bold tracking-[0.2em] uppercase text-talmud-brown mb-4 opacity-80">Chapter 1</h2>
          <div className="flex flex-col items-center justify-center gap-3">
            <h1 className="text-4xl sm:text-5xl font-serif-en text-[hsl(25,12%,18%)] tracking-tight">Me'eimatay</h1>
            <h1 className="text-5xl sm:text-6xl font-hebrew text-talmud-brown mt-1">מאימתי</h1>
          </div>
        </header>

        {/* Top-level Tabs */}
        <div className="flex justify-center mb-20 relative">
          <div className="absolute inset-x-0 bottom-0 h-px bg-warm-hover"></div>
          <div className="flex space-x-12 px-4 relative">
            <button 
              onClick={() => setActiveTab("text")}
              className={`pb-4 text-sm font-medium tracking-wide transition-all duration-200 relative ${activeTab === 'text' ? 'text-slate-blue' : 'text-warm-muted hover:text-[hsl(25,12%,18%)]'}`}
            >
              Text & Translation
              {activeTab === 'text' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-blue"></div>}
            </button>
            <button 
              onClick={() => setActiveTab("summaries")}
              className={`pb-4 text-sm font-medium tracking-wide transition-all duration-200 relative ${activeTab === 'summaries' ? 'text-slate-blue' : 'text-warm-muted hover:text-[hsl(25,12%,18%)]'}`}
            >
              Summaries & Key Terms
              {activeTab === 'summaries' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-blue"></div>}
            </button>
            <button 
              onClick={() => setActiveTab("analysis")}
              className={`pb-4 text-sm font-medium tracking-wide transition-all duration-200 relative ${activeTab === 'analysis' ? 'text-slate-blue' : 'text-warm-muted hover:text-[hsl(25,12%,18%)]'}`}
            >
              Broader Analysis
              {activeTab === 'analysis' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-blue"></div>}
            </button>
          </div>
        </div>

        {/* Bilingual Text Layout: Central Spine Approach */}
        <div className="max-w-6xl mx-auto">
          
          {/* Segment 1 */}
          <div className="mb-8">
            <div className="flex justify-center mb-8">
              <h3 className="font-serif-en text-talmud-brown font-semibold tracking-wider uppercase text-sm border-b border-talmud-brown/20 pb-1.5 px-6">
                Mishnah
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-[1fr_4rem_1fr] gap-0 group">
              
              {/* English Column (Left) */}
              <div className="md:text-left pr-4 md:pr-8 pb-12">
                <p className="font-serif-en text-[1.1rem] leading-[1.85] text-[hsl(25,12%,18%)] opacity-90 text-justify md:text-left">
                  The beginning of tractate Berakhot, the first tractate in the first of the 6 orders of Mishnah, opens with a discussion of the recitation of Shema in the evening.
                  <br/><br/>
                  From what time does one recite Shema in the evening? From the time when the priests enter to partake of their teruma, until the end of the first watch. This is the statement of Rabbi Eliezer.
                  <br/><br/>
                  And the Rabbis say: Until midnight. Rabban Gamliel says: Until dawn.
                </p>
              </div>

              {/* Central Spine */}
              <div className="hidden md:flex flex-col items-center relative">
                <div className="absolute top-2 w-7 h-7 rounded-sm bg-[hsl(28,37%,94%)] border border-talmud-brown/30 flex items-center justify-center text-xs font-bold text-talmud-brown z-10 font-sans shadow-sm">
                  1
                </div>
                <div className="w-px h-full bg-gradient-to-b from-talmud-brown/20 via-[hsl(25,18%,80%)] to-[hsl(25,18%,80%)]"></div>
              </div>

              {/* Hebrew Column (Right) */}
              <div className="md:text-right pl-4 md:pl-8 pb-12 relative" dir="rtl">
                {/* Desktop Action Menu (Absolute Left) */}
                <div className="absolute top-2 -left-12 opacity-0 group-hover:opacity-100 transition-opacity hidden md:flex flex-col gap-1.5" dir="ltr">
                  <button className="w-8 h-8 rounded-full flex items-center justify-center bg-[hsl(28,37%,94%)] border border-warm text-warm-muted hover:text-slate-blue hover:border-slate-blue transition-colors shadow-sm" title="View on Sefaria">
                    <ExternalLink size={14} />
                  </button>
                  <button className="w-8 h-8 rounded-full flex items-center justify-center bg-[hsl(28,37%,94%)] border border-warm text-warm-muted hover:text-slate-blue hover:border-slate-blue transition-colors shadow-sm" title="More Options">
                    <MoreVertical size={14} />
                  </button>
                </div>
                {/* Mobile Section Marker */}
                <div className="md:hidden flex items-center gap-3 mb-3" dir="ltr">
                  <div className="w-6 h-6 rounded-sm border border-talmud-brown/30 flex items-center justify-center text-xs font-bold text-talmud-brown">1</div>
                  <div className="h-px flex-1 bg-warm-hover"></div>
                  <div className="flex gap-2">
                    <button className="text-warm-muted"><ExternalLink size={14}/></button>
                  </div>
                </div>

                <p className="font-hebrew text-[1.4rem] leading-[2.2] text-[hsl(25,12%,18%)] text-justify md:text-right">
                  <strong>מאימתי</strong> קורין את שמע בערבין? משעה שהכהנים נכנסים לאכול בתרומתן, עד סוף האשמורה הראשונה. דברי רבי אליעזר.
                  <br/><br/>
                  וחכמים אומרים: עד חצות. רבן גמליאל אומר: עד שיעלה עמוד השחר.
                </p>
              </div>
            </div>
          </div>

          {/* Segment 2 */}
          <div className="mb-8">
            <div className="flex justify-center mb-8 mt-4">
              <h3 className="font-serif-en text-talmud-brown font-semibold tracking-wider uppercase text-sm border-b border-talmud-brown/20 pb-1.5 px-6">
                Gemara
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-[1fr_4rem_1fr] gap-0 group">
              
              {/* English Column (Left) */}
              <div className="md:text-left pr-4 md:pr-8 pb-12">
                <p className="font-serif-en text-[1.1rem] leading-[1.85] text-[hsl(25,12%,18%)] opacity-90 text-justify md:text-left">
                  The Gemara asks: On what basis does the tanna of the mishna stand when he asks: From what time? 
                  <br/><br/>
                  The Gemara answers: He stands on the verse of the Torah: "And you shall speak of them when you sit in your house, and when you walk by the way, and when you lie down, and when you rise up" (Deuteronomy 6:7).
                </p>
              </div>

              {/* Central Spine */}
              <div className="hidden md:flex flex-col items-center relative">
                <div className="absolute top-2 w-7 h-7 rounded-sm bg-[hsl(28,37%,94%)] border border-[hsl(25,18%,80%)] flex items-center justify-center text-xs font-bold text-warm-muted z-10 font-sans shadow-sm">
                  2
                </div>
                <div className="w-px h-full bg-[hsl(25,18%,80%)]"></div>
              </div>

              {/* Hebrew Column (Right) */}
              <div className="md:text-right pl-4 md:pl-8 pb-12 relative" dir="rtl">
                {/* Desktop Action Menu */}
                <div className="absolute top-2 -left-12 opacity-0 group-hover:opacity-100 transition-opacity hidden md:flex flex-col gap-1.5" dir="ltr">
                  <button className="w-8 h-8 rounded-full flex items-center justify-center bg-[hsl(28,37%,94%)] border border-warm text-warm-muted hover:text-slate-blue hover:border-slate-blue transition-colors shadow-sm" title="View on Sefaria">
                    <ExternalLink size={14} />
                  </button>
                  <button className="w-8 h-8 rounded-full flex items-center justify-center bg-[hsl(28,37%,94%)] border border-warm text-warm-muted hover:text-slate-blue hover:border-slate-blue transition-colors shadow-sm" title="More Options">
                    <MoreVertical size={14} />
                  </button>
                </div>
                {/* Mobile Section Marker */}
                <div className="md:hidden flex items-center gap-3 mb-3" dir="ltr">
                  <div className="w-6 h-6 rounded-sm border border-[hsl(25,18%,80%)] flex items-center justify-center text-xs font-bold text-warm-muted">2</div>
                  <div className="h-px flex-1 bg-warm-hover"></div>
                  <div className="flex gap-2">
                    <button className="text-warm-muted"><ExternalLink size={14}/></button>
                  </div>
                </div>

                <p className="font-hebrew text-[1.4rem] leading-[2.2] text-[hsl(25,12%,18%)] text-justify md:text-right">
                  תנא היכא קאי דקתני <strong>מאימתי</strong>? 
                  <br/><br/>
                  תנא אקרא קאי, דכתיב: ״בשכבך ובקומך״.
                </p>
              </div>
            </div>
          </div>

          {/* End of Folio Marker */}
          <div className="mt-8 flex items-center justify-center">
             <div className="h-px w-24 bg-gradient-to-r from-transparent via-[hsl(25,18%,80%)] to-transparent"></div>
             <div className="mx-4 text-warm-muted">
                <BookOpen size={16} className="opacity-50" />
             </div>
             <div className="h-px w-24 bg-gradient-to-r from-[hsl(25,18%,80%)] via-[hsl(25,18%,80%)] to-transparent"></div>
          </div>

        </div>
      </main>

      <footer className="border-t border-warm bg-[hsl(28,30%,93%)] py-10 mt-12 text-center">
        <div className="max-w-4xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm font-medium text-warm-muted font-serif-en">ChavrutAI Reading Interface Redesign</p>
          <div className="flex gap-6 text-sm text-warm-muted">
            <a href="#" className="hover:text-slate-blue transition-colors">Sefaria</a>
            <a href="#" className="hover:text-slate-blue transition-colors">Al HaTorah</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
