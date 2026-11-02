"use client";

import { useEffect, useId, useRef, useState } from "react";
import { CameraIcon, UploadIcon } from "@/components/ui/icons";
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
  const hintId = useId();
  const onFilesSelectRef = useRef(onFilesSelect);
  const [isDragging, setIsDragging] = useState(false);
  const [isReading, setIsReading] = useState(false);

  useEffect(() => {
    onFilesSelectRef.current = onFilesSelect;
  }, [onFilesSelect]);

  const busy = Boolean(disabled || isReading);
  const formats = t("dropFormats")
    .split("·")
    .map((format) => format.trim())
    .filter(Boolean);

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
      aria-busy={isReading}
      className={`group relative overflow-hidden rounded-[28px] border bg-surface-raised p-2 shadow-card transition-all duration-300 focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 focus-within:ring-offset-surface ${
        isDragging ? "border-primary" : "border-line"
      } ${busy ? "pointer-events-none opacity-60" : ""}`}
      onDragOver={(event) => {
        event.preventDefault();
        if (!busy) setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(event) => {
        event.preventDefault();
        setIsDragging(false);
        if (!busy) void handleList(event.dataTransfer.files);
      }}
    >
      <input
        type="file"
        accept="image/*"
        multiple
        disabled={busy}
        onChange={(event) => {
          void handleList(event.target.files, event.target);
        }}
        className="absolute inset-0 z-20 h-full w-full cursor-pointer opacity-0"
        style={{ fontSize: 16 }}
        aria-label={t("dropTitle")}
        aria-describedby={hintId}
      />

      <div
        className={`relative flex min-h-[320px] flex-col items-center justify-center rounded-[22px] border border-dashed px-6 pb-10 pt-14 text-center transition-colors sm:min-h-[380px] sm:px-10 ${
          isDragging
            ? "border-primary/50 bg-secondary/35"
            : "border-control-border/60 bg-surface/60 group-hover:border-primary/40 group-hover:bg-secondary/20"
        }`}
      >
        <span className="pointer-events-none absolute left-5 top-4 flex items-center gap-2 font-mono text-xs uppercase tracking-[0.14em] text-ink-muted">
          <span className="text-primary">01</span>
          <span className="h-px w-4 bg-control-border/60" />
          <span>{t("stepUpload")}</span>
        </span>

        <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-secondary/70 text-primary ring-1 ring-line">
          {isReading ? (
            <div className="h-7 w-7 animate-spin rounded-full border-2 border-line border-t-primary" />
          ) : (
            <UploadIcon className="h-7 w-7" />
          )}
          {!isReading && (
            <span className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-surface-raised shadow-sm">
              <CameraIcon className="h-4 w-4" />
            </span>
          )}
        </div>

        <p className="mt-6 font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
          {isReading ? t("loading") : t("dropTitle")}
        </p>

        {!isReading && (
          <>
            <div id={hintId} className="mt-3 space-y-1">
              <p className="text-base leading-7 text-ink-muted">
                {t("dropHint")}
              </p>
              <p className="text-sm leading-6 text-ink-muted">
                {t("dropBatchHint")}
              </p>
            </div>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              {formats.map((format) => (
                <span
                  key={format}
                  className="rounded-full border border-line bg-surface-raised px-3 py-1.5 font-mono text-xs tracking-[0.12em] text-ink-muted"
                >
                  {format}
                </span>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
