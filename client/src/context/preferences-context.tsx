import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export type TextSize = "extra-small" | "small" | "medium" | "large" | "extra-large";
export type HebrewFont = "calibri" | "times" | "frank-ruehl" | "noto-sans-hebrew" | "noto-serif-hebrew" | "assistant" | "david-libre";
export type EnglishFont = "roboto" | "inter" | "source-sans-3" | "open-sans";
export type Theme = "paper" | "white" | "dark" | "high-contrast";
export type Layout = "side-by-side" | "stacked";

interface HighlightingSettings {
  enabled: boolean;
  concepts: boolean;
  names: boolean;
  places: boolean;
}

interface Preferences {
  textSize: TextSize;
  hebrewFont: HebrewFont;
  englishFont: EnglishFont;
  theme: Theme;
  layout: Layout;
  highlighting: HighlightingSettings;
}

interface PreferencesContextType {
  preferences: Preferences;
  setTextSize: (size: TextSize) => void;
  setHebrewFont: (font: HebrewFont) => void;
  setEnglishFont: (font: EnglishFont) => void;
  setTheme: (theme: Theme) => void;
  setLayout: (layout: Layout) => void;
  setHighlighting: (highlighting: HighlightingSettings) => void;
}

const PreferencesContext = createContext<PreferencesContextType | undefined>(undefined);

const DEFAULT_PREFERENCES: Preferences = {
  textSize: "medium",
  hebrewFont: "assistant",
  englishFont: "inter",
  theme: "white",
  layout: "side-by-side",
  highlighting: {
    enabled: false,
    concepts: true,
    names: true,
    places: true,
  },
};

const PREFERENCES_STORAGE_KEY = "talmud-study-preferences";

const ALL_THEMES: Theme[] = ["paper", "white", "dark", "high-contrast"];

function migrateTheme(storedTheme: string): Theme {
  if (storedTheme === "light" || storedTheme === "sepia") return "white";
  if (ALL_THEMES.includes(storedTheme as Theme)) {
    return storedTheme as Theme;
  }
  return "white";
}

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = useState<Preferences>(() => {
    const stored = localStorage.getItem(PREFERENCES_STORAGE_KEY);
    let prefs = DEFAULT_PREFERENCES;
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.theme) {
          parsed.theme = migrateTheme(parsed.theme);
        }
        prefs = { ...DEFAULT_PREFERENCES, ...parsed };
      } catch {
        prefs = DEFAULT_PREFERENCES;
      }
    }
    if (typeof document !== 'undefined') {
      document.documentElement.classList.remove(...ALL_THEMES);
      document.documentElement.classList.add(prefs.theme);
    }
    return prefs;
  });

  useEffect(() => {
    localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(preferences));
  }, [preferences]);

  useEffect(() => {
    document.documentElement.classList.remove(...ALL_THEMES);
    document.documentElement.classList.add(preferences.theme);
  }, [preferences.theme]);

  const setTextSize = (textSize: TextSize) => {
    setPreferences(prev => ({ ...prev, textSize }));
  };

  const setHebrewFont = (hebrewFont: HebrewFont) => {
    setPreferences(prev => ({ ...prev, hebrewFont }));
  };

  const setEnglishFont = (englishFont: EnglishFont) => {
    setPreferences(prev => ({ ...prev, englishFont }));
  };

  const setTheme = (theme: Theme) => {
    setPreferences(prev => ({ ...prev, theme }));
  };

  const setLayout = (layout: Layout) => {
    setPreferences(prev => ({ ...prev, layout }));
  };

  const setHighlighting = (highlighting: HighlightingSettings) => {
    setPreferences(prev => ({ ...prev, highlighting }));
  };

  return (
    <PreferencesContext.Provider
      value={{
        preferences,
        setTextSize,
        setHebrewFont,
        setEnglishFont,
        setTheme,
        setLayout,
        setHighlighting,
      }}
    >
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences() {
  const context = useContext(PreferencesContext);
  if (context === undefined) {
    throw new Error("usePreferences must be used within a PreferencesProvider");
  }
  return context;
}
