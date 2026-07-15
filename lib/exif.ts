import exifr from "exifr";

export type ExifData = {
  make: string;
  model: string;
  lens: string;
  focalLength: string;
  aperture: string;
  shutterSpeed: string;
  iso: string;
  date: string;
};

export const emptyExifData = (): ExifData => ({
  make: "",
  model: "",
  lens: "",
  focalLength: "",
  aperture: "",
  shutterSpeed: "",
  iso: "",
  date: "",
});

function formatShutterSpeed(exposureTime: number): string {
  if (!exposureTime || exposureTime <= 0) return "";
  if (exposureTime >= 1) {
    return `${exposureTime % 1 === 0 ? exposureTime : exposureTime.toFixed(1)}s`;
  }
  const denominator = Math.round(1 / exposureTime);
  return `1/${denominator}s`;
}

function formatAperture(fNumber: number): string {
  if (!fNumber || fNumber <= 0) return "";
  return `f/${fNumber.toFixed(1)}`;
}

function formatFocalLength(
  focalLength?: number,
  focalLength35mm?: number,
): string {
  const value = focalLength35mm ?? focalLength;
  if (!value || value <= 0) return "";
  return `${Math.round(value)}mm`;
}

function formatDate(date: Date | string | undefined): string {
  if (!date) return "";
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}.${m}.${day}`;
}

type RawExif = {
  Make?: string;
  Model?: string;
  LensModel?: string;
  FocalLength?: number;
  FocalLengthIn35mmFormat?: number;
  FNumber?: number;
  ExposureTime?: number;
  ISO?: number;
  DateTimeOriginal?: Date | string;
};

export async function parseExifFromFile(file: File): Promise<ExifData> {
  try {
    const raw = (await exifr.parse(file, {
      pick: [
        "Make",
        "Model",
        "LensModel",
        "FocalLength",
        "FocalLengthIn35mmFormat",
        "FNumber",
        "ExposureTime",
        "ISO",
        "DateTimeOriginal",
      ],
    })) as RawExif | null;

    if (!raw) return emptyExifData();

    return {
      make: raw.Make?.trim() ?? "",
      model: raw.Model?.trim() ?? "",
      lens: raw.LensModel?.trim() ?? "",
      focalLength: formatFocalLength(
        raw.FocalLength,
        raw.FocalLengthIn35mmFormat,
      ),
      aperture: formatAperture(raw.FNumber ?? 0),
      shutterSpeed: formatShutterSpeed(raw.ExposureTime ?? 0),
      iso: raw.ISO ? `ISO${raw.ISO}` : "",
      date: formatDate(raw.DateTimeOriginal),
    };
  } catch {
    return emptyExifData();
  }
}

export function getCameraDisplayName(data: ExifData): string {
  const make = data.make.trim();
  const model = data.model.trim();
  if (!make && !model) return "";
  if (!make) return model;
  if (!model) return make;
  if (model.toUpperCase().startsWith(make.toUpperCase())) return model;
  return `${make} ${model}`;
}

export function hasExifData(data: ExifData): boolean {
  return Object.values(data).some((value) => value.trim().length > 0);
}

/** iOS Safari canvas pixel budget is roughly 16–67M; keep margin for the frame. */
const MAX_EDGE = 4096;

function loadHtmlImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      if (!img.naturalWidth) {
        reject(new Error("empty image"));
        return;
      }
      resolve(img);
    };
    img.onerror = () => reject(new Error("img error"));
    img.src = url;
  });
}

/**
 * Decode → draw to canvas → re-encode JPEG.
 * Keeps pixels in memory for Safari and caps huge phone photos.
 */
async function bakeForCanvas(img: HTMLImageElement): Promise<HTMLImageElement> {
  const srcW = img.naturalWidth;
  const srcH = img.naturalHeight;
  const edge = Math.max(srcW, srcH);
  const scale = edge > MAX_EDGE ? MAX_EDGE / edge : 1;
  const w = Math.max(1, Math.round(srcW * scale));
  const h = Math.max(1, Math.round(srcH * scale));

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("no 2d context");
  ctx.drawImage(img, 0, 0, w, h);

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("toBlob failed"))),
      "image/jpeg",
      0.92,
    );
  });

  const bakedUrl = URL.createObjectURL(blob);
  try {
    return await loadHtmlImage(bakedUrl);
  } catch (e) {
    URL.revokeObjectURL(bakedUrl);
    throw e;
  }
}

export async function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(file);
  try {
    const img = await loadHtmlImage(url);
    try {
      await img.decode?.();
    } catch {
      // decode() unsupported or failed — onload already succeeded
    }
    return await bakeForCanvas(img);
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function revokeImageUrl(image: HTMLImageElement) {
  if (image.src.startsWith("blob:")) {
    URL.revokeObjectURL(image.src);
  }
}
