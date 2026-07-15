"use client";

import { useCallback, useRef, useState } from "react";
import { useI18n } from "@/lib/i18n/context";

type DropZoneProps = {
  onFilesSelect: (files: File[]) => void;
  disabled?: boolean;
};

function collectImages(fileList: FileList | File[]): File[] {
  return Array.from(fileList).filter((f) => f.type.startsWith("image/"));
}

export function DropZone({ onFilesSelect, disabled }: DropZoneProps) {
  const { t } = useI18n();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFiles = useCallback(
    (list: FileList | File[] | null | undefined) => {
      if (!list) return;
      const files = collectImages(list);
      if (files.length === 0) return;
      onFilesSelect(files);
    },
    [onFilesSelect],
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (disabled) return;
      handleFiles(e.dataTransfer.files);
    },
    [disabled, handleFiles],
  );

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => !disabled && inputRef.current?.click()}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          inputRef.current?.click();
        }
      }}
      onDragOver={(e) => {
        e.preventDefault();
        if (!disabled) setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={onDrop}
      className={`group flex min-h-[320px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-8 py-16 transition-all duration-300 ${
        isDragging
          ? "border-stone-400 bg-white shadow-lg"
          : "border-stone-200 bg-white/60 hover:border-stone-300 hover:bg-white hover:shadow-md"
      } ${disabled ? "pointer-events-none opacity-50" : ""}`}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = "";
        }}
      />
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-stone-100 transition-colors group-hover:bg-stone-200">
        <svg
          className="h-6 w-6 text-stone-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
          />
        </svg>
      </div>
      <p className="text-base font-medium text-stone-700">{t("dropTitle")}</p>
      <p className="mt-1 text-sm text-stone-400">{t("dropHint")}</p>
      <p className="mt-2 text-xs text-stone-400">{t("dropBatchHint")}</p>
      <p className="mt-4 text-xs tracking-wide text-stone-400">
        {t("dropFormats")}
      </p>
    </div>
  );
}
