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
      <div className="flex aspect-[4/5] w-full max-w-md items-center justify-center rounded-lg bg-white shadow-xl shadow-stone-200/60">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-stone-200 border-t-stone-600" />
      </div>
    );
  }

  if (!canvas) return null;

  return (
    <div className="fade-in w-full max-w-md">
      <canvas
        ref={displayRef}
        className="h-auto w-full bg-transparent"
        style={{
          filter: previewShadow
            ? "drop-shadow(0 16px 28px rgba(0, 0, 0, 0.18))"
            : "none",
        }}
      />
    </div>
  );
}
