"use client";

import type { ReactNode } from "react";

export type SegmentedOption<T extends string> = {
  value: T;
  label: ReactNode;
};

type SegmentedProps<T extends string> = {
  value: T;
  options: readonly SegmentedOption<T>[];
  onChange: (value: T) => void;
  ariaLabel: string;
  columns?: number;
  className?: string;
};

export function Segmented<T extends string>({
  value,
  options,
  onChange,
  ariaLabel,
  columns = options.length,
  className = "",
}: SegmentedProps<T>) {
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={`grid gap-1 rounded-xl border border-control-border bg-surface p-1 ${className}`}
      style={{
        gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
      }}
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(option.value)}
            className={`min-h-11 rounded-lg px-1 text-xs font-medium leading-tight transition-colors sm:px-2 sm:text-sm ${
              active
                ? "bg-primary text-surface-raised shadow-soft"
                : "text-ink-muted hover:bg-secondary/60 hover:text-ink"
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
