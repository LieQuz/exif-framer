"use client";

import { useRef, type KeyboardEvent } from "react";

export type TabItem<T extends string> = {
  id: T;
  label: string;
};

type TabsProps<T extends string> = {
  items: readonly TabItem<T>[];
  value: T;
  onChange: (value: T) => void;
  ariaLabel: string;
  idPrefix: string;
};

export function Tabs<T extends string>({
  items,
  value,
  onChange,
  ariaLabel,
  idPrefix,
}: TabsProps<T>) {
  const refs = useRef(new Map<T, HTMLButtonElement>());

  const handleKeyDown = (event: KeyboardEvent, index: number) => {
    let nextIndex = index;
    if (event.key === "ArrowRight") {
      nextIndex = (index + 1) % items.length;
    } else if (event.key === "ArrowLeft") {
      nextIndex = (index - 1 + items.length) % items.length;
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = items.length - 1;
    } else {
      return;
    }

    event.preventDefault();
    const next = items[nextIndex];
    onChange(next.id);
    refs.current.get(next.id)?.focus();
  };

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className="grid gap-1 rounded-xl border border-control-border bg-surface p-1"
      style={{
        gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))`,
      }}
    >
      {items.map((item, index) => {
        const active = item.id === value;
        return (
          <button
            key={item.id}
            ref={(node) => {
              if (node) refs.current.set(item.id, node);
              else refs.current.delete(item.id);
            }}
            type="button"
            role="tab"
            id={`${idPrefix}-tab-${item.id}`}
            aria-selected={active}
            aria-controls={`${idPrefix}-panel-${item.id}`}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(item.id)}
            onKeyDown={(event) => handleKeyDown(event, index)}
            className={`min-h-11 rounded-lg px-1 text-xs font-medium transition-colors sm:px-1.5 sm:text-sm ${
              active
                ? "bg-primary text-surface-raised shadow-soft"
                : "text-ink-muted hover:bg-secondary/60 hover:text-ink"
            }`}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
