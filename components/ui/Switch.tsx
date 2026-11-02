"use client";

import { useId } from "react";

type SwitchProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description?: string;
};

export function Switch({
  checked,
  onChange,
  label,
  description,
}: SwitchProps) {
  const id = useId();
  const descriptionId = description ? `${id}-description` : undefined;

  return (
    <label
      htmlFor={id}
      className="group flex min-h-12 cursor-pointer items-center justify-between gap-4 rounded-xl border border-line bg-surface-raised px-4 py-3 transition-colors hover:border-primary/25 hover:bg-secondary/25"
    >
      <input
        id={id}
        type="checkbox"
        role="switch"
        className="peer sr-only"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        aria-describedby={descriptionId}
      />
      <span className="min-w-0">
        <span className="block text-base font-medium text-ink">{label}</span>
        {description ? (
          <span
            id={descriptionId}
            className="mt-1 block text-sm leading-6 text-ink-muted"
          >
            {description}
          </span>
        ) : null}
      </span>
      <span
        aria-hidden="true"
        className={`relative h-6 w-11 shrink-0 rounded-full ring-1 ring-inset transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-primary peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-surface-raised ${
          checked
            ? "bg-primary ring-primary"
            : "bg-secondary ring-control-border"
        }`}
      >
        <span
          className={`absolute top-1 h-4 w-4 rounded-full bg-surface-raised shadow-sm transition-transform ${
            checked ? "translate-x-5" : "translate-x-1"
          }`}
        />
      </span>
    </label>
  );
}
