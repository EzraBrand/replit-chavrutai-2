import { Menu, ChevronDown, ChevronRight, Type, Palette, Moon, Sun } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { usePreferences, type TextSize, type HebrewFont, type Theme } from "@/context/preferences-context";
import type { TalmudLocation } from "@/types/talmud";

interface HamburgerMenuProps {
  onLocationChange: (location: TalmudLocation) => void;
}

interface SuggestedPage {
  tractate: string;
  folio: number;
  side: 'a' | 'b';
  label: string;
}

interface TractateSection {
  name: string;
  pages: SuggestedPage[];
}

export function HamburgerMenu({ onLocationChange }: HamburgerMenuProps) {
  const [open, setOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const { preferences, setTextSize, setHebrewFont, setTheme } = usePreferences();

  const tractatesWithPages: TractateSection[] = [
    {
      name: "Berakhot",
      pages: [
        { tractate: "Berakhot", folio: 17, side: 'a', label: "Berakhot 17a (Prayers)" },
        { tractate: "Berakhot", folio: 28, side: 'a', label: "Berakhot 28a (Rabban Gamliel)" },
        { tractate: "Berakhot", folio: 56, side: 'b', label: "Berakhot 56a (Dreams)" },
        { tractate: "Berakhot", folio: 62, side: 'a', label: "Berakhot 62a (Outhouse)" },
        { tractate: "Berakhot", folio: 63, side: 'b', label: "Berakhot 63b (Yavne)" }
      ]
    },
    {
      name: "Shabbat",
      pages: [
        { tractate: "Shabbat", folio: 31, side: 'a', label: "Shabbat 31a (Hillel)" },
        { tractate: "Shabbat", folio: 32, side: 'b', label: "Shabbat 32b (Divine Punishments)" },
        { tractate: "Shabbat", folio: 33, side: 'b', label: "Shabbat 33b (R' Shimon's Flight from the Romans)" },
        { tractate: "Shabbat", folio: 88, side: 'b', label: "Shabbat 88b (Giving of the Torah)" },
        { tractate: "Shabbat", folio: 104, side: 'a', label: "Shabbat 104a (Hebrew alphabet)" },
        { tractate: "Shabbat", folio: 109, side: 'b', label: "Shabbat 109b (Snakes)" },
        { tractate: "Shabbat", folio: 152, side: 'a', label: "Shabbat 152a (Old age)" },
        { tractate: "Shabbat", folio: 156, side: 'a', label: "Shabbat 156a (Astrology)" }
      ]
    },
    {
      name: "Taanit",
      pages: [
        { tractate: "Taanit", folio: 24, side: 'b', label: "Taanit 24b (Rainmaking)" },
        { tractate: "Taanit", folio: 29, side: 'a', label: "Taanit 29a (Tisha B'Av)" }
      ]
    },
    {
      name: "Gittin",
      pages: [
        { tractate: "Gittin", folio: 56, side: 'a', label: "Gittin 56a (Siege of Jerusalem)" },
        { tractate: "Gittin", folio: 56, side: 'b', label: "Gittin 56b (Rabban Yoḥanan ben Zakkai)" },
        { tractate: "Gittin", folio: 58, side: 'a', label: "Gittin 58a (Roman atrocities)" },
        { tractate: "Gittin", folio: 69, side: 'a', label: "Gittin 69a (Remedies)" },
        { tractate: "Gittin", folio: 70, side: 'a', label: "Gittin 70a (Remedies and dangerous activities)" }
      ]
    },
    {
      name: "Kiddushin",
      pages: [
        { tractate: "Kiddushin", folio: 70, side: 'b', label: "Kiddushin 70b (Lineage)" },
        { tractate: "Kiddushin", folio: 72, side: 'a', label: "Kiddushin 72a (Babylonian Jewish Geography)" },
        { tractate: "Kiddushin", folio: 82, side: 'a', label: "Kiddushin 82a (Professions)" }
      ]
    },
    {
      name: "Pesachim",
      pages: [
        { tractate: "Pesachim", folio: 49, side: 'b', label: "Pesachim 49b (Am Ha'aretz)" },
        { tractate: "Pesachim", folio: 54, side: 'a', label: "Pesachim 54a (Lists of creations)" },
        { tractate: "Pesachim", folio: 111, side: 'b', label: "Pesachim 111b (Demons)" },
        { tractate: "Pesachim", folio: 112, side: 'b', label: "Pesachim 112b (Advice)" },
        { tractate: "Pesachim", folio: 117, side: 'a', label: "Pesachim 117a (Hallel)" }
      ]
    },
    {
      name: "Rosh Hashanah",
      pages: [
        { tractate: "Rosh Hashanah", folio: 11, side: 'a', label: "Rosh Hashanah 11a (Tishrei vs. Nisan)" },
        { tractate: "Rosh Hashanah", folio: 26, side: 'b', label: "Rosh Hashanah 26b (Word Definitions)" }
      ]
    },
    {
      name: "Yoma",
      pages: [
        { tractate: "Yoma", folio: 20, side: 'b', label: "Yoma 20b (Loud sounds)" },
        { tractate: "Yoma", folio: 35, side: 'b', label: "Yoma 35b (Posthumous judgement)" },
        { tractate: "Yoma", folio: 39, side: 'b', label: "Yoma 39b (Omens of the Destruction)" },
        { tractate: "Yoma", folio: 69, side: 'b', label: "Yoma 69b (Destroying inclination for idolatry)" },
        { tractate: "Yoma", folio: 77, side: 'a', label: "Yoma 77a (Gabriel)" }
      ]
    },
    {
      name: "Megillah",
      pages: [
        { tractate: "Megillah", folio: 11, side: 'a', label: "Megillah 11a (Intro to Esther)" }
      ]
    },
    {
      name: "Sanhedrin",
      pages: [
        { tractate: "Sanhedrin", folio: 44, side: 'a', label: "Sanhedrin 44a (Achan)" }
      ]
    }
  ];

  const handleSuggestedPageClick = (tractate: string, folio: number, side: 'a' | 'b') => {
    onLocationChange({
      work: "Talmud Bavli",
      tractate,
      chapter: 1,
      folio,
      side
    });
    setOpen(false);
  };

  const toggleSection = (sectionName: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionName)) {
      newExpanded.delete(sectionName);
    } else {
      newExpanded.add(sectionName);
    }
    setExpandedSections(newExpanded);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="flex-shrink-0 text-primary hover:bg-secondary"
        >
          <Menu className="h-6 w-6" />
          <span className="sr-only">Open menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64">
        <SheetHeader>
          <SheetTitle className="text-left">Menu</SheetTitle>
        </SheetHeader>
        
        <div className="flex flex-col h-full pt-6">
          {/* Contents Link */}
          <div className="mb-6">
            <Link 
              href="/contents"
              onClick={() => setOpen(false)}
              className="block w-full text-left px-4 py-3 rounded-lg hover:bg-secondary transition-colors duration-100 text-foreground font-medium text-lg"
            >
              Contents
            </Link>
          </div>
          
          {/* Suggested Pages Section */}
          <div className="flex-1 overflow-hidden">
            <h3 className="text-lg font-semibold text-foreground mb-4">Suggested pages</h3>
            <div className="space-y-1 overflow-y-auto max-h-[calc(100vh-200px)] pr-2">
              {/* Tractate Sections */}
              {tractatesWithPages.map((section) => (
                <div key={section.name} className="space-y-1">
                  {/* Tractate Header */}
                  <button
                    onClick={() => toggleSection(section.name)}
                    className="w-full flex items-center justify-between px-4 py-3 rounded-lg hover:bg-secondary/50 transition-colors duration-100 text-foreground font-medium"
                  >
                    <span>{section.name}</span>
                    {expandedSections.has(section.name) ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </button>
                  
                  {/* Tractate Pages */}
                  {expandedSections.has(section.name) && (
                    <div className="ml-4 space-y-1">
                      {section.pages.map((page) => (
                        <button
                          key={`${page.tractate}-${page.folio}${page.side}`}
                          onClick={() => handleSuggestedPageClick(page.tractate, page.folio, page.side)}
                          className="w-full text-left px-4 py-2 rounded-lg hover:bg-secondary transition-colors duration-100 text-foreground text-sm"
                        >
                          {page.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
          
          {/* Bottom Section */}
          <div className="border-t border-border pt-4 mt-4 space-y-4">
            {/* Preferences Section */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-foreground/80 px-4">Preferences</h4>
              
              {/* Text Size */}
              <div className="px-4">
                <div className="flex items-center gap-2 mb-2">
                  <Type className="w-4 h-4 text-foreground/60" />
                  <span className="text-sm text-foreground/80">Text Size</span>
                </div>
                <Select value={preferences.textSize} onValueChange={(value: TextSize) => setTextSize(value)}>
                  <SelectTrigger className="w-full h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="small">Small</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="large">Large</SelectItem>
                    <SelectItem value="extra-large">Extra Large</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Hebrew Font */}
              <div className="px-4">
                <div className="flex items-center gap-2 mb-2">
                  <Palette className="w-4 h-4 text-foreground/60" />
                  <span className="text-sm text-foreground/80">Hebrew Font</span>
                </div>
                <Select value={preferences.hebrewFont} onValueChange={(value: HebrewFont) => setHebrewFont(value)}>
                  <SelectTrigger className="w-full h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="calibri">Calibri</SelectItem>
                    <SelectItem value="times">Times New Roman</SelectItem>
                    <SelectItem value="david">Noto Sans Hebrew</SelectItem>
                    <SelectItem value="frank-ruehl">Frank Ruhl Libre</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Dark Mode */}
              <div className="px-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {preferences.theme === "dark" ? (
                      <Moon className="w-4 h-4 text-foreground/60" />
                    ) : (
                      <Sun className="w-4 h-4 text-foreground/60" />
                    )}
                    <span className="text-sm text-foreground/80">Theme</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setTheme(preferences.theme === "light" ? "dark" : "light")}
                    className="h-8 px-3"
                  >
                    {preferences.theme === "light" ? "Dark" : "Light"}
                  </Button>
                </div>
              </div>
            </div>
            
            <Separator />
            
            <Link 
              href="/about"
              onClick={() => setOpen(false)}
              className="block w-full text-left px-4 py-3 rounded-lg hover:bg-secondary transition-colors duration-100 text-foreground"
            >
              About
            </Link>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}