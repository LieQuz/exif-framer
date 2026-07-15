"use client";

import { useI18n } from "@/lib/i18n/context";

type HeaderProps = {
  compact?: boolean;
};

export function Header({ compact = false }: HeaderProps) {
  const { locale, setLocale, t } = useI18n();

  return (
    <header
      className={`flex shrink-0 items-center justify-between border-b border-stone-200/80 bg-transparent ${
        compact ? "px-5 py-2.5 sm:px-6" : "px-6 py-5 md:px-10"
      }`}
    >
      <div className={compact ? "min-w-0" : undefined}>
        <h1
          className={`font-medium tracking-tight text-stone-800 ${compact ? "text-sm" : "text-lg"}`}
        >
          {t("appTitle")}
        </h1>
        {!compact && (
          <p className="mt-0.5 text-sm text-stone-500">{t("appSubtitle")}</p>
        )}
      </div>
      <div className="flex rounded-full border border-stone-200 bg-white p-0.5 text-xs font-medium shadow-sm">
        <button
          type="button"
          onClick={() => setLocale("ja")}
          className={`rounded-full px-3 py-1.5 transition-colors ${
            locale === "ja"
              ? "bg-stone-800 text-white"
              : "text-stone-500 hover:text-stone-800"
          }`}
        >
          JA
        </button>
        <button
          type="button"
          onClick={() => setLocale("en")}
          className={`rounded-full px-3 py-1.5 transition-colors ${
            locale === "en"
              ? "bg-stone-800 text-white"
              : "text-stone-500 hover:text-stone-800"
          }`}
        >
          EN
        </button>
      </div>
    </header>
  );
}
