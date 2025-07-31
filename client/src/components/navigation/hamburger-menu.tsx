import { Menu, X } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import type { TalmudLocation } from "@/types/talmud";

interface HamburgerMenuProps {
  onLocationChange: (location: TalmudLocation) => void;
}

export function HamburgerMenu({ onLocationChange }: HamburgerMenuProps) {
  const [open, setOpen] = useState(false);

  const suggestedPages = [
    { tractate: "Ta'anit", folio: 29, side: 'a' as const, label: "Taanit 29a" },
    { tractate: "Gittin", folio: 69, side: 'a' as const, label: "Gittin 69a" }
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
      <SheetContent side="left" className="w-80 sm:w-96">
        <SheetHeader>
          <SheetTitle className="text-left">Menu</SheetTitle>
        </SheetHeader>
        
        <div className="flex flex-col h-full pt-6">
          {/* Suggested Pages Section */}
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-foreground mb-4">Suggested pages</h3>
            <div className="space-y-2">
              {suggestedPages.map((page) => (
                <button
                  key={`${page.tractate}-${page.folio}${page.side}`}
                  onClick={() => handleSuggestedPageClick(page.tractate, page.folio, page.side)}
                  className="w-full text-left px-4 py-3 rounded-lg hover:bg-secondary transition-colors duration-200 text-foreground"
                >
                  {page.label}
                </button>
              ))}
            </div>
          </div>
          
          {/* Bottom Section */}
          <div className="border-t border-border pt-4 mt-4">
            <Link 
              href="/about"
              onClick={() => setOpen(false)}
              className="block w-full text-left px-4 py-3 rounded-lg hover:bg-secondary transition-colors duration-200 text-foreground"
            >
              About
            </Link>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}