"use client";

import { useCallback, useEffect, useState } from "react";
import { BatchStrip } from "@/components/BatchStrip";
import { DropZone } from "@/components/DropZone";
import { Header } from "@/components/Header";
import { Preview } from "@/components/Preview";
import {
  MobileSheet,
  PropertiesPanel,
} from "@/components/PropertiesPanel";
import { DownloadIcon, LockIcon, SlidersIcon } from "@/components/ui/icons";
import { Toast, type ToastMessage } from "@/components/ui/Toast";
import {
  createBatchItem,
  downloadBlob,
  exportBatchZip,
  type BatchItem,
} from "@/lib/batch";
import { revokeImageUrl, type ExifData } from "@/lib/exif";
import {
  applyExportEffects,
  canvasToBlob,
  defaultFrameSettings,
  renderPolaroidFrame,
  settingsToFrameOptions,
  type FrameSettings,
} from "@/lib/frame";
import { loadFrameSettings, saveFrameSettings } from "@/lib/storage";
import { useI18n } from "@/lib/i18n/context";

function LandingSteps() {
  const { t } = useI18n();
  const steps = [
    { number: "01", title: t("stepUpload"), hint: t("stepUploadHint") },
    { number: "02", title: t("stepTune"), hint: t("stepTuneHint") },
    { number: "03", title: t("stepExport"), hint: t("stepExportHint") },
  ];

  return (
    <ol className="space-y-4">
      {steps.map((step) => (
        <li key={step.number} className="flex items-start gap-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-line bg-surface-raised font-mono text-xs text-ink-muted">
            {step.number}
          </span>
          <span className="min-w-0">
            <span className="block text-base font-medium text-ink">
              {step.title}
            </span>
            <span className="mt-1 block text-sm leading-6 text-ink-muted">
              {step.hint}
            </span>
          </span>
        </li>
      ))}
    </ol>
  );
}

function PrivacyNote({ className = "" }: { className?: string }) {
  const { t } = useI18n();

  return (
    <p
      className={`flex items-start gap-3 text-sm leading-6 text-ink-muted ${className}`}
    >
      <LockIcon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
      <span>{t("privacyNote")}</span>
    </p>
  );
}

