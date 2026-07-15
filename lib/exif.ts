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

/** Bold camera name for the "Shot on" line, e.g. "Canon EOS R5" */
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

export function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image"));
    };
    img.src = url;
  });
}

export function revokeImageUrl(image: HTMLImageElement) {
  if (image.src.startsWith("blob:")) {
    URL.revokeObjectURL(image.src);
  }
}
