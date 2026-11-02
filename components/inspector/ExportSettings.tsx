"use client";

import { SectionLabel } from "@/components/ui/SectionLabel";
import { Segmented } from "@/components/ui/Segmented";
import { Slider } from "@/components/ui/Slider";
import {
  DEFAULT_JPEG_QUALITY,
  MAX_JPEG_QUALITY,
  MIN_JPEG_QUALITY,
  type ExportFormat,
  type FrameSettings,
} from "@/lib/frame-settings";
import { useI18n } from "@/lib/i18n/context";

type ExportSettingsProps = {
  settings: FrameSettings;
  onChange: (settings: FrameSettings) => void;
};

export function ExportSettings({ settings, onChange }: ExportSettingsProps) {
  const { t } = useI18n();

  const patch = (partial: Partial<FrameSettings>) =>
    onChange({ ...settings, ...partial });

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <SectionLabel>{t("exportFormat")}</SectionLabel>
        <Segmented
          value={settings.exportFormat}
          options={(["png", "jpeg"] as ExportFormat[]).map((format) => ({
            value: format,
            label: format.toUpperCase(),
          }))}
          onChange={(format) => patch({ exportFormat: format })}
          ariaLabel={t("exportFormat")}
          columns={2}
        />
        <p className="text-sm leading-6 text-ink-muted">
          {settings.exportFormat === "jpeg"
            ? t("formatJpegHint")
            : t("formatPngHint")}
        </p>
      </div>

      {settings.exportFormat === "jpeg" && (
        <Slider
          label={t("jpegQuality")}
          value={settings.jpegQuality}
          min={MIN_JPEG_QUALITY}
          max={MAX_JPEG_QUALITY}
          step={0.01}
          valueLabel={`${Math.round(settings.jpegQuality * 100)}%`}
          minLabel={t("qualityLow")}
          maxLabel={t("qualityHigh")}
          resetValue={DEFAULT_JPEG_QUALITY}
          onChange={(value) => patch({ jpegQuality: value })}
        />
      )}

      <div className="rounded-2xl border border-line bg-surface p-4">
        <p className="text-sm leading-6 text-ink-muted">
          {t("batchExportHint")}
        </p>
      </div>
    </div>
  );
}
