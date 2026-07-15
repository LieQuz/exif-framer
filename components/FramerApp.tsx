"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { BatchStrip } from "@/components/BatchStrip";
import { DownloadButton } from "@/components/DownloadButton";
import { DropZone } from "@/components/DropZone";
import { ExifEditor } from "@/components/ExifEditor";
import { FrameControls } from "@/components/FrameControls";
import { Header } from "@/components/Header";
import { Preview } from "@/components/Preview";
import {
  createBatchItem,
  downloadBlob,
  exportBatchZip,
  type BatchItem,
} from "@/lib/batch";
import { hasExifData, revokeImageUrl, type ExifData } from "@/lib/exif";
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
  const addInputRef = useRef<HTMLInputElement>(null);

  const [items, setItems] = useState<BatchItem[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [canvas, setCanvas] = useState<HTMLCanvasElement | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState({ done: 0, total: 0 });
  const [settings, setSettings] = useState<FrameSettings>(() => {
    if (typeof window === "undefined") return defaultFrameSettings();
    return loadFrameSettings();
  });

  const activeItem = items.find((item) => item.id === activeId) ?? null;

  useEffect(() => {
    saveFrameSettings(settings);
  }, [settings]);

  const clearItems = useCallback((list: BatchItem[]) => {
    for (const item of list) revokeImageUrl(item.image);
  }, []);

  const handleFilesSelect = useCallback(async (files: File[]) => {
    setIsLoading(true);
    try {
      const created = await Promise.all(files.map((f) => createBatchItem(f)));
      setItems((prev) => {
        const next = [...prev, ...created];
        return next;
      });
      setActiveId((prev) => prev ?? created[0]?.id ?? null);
    } catch {
      // Keep existing items on failure
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleReset = useCallback(() => {
    setItems((prev) => {
      clearItems(prev);
      return [];
    });
    setActiveId(null);
    setCanvas(null);
  }, [clearItems]);

  const handleRemove = useCallback(
    (id: string) => {
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
    },
    [],
  );

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

  return (
    <div className="flex min-h-full flex-col">
      <Header />
      <main className="mx-auto w-full max-w-4xl flex-1 px-6 pb-12 md:px-10">
        {items.length === 0 ? (
          <div className="fade-in mx-auto max-w-lg">
            <DropZone onFilesSelect={handleFilesSelect} disabled={isLoading} />
            <p className="mt-6 text-center text-xs text-stone-400">
              {t("privacyNote")}
            </p>
          </div>
        ) : (
          <div className="fade-in grid gap-10 lg:grid-cols-[1fr_1fr] lg:items-start">
            <div className="flex flex-col items-center gap-4 lg:sticky lg:top-6">
              <Preview
                canvas={activeItem ? canvas : null}
                isLoading={isLoading}
                cornerRadius={settings.cornerRadius}
                previewShadow={settings.previewShadow}
              />
              <BatchStrip
                items={items}
                activeId={activeId ?? items[0].id}
                onSelect={setActiveId}
                onRemove={handleRemove}
                onAddMore={() => addInputRef.current?.click()}
              />
              <input
                ref={addInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.length) {
                    void handleFilesSelect(Array.from(e.target.files));
                  }
                  e.target.value = "";
                }}
              />
              <button
                type="button"
                onClick={handleReset}
                className="text-sm text-stone-400 transition-colors hover:text-stone-600"
              >
                {t("changeImage")}
              </button>
            </div>
            <div className="space-y-8">
              <FrameControls settings={settings} onChange={setSettings} />
              {activeItem && (
                <ExifEditor
                  data={activeItem.exif}
                  onChange={handleExifChange}
                  showNoExifWarning={!hasExifData(activeItem.exif)}
                />
              )}
              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <DownloadButton
                  onClick={handleDownloadOne}
                  disabled={!canvas || isExporting}
                  label={
                    items.length > 1 ? t("downloadCurrent") : t("download")
                  }
                />
                {items.length > 1 && (
                  <DownloadButton
                    onClick={() => void handleDownloadBatch()}
                    disabled={isExporting}
                    label={
                      isExporting
                        ? `${t("batchExporting")} ${exportProgress.done}/${exportProgress.total}`
                        : t("downloadBatch")
                    }
                  />
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
