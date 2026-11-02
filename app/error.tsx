"use client";

import { useEffect } from "react";
import { AlertIcon } from "@/components/ui/icons";
import { useI18n } from "@/lib/i18n/context";

type ErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  const { t } = useI18n();

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-dvh items-center justify-center bg-surface px-4 py-16">
      <div className="w-full max-w-md rounded-[28px] border border-line bg-surface-raised p-8 text-center shadow-card">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-secondary text-primary">
          <AlertIcon className="h-6 w-6" />
        </span>
        <h1 className="mt-6 font-display text-2xl font-semibold tracking-tight text-ink">
          {t("errorTitle")}
        </h1>
        <p className="mt-3 text-base leading-7 text-ink-muted">
          {t("errorBody")}
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-6 inline-flex min-h-12 items-center justify-center rounded-xl bg-primary px-5 text-sm font-medium text-surface-raised shadow-action transition-colors hover:bg-primary-hover"
        >
          {t("retry")}
        </button>
      </div>
    </main>
  );
}
