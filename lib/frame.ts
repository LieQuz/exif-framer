import { getCameraDisplayName, type ExifData } from "./exif";
import {
  DEFAULT_BORDER_SCALE,
  DEFAULT_TEXT_SCALE,
  FRAME_COLORS,
  L_SIZE_ASPECT,
  MAX_BORDER_SCALE,
  MAX_TEXT_SCALE,
  MIN_BORDER_SCALE,
  MIN_TEXT_SCALE,
  type AspectPreset,
  type FrameColor,
  type FrameSettings,
  type FrameTemplate,
  type TextAlign,
} from "./frame-settings";

export {
  DEFAULT_BORDER_SCALE,
  DEFAULT_CORNER_RADIUS,
  DEFAULT_JPEG_QUALITY,
  DEFAULT_TEXT_SCALE,
  MAX_BORDER_SCALE,
  MAX_CORNER_RADIUS,
  MAX_JPEG_QUALITY,
  MAX_TEXT_SCALE,
  MIN_BORDER_SCALE,
  MIN_CORNER_RADIUS,
  MIN_JPEG_QUALITY,
  MIN_TEXT_SCALE,
  ASPECT_PRESETS,
  TEMPLATES,
  defaultFrameSettings,
  type AspectPreset,
  type ExportFormat,
  type FrameColor,
  type FrameSettings,
  type FrameTemplate,
  type TextAlign,
} from "./frame-settings";

const BASE_MARGIN_X_RATIO = 0.045;
const BASE_MARGIN_TOP_RATIO = 0.045;

export type FrameOptions = {
  scale?: number;
  shotOnPrefix?: string;
  textScale?: number;
  frameColor?: FrameColor;
  borderScale?: number;
  textAlign?: TextAlign;
  showShotOn?: boolean;
  showMake?: boolean;
  showSpecs?: boolean;
  template?: FrameTemplate;
  aspectPreset?: AspectPreset;
  signature?: string;
};

const SYSTEM_UI_FONT =
  '-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "Helvetica Neue", Helvetica, Arial, sans-serif';

function getSansFont(): string {
  return SYSTEM_UI_FONT;
}

function buildSpecsLine(exif: ExifData): string {
  return [exif.focalLength, exif.aperture, exif.shutterSpeed, exif.iso]
    .map((s) => s.trim())
    .filter(Boolean)
    .join(" ");
}

async function ensureFontLoaded(size: number, font: string): Promise<void> {
  if (typeof document === "undefined" || !document.fonts) return;
  try {
    await Promise.all([
      document.fonts.load(`700 ${size}px -apple-system`),
      document.fonts.load(`400 ${size}px -apple-system`),
      document.fonts.load(`700 ${size}px ${font}`),
      document.fonts.load(`400 ${size}px ${font}`),
    ]);
  } catch {
    // Ignore
  }
  await document.fonts.ready;
}

type TextRun = {
  text: string;
  weight: number;
  color: string;
};

function measureRuns(
  ctx: CanvasRenderingContext2D,
  runs: TextRun[],
  size: number,
  font: string,
): number {
  let width = 0;
  for (const run of runs) {
    ctx.font = `${run.weight} ${size}px ${font}`;
    width += ctx.measureText(run.text).width;
  }
  return width;
}

function drawRuns(
  ctx: CanvasRenderingContext2D,
  runs: TextRun[],
  startX: number,
  y: number,
  size: number,
  font: string,
  align: TextAlign,
  canvasW: number,
) {
  const totalWidth = measureRuns(ctx, runs, size, font);
  let x =
    align === "center"
      ? canvasW / 2 - totalWidth / 2
      : align === "right"
        ? canvasW - startX - totalWidth
        : startX;
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";

  for (const run of runs) {
    ctx.font = `${run.weight} ${size}px ${font}`;
    ctx.fillStyle = run.color;
    ctx.fillText(run.text, x, y);
    x += ctx.measureText(run.text).width;
  }
}

function drawTrackedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  startX: number,
  y: number,
  size: number,
  font: string,
  color: string,
  trackingPx: number,
  align: TextAlign,
  canvasW: number,
) {
  ctx.font = `400 ${size}px ${font}`;
  ctx.fillStyle = color;
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";

  let total = 0;
  for (let i = 0; i < text.length; i++) {
    total += ctx.measureText(text[i]).width;
    if (i < text.length - 1) total += trackingPx;
  }

  let x =
    align === "center"
      ? canvasW / 2 - total / 2
      : align === "right"
        ? canvasW - startX - total
        : startX;
  for (let i = 0; i < text.length; i++) {
    ctx.fillText(text[i], x, y);
    x += ctx.measureText(text[i]).width + trackingPx;
  }
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function getSourceSize(source: CanvasImageSource): { w: number; h: number } {
  if (source instanceof HTMLImageElement) {
    return { w: source.naturalWidth, h: source.naturalHeight };
  }
  if (source instanceof HTMLCanvasElement) {
    return { w: source.width, h: source.height };
  }
  if (typeof ImageBitmap !== "undefined" && source instanceof ImageBitmap) {
    return { w: source.width, h: source.height };
  }
  throw new Error("Unsupported image source");
}

/**
 * Center-crop to a target width:height aspect ratio.
 * Pass a single number (w/h), or a pair via aspectW/aspectH.
 */
export function cropToAspect(
  image: HTMLImageElement,
  aspectW: number,
  aspectH = 1,
): HTMLCanvasElement {
  const srcW = image.naturalWidth;
  const srcH = image.naturalHeight;
  const targetAspect = aspectW / aspectH;

  const srcAspect = srcW / srcH;
  let cropW: number;
  let cropH: number;
  if (srcAspect > targetAspect) {
    cropH = srcH;
    cropW = Math.round(srcH * targetAspect);
  } else {
    cropW = srcW;
    cropH = Math.round(srcW / targetAspect);
  }
  const sx = Math.round((srcW - cropW) / 2);
  const sy = Math.round((srcH - cropH) / 2);

  const canvas = document.createElement("canvas");
  canvas.width = cropW;
  canvas.height = cropH;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not get canvas context");
  ctx.drawImage(image, sx, sy, cropW, cropH, 0, 0, cropW, cropH);
  return canvas;
}

/** Center-crop to 1:1 */
export function cropToSquare(image: HTMLImageElement): HTMLCanvasElement {
  return cropToAspect(image, 1, 1);
}

/** Outer L-size aspect (w/h), matching source orientation. */
export function lSizeOuterAspect(srcW: number, srcH: number): number {
  return srcW > srcH
    ? L_SIZE_ASPECT.h / L_SIZE_ASPECT.w
    : L_SIZE_ASPECT.w / L_SIZE_ASPECT.h;
}

function computeTextMetrics(
  imgW: number,
  textScale: number,
  template: FrameTemplate,
) {
  const titleMul = template === "minimal" ? 0.02 : 0.022;
  const specsMul = template === "minimal" ? 0.015 : 0.016;
  const titleSize = Math.max(10, Math.round(imgW * titleMul * textScale));
  const specsSize = Math.max(8, Math.round(imgW * specsMul * textScale));
  const lineGap = specsSize * (template === "minimal" ? 0 : 0.85);
  const captionPadding = Math.round(
    titleSize * (template === "minimal" ? 1.1 : 1.35),
  );
  return { titleSize, specsSize, lineGap, captionPadding };
}

type MarginInputs = {
  imgW: number;
  imgH: number;
  borderScale: number;
  template: FrameTemplate;
  textScale: number;
  totalTextHeight: number;
};

function computeFrameMargins({
  imgW,
  imgH,
  borderScale,
  template,
  textScale,
  totalTextHeight,
}: MarginInputs) {
  const { captionPadding } = computeTextMetrics(imgW, textScale, template);

  let marginX = Math.round(imgW * BASE_MARGIN_X_RATIO * borderScale);
  let marginTop = Math.round(imgH * BASE_MARGIN_TOP_RATIO * borderScale);
  let marginBottom =
    totalTextHeight > 0
      ? totalTextHeight + captionPadding * 2
      : Math.round(imgH * 0.12 * borderScale);

  if (template === "film") {
    marginX = Math.round(imgW * 0.07 * borderScale);
    const bar = Math.max(
      Math.round(imgH * 0.08 * borderScale),
      totalTextHeight > 0
        ? totalTextHeight + captionPadding * 2
        : Math.round(imgH * 0.1 * borderScale),
    );
    marginTop = bar;
    marginBottom = bar;
  }

  if (template === "minimal") {
    marginX = Math.round(imgW * 0.035 * borderScale);
    marginTop = Math.round(imgH * 0.035 * borderScale);
  }

  return { marginX, marginTop, marginBottom, captionPadding };
}

/**
 * Find the photo (inner) aspect ratio such that, after frame margins,
 * the outer canvas matches targetOuterAspect (w/h).
 */
function photoAspectForOuterL(
  targetOuterAspect: number,
  borderScale: number,
  template: FrameTemplate,
  textScale: number,
  textHeightAt: (imgW: number) => number,
): number {
  const refW = 1000;
  let lo = 0.25;
  let hi = 4;
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2;
    const imgH = refW / mid;
    const totalTextHeight = textHeightAt(refW);
    const { marginX, marginTop, marginBottom } = computeFrameMargins({
      imgW: refW,
      imgH,
      borderScale,
      template,
      textScale,
      totalTextHeight,
    });
    const outer =
      (refW + marginX * 2) / (imgH + marginTop + marginBottom);
    if (outer > targetOuterAspect) hi = mid;
    else lo = mid;
  }
  return (lo + hi) / 2;
}

