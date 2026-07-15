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
import {
  createBatchItem,
  downloadBlob,
  exportBatchZip,
  type BatchItem,
} from "@/lib/batch";
import { revokeImageUrl, type ExifData } from "@/lib/exif";
import {
  applyExportEffects,
  defaultFrameSettings,
  downloadCanvas,
  renderPolaroidFrame,
  settingsToFrameOptions,
  type FrameSettings,
} from "@/lib/frame";
import { loadFrameSettings, saveFrameSettings } from "@/lib/storage";
import { useI18n } from "@/lib/i18n/context";

export function FramerApp() {
  const { t } = useI18n();

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

  const activeItem = items.find((item) => item.id === activeId) ?? null;
  const editing = items.length > 0;

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
        return;
      }

      setIsLoading(true);
      setUploadError(null);

      try {
        const created: BatchItem[] = [];
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
            // try next file
          }
        }

        if (created.length === 0) {
          setUploadError(t("uploadFailed"));
        }
      } catch {
        setUploadError(t("uploadFailed"));
      } finally {
        setIsLoading(false);
      }
    },
    [t],
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

  const handleDownloadOne = useCallback(() => {
    if (!canvas || !activeItem) return;
    const exportCanvas = applyExportEffects(canvas, {
      cornerRadius: settings.cornerRadius,
      exportShadow: settings.exportShadow,
    });
    const ext = settings.exportFormat === "jpeg" ? "jpg" : "png";
    downloadCanvas(
      exportCanvas,
      `${activeItem.filename}-framed.${ext}`,
      settings.exportFormat,
      settings.jpegQuality,
    );
  }, [activeItem, canvas, settings]);

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
      downloadBlob(blob, `exif-framer-batch.zip`);
    } finally {
      setIsExporting(false);
      setExportProgress({ done: 0, total: 0 });
    }
  }, [items, settings, t]);

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
    onDownloadOne: handleDownloadOne,
    onDownloadBatch: () => void handleDownloadBatch(),
    canDownload: Boolean(canvas),
    isExporting,
    exportLabel,
    showBatchDownload: items.length > 1,
    downloadOneLabel,
  };

  return (
    <>
      <div
        className={
          editing
            ? "hidden"
            : "flex min-h-dvh flex-col pb-[env(safe-area-inset-bottom)]"
        }
        aria-hidden={editing}
      >
        <Header />
        <main className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center px-5 pb-10 sm:px-6">
          <div className="fade-in">
            <DropZone
              onFilesSelect={handleFilesSelect}
              disabled={isLoading}
            />
            {isLoading && (
              <p className="mt-4 text-center text-sm text-stone-500">
                {t("loading")}
              </p>
            )}
            {uploadError && (
              <p className="mt-4 text-center text-sm text-red-600">
                {uploadError}
              </p>
            )}
            <p className="mt-6 text-center text-xs leading-relaxed text-stone-400">
              {t("privacyNote")}
            </p>
          </div>
        </main>
      </div>

      {editing && (
        <div className="flex h-dvh flex-col overflow-hidden bg-[#E8E4DE] pt-[env(safe-area-inset-top)] md:px-4 md:pb-4">
          <Header compact />

          <div className="flex min-h-0 flex-1 flex-col overflow-hidden md:flex-row md:rounded-xl md:border md:border-stone-200/80 md:bg-[#FAF8F5] md:shadow-sm">
            <section className="flex min-h-0 min-w-0 flex-1 flex-col bg-[#EDE9E3] md:rounded-l-xl">
              <div className="relative min-h-0 flex-1 basis-0">
                <Preview
                  canvas={activeItem ? canvas : null}
                  isLoading={isLoading || (!canvas && Boolean(activeItem))}
                  cornerRadius={settings.cornerRadius}
                  previewShadow={settings.previewShadow}
                />
              </div>

              <BatchStrip
                items={items}
                activeId={activeId ?? items[0].id}
                onSelect={setActiveId}
                onRemove={handleRemove}
                onAddFiles={(files) => void handleFilesSelect(files)}
              />

              <div className="flex shrink-0 items-center gap-2 border-t border-stone-200/80 bg-[#FAF8F5] px-3 py-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom))] md:hidden">
                <button
                  type="button"
                  onClick={() => setSheetOpen(true)}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-stone-300 bg-white px-4 py-3 text-sm font-medium text-stone-800"
                >
                  {t("edit")}
                </button>
                <button
                  type="button"
                  onClick={handleDownloadOne}
                  disabled={!canvas || isExporting}
                  className="inline-flex flex-[1.2] items-center justify-center gap-2 rounded-full bg-stone-800 px-4 py-3 text-sm font-medium text-white disabled:opacity-40"
                >
                  {t("download")}
                </button>
              </div>
            </section>

            <aside className="hidden h-full w-[340px] shrink-0 flex-col border-l border-stone-200 md:flex lg:w-[380px]">
              <PropertiesPanel {...panelProps} variant="sidebar" />
            </aside>
          </div>

          <MobileSheet open={sheetOpen} onClose={() => setSheetOpen(false)}>
            <PropertiesPanel {...panelProps} variant="sheet" />
          </MobileSheet>
        </div>
      )}
    </>
  );
}
