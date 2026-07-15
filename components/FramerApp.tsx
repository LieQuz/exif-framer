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
  const [settings, setSettings] = useState<FrameSettings>(defaultFrameSettings);
  const [settingsHydrated, setSettingsHydrated] = useState(false);

  const activeItem = items.find((item) => item.id === activeId) ?? null;
  const editing = items.length > 0;

  // Hydrate from localStorage after mount (same defaults on server/client first)
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

  const handleFilesSelect = useCallback(async (files: File[]) => {
    setIsLoading(true);
    try {
      const created = await Promise.all(files.map((f) => createBatchItem(f)));
      setItems((prev) => [...prev, ...created]);
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

  if (!editing) {
    return (
      <div className="flex min-h-dvh flex-col">
        <Header />
        <main className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center px-6 pb-12">
          <div className="fade-in">
            <DropZone onFilesSelect={handleFilesSelect} disabled={isLoading} />
            <p className="mt-6 text-center text-xs text-stone-400">
              {t("privacyNote")}
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-[#E8E4DE] px-3 pb-3 pt-0 sm:px-4 sm:pb-4">
      <Header compact />
      <div className="fade-in flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-stone-200/80 bg-[#FAF8F5] shadow-sm md:flex-row">
        {/* Canvas / filmstrip — Lightroom-style main stage */}
        <section className="flex min-h-[45vh] min-w-0 flex-1 flex-col bg-[#EDE9E3] md:min-h-0 md:rounded-l-xl">
          <div className="relative min-h-0 flex-1">
            <Preview
              canvas={activeItem ? canvas : null}
              isLoading={isLoading}
              cornerRadius={settings.cornerRadius}
              previewShadow={settings.previewShadow}
            />
          </div>
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
        </section>

        {/* Right properties panel */}
        <aside className="flex max-h-[55vh] w-full shrink-0 flex-col border-t border-stone-200 bg-[#FAF8F5] md:max-h-none md:w-[340px] md:rounded-r-xl md:border-t-0 md:border-l lg:w-[380px]">
          <div className="flex items-center justify-between border-b border-stone-200/80 px-5 py-3 sm:px-6">
            <span className="text-xs font-medium uppercase tracking-wider text-stone-400">
              {t("properties")}
            </span>
            <button
              type="button"
              onClick={handleReset}
              className="text-xs text-stone-400 transition-colors hover:text-stone-600"
            >
              {t("changeImage")}
            </button>
          </div>

          <div className="min-h-0 flex-1 space-y-8 overflow-y-auto px-5 py-5 sm:px-6">
            <FrameControls settings={settings} onChange={setSettings} />
            {activeItem && (
              <ExifEditor
                data={activeItem.exif}
                onChange={handleExifChange}
                showNoExifWarning={!hasExifData(activeItem.exif)}
              />
            )}
          </div>

          <div className="shrink-0 space-y-2 border-t border-stone-200/80 bg-[#FAF8F5] px-5 py-4 sm:px-6">
            <DownloadButton
              onClick={handleDownloadOne}
              disabled={!canvas || isExporting}
              label={items.length > 1 ? t("downloadCurrent") : t("download")}
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
        </aside>
      </div>
    </div>
  );
}
