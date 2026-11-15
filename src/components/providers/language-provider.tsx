"use client";

import * as React from "react";
import { translate, type Locale, type TranslationKey } from "@/lib/i18n";

interface LanguageContextValue {
  locale: Locale;
  dir: "rtl" | "ltr";
  t: (key: TranslationKey) => string;
  setLocale: (locale: Locale) => void;
  toggleLocale: () => void;
}

const LanguageContext = React.createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = React.useState<Locale>("ar");

  React.useEffect(() => {
    const stored = (localStorage.getItem("tectnal:locale") as Locale | null) ?? "ar";
    setLocaleState(stored);
  }, []);

  const apply = React.useCallback((next: Locale) => {
    setLocaleState(next);
    localStorage.setItem("tectnal:locale", next);
    document.documentElement.lang = next;
    document.documentElement.dir = next === "ar" ? "rtl" : "ltr";
  }, []);

  const value = React.useMemo<LanguageContextValue>(
    () => ({
      locale,
      dir: locale === "ar" ? "rtl" : "ltr",
      t: (key) => translate(locale, key),
      setLocale: apply,
      toggleLocale: () => apply(locale === "ar" ? "en" : "ar"),
    }),
    [locale, apply],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useI18n() {
  const context = React.useContext(LanguageContext);
  if (!context) throw new Error("useI18n must be used inside <LanguageProvider>");
  return context;
}
