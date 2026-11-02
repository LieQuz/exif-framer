"use client";

import { DownloadIcon } from "@/components/ui/icons";
import { useI18n } from "@/lib/i18n/context";

type DownloadButtonProps = {
  onClick: () => void;
  disabled?: boolean;
  label?: string;
  variant?: "primary" | "secondary";
  className?: string;
};

export function DownloadButton({
  onClick,
  disabled,
  label,
  variant = "primary",
  className = "",
}: DownloadButtonProps) {
  const { t } = useI18n();

  const variantClass =
    variant === "secondary"
      ? "border border-control-border bg-surface-raised text-ink hover:border-primary/40 hover:bg-secondary/40"
      : "bg-primary text-surface-raised shadow-action hover:bg-primary-hover";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl px-5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${variantClass} ${className}`}
    >
      <DownloadIcon className="h-4 w-4" />
      {label ?? t("download")}
    </button>
  );
}
