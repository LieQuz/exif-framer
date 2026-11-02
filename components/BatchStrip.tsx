"use client";

import { PlusIcon } from "@/components/ui/icons";
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
    <div className="batch-strip flex shrink-0 items-center gap-3 border-t border-line/80 bg-surface-sunken/70 px-4 py-3 sm:px-6">
      <span className="hidden shrink-0 font-mono text-xs uppercase tracking-[0.14em] text-ink-muted lg:inline">
        {t("batchList")}
      </span>

      <div className="group relative h-11 w-11 shrink-0 rounded-xl focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 focus-within:ring-offset-surface-sunken sm:h-14 sm:w-14">
        <input
          type="file"
          accept="image/*"
          multiple
          aria-label={t("batchAddMore")}
          title={t("batchAddMore")}
          onChange={(event) => {
            const list = event.target.files;
            void (async () => {
              if (!list || list.length === 0) return;
              try {
                const copies = await snapshotFiles(list);
                event.target.value = "";
                if (copies.length) onAddFiles(copies);
              } catch {
                event.target.value = "";
              }
            })();
          }}
          className="absolute inset-0 z-10 m-0 h-full w-full cursor-pointer opacity-0"
          style={{ fontSize: 16 }}
        />
        <div className="pointer-events-none flex h-full w-full items-center justify-center rounded-xl border border-dashed border-control-border bg-surface-raised/70 text-primary transition-colors group-hover:border-primary group-hover:bg-surface-raised">
          <PlusIcon className="h-4 w-4" />
        </div>
      </div>

      <div className="flex min-w-0 flex-1 gap-2 overflow-x-auto overscroll-x-contain [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {items.map((item) => {
          const active = item.id === activeId;
          return (
            <div key={item.id} className="relative shrink-0">
              <button
                type="button"
                onClick={() => onSelect(item.id)}
                aria-current={active ? "true" : undefined}
                className={`block h-11 w-11 overflow-hidden rounded-xl border-2 transition-all sm:h-14 sm:w-14 ${
                  active
                    ? "border-primary shadow-sm"
                    : "border-transparent opacity-65 hover:opacity-100"
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
                className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-medium text-surface-raised shadow-sm ring-2 ring-surface-raised before:absolute before:-inset-3 before:content-[''] transition-colors hover:bg-primary-hover"
                aria-label={t("batchRemove")}
              >
                ×
              </button>
            </div>
          );
        })}
      </div>

      <span
        title={t("batchList")}
        className="shrink-0 rounded-full bg-secondary/80 px-2.5 py-1 font-mono text-xs tabular-nums text-ink-muted"
      >
        {items.length}
      </span>
    </div>
  );
}
