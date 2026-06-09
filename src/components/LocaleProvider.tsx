"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { createTranslator, type Translator } from "@/lib/i18n";
import { defaultLocale, isLocale, localeStorageKey, resolveLocale, type Locale } from "@/lib/i18n/locales";

type LocaleContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: Translator;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

function applyLocale(locale: Locale) {
  document.documentElement.lang = locale;
}

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(defaultLocale);

  useEffect(() => {
    const saved = window.localStorage.getItem(localeStorageKey);
    const nextLocale = resolveLocale(saved);
    setLocaleState(nextLocale);
    applyLocale(nextLocale);
  }, []);

  function setLocale(nextLocale: Locale) {
    window.localStorage.setItem(localeStorageKey, nextLocale);
    setLocaleState(nextLocale);
    applyLocale(nextLocale);
  }

  const t = useMemo(() => createTranslator(locale), [locale]);

  const value = useMemo(() => ({ locale, setLocale, t }), [locale, t]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (!context) throw new Error("useLocale must be used inside LocaleProvider.");
  return context;
}

export function useTranslation() {
  const { locale, setLocale, t } = useLocale();
  return { locale, setLocale, t };
}

export { isLocale, localeStorageKey };
