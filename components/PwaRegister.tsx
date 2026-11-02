"use client";

import { useEffect } from "react";

function isStaticAsset(raw: string): boolean {
  try {
    const url = new URL(raw, window.location.origin);
    return (
      url.origin === window.location.origin &&
      (url.pathname.startsWith("/_next/static/") ||
        url.pathname.startsWith("/icon") ||
        url.pathname === "/apple-touch-icon.png" ||
        url.pathname === "/manifest.webmanifest" ||
        url.pathname === "/offline.html" ||
        url.pathname === "/exif-worker.js" ||
        url.pathname === "/exifr.full.umd.js")
    );
  } catch {
    return false;
  }
}

function collectAssetUrls(): string[] {
  const urls = new Set<string>();

  for (const entry of performance.getEntriesByType("resource")) {
    urls.add(entry.name);
  }
  for (const script of document.querySelectorAll<HTMLScriptElement>(
    "script[src]",
  )) {
    if (script.src) urls.add(script.src);
  }
  for (const link of document.querySelectorAll<HTMLLinkElement>(
    'link[rel="stylesheet"][href], link[rel="manifest"][href], link[rel="preload"][href]',
  )) {
    if (link.href) urls.add(link.href);
  }

  return [...urls].filter(isStaticAsset);
}

async function cacheAppShell(): Promise<void> {
  try {
    const registration = await navigator.serviceWorker.ready;
    const worker = navigator.serviceWorker.controller ?? registration.active;
    if (!worker) return;

    // Assets loaded before the worker took control are invisible to its fetch
    // handler, so send them explicitly for the next (offline) visit.
    worker.postMessage({
      type: "CACHE_ASSETS",
      urls: collectAssetUrls(),
      page: window.location.href,
    });
  } catch {
    // Ignore registration / messaging failures (private mode, etc.)
  }
}

function waitForLoad(): Promise<void> {
  if (document.readyState === "complete") return Promise.resolve();
  return new Promise((resolve) => {
    window.addEventListener("load", () => resolve(), { once: true });
  });
}

/** Register SW in production; always tear down stray SW/caches in development. */
export function PwaRegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    const isProd = process.env.NODE_ENV === "production";

    if (!isProd) {
      void (async () => {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map((reg) => reg.unregister()));
        if ("caches" in window) {
          const keys = await caches.keys();
          await Promise.all(keys.map((key) => caches.delete(key)));
        }
      })();
      return;
    }

    let cancelled = false;

    const sendAssets = () => {
      if (cancelled) return;
      void waitForLoad().then(cacheAppShell);
    };

    void navigator.serviceWorker
      .register("/sw.js", { scope: "/", updateViaCache: "none" })
      .then(() => sendAssets())
      .catch(() => {
        // Ignore registration failures (private mode, etc.)
      });

    navigator.serviceWorker.addEventListener("controllerchange", sendAssets);
    if (document.readyState === "complete") sendAssets();

    return () => {
      cancelled = true;
      navigator.serviceWorker.removeEventListener(
        "controllerchange",
        sendAssets,
      );
    };
  }, []);

  return null;
}
