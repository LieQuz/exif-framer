import {
  defaultFrameSettings,
  type FrameSettings,
} from "./frame-settings";

export type StoredLocale = "ja" | "en";

const SETTINGS_KEY = "exif-framer:settings";
const LOCALE_KEY = "exif-framer:locale";

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function loadFrameSettings(): FrameSettings {
  const defaults = defaultFrameSettings();
  if (typeof window === "undefined") return defaults;

  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return defaults;
    const parsed: unknown = JSON.parse(raw);
    if (!isObject(parsed)) return defaults;
    return { ...defaults, ...parsed } as FrameSettings;
  } catch {
    return defaults;
  }
}

export function saveFrameSettings(settings: FrameSettings): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // Ignore quota / private mode errors
  }
}

export function loadLocale(fallback: StoredLocale = "ja"): StoredLocale {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(LOCALE_KEY);
    if (raw === "ja" || raw === "en") return raw;
  } catch {
    // Ignore
  }
  return fallback;
}

export function saveLocale(locale: StoredLocale): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LOCALE_KEY, locale);
  } catch {
    // Ignore
  }
}
