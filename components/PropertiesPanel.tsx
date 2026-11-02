"use client";

import { useEffect, useId, useRef, useState } from "react";
import { DownloadButton } from "@/components/DownloadButton";
import { ExifEditor } from "@/components/ExifEditor";
import { ExportSettings } from "@/components/inspector/ExportSettings";
import { FrameSettings } from "@/components/inspector/FrameSettings";
import { TextSettings } from "@/components/inspector/TextSettings";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { Tabs, type TabItem } from "@/components/ui/Tabs";
import { hasExifData, type ExifData } from "@/lib/exif";
import type { FrameSettings as FrameSettingsType } from "@/lib/frame";
import { useI18n } from "@/lib/i18n/context";

type SettingsTab = "frame" | "text" | "camera" | "export";

type PropertiesPanelProps = {
  settings: FrameSettingsType;
  onSettingsChange: (settings: FrameSettingsType) => void;
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
  const [tab, setTab] = useState<SettingsTab>("frame");
  const idPrefix = useId();
  const scrollRef = useRef<HTMLDivElement>(null);

  const tabs: readonly TabItem<SettingsTab>[] = [
    { id: "frame", label: t("tabFrame") },
    { id: "text", label: t("tabText") },
    { id: "camera", label: t("tabCamera") },
    { id: "export", label: t("tabExport") },
  ];

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0, behavior: "auto" });
  }, [tab]);

  const outputSummary = `${settings.exportFormat.toUpperCase()}${
    settings.exportFormat === "jpeg"
      ? ` · ${Math.round(settings.jpegQuality * 100)}%`
      : ""
  }`;

  return (
    <div
      className={`flex flex-col bg-surface-raised ${
        isSheet ? "max-h-[min(88dvh,760px)]" : "h-full"
      }`}
    >
      <div className="relative flex shrink-0 items-center justify-between gap-3 border-b border-line/80 px-4 pb-3 pt-4">
        {isSheet && (
          <div className="absolute left-1/2 top-2 h-1 w-10 -translate-x-1/2 rounded-full bg-line" />
        )}
        <SectionLabel>{t("properties")}</SectionLabel>
        <button
          type="button"
          onClick={onReset}
          aria-label={t("changeImage")}
          className="inline-flex min-h-11 items-center rounded-full px-3 text-xs font-medium text-ink-muted transition-colors hover:bg-secondary/60 hover:text-ink"
        >
          {t("changeImage")}
        </button>
      </div>

      <div className="shrink-0 px-4 pt-3">
        <Tabs
          items={tabs}
          value={tab}
          onChange={setTab}
          ariaLabel={t("properties")}
          idPrefix={idPrefix}
        />
      </div>

      <div className="relative min-h-0 flex-1">
        <div
          ref={scrollRef}
          className="panel-scroll h-full overflow-y-auto overscroll-contain px-4 py-5 pb-10"
        >
          <div
            role="tabpanel"
            id={`${idPrefix}-panel-frame`}
            aria-labelledby={`${idPrefix}-tab-frame`}
            hidden={tab !== "frame"}
          >
            <FrameSettings settings={settings} onChange={onSettingsChange} />
          </div>

          <div
            role="tabpanel"
            id={`${idPrefix}-panel-text`}
            aria-labelledby={`${idPrefix}-tab-text`}
            hidden={tab !== "text"}
          >
            <TextSettings settings={settings} onChange={onSettingsChange} />
          </div>

          <div
            role="tabpanel"
            id={`${idPrefix}-panel-camera`}
            aria-labelledby={`${idPrefix}-tab-camera`}
            hidden={tab !== "camera"}
          >
            {exif ? (
              <ExifEditor
                data={exif}
                onChange={onExifChange}
                showNoExifWarning={!hasExifData(exif)}
              />
            ) : (
              <p className="text-sm leading-6 text-ink-muted">
                {t("noImageSelected")}
              </p>
            )}
          </div>

          <div
            role="tabpanel"
            id={`${idPrefix}-panel-export`}
            aria-labelledby={`${idPrefix}-tab-export`}
            hidden={tab !== "export"}
          >
            <ExportSettings settings={settings} onChange={onSettingsChange} />
          </div>
        </div>

        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-surface-raised to-transparent"
        />
      </div>

      <div className="shrink-0 border-t border-line/80 bg-surface-raised px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="mb-2 flex items-center justify-between gap-3 text-xs text-ink-muted">
          <span className="font-mono uppercase tracking-[0.14em]">
            {t("output")}
          </span>
          <span className="font-mono tabular-nums">{outputSummary}</span>
        </div>
        <div className="space-y-2">
          <DownloadButton
            onClick={onDownloadOne}
            disabled={!canDownload || isExporting}
            label={downloadOneLabel}
            variant="primary"
          />
          {showBatchDownload && onDownloadBatch && (
            <DownloadButton
              onClick={onDownloadBatch}
              disabled={isExporting}
              label={exportLabel ?? t("downloadBatch")}
              variant="secondary"
            />
          )}
        </div>
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
  const { t } = useI18n();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const mq = window.matchMedia("(min-width: 768px)");
    const closeOnDesktop = () => {
      if (mq.matches) onClose();
    };
    mq.addEventListener("change", closeOnDesktop);
    closeOnDesktop();
    return () => mq.removeEventListener("change", closeOnDesktop);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const panel = panelRef.current;
    const previousFocus =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panel?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      if (event.key !== "Tab" || !panel) return;

      const focusables = panel.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (focusables.length === 0) return;

      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (
        event.shiftKey &&
        (document.activeElement === first || document.activeElement === panel)
      ) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKeyDown);
      previousFocus?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      <button
        type="button"
        className="absolute inset-0 bg-ink/25 backdrop-blur-[2px]"
        aria-label={t("close")}
        onClick={onClose}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={t("properties")}
        tabIndex={-1}
        className="sheet-enter shadow-sheet absolute inset-x-0 bottom-0 overflow-hidden rounded-t-[28px] border border-line bg-surface-raised outline-none"
      >
        {children}
      </div>
    </div>
  );
}
