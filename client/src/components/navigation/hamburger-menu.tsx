import { Menu, Type, Palette, Moon, Sun, Columns } from "lucide-react";
import hebrewBookIcon from "@assets/20250731_1721_Hebrew Book Icon_remix_01k1gdhqpbetsb13vbtjceet4e_1753973105554.png";
import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { usePreferences, type TextSize, type HebrewFont, type Theme, type Layout } from "@/context/preferences-context";
import type { TalmudLocation } from "@/types/talmud";
import { trackEvent } from "@/lib/analytics";

interface HamburgerMenuProps {
  onLocationChange: (location: TalmudLocation) => void;
}

export function HamburgerMenu({ onLocationChange }: HamburgerMenuProps) {
  const [open, setOpen] = useState(false);
  const { preferences, setTextSize, setHebrewFont, setTheme, setLayout } = usePreferences();

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
                    <SelectItem value="calibri">Calibri</SelectItem>
                    <SelectItem value="times">Times New Roman</SelectItem>
                    <SelectItem value="david">Noto Sans Hebrew</SelectItem>
                    <SelectItem value="frank-ruehl">Frank Ruhl Libre</SelectItem>
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