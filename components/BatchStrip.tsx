"use client";

import type { BatchItem } from "@/lib/batch";
import { snapshotFiles } from "@/lib/files";
import { useI18n } from "@/lib/i18n/context";

type BatchStripProps = {
  items: BatchItem[];
  activeId: string;
  onSelect: (id: string) => void;
  onRemove: (id: string) => void;
  onAddFiles: (files: File[]) => void;
};

export function BatchStrip({
  items,
  activeId,
  onSelect,
  onRemove,
  onAddFiles,
}: BatchStripProps) {
  const { t } = useI18n();

  return (
    <div className="flex shrink-0 items-center gap-2 border-t border-stone-200/80 bg-[#F3F0EB] px-3 py-2 sm:gap-3 sm:px-6 sm:py-3">
      <div className="relative h-11 w-11 shrink-0 sm:h-14 sm:w-14">
        <input
          type="file"
          accept="image/*"
          multiple
          aria-label={t("batchAddMore")}
          title={t("batchAddMore")}
          onChange={(e) => {
            const list = e.target.files;
            void (async () => {
              if (!list || list.length === 0) return;
              try {
                const copies = await snapshotFiles(list);
                e.target.value = "";
                if (copies.length) onAddFiles(copies);
              } catch {
                e.target.value = "";
              }
            })();
          }}
          className="absolute inset-0 z-10 m-0 h-full w-full cursor-pointer opacity-0"
          style={{ fontSize: 16 }}
        />
        <div className="pointer-events-none flex h-full w-full items-center justify-center rounded-md border border-dashed border-stone-300 text-lg text-stone-400">
          +
        </div>
      </div>
      <div className="flex min-w-0 flex-1 gap-2 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {items.map((item) => {
          const active = item.id === activeId;
          return (
            <div key={item.id} className="relative shrink-0">
              <button
                type="button"
                onClick={() => onSelect(item.id)}
                className={`block h-11 w-11 overflow-hidden rounded-md border-2 transition-colors sm:h-14 sm:w-14 ${
                  active
                    ? "border-stone-800"
                    : "border-transparent opacity-70 hover:opacity-100"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.image.src}
                  alt={item.filename}
                  className="h-full w-full object-cover"
                />
              </button>
              <button
                type="button"
                onClick={() => onRemove(item.id)}
                className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-stone-800 text-[10px] text-white"
                aria-label={t("batchRemove")}
              >
                ×
              </button>
            </div>
          );
        })}
      </div>
      <span className="hidden shrink-0 text-xs text-stone-400 sm:inline">
        {items.length}
      </span>
    </div>
  );
}
