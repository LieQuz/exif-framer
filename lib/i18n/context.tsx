"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { loadLocale, saveLocale, type StoredLocale } from "@/lib/storage";
import en from "./en.json";
import ja from "./ja.json";

export type Locale = StoredLocale;

const messages: Record<Locale, Record<string, string>> = { ja, en };

type I18nContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  // Always start with the same default on server + client to avoid hydration loops
  const [locale, setLocaleState] = useState<Locale>("ja");

  useEffect(() => {
    const stored = loadLocale("ja");
    if (stored !== "ja") {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional client hydration
      setLocaleState(stored);
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    saveLocale(next);
  }, []);

  const t = useCallback(
    (key: string) => messages[locale][key] ?? key,
    [locale],
  );

  const value = useMemo(
    () => ({ locale, setLocale, t }),
    [locale, setLocale, t],
  );

  return (
    <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used within I18nProvider");
  }
  return context;
}
