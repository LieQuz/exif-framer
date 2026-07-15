import JSZip from "jszip";
import {
  applyExportEffects,
  canvasToBlob,
  renderPolaroidFrame,
  settingsToFrameOptions,
  type FrameSettings,
} from "@/lib/frame";
import {
  loadImageFromFile,
  parseExifFromFile,
  type ExifData,
} from "@/lib/exif";

export type BatchItem = {
  id: string;
  file: File;
  image: HTMLImageElement;
  exif: ExifData;
  filename: string;
};

export async function createBatchItem(file: File): Promise<BatchItem> {
  const [image, exif] = await Promise.all([
    loadImageFromFile(file),
    parseExifFromFile(file),
  ]);
  return {
    id: `${file.name}-${file.size}-${file.lastModified}-${Math.random().toString(36).slice(2)}`,
    file,
    image,
    exif,
    filename: file.name.replace(/\.[^.]+$/, "") || "photo",
  };
}

export async function exportBatchZip(
  items: BatchItem[],
  settings: FrameSettings,
  shotOnPrefix: string,
  onProgress?: (done: number, total: number) => void,
): Promise<Blob> {
  const zip = new JSZip();
  const ext = settings.exportFormat === "jpeg" ? "jpg" : "png";
  const usedNames = new Set<string>();

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const framed = await renderPolaroidFrame(
      item.image,
      item.exif,
      settingsToFrameOptions(settings, shotOnPrefix),
    );
    const exportCanvas = applyExportEffects(framed, {
      cornerRadius: settings.cornerRadius,
      exportShadow: settings.exportShadow,
    });
    const blob = await canvasToBlob(
      exportCanvas,
      settings.exportFormat,
      settings.jpegQuality,
    );

    let name = `${item.filename}-framed.${ext}`;
    let n = 2;
    while (usedNames.has(name)) {
      name = `${item.filename}-framed-${n}.${ext}`;
      n += 1;
    }
    usedNames.add(name);
    zip.file(name, blob);
    onProgress?.(i + 1, items.length);
  }

  return zip.generateAsync({ type: "blob" });
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