function totalTextHeightFor(
  imgW: number,
  textScale: number,
  template: FrameTemplate,
  showTitle: boolean,
  hasSpecsLine: boolean,
  hasSignature: boolean,
) {
  const { titleSize, specsSize, lineGap } = computeTextMetrics(
    imgW,
    textScale,
    template,
  );
  const signatureSize = Math.max(10, Math.round(titleSize * 0.72));
  const signatureGap = hasSignature ? signatureSize * 0.75 : 0;
  const titleBlock = showTitle ? titleSize : 0;
  const specsBlock = hasSpecsLine ? specsSize : 0;
  const signatureBlock = hasSignature ? signatureSize : 0;
  return (
    titleBlock +
    (showTitle && hasSpecsLine ? lineGap : 0) +
    specsBlock +
    (hasSignature && (showTitle || hasSpecsLine) ? signatureGap : 0) +
    signatureBlock
  );
}

function drawFilmSprockets(
  ctx: CanvasRenderingContext2D,
  marginX: number,
  marginTop: number,
  imgW: number,
  imgH: number,
  bg: string,
) {
  const holeW = Math.max(4, Math.round(marginX * 0.35));
  const holeH = Math.max(6, Math.round(holeW * 1.4));
  const gap = holeH * 1.6;
  const inset = (marginX - holeW) / 2;

  // Punch holes by using destination-over won't work on opaque bg.
  // Draw contrasting holes: slightly lighter/darker than frame.
  const isDark = bg === "#111111";
  ctx.fillStyle = isDark ? "#2A2A2A" : "#E8E8E8";

  const startY = marginTop + gap * 0.5;
  const endY = marginTop + imgH - gap * 0.5;

  for (let y = startY; y + holeH <= endY; y += gap) {
    // left
    roundRectPath(ctx, inset, y, holeW, holeH, holeW * 0.25);
    ctx.fill();
    // right
    roundRectPath(
      ctx,
      marginX + imgW + inset,
      y,
      holeW,
      holeH,
      holeW * 0.25,
    );
    ctx.fill();
  }
}

function roundRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

/** Apply rounded corners and optional drop shadow for export */
export function applyExportEffects(
  source: HTMLCanvasElement,
  options: { cornerRadius: number; exportShadow: boolean },
): HTMLCanvasElement {
  const { cornerRadius, exportShadow } = options;
  const radiusPx = Math.round(
    Math.min(source.width, source.height) * cornerRadius,
  );
  const shadowBlur = exportShadow
    ? Math.max(12, Math.round(Math.min(source.width, source.height) * 0.025))
    : 0;
  const shadowPad = exportShadow ? Math.round(shadowBlur * 2.2) : 0;

  const out = document.createElement("canvas");
  out.width = source.width + shadowPad * 2;
  out.height = source.height + shadowPad * 2;
  const ctx = out.getContext("2d");
  if (!ctx) throw new Error("Could not get canvas context");

  const dx = shadowPad;
  const dy = shadowPad;

  if (exportShadow) {
    ctx.save();
    ctx.shadowColor = "rgba(0, 0, 0, 0.28)";
    ctx.shadowBlur = shadowBlur;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = Math.round(shadowBlur * 0.35);
    // Shadow caster: filled rounded rect matching image bounds
    ctx.fillStyle = "#000";
    roundRectPath(ctx, dx, dy, source.width, source.height, radiusPx);
    ctx.fill();
    ctx.restore();
  }

  ctx.save();
  if (radiusPx > 0) {
    roundRectPath(ctx, dx, dy, source.width, source.height, radiusPx);
    ctx.clip();
  }
  ctx.drawImage(source, dx, dy);
  ctx.restore();

  return out;
}

