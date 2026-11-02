"use client";

import { ApertureIcon, LockIcon } from "@/components/ui/icons";
import { useI18n } from "@/lib/i18n/context";

type HeaderProps = {
  compact?: boolean;
  className?: string;
};

export function Header({ compact = false, className = "" }: HeaderProps) {
  const { locale, setLocale, t } = useI18n();

  return (
    <header
      className={`flex items-center justify-between gap-3 border-b border-line/70 ${
        compact ? "py-2" : "py-4"
      } ${className}`}
    >
      <div className="flex min-w-0 items-center gap-3">
        <span
          aria-hidden="true"
          className={`flex shrink-0 items-center justify-center rounded-2xl bg-primary text-surface-raised shadow-soft ${
            compact ? "h-10 w-10" : "h-12 w-12"
          }`}
        >
          <ApertureIcon className={compact ? "h-5 w-5" : "h-6 w-6"} />
        </span>

        <div className="min-w-0">
          <p
            className={`font-display font-semibold tracking-tight text-ink ${
              compact ? "text-base" : "text-xl"
            }`}
          >
            {t("appTitle")}
          </p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <span className="hidden items-center gap-1.5 rounded-full border border-line bg-surface-raised/80 px-3 py-2 text-xs font-medium text-ink-muted sm:inline-flex">
          <LockIcon className="h-3.5 w-3.5 text-primary" />
          {t("localOnly")}
        </span>

        <div className="flex rounded-full border border-control-border bg-surface-raised p-1 shadow-sm">
          {(["ja", "en"] as const).map((code) => (
            <button
              key={code}
              type="button"
              aria-pressed={locale === code}
              onClick={() => setLocale(code)}
              className={`min-h-11 min-w-11 rounded-full px-3 text-xs font-semibold transition-colors ${
                locale === code
                  ? "bg-primary text-surface-raised"
                  : "text-ink-muted hover:bg-secondary/60 hover:text-ink"
              }`}
            >
              {code.toUpperCase()}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}
