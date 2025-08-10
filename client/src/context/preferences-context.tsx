import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export type TextSize = "extra-small" | "small" | "medium" | "large" | "extra-large";
export type HebrewFont = "calibri" | "times" | "david" | "frank-ruehl" | "noto-sans-hebrew" | "noto-serif-hebrew" | "noto-rashi-hebrew" | "assistant" | "david-libre";
export type Theme = "light" | "dark";
export type Layout = "side-by-side" | "stacked";

interface Preferences {
  textSize: TextSize;
  hebrewFont: HebrewFont;
  theme: Theme;
  layout: Layout;
}

interface PreferencesContextType {
  preferences: Preferences;
  setTextSize: (size: TextSize) => void;
  setHebrewFont: (font: HebrewFont) => void;
  setTheme: (theme: Theme) => void;
  setLayout: (layout: Layout) => void;
}

const PreferencesContext = createContext<PreferencesContextType | undefined>(undefined);

const DEFAULT_PREFERENCES: Preferences = {
  textSize: "medium",
  hebrewFont: "noto-sans-hebrew",
  theme: "light",
  layout: "side-by-side",
};

const PREFERENCES_STORAGE_KEY = "talmud-study-preferences";

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = useState<Preferences>(() => {
    // Load from localStorage on initialization
    const stored = localStorage.getItem(PREFERENCES_STORAGE_KEY);
    if (stored) {
      try {
        return { ...DEFAULT_PREFERENCES, ...JSON.parse(stored) };
      } catch {
        return DEFAULT_PREFERENCES;
      }
    }
    return DEFAULT_PREFERENCES;
  });

  // Save to localStorage whenever preferences change
  useEffect(() => {
    localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(preferences));
  }, [preferences]);

  // Apply theme to document
  useEffect(() => {
    if (preferences.theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [preferences.theme]);

  const setTextSize = (textSize: TextSize) => {
    setPreferences(prev => ({ ...prev, textSize }));
  };

  const setHebrewFont = (hebrewFont: HebrewFont) => {
    setPreferences(prev => ({ ...prev, hebrewFont }));
  };

  const setTheme = (theme: Theme) => {
    setPreferences(prev => ({ ...prev, theme }));
  };

  const setLayout = (layout: Layout) => {
    setPreferences(prev => ({ ...prev, layout }));
  };

  return (
    <PreferencesContext.Provider
      value={{
        preferences,
        setTextSize,
        setHebrewFont,
        setTheme,
        setLayout,
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