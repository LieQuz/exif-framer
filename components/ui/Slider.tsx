"use client";

import { useI18n } from "@/lib/i18n/context";

type SliderProps = {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  valueLabel: string;
  minLabel: string;
  maxLabel: string;
  resetValue: number;
  onChange: (value: number) => void;
};

export function Slider({
  label,
  value,
  min,
  max,
  step,
  valueLabel,
  minLabel,
  maxLabel,
  resetValue,
  onChange,
}: SliderProps) {
  const { t } = useI18n();

  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-3">
        <span className="section-label">{label}</span>
        <span className="font-mono text-xs tabular-nums text-ink-muted">
          {valueLabel}
        </span>
      </div>
      <div className="flex items-center gap-3">
        <span
          aria-hidden="true"
          className="w-10 shrink-0 whitespace-nowrap font-mono text-xs text-ink-muted"
        >
          {minLabel}
        </span>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(event) => onChange(Number(event.target.value))}
          className="range"
          aria-label={label}
        />
        <span
          aria-hidden="true"
          className="w-10 shrink-0 whitespace-nowrap text-right font-mono text-xs text-ink-muted"
        >
          {maxLabel}
        </span>
      </div>
      {value !== resetValue && (
        <button
          type="button"
          onClick={() => onChange(resetValue)}
          className="inline-flex min-h-11 items-center font-mono text-xs uppercase tracking-[0.12em] text-ink-muted underline-offset-4 transition-colors hover:text-primary hover:underline"
        >
          {t("reset")}
        </button>
      )}
    </div>
  );
}