function buildTitleRuns(
  cameraName: string,
  make: string,
  colors: { muted: string; bold: string },
  opts: {
    template: FrameTemplate;
    showShotOn: boolean;
    showMake: boolean;
    shotOnPrefix: string;
    specs: string;
  },
): TextRun[] {
  const { template, showShotOn, showMake, shotOnPrefix, specs } = opts;
  const runs: TextRun[] = [];

  if (template === "minimal") {
    // Single refined line: camera · specs
    if (cameraName) {
      runs.push({ text: cameraName, weight: 600, color: colors.bold });
    }
    if (specs) {
      if (runs.length > 0) {
        runs.push({ text: "  ·  ", weight: 400, color: colors.muted });
      }
      runs.push({ text: specs, weight: 400, color: colors.muted });
    }
    return runs;
  }

  // shoton / film — two-line style title
  if (cameraName) {
    if (showShotOn) {
      runs.push({
        text: `${shotOnPrefix} `,
        weight: 400,
        color: colors.muted,
      });
    }
    runs.push({ text: cameraName, weight: 700, color: colors.bold });
    if (
      showMake &&
      make &&
      cameraName.toUpperCase() !== make.toUpperCase()
    ) {
      runs.push({ text: ` ${make}`, weight: 400, color: colors.muted });
    }
  }
  return runs;
}

