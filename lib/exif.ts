import { abortReason, abortable, throwIfAborted } from "./async";
import {
  emptyExifData,
  formatExifData,
  type ExifData,
  type ExifWorkerResponse,
} from "./exif-parse";

export {
  emptyExifData,
  getCameraDisplayName,
  hasExifData,
} from "./exif-parse";
export type { ExifData } from "./exif-parse";

/** iOS Safari canvas pixel budget is roughly 16–67M; keep margin for the frame. */
const MAX_EDGE = 4096;

/**
 * EXIF parsing runs in a classic worker so a timeout can terminate it for
 * real — exifr itself has no AbortSignal support.
 */
function parseExifInWorker(
  file: File,
  signal?: AbortSignal,
): Promise<ExifData> {
  return new Promise<ExifData>((resolve, reject) => {
    if (signal?.aborted) {
      reject(abortReason(signal));
      return;
    }

    let worker: Worker;
    try {
      worker = new Worker("/exif-worker.js");
    } catch (error) {
      reject(error);
      return;
    }

    let settled = false;

    function onAbort() {
      finish(() => reject(abortReason(signal!)));
    }

    const cleanup = () => {
      signal?.removeEventListener("abort", onAbort);
      worker.terminate();
    };

    const finish = (callback: () => void) => {
      if (settled) return;
      settled = true;
      cleanup();
      callback();
    };

    signal?.addEventListener("abort", onAbort, { once: true });
    if (signal?.aborted) {
      onAbort();
      return;
    }

    worker.onmessage = (event: MessageEvent<ExifWorkerResponse>) => {
      const message = event.data;
      finish(() => {
        if (message.ok) resolve(formatExifData(message.raw));
        else reject(new Error(message.error));
      });
    };

    worker.onerror = (event) => {
      finish(() => reject(new Error(event.message || "EXIF worker failed")));
    };

    try {
      worker.postMessage(file);
    } catch (error) {
      finish(() => reject(error));
    }
  });
}

export async function parseExifFromFile(
  file: File,
  signal?: AbortSignal,
): Promise<ExifData> {
  try {
    return await parseExifInWorker(file, signal);
  } catch {
    if (signal?.aborted) throw abortReason(signal);
    return emptyExifData();
  }
}

function loadHtmlImage(
  url: string,
  signal?: AbortSignal,
): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(abortReason(signal));
      return;
    }

    const img = new Image();
    let settled = false;

    const cleanup = () => {
      img.onload = null;
      img.onerror = null;
      signal?.removeEventListener("abort", onAbort);
    };

    const fail = (reason: unknown) => {
      if (settled) return;
      settled = true;
      cleanup();
      // Stop the browser from decoding an image nobody will use.
      img.src = "";
      reject(reason);
    };

    function onAbort() {
      fail(abortReason(signal!));
    }

    img.onload = () => {
      if (settled) return;
      if (!img.naturalWidth) {
        fail(new Error("empty image"));
        return;
      }
      settled = true;
      cleanup();
      resolve(img);
    };
    img.onerror = () => fail(new Error("img error"));

    signal?.addEventListener("abort", onAbort, { once: true });
    if (signal?.aborted) {
      onAbort();
      return;
    }
    img.src = url;
  });
}

async function decodeImage(
  img: HTMLImageElement,
  signal?: AbortSignal,
): Promise<void> {
  if (typeof img.decode !== "function") return;
  try {
    await abortable(img.decode(), signal);
  } catch {
    if (signal?.aborted) {
      // Release the decoded pixels if the caller timed out.
      img.src = "";
      throw abortReason(signal);
    }
    // decode() unsupported or failed — onload already succeeded
  }
}

function canvasToJpegBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("toBlob failed"))),
      "image/jpeg",
      0.92,
    );
  });
}

/**
 * Decode → draw to canvas → re-encode JPEG.
 * Keeps pixels in memory for Safari and caps huge phone photos.
 */
async function bakeForCanvas(
  img: HTMLImageElement,
  signal?: AbortSignal,
): Promise<HTMLImageElement> {
  throwIfAborted(signal);

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

  const blob = await abortable(canvasToJpegBlob(canvas), signal);
  throwIfAborted(signal);

  const bakedUrl = URL.createObjectURL(blob);
  try {
    return await loadHtmlImage(bakedUrl, signal);
  } catch (error) {
    URL.revokeObjectURL(bakedUrl);
    throw error;
  }
}

export async function loadImageFromFile(
  file: File,
  signal?: AbortSignal,
): Promise<HTMLImageElement> {
  throwIfAborted(signal);

  const url = URL.createObjectURL(file);
  try {
    const img = await loadHtmlImage(url, signal);
    await decodeImage(img, signal);
    throwIfAborted(signal);
    return await bakeForCanvas(img, signal);
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function revokeImageUrl(image: HTMLImageElement) {
  if (image.src.startsWith("blob:")) {
    URL.revokeObjectURL(image.src);
  }
}
