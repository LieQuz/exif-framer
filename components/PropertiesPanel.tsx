"use client";

import { useEffect } from "react";
import { DownloadButton } from "@/components/DownloadButton";
import { ExifEditor } from "@/components/ExifEditor";
import { FrameControls } from "@/components/FrameControls";
import { hasExifData, type ExifData } from "@/lib/exif";
import type { FrameSettings } from "@/lib/frame";
import { useI18n } from "@/lib/i18n/context";

type PropertiesPanelProps = {
  settings: FrameSettings;
  onSettingsChange: (settings: FrameSettings) => void;
  exif: ExifData | null;
  onExifChange: (exif: ExifData) => void;
  onReset: () => void;
  onDownloadOne: () => void;
  onDownloadBatch?: () => void;
  canDownload: boolean;
  isExporting: boolean;
  exportLabel?: string;
  showBatchDownload: boolean;
  downloadOneLabel: string;
  /** Desktop: static sidebar. Mobile sheet: overlay content only */
  variant?: "sidebar" | "sheet";
};

export function PropertiesPanel({
  settings,
  onSettingsChange,
  exif,
  onExifChange,
  onReset,
  onDownloadOne,
  onDownloadBatch,
  canDownload,
  isExporting,
  exportLabel,
  showBatchDownload,
  downloadOneLabel,
  variant = "sidebar",
}: PropertiesPanelProps) {
  const { t } = useI18n();
  const isSheet = variant === "sheet";

  return (
    <div
      className={`flex flex-col bg-[#FAF8F5] ${
        isSheet ? "max-h-[min(85dvh,720px)]" : "h-full"
      }`}
    >
      <div className="relative flex shrink-0 items-center justify-between border-b border-stone-200/80 px-5 py-3 pt-4">
        {isSheet && (
          <div className="absolute left-1/2 top-2 h-1 w-10 -translate-x-1/2 rounded-full bg-stone-300" />
        )}
        <span className="text-xs font-medium uppercase tracking-wider text-stone-400">
          {t("properties")}
        </span>
        <button
          type="button"
          onClick={onReset}
          className="text-xs text-stone-400 transition-colors hover:text-stone-600"
        >
          {t("changeImage")}
        </button>
      </div>

      <div className="min-h-0 flex-1 space-y-8 overflow-y-auto overscroll-contain px-5 py-5 pb-6">
        <FrameControls settings={settings} onChange={onSettingsChange} />
        {exif && (
          <ExifEditor
            data={exif}
            onChange={onExifChange}
            showNoExifWarning={!hasExifData(exif)}
          />
        )}
      </div>

      <div className="shrink-0 space-y-2 border-t border-stone-200/80 bg-[#FAF8F5] px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <DownloadButton
          onClick={onDownloadOne}
          disabled={!canDownload || isExporting}
          label={downloadOneLabel}
        />
        {showBatchDownload && onDownloadBatch && (
          <DownloadButton
            onClick={onDownloadBatch}
            disabled={isExporting}
            label={exportLabel ?? t("downloadBatch")}
          />
        )}
      </div>
    </div>
  );
}

type MobileSheetProps = {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
};

export function MobileSheet({ open, onClose, children }: MobileSheetProps) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      <button
        type="button"
        className="absolute inset-0 bg-black/35"
        aria-label="Close"
        onClick={onClose}
      />
      <div className="absolute inset-x-0 bottom-0 animate-[slide-up_0.28s_ease-out] overflow-hidden rounded-t-2xl border border-stone-200 bg-[#FAF8F5] shadow-2xl">
        {children}
      </div>
    </div>
  );
}
