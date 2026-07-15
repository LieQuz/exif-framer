"use client";

import { useEffect, useMemo, useRef } from "react";
import { applyExportEffects } from "@/lib/frame";

type PreviewProps = {
  canvas: HTMLCanvasElement | null;
  isLoading?: boolean;
  cornerRadius?: number;
  previewShadow?: boolean;
};

export function Preview({
  canvas,
  isLoading,
  cornerRadius = 0,
  previewShadow = true,
}: PreviewProps) {
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

  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-stone-300 border-t-stone-700" />
      </div>
    );
  }

  if (!canvas) return null;

  return (
    <div className="fade-in flex h-full w-full items-center justify-center px-4 py-4 sm:px-8 sm:py-6 md:px-14 md:py-10">
      <canvas
        ref={displayRef}
        className="max-h-full max-w-full bg-transparent object-contain"
        style={{
          width: "auto",
          height: "auto",
          filter: previewShadow
            ? "drop-shadow(0 12px 28px rgba(0, 0, 0, 0.2))"
            : "none",
        }}
      />
    </div>
  );
}
