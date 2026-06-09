"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { defaultLogoIconId, defaultSiteName, defaultTagline, isLogoIconId, type LogoIconId } from "@/lib/brand";
import { defaultThemeId, isThemeId, type ThemeId } from "@/lib/themes";

type ThemeContextValue = {
  themeId: ThemeId;
  logoIconId: LogoIconId;
  siteName: string;
  tagline: string;
  setThemeId: (themeId: ThemeId) => void;
  setLogoIconId: (logoIconId: LogoIconId) => void;
  setSiteName: (siteName: string) => void;
  setTagline: (tagline: string) => void;
  resetTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function applyTheme(themeId: ThemeId) {
  document.documentElement.dataset.theme = themeId;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeId, setThemeIdState] = useState<ThemeId>(defaultThemeId);
  const [logoIconId, setLogoIconIdState] = useState<LogoIconId>(defaultLogoIconId);
  const [siteName, setSiteNameState] = useState(defaultSiteName);
  const [tagline, setTaglineState] = useState(defaultTagline);

  useEffect(() => {
    const savedTheme = window.localStorage.getItem("ai-tools-hub.theme");
    const savedLogoIcon = window.localStorage.getItem("ai-tools-hub.logoIcon");
    const savedSiteName = window.localStorage.getItem("ai-tools-hub.siteName");
    const savedTagline = window.localStorage.getItem("ai-tools-hub.tagline");
    const migratedTheme = savedTheme === "butter" ? "pink" : savedTheme;
    const nextTheme = isThemeId(migratedTheme) ? migratedTheme : defaultThemeId;
    if (migratedTheme === "pink" && savedTheme === "butter") {
      window.localStorage.setItem("ai-tools-hub.theme", "pink");
    }
    const nextLogoIcon = isLogoIconId(savedLogoIcon) ? savedLogoIcon : defaultLogoIconId;
    setThemeIdState(nextTheme);
    setLogoIconIdState(nextLogoIcon);
    setSiteNameState(savedSiteName?.trim() || defaultSiteName);
    setTaglineState(savedTagline?.trim() || defaultTagline);
    applyTheme(nextTheme);
  }, []);

  function setThemeId(nextTheme: ThemeId) {
    window.localStorage.setItem("ai-tools-hub.theme", nextTheme);
    setThemeIdState(nextTheme);
    applyTheme(nextTheme);
  }

  function setLogoIconId(nextLogoIcon: LogoIconId) {
    window.localStorage.setItem("ai-tools-hub.logoIcon", nextLogoIcon);
    setLogoIconIdState(nextLogoIcon);
  }

  function setSiteName(nextSiteName: string) {
    window.localStorage.setItem("ai-tools-hub.siteName", nextSiteName);
    setSiteNameState(nextSiteName.trim() || defaultSiteName);
  }

  function setTagline(nextTagline: string) {
    window.localStorage.setItem("ai-tools-hub.tagline", nextTagline);
    setTaglineState(nextTagline.trim() || defaultTagline);
  }

  function resetTheme() {
    window.localStorage.removeItem("ai-tools-hub.theme");
    window.localStorage.removeItem("ai-tools-hub.logoIcon");
    window.localStorage.removeItem("ai-tools-hub.siteName");
    window.localStorage.removeItem("ai-tools-hub.tagline");
    setThemeIdState(defaultThemeId);
    setLogoIconIdState(defaultLogoIconId);
    setSiteNameState(defaultSiteName);
    setTaglineState(defaultTagline);
    applyTheme(defaultThemeId);
  }

  const value = useMemo(
    () => ({ themeId, logoIconId, siteName, tagline, setThemeId, setLogoIconId, setSiteName, setTagline, resetTheme }),
    [themeId, logoIconId, siteName, tagline],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used inside ThemeProvider.");
  return context;
}
