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
  if (!Number.isFinite(exposureTime) || exposureTime <= 0) return "";
  if (exposureTime >= 1) {
    return `${exposureTime % 1 === 0 ? exposureTime : exposureTime.toFixed(1)}s`;
  }
  const denominator = Math.round(1 / exposureTime);
  if (!Number.isFinite(denominator) || denominator <= 0) return "";
  return `1/${denominator}s`;
}

function formatAperture(fNumber: number): string {
  if (!Number.isFinite(fNumber) || fNumber <= 0) return "";
  return `f/${fNumber.toFixed(1)}`;
}

function formatFocalLengthMm(mm: number): string {
  if (!Number.isFinite(mm) || mm <= 0) return "";
  return `${Math.round(mm)}mm`;
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

type RawExif = Record<string, unknown>;

/** Lightroom PNG/XMP often stores rationals as "50/1", [50,1], or {numerator,denominator}. */
function toNumber(value: unknown): number {
  if (value == null || value === "") return NaN;
  if (typeof value === "number") return Number.isFinite(value) ? value : NaN;
  if (typeof value === "boolean") return NaN;

  if (typeof value === "string") {
    const cleaned = value.trim().replace(/,/g, "").replace(/mm$/i, "").trim();
    if (!cleaned) return NaN;
    if (cleaned.includes("/")) {
      const [a, b] = cleaned.split("/").map((s) => Number(s.trim()));
      if (Number.isFinite(a) && Number.isFinite(b) && b !== 0) return a / b;
      return NaN;
    }
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : NaN;
  }

  if (Array.isArray(value)) {
    if (value.length >= 2) {
      const a = toNumber(value[0]);
      const b = toNumber(value[1]);
      if (Number.isFinite(a) && Number.isFinite(b) && b !== 0) return a / b;
    }
    return toNumber(value[0]);
  }

  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;
    if ("numerator" in obj && "denominator" in obj) {
      const a = toNumber(obj.numerator);
      const b = toNumber(obj.denominator);
      if (Number.isFinite(a) && Number.isFinite(b) && b !== 0) return a / b;
    }
    if ("n" in obj && "d" in obj) {
      const a = toNumber(obj.n);
      const b = toNumber(obj.d);
      if (Number.isFinite(a) && Number.isFinite(b) && b !== 0) return a / b;
    }
    // Typed array / array-like
    if ("0" in obj && "1" in obj) {
      const a = toNumber(obj["0"]);
      const b = toNumber(obj["1"]);
      if (Number.isFinite(a) && Number.isFinite(b) && b !== 0) return a / b;
    }
    if ("0" in obj) return toNumber(obj["0"]);
  }

  return NaN;
}

function pickString(...values: unknown[]): string {
  for (const v of values) {
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return "";
}

function pickPositiveNumber(...values: unknown[]): number {
  for (const v of values) {
    const n = toNumber(v);
    if (Number.isFinite(n) && n > 0) return n;
  }
  return NaN;
}

function formatIso(raw: RawExif): string {
  const iso = pickPositiveNumber(
    raw.ISO,
    raw.PhotographicSensitivity,
    raw.ISOSpeedRatings,
  );
  return Number.isFinite(iso) ? `ISO${Math.round(iso)}` : "";
}

function formatDateFromRaw(raw: RawExif): string {
  return formatDate(
    (raw.DateTimeOriginal ??
      raw.CreateDate ??
      raw.DateCreated ??
      raw.DateTime) as Date | string | undefined,
  );
}

/**
 * Parse camera EXIF from JPEG / PNG / HEIC.
 * PNG stores EXIF in an eXIf chunk (and sometimes only in XMP) — read the
 * whole file so chunked scanning cannot miss a late eXIf segment.
 */
export async function parseExifFromFile(file: File): Promise<ExifData> {
  try {
    const buffer = await file.arrayBuffer();
    const raw = (await exifr.parse(buffer, {
      tiff: true,
      xmp: true,
      icc: false,
      iptc: false,
      jfif: false,
      ihdr: false,
      mergeOutput: true,
      translateKeys: true,
      translateValues: true,
      reviveValues: true,
      sanitize: true,
    })) as RawExif | null;

    if (!raw) return emptyExifData();

    // Prefer 35mm-equivalent when present (common in Lightroom exports)
    const focal = pickPositiveNumber(
      raw.FocalLengthIn35mmFormat,
      raw.FocalLengthIn35mmFilm,
      raw.FocalLength,
    );
    // FNumber only — ApertureValue is APEX, not f-stop
    const fNumber = pickPositiveNumber(raw.FNumber);
    const exposure = pickPositiveNumber(raw.ExposureTime);

    return {
      make: pickString(raw.Make),
      model: pickString(raw.Model),
      lens: pickString(raw.LensModel, raw.Lens),
      focalLength: formatFocalLengthMm(focal),
      aperture: formatAperture(fNumber),
      shutterSpeed: formatShutterSpeed(exposure),
      iso: formatIso(raw),
      date: formatDateFromRaw(raw),
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
