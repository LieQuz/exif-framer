"use client";

import { useRef, useState } from "react";
import { snapshotFiles } from "@/lib/files";
import { useI18n } from "@/lib/i18n/context";

type DropZoneProps = {
  onFilesSelect: (files: File[]) => void;
  disabled?: boolean;
};

/**
 * Cover the hit area with an opacity-0 file input so iOS Safari
 * receives the tap on the native control (label/sr-only is unreliable).
 */
export function DropZone({ onFilesSelect, disabled }: DropZoneProps) {
  const { t } = useI18n();
  const onFilesSelectRef = useRef(onFilesSelect);
  const [isDragging, setIsDragging] = useState(false);
  const [isReading, setIsReading] = useState(false);

  onFilesSelectRef.current = onFilesSelect;
  const busy = Boolean(disabled || isReading);

  const handleList = async (
    list: FileList | File[] | null | undefined,
    input?: HTMLInputElement | null,
  ) => {
    if (!list || list.length === 0) return;
    setIsReading(true);
    try {
      // Snapshot before clearing input — iOS can invalidate File blobs otherwise
      const copies = await snapshotFiles(list);
      if (input) input.value = "";
      onFilesSelectRef.current(copies);
    } catch {
      if (input) input.value = "";
      onFilesSelectRef.current([]);
    } finally {
      setIsReading(false);
    }
  };

  return (
    <div
      className={`relative block overflow-hidden rounded-2xl border-2 border-dashed transition-all duration-300 ${
        isDragging
          ? "border-stone-400 bg-white shadow-lg"
          : "border-stone-200 bg-white/60"
      } ${busy ? "pointer-events-none opacity-50" : ""}`}
      onDragOver={(e) => {
        e.preventDefault();
        if (!busy) setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragging(false);
        if (!busy) void handleList(e.dataTransfer.files);
      }}
    >
      <input
        type="file"
        accept="image/*"
        multiple
        disabled={busy}
        onChange={(e) => {
          void handleList(e.target.files, e.target);
        }}
        className="absolute inset-0 z-20 h-full w-full cursor-pointer opacity-0"
        style={{ fontSize: 16 }}
        aria-label={t("dropTitle")}
      />

      <div className="pointer-events-none flex min-h-[240px] flex-col items-center justify-center px-6 py-12 sm:min-h-[320px] sm:px-8 sm:py-16">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-stone-100 sm:h-14 sm:w-14">
          {isReading ? (
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-stone-300 border-t-stone-700" />
          ) : (
            <svg
              className="h-5 w-5 text-stone-500 sm:h-6 sm:w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
              />
            </svg>
          )}
        </div>
        <p className="text-center text-base font-medium text-stone-700">
          {isReading ? t("loading") : t("dropTitle")}
        </p>
        {!isReading && (
          <>
            <p className="mt-1 text-center text-sm text-stone-400">
              {t("dropHint")}
            </p>
            <p className="mt-2 text-center text-xs text-stone-400">
              {t("dropBatchHint")}
            </p>
            <p className="mt-4 text-center text-xs tracking-wide text-stone-400">
              {t("dropFormats")}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
