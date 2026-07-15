"use client";

import type { BatchItem } from "@/lib/batch";
import { useI18n } from "@/lib/i18n/context";

type BatchStripProps = {
  items: BatchItem[];
  activeId: string;
  onSelect: (id: string) => void;
  onRemove: (id: string) => void;
  onAddMore: () => void;
};

export function BatchStrip({
  items,
  activeId,
  onSelect,
  onRemove,
  onAddMore,
}: BatchStripProps) {
  const { t } = useI18n();

  return (
    <div className="flex shrink-0 items-center gap-3 border-t border-stone-200/80 bg-[#F3F0EB] px-5 py-3 sm:px-8">
      <button
        type="button"
        onClick={onAddMore}
        className="flex h-14 w-14 shrink-0 items-center justify-center rounded-md border border-dashed border-stone-300 text-lg text-stone-400 transition-colors hover:border-stone-400 hover:text-stone-600"
        aria-label={t("batchAddMore")}
        title={t("batchAddMore")}
      >
        +
      </button>
      <div className="flex min-w-0 flex-1 gap-2 overflow-x-auto">
        {items.map((item) => {
          const active = item.id === activeId;
          return (
            <div key={item.id} className="relative shrink-0">
              <button
                type="button"
                onClick={() => onSelect(item.id)}
                className={`block h-14 w-14 overflow-hidden rounded-md border-2 transition-colors ${
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
