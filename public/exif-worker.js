/*
 * EXIF parsing worker.
 *
 * This is intentionally a classic worker served from /public so it works the
 * same under Turbopack, webpack and production builds. exifr is loaded from
 * the pinned UMD file next to it (exifr 7.1.3, see package.json). The main
 * thread terminates this worker on timeout, which is the only reliable way to
 * abort exifr parsing.
 */
importScripts("/exifr.full.umd.js");

const OPTIONS = {
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
};

/** Only send the fields the UI actually formats back to the main thread. */
const KEYS = [
  "Make",
  "Model",
  "LensModel",
  "Lens",
  "FocalLengthIn35mmFormat",
  "FocalLengthIn35mmFilm",
  "FocalLength",
  "FNumber",
  "ExposureTime",
  "ISO",
  "PhotographicSensitivity",
  "ISOSpeedRatings",
  "DateTimeOriginal",
  "CreateDate",
  "DateCreated",
  "DateTime",
];

self.onmessage = async (event) => {
  const file = event.data;
  try {
    // Read the whole file so a late PNG eXIf chunk cannot be missed.
    const buffer = await file.arrayBuffer();
    const raw = await self.exifr.parse(buffer, OPTIONS);

    if (!raw || typeof raw !== "object") {
      self.postMessage({ ok: true, raw: null });
      return;
    }

    const picked = {};
    for (const key of KEYS) {
      if (raw[key] !== undefined) picked[key] = raw[key];
    }
    self.postMessage({ ok: true, raw: picked });
  } catch (error) {
    self.postMessage({
      ok: false,
      error: error instanceof Error ? error.message : "EXIF parse failed",
    });
  }
};