export async function renderPolaroidFrame(
  image: HTMLImageElement,
  exif: ExifData,
  options: FrameOptions = {},
): Promise<HTMLCanvasElement> {
  const shotOnPrefix = options.shotOnPrefix ?? "Shot on";
  const textScale = clamp(
    options.textScale ?? DEFAULT_TEXT_SCALE,
    MIN_TEXT_SCALE,
    MAX_TEXT_SCALE,
  );
  const borderScale = clamp(
    options.borderScale ?? DEFAULT_BORDER_SCALE,
    MIN_BORDER_SCALE,
    MAX_BORDER_SCALE,
  );
  const frameColor = options.frameColor ?? "white";
  const textAlign = options.textAlign ?? "center";
  const showShotOn = options.showShotOn ?? true;
  const showMake = options.showMake ?? true;
  const showSpecs = options.showSpecs ?? true;
  const template = options.template ?? "shoton";
  const aspectPreset = options.aspectPreset ?? "original";
  const signature = options.signature?.trim() ?? "";

  const colors = FRAME_COLORS[frameColor];

  const cameraName = getCameraDisplayName(exif);
  const make = exif.make.trim();
  const specsRaw = showSpecs ? buildSpecsLine(exif) : "";
  // Minimal folds specs into the title line
  const specsForSecondLine = template === "minimal" ? "" : specsRaw;

  const titleRuns = buildTitleRuns(cameraName, make, colors, {
    template,
    showShotOn: template === "minimal" ? false : showShotOn,
    showMake: template === "minimal" ? false : showMake,
    shotOnPrefix,
    specs: template === "minimal" ? specsRaw : "",
  });

  const showTitle = titleRuns.length > 0;
  const hasSpecsLine = Boolean(specsForSecondLine);
  const hasSignature = Boolean(signature);

  const textHeightAt = (w: number) =>
    totalTextHeightFor(
      w,
      textScale,
      template,
      showTitle,
      hasSpecsLine,
      hasSignature,
    );

  let source: CanvasImageSource;
  if (aspectPreset === "square") {
    source = cropToSquare(image);
  } else if (aspectPreset === "l") {
    const outerAspect = lSizeOuterAspect(
      image.naturalWidth,
      image.naturalHeight,
    );
    const photoAspect = photoAspectForOuterL(
      outerAspect,
      borderScale,
      template,
      textScale,
      textHeightAt,
    );
    source = cropToAspect(image, photoAspect, 1);
  } else {
    source = image;
  }

  const { w: imgW, h: imgH } = getSourceSize(source);

  const totalTextHeight = textHeightAt(imgW);
  const frameMargins = computeFrameMargins({
    imgW,
    imgH,
    borderScale,
    template,
    textScale,
    totalTextHeight,
  });
  const { marginX, captionPadding } = frameMargins;
  let { marginTop, marginBottom } = frameMargins;

  const { titleSize, specsSize, lineGap } = computeTextMetrics(
    imgW,
    textScale,
    template,
  );
  const signatureSize = Math.max(10, Math.round(titleSize * 0.72));
  const signatureGap = hasSignature ? signatureSize * 0.75 : 0;

  const canvasW = imgW + marginX * 2;
  let canvasH = imgH + marginTop + marginBottom;

  // Snap outer canvas to exact L-size aspect (margins included)
  if (aspectPreset === "l") {
    const outerAspect = lSizeOuterAspect(
      image.naturalWidth,
      image.naturalHeight,
    );
    const idealH = Math.round(canvasW / outerAspect);
    const delta = idealH - canvasH;
    if (delta !== 0) {
      if (template === "film") {
        const half = Math.trunc(delta / 2);
        marginTop = Math.max(0, marginTop + half);
        marginBottom = Math.max(0, marginBottom + (delta - half));
      } else {
        marginBottom = Math.max(0, marginBottom + delta);
      }
      canvasH = imgH + marginTop + marginBottom;
      if (canvasH !== idealH) {
        marginTop = Math.max(0, marginTop + (idealH - canvasH));
        canvasH = imgH + marginTop + marginBottom;
      }
    }
  }

  // Cap DPR / size — iPhone Safari rejects oversized canvases
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  let scale = options.scale ?? dpr;
  const maxCanvasEdge = 4096;
  const rawEdge = Math.max(canvasW, canvasH) * scale;
  if (rawEdge > maxCanvasEdge) {
    scale = maxCanvasEdge / Math.max(canvasW, canvasH);
  }

  const canvas = document.createElement("canvas");
  canvas.width = canvasW * scale;
  canvas.height = canvasH * scale;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not get canvas context");

  ctx.scale(scale, scale);
  ctx.letterSpacing = "0px";

  ctx.fillStyle = colors.bg;
  ctx.fillRect(0, 0, canvasW, canvasH);
  ctx.drawImage(source, marginX, marginTop, imgW, imgH);

  if (template === "film") {
    drawFilmSprockets(ctx, marginX, marginTop, imgW, imgH, colors.bg);
  }

  if (!showTitle && !specsForSecondLine && !signature) {
    return canvas;
  }

  const font = getSansFont();
  await ensureFontLoaded(titleSize, font);

  const textAreaTop = marginTop + imgH;
  const blockTop =
    template === "film"
      ? textAreaTop + (marginBottom - totalTextHeight) / 2
      : textAreaTop + captionPadding;
  const textStartX = marginX;

  let cursorY = blockTop;

  if (titleRuns.length > 0) {
    drawRuns(
      ctx,
      titleRuns,
      textStartX,
      cursorY + titleSize * 0.82,
      titleSize,
      font,
      textAlign,
      canvasW,
    );
    cursorY += titleSize;
  }

  if (specsForSecondLine) {
    if (showTitle) cursorY += lineGap;
    const tracking = Math.max(0.6, specsSize * 0.06);
    drawTrackedText(
      ctx,
      specsForSecondLine,
      textStartX,
      cursorY + specsSize * 0.82,
      specsSize,
      font,
      colors.muted,
      tracking,
      textAlign,
      canvasW,
    );
    cursorY += specsSize;
  }

  if (signature) {
    if (showTitle || specsForSecondLine) cursorY += signatureGap;
    drawRuns(
      ctx,
      [{ text: signature, weight: 400, color: colors.muted }],
      textStartX,
      cursorY + signatureSize * 0.82,
      signatureSize,
      font,
      textAlign,
      canvasW,
    );
  }

  return canvas;
}

export function canvasToBlob(
  canvas: HTMLCanvasElement,
  format: "png" | "jpeg" = "png",
  quality = 0.92,
): Promise<Blob> {
  const mime = format === "jpeg" ? "image/jpeg" : "image/png";
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Failed to export image"));
      },
      mime,
      format === "jpeg" ? quality : undefined,
    );
  });
}

export function downloadCanvas(
  canvas: HTMLCanvasElement,
  filename: string,
  format: "png" | "jpeg" = "png",
  quality = 0.92,
) {
  const mime = format === "jpeg" ? "image/jpeg" : "image/png";
  canvas.toBlob(
    (blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    },
    mime,
    format === "jpeg" ? quality : undefined,
  );
}

export function settingsToFrameOptions(
  settings: FrameSettings,
  shotOnPrefix: string,
): FrameOptions {
  return {
    shotOnPrefix,
    textScale: settings.textScale,
    frameColor: settings.frameColor,
    borderScale: settings.borderScale,
    textAlign: settings.textAlign,
    showShotOn: settings.showShotOn,
    showMake: settings.showMake,
    showSpecs: settings.showSpecs,
    template: settings.template,
    aspectPreset: settings.aspectPreset,
    signature: settings.signature,
  };
}
