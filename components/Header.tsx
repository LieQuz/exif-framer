"use client";

import { useI18n } from "@/lib/i18n/context";

export function Header() {
  const { locale, setLocale, t } = useI18n();

  return (
    <header className="flex items-center justify-between px-6 py-5 md:px-10">
      <div>
        <h1 className="text-lg font-medium tracking-tight text-stone-800">
          {t("appTitle")}
        </h1>
        <p className="mt-0.5 text-sm text-stone-500">{t("appSubtitle")}</p>
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