export function FramerApp() {
  const { locale, t } = useI18n();

  const [items, setItems] = useState<BatchItem[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [canvas, setCanvas] = useState<HTMLCanvasElement | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState({ done: 0, total: 0 });
  const [settings, setSettings] = useState<FrameSettings>(defaultFrameSettings);
  const [settingsHydrated, setSettingsHydrated] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const activeItem = items.find((item) => item.id === activeId) ?? null;
  const editing = items.length > 0;

  const closeSheet = useCallback(() => setSheetOpen(false), []);
  const dismissToast = useCallback(() => setToast(null), []);
  const showToast = useCallback(
    (type: ToastMessage["type"], text: string) => {
      setToast({ id: Date.now(), type, text });
    },
    [],
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional client hydration
    setSettings(loadFrameSettings());
    setSettingsHydrated(true);
  }, []);

  useEffect(() => {
    if (!settingsHydrated) return;
    saveFrameSettings(settings);
  }, [settings, settingsHydrated]);

  const clearItems = useCallback((list: BatchItem[]) => {
    for (const item of list) revokeImageUrl(item.image);
  }, []);

  const handleFilesSelect = useCallback(
    async (files: File[]) => {
      if (files.length === 0) {
        setUploadError(t("uploadFailed"));
        showToast("error", t("uploadFailed"));
        return;
      }

      setIsLoading(true);
      setUploadError(null);

      try {
        const created: BatchItem[] = [];
        let failed = 0;

        for (const file of files) {
          try {
            const item = await createBatchItem(file);
            created.push(item);
            setItems((prev) => {
              if (prev.some((p) => p.id === item.id)) return prev;
              return [...prev, item];
            });
            setActiveId((prev) => prev ?? item.id);
          } catch {
            failed += 1;
          }
        }

        if (created.length === 0) {
          setUploadError(t("uploadFailed"));
          showToast("error", t("uploadFailed"));
        } else if (failed > 0) {
          showToast("error", t("someUploadsFailed"));
        }
      } catch {
        setUploadError(t("uploadFailed"));
        showToast("error", t("uploadFailed"));
      } finally {
        setIsLoading(false);
      }
    },
    [showToast, t],
  );

  const handleReset = useCallback(() => {
    setSheetOpen(false);
    setItems((prev) => {
      clearItems(prev);
      return [];
    });
    setActiveId(null);
    setCanvas(null);
    setUploadError(null);
  }, [clearItems]);

  const handleRemove = useCallback((id: string) => {
    setItems((prev) => {
      const target = prev.find((item) => item.id === id);
      if (target) revokeImageUrl(target.image);
      const next = prev.filter((item) => item.id !== id);
      setActiveId((current) => {
        if (current !== id) return current;
        return next[0]?.id ?? null;
      });
      if (next.length === 0) setCanvas(null);
      return next;
    });
  }, []);

  const handleExifChange = useCallback(
    (exif: ExifData) => {
      if (!activeId) return;
      setItems((prev) =>
        prev.map((item) =>
          item.id === activeId ? { ...item, exif } : item,
        ),
      );
    },
    [activeId],
  );

  useEffect(() => {
    if (!activeItem) return;

    let cancelled = false;

    renderPolaroidFrame(
      activeItem.image,
      activeItem.exif,
      settingsToFrameOptions(settings, t("shotOn")),
    )
      .then((result) => {
        if (!cancelled) setCanvas(result);
      })
      .catch(() => {
        if (!cancelled) setCanvas(null);
      });

    return () => {
      cancelled = true;
    };
  }, [activeItem, settings, t]);

  const handleDownloadOne = useCallback(async () => {
    if (!canvas || !activeItem) return;

    try {
      const exportCanvas = applyExportEffects(canvas, {
        cornerRadius: settings.cornerRadius,
        exportShadow: settings.exportShadow,
      });
      const blob = await canvasToBlob(
        exportCanvas,
        settings.exportFormat,
        settings.jpegQuality,
      );
      const ext = settings.exportFormat === "jpeg" ? "jpg" : "png";
      downloadBlob(blob, `${activeItem.filename}-framed.${ext}`);
      showToast("success", t("downloadStarted"));
    } catch {
      showToast("error", t("downloadFailed"));
    }
  }, [activeItem, canvas, settings, showToast, t]);

  const handleDownloadBatch = useCallback(async () => {
    if (items.length === 0) return;
    setIsExporting(true);
    setExportProgress({ done: 0, total: items.length });
    try {
      const blob = await exportBatchZip(
        items,
        settings,
        t("shotOn"),
        (done, total) => setExportProgress({ done, total }),
      );
      downloadBlob(blob, "exif-framer-batch.zip");
      showToast("success", t("batchDownloadStarted"));
    } catch {
      showToast("error", t("downloadFailed"));
    } finally {
      setIsExporting(false);
      setExportProgress({ done: 0, total: 0 });
    }
  }, [items, settings, showToast, t]);

  const downloadOneLabel =
    items.length > 1 ? t("downloadCurrent") : t("download");
  const exportLabel = isExporting
    ? `${t("batchExporting")} ${exportProgress.done}/${exportProgress.total}`
    : t("downloadBatch");

  const panelProps = {
    settings,
    onSettingsChange: setSettings,
    exif: activeItem?.exif ?? null,
    onExifChange: handleExifChange,
    onReset: handleReset,
    onDownloadOne: () => void handleDownloadOne(),
    onDownloadBatch: () => void handleDownloadBatch(),
    canDownload: Boolean(canvas),
    isExporting,
    exportLabel,
    showBatchDownload: items.length > 1,
    downloadOneLabel,
  };

  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:inline-flex focus:min-h-11 focus:items-center focus:rounded-xl focus:bg-primary focus:px-4 focus:text-sm focus:font-medium focus:text-surface-raised focus:shadow-action"
      >
        {t("skipToContent")}
      </a>

      {!editing && (
        <div className="relative flex min-h-dvh flex-col pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 overflow-hidden"
          >
            <div className="absolute -right-32 top-12 h-96 w-96 rounded-full bg-secondary/55 blur-3xl" />
            <div className="absolute -left-36 bottom-0 h-96 w-96 rounded-full bg-[#efe4d9]/75 blur-3xl" />
          </div>

          <div className="relative mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
            <Header />
          </div>

          <main
            id="main"
            tabIndex={-1}
            className="relative mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 pb-12 pt-8 focus:outline-none sm:px-6 sm:pb-16 sm:pt-14 lg:px-8 lg:pb-24 lg:pt-20"
          >
            <div className="grid flex-1 items-start gap-8 sm:gap-12 md:grid-cols-12 md:items-start md:gap-8 lg:items-center lg:gap-14">
              <div className="md:col-span-5">
                <span className="inline-flex items-center gap-2 rounded-full border border-line bg-surface-raised/90 px-3 py-1.5 font-mono text-xs uppercase tracking-[0.14em] text-ink-muted shadow-sm backdrop-blur">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  {t("studioLabel")}
                </span>

                <h1 className="mt-6 font-display text-[clamp(2.25rem,4.6vw,3.25rem)] font-semibold leading-[1.06] tracking-[-0.04em] text-ink">
                  {t("landingTitleLine1")}
                  {locale === "en" ? " " : ""}
                  <wbr />
                  <span className="inline-block whitespace-nowrap">
                    {t("landingTitleLine2")}
                  </span>
                </h1>

                <p className="mt-5 max-w-[46ch] text-base leading-8 text-ink-muted sm:text-lg">
                  {t("landingBody")}
                </p>

                <div className="mt-10 hidden md:block">
                  <LandingSteps />
                </div>

                <PrivacyNote className="mt-8 hidden md:flex" />
              </div>

              <div className="md:col-span-7">
                <DropZone
                  onFilesSelect={handleFilesSelect}
                  disabled={isLoading}
                />

                {isLoading && (
                  <p
                    aria-live="polite"
                    className="mt-4 text-center text-sm text-ink-muted"
                  >
                    {t("loading")}
                  </p>
                )}
                {uploadError && (
                  <p
                    role="alert"
                    className="mt-4 text-center text-sm text-danger"
                  >
                    {uploadError}
                  </p>
                )}

                <div className="mt-8 md:hidden">
                  <LandingSteps />
                  <PrivacyNote className="mt-6" />
                </div>
              </div>
            </div>
          </main>

          <footer className="relative mx-auto w-full max-w-6xl px-4 pb-8 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-2 border-t border-line pt-6 text-xs text-ink-muted sm:flex-row sm:items-center sm:justify-between">
              <p>
                {t("appTitle")} — {t("localOnly")}
              </p>
              <p className="font-mono uppercase tracking-[0.14em]">
                {t("dropFormats")}
              </p>
            </div>
          </footer>
        </div>
      )}

      {editing && (
        <div className="flex h-dvh flex-col overflow-hidden bg-surface pt-[env(safe-area-inset-top)] lg:px-4 lg:pb-4">
          <div className="mx-auto flex min-h-0 w-full max-w-[1440px] flex-1 flex-col overflow-hidden">
            <div className="px-4 sm:px-6 lg:px-0">
              <Header compact />
            </div>

            <main
              id="main"
              tabIndex={-1}
              className="flex min-h-0 flex-1 flex-col overflow-hidden focus:outline-none"
            >
              <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-surface-sunken lg:flex-row lg:rounded-[24px] lg:border lg:border-line lg:bg-surface-raised lg:shadow-panel">
                <section className="flex min-h-0 min-w-0 flex-1 flex-col lg:rounded-l-[24px]">
                  <div className="relative min-h-0 flex-1 basis-0">
                    <Preview
                      canvas={activeItem ? canvas : null}
                      isLoading={
                        isLoading || (!canvas && Boolean(activeItem))
                      }
                      cornerRadius={settings.cornerRadius}
                      previewShadow={settings.previewShadow}
                      title={activeItem?.filename ?? t("appTitle")}
                      meta={
                        activeItem
                          ? `${activeItem.image.naturalWidth} × ${activeItem.image.naturalHeight} px`
                          : undefined
                      }
                    />
                  </div>

                  <BatchStrip
                    items={items}
                    activeId={activeId ?? items[0].id}
                    onSelect={setActiveId}
                    onRemove={handleRemove}
                    onAddFiles={(files) => void handleFilesSelect(files)}
                  />

                  <div className="mobile-action-bar flex shrink-0 items-center gap-2 border-t border-line/80 bg-surface-raised px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:hidden">
                    <button
                      type="button"
                      onClick={() => setSheetOpen(true)}
                      aria-haspopup="dialog"
                      aria-expanded={sheetOpen}
                      className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl border border-control-border bg-surface-raised px-4 text-sm font-medium text-ink transition-colors hover:border-primary/40 hover:bg-secondary/40"
                    >
                      <SlidersIcon className="h-4 w-4" />
                      {t("edit")}
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDownloadOne()}
                      disabled={!canvas || isExporting}
                      className="inline-flex min-h-12 flex-[1.2] items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-medium text-surface-raised shadow-action transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <DownloadIcon className="h-4 w-4" />
                      {t("download")}
                    </button>
                  </div>
                </section>

                <aside className="hidden h-full w-[380px] shrink-0 flex-col border-l border-line/80 lg:flex xl:w-[420px]">
                  <PropertiesPanel {...panelProps} variant="sidebar" />
                </aside>
              </div>
            </main>
          </div>

          <MobileSheet open={sheetOpen} onClose={closeSheet}>
            <PropertiesPanel {...panelProps} variant="sheet" />
          </MobileSheet>
        </div>
      )}

      <Toast toast={toast} onClose={dismissToast} />
    </>
  );
}
