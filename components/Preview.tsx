"use client";

import { useEffect, useMemo, useRef } from "react";
import { applyExportEffects } from "@/lib/frame";
import { useI18n } from "@/lib/i18n/context";

type PreviewProps = {
  canvas: HTMLCanvasElement | null;
  isLoading?: boolean;
  cornerRadius?: number;
  previewShadow?: boolean;
  title?: string;
  meta?: string;
};

export function Preview({
  canvas,
  isLoading,
  cornerRadius = 0,
  previewShadow = true,
  title,
  meta,
}: PreviewProps) {
  const { t } = useI18n();
  const displayRef = useRef<HTMLCanvasElement>(null);

  const displayCanvas = useMemo(() => {
    if (!canvas) return null;
    if (cornerRadius <= 0) return canvas;
    return applyExportEffects(canvas, {
      cornerRadius,
      exportShadow: false,
    });
  }, [canvas, cornerRadius]);

  useEffect(() => {
    const node = displayRef.current;
    if (!node || !displayCanvas) return;

    node.width = displayCanvas.width;
    node.height = displayCanvas.height;
    const ctx = node.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, node.width, node.height);
    ctx.drawImage(displayCanvas, 0, 0);
  }, [displayCanvas]);

  if (!canvas && !isLoading) return null;

  return (
    <div className="preview-backdrop fade-in relative flex h-full w-full items-center justify-center overflow-hidden px-4 pb-5 pt-16 sm:px-8 sm:pb-8 md:px-10 md:pb-10">
      {title && (
        <div className="absolute inset-x-4 top-4 z-10 flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2 rounded-full border border-line bg-surface-raised/90 px-3 py-2 shadow-sm backdrop-blur">
            <span
              aria-hidden="true"
              className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary"
            />
            <h1 className="truncate text-sm font-medium text-ink">{title}</h1>
          </div>
          {meta && (
            <span className="hidden shrink-0 font-mono text-xs text-ink-muted sm:inline">
              {meta}
            </span>
          )}
        </div>
      )}

      {isLoading ? (
        <div className="flex h-full w-full items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-line border-t-primary" />
        </div>
      ) : (
        <canvas
          ref={displayRef}
          role="img"
          aria-label={`${title ? `${title} — ` : ""}${t("previewLabel")}`}
          className="h-full w-full object-contain"
          style={{
            filter: previewShadow
              ? "drop-shadow(0 26px 44px rgba(62, 43, 30, 0.24))"
              : "none",
          }}
        />
      )}
    </div>
  );
}
