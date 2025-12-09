import { ReactNode } from "react";
import { HeaderSimple } from "./header-simple";
import { HeaderNavigation } from "./header-navigation";
import { Footer } from "@/components/footer";
import { usePreferences } from "@/context/preferences-context";
import type { TalmudLocation } from "@/types/talmud";

interface SharedLayoutProps {
  children: ReactNode;
  variant?: "simple" | "navigation";
  location?: TalmudLocation;
  onLocationChange?: (location: TalmudLocation) => void;
  headerMaxWidth?: string;
  mainMaxWidth?: string;
  showFooter?: boolean;
  applyTextPreferences?: boolean;
}

export function SharedLayout({
  children,
  variant = "simple",
  location,
  onLocationChange,
  headerMaxWidth,
  mainMaxWidth = "max-w-4xl",
  showFooter = true,
  applyTextPreferences = false,
}: SharedLayoutProps) {
  const { preferences } = usePreferences();

  const mainClasses = applyTextPreferences
    ? `${mainMaxWidth} mx-auto px-4 py-6 text-size-${preferences.textSize} hebrew-font-${preferences.hebrewFont} english-font-${preferences.englishFont} layout-${preferences.layout}`
    : `${mainMaxWidth} mx-auto px-4 py-6`;

  return (
    <div className="min-h-screen bg-background">
      {variant === "navigation" && location && onLocationChange ? (
        <HeaderNavigation 
          location={location} 
          onLocationChange={onLocationChange}
          maxWidth={headerMaxWidth}
        />
      ) : (
        <HeaderSimple maxWidth={headerMaxWidth} />
      )}

      <main className={mainClasses}>
        {children}
      </main>

      {showFooter && <Footer />}
    </div>
  );
}

export { HeaderSimple } from "./header-simple";
export { HeaderNavigation } from "./header-navigation";
