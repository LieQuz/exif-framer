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

  if (items.length <= 1) return null;

  return (
    <div className="w-full max-w-md space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wider text-stone-400">
          {t("batchList")} ({items.length})
        </span>
        <button
          type="button"
          onClick={onAddMore}
          className="text-xs text-stone-500 transition-colors hover:text-stone-800"
        >
          {t("batchAddMore")}
        </button>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {items.map((item) => {
          const active = item.id === activeId;
          return (
            <div key={item.id} className="relative shrink-0">
              <button
                type="button"
                onClick={() => onSelect(item.id)}
                className={`block h-16 w-16 overflow-hidden rounded-lg border-2 transition-colors ${
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
    </div>
  );
}
