"use client";

import { useEffect } from "react";
import {
  AlertIcon,
  CheckIcon,
  CloseIcon,
} from "@/components/ui/icons";
import { useI18n } from "@/lib/i18n/context";

export type ToastMessage = {
  id: number;
  type: "success" | "error";
  text: string;
};

type ToastProps = {
  toast: ToastMessage | null;
  onClose: () => void;
};

export function Toast({ toast, onClose }: ToastProps) {
  const { t } = useI18n();

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(onClose, 3600);
    return () => window.clearTimeout(timer);
  }, [toast, onClose]);

  if (!toast) return null;

  const isError = toast.type === "error";

  return (
    <div
      role={isError ? "alert" : "status"}
      aria-live={isError ? "assertive" : "polite"}
      className="pointer-events-none fixed inset-x-0 bottom-[calc(10rem+env(safe-area-inset-bottom))] z-[70] flex justify-center px-4"
    >
      <div
        className={`fade-in pointer-events-auto flex max-w-md items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium shadow-panel ${
          isError
            ? "bg-danger text-white"
            : "bg-primary text-surface-raised"
        }`}
      >
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/15">
          {isError ? (
            <AlertIcon className="h-4 w-4" />
          ) : (
            <CheckIcon className="h-4 w-4" />
          )}
        </span>
        <span className="min-w-0">{toast.text}</span>
        <button
          type="button"
          onClick={onClose}
          aria-label={t("close")}
          className="relative ml-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors before:absolute before:-inset-2 before:content-[''] hover:bg-white/15"
        >
          <CloseIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
