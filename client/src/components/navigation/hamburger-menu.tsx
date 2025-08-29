import { Menu, Type, Palette, Moon, Sun, Columns, Highlighter } from "lucide-react";
import hebrewBookIcon from "@/assets/hebrew-book-icon.png";
import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { usePreferences, type TextSize, type HebrewFont, type Theme, type Layout } from "@/context/preferences-context";
import { Switch } from "@/components/ui/switch";
import type { TalmudLocation } from "@/types/talmud";
import { trackEvent } from "@/lib/analytics";

interface HamburgerMenuProps {
  onLocationChange: (location: TalmudLocation) => void;
}

export function HamburgerMenu({ onLocationChange }: HamburgerMenuProps) {
  const [open, setOpen] = useState(false);
  const { preferences, setTextSize, setHebrewFont, setTheme, setLayout, setHighlighting } = usePreferences();

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
          {/* Contents Link with Logo */}
          <div className="mb-6">
            <Link 
              href="/contents"
              onClick={() => {
                trackEvent('navigate_menu', 'navigation', 'contents');
                setOpen(false);
              }}
              className="flex items-center gap-3 w-full text-left px-4 py-3 rounded-lg hover:bg-secondary transition-colors duration-100 text-foreground font-medium text-lg"
            >
              <div className="w-8 h-8 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
                <img 
                  src={hebrewBookIcon} 
                  alt="ChavrutAI Logo" 
                  className="w-8 h-8 object-cover"
                />
              </div>
              Contents
            </Link>
          </div>
          
          {/* Suggested Pages Link */}
          <div className="mb-6">
            <Link 
              href="/suggested-pages"
              onClick={() => setOpen(false)}
              className="block w-full text-left px-4 py-3 rounded-lg hover:bg-secondary transition-colors duration-100 text-foreground font-medium text-lg"
            >
              Suggested Pages
            </Link>
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
                <Select value={preferences.textSize} onValueChange={(value: TextSize) => {
                  trackEvent('change_preference', 'settings', `text_size_${value}`);
                  setTextSize(value);
                }}>
                  <SelectTrigger className="w-full h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="extra-small">Extra Small</SelectItem>
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
                <Select value={preferences.hebrewFont} onValueChange={(value: HebrewFont) => {
                  trackEvent('change_preference', 'settings', `hebrew_font_${value}`);
                  setHebrewFont(value);
                }}>
                  <SelectTrigger className="w-full h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="calibri">
                      <div className="flex items-center gap-2">
                        <span className="hebrew-font-calibri text-lg">א</span>
                        <span>Calibri</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="times">
                      <div className="flex items-center gap-2">
                        <span className="hebrew-font-times text-lg">א</span>
                        <span>Times New Roman</span>
                      </div>
                    </SelectItem>

                    <SelectItem value="frank-ruehl">
                      <div className="flex items-center gap-2">
                        <span className="hebrew-font-frank-ruehl text-lg">א</span>
                        <span>Frank Ruhl Libre</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="noto-sans-hebrew">
                      <div className="flex items-center gap-2">
                        <span className="hebrew-font-noto-sans-hebrew text-lg">א</span>
                        <span>Noto Sans Hebrew</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="noto-serif-hebrew">
                      <div className="flex items-center gap-2">
                        <span className="hebrew-font-noto-serif-hebrew text-lg">א</span>
                        <span>Noto Serif Hebrew</span>
                      </div>
                    </SelectItem>

                    <SelectItem value="assistant">
                      <div className="flex items-center gap-2">
                        <span className="hebrew-font-assistant text-lg">א</span>
                        <span>Assistant</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="david-libre">
                      <div className="flex items-center gap-2">
                        <span className="hebrew-font-david-libre text-lg">א</span>
                        <span>David Libre</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Layout */}
              <div className="px-4">
                <div className="flex items-center gap-2 mb-2">
                  <Columns className="w-4 h-4 text-foreground/60" />
                  <span className="text-sm text-foreground/80">Layout</span>
                </div>
                <Select value={preferences.layout} onValueChange={(value: Layout) => {
                  trackEvent('change_preference', 'settings', `layout_${value}`);
                  setLayout(value);
                }}>
                  <SelectTrigger className="w-full h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="side-by-side">Side by Side</SelectItem>
                    <SelectItem value="stacked">Stacked</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Term Highlighting */}
              <div className="px-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Highlighter className="w-4 h-4 text-foreground/60" />
                    <span className="text-sm text-foreground/80">Term Highlighting</span>
                  </div>
                  <Switch
                    checked={preferences.highlighting.enabled}
                    onCheckedChange={(enabled) => {
                      trackEvent('change_preference', 'settings', `highlighting_${enabled ? 'enabled' : 'disabled'}`);
                      setHighlighting({
                        ...preferences.highlighting,
                        enabled,
                      });
                    }}
                    data-testid="switch-highlighting"
                  />
                </div>
                
                {/* Highlighting category controls - only show when enabled */}
                {preferences.highlighting.enabled && (
                  <div className="space-y-2 pl-6">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-foreground/70">Concepts</span>
                      <Switch
                        checked={preferences.highlighting.concepts}
                        onCheckedChange={(concepts) => {
                          trackEvent('change_preference', 'settings', `highlighting_concepts_${concepts ? 'enabled' : 'disabled'}`);
                          setHighlighting({
                            ...preferences.highlighting,
                            concepts,
                          });
                        }}
                        data-testid="switch-highlighting-concepts"
                        className="scale-75"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-foreground/70">Names</span>
                      <Switch
                        checked={preferences.highlighting.names}
                        onCheckedChange={(names) => {
                          trackEvent('change_preference', 'settings', `highlighting_names_${names ? 'enabled' : 'disabled'}`);
                          setHighlighting({
                            ...preferences.highlighting,
                            names,
                          });
                        }}
                        data-testid="switch-highlighting-names"
                        className="scale-75"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-foreground/70">Places</span>
                      <Switch
                        checked={preferences.highlighting.places}
                        onCheckedChange={(places) => {
                          trackEvent('change_preference', 'settings', `highlighting_places_${places ? 'enabled' : 'disabled'}`);
                          setHighlighting({
                            ...preferences.highlighting,
                            places,
                          });
                        }}
                        data-testid="switch-highlighting-places"
                        className="scale-75"
                      />
                    </div>
                  </div>
                )}
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
                    onClick={() => {
                      const newTheme = preferences.theme === "light" ? "dark" : "light";
                      trackEvent('change_preference', 'settings', `theme_${newTheme}`);
                      setTheme(newTheme);
                    }}
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