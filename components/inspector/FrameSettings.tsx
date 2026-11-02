"use client";

import { SectionLabel } from "@/components/ui/SectionLabel";
import { Segmented } from "@/components/ui/Segmented";
import { Slider } from "@/components/ui/Slider";
import { Switch } from "@/components/ui/Switch";
import {
  ASPECT_PRESETS,
  DEFAULT_BORDER_SCALE,
  DEFAULT_CORNER_RADIUS,
  MAX_BORDER_SCALE,
  MAX_CORNER_RADIUS,
  MIN_BORDER_SCALE,
  MIN_CORNER_RADIUS,
  TEMPLATES,
  type AspectPreset,
  type FrameSettings as FrameSettingsType,
  type FrameTemplate,
} from "@/lib/frame-settings";
import { useI18n } from "@/lib/i18n/context";

type FrameSettingsProps = {
  settings: FrameSettingsType;
  onChange: (settings: FrameSettingsType) => void;
};

const FRAME_COLOR_OPTIONS = [
  {
    id: "white",
    labelKey: "frameColor_white",
    swatch: "#FFFFFF",
    border: true,
  },
  {
    id: "offwhite",
    labelKey: "frameColor_offwhite",
    swatch: "#F7F4EF",
    border: true,
  },
  {
    id: "black",
    labelKey: "frameColor_black",
    swatch: "#111111",
    border: false,
  },
] as const;

export function FrameSettings({ settings, onChange }: FrameSettingsProps) {
  const { t } = useI18n();

  const patch = (partial: Partial<FrameSettingsType>) =>
    onChange({ ...settings, ...partial });

  const selectTemplate = (template: FrameTemplate) => {
    if (template === "minimal") {
      patch({
        template,
        showShotOn: false,
        showMake: false,
        showSpecs: true,
      });
    } else if (template === "film") {
      patch({
        template,
        showShotOn: true,
        showMake: true,
        showSpecs: true,
      });
    } else {
      patch({ template, showShotOn: true, showMake: true, showSpecs: true });
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <SectionLabel>{t("template")}</SectionLabel>
        <Segmented
          value={settings.template}
          options={TEMPLATES.map((template) => ({
            value: template,
            label: t(`template_${template}`),
          }))}
          onChange={selectTemplate}
          ariaLabel={t("template")}
          columns={3}
        />
      </div>

      <div className="space-y-2">
        <SectionLabel>{t("aspectPreset")}</SectionLabel>
        <Segmented
          value={settings.aspectPreset}
          options={ASPECT_PRESETS.map((preset) => ({
            value: preset,
            label: t(`aspect_${preset}`),
          }))}
          onChange={(preset: AspectPreset) => patch({ aspectPreset: preset })}
          ariaLabel={t("aspectPreset")}
          columns={3}
        />
      </div>

      <div className="space-y-2">
        <SectionLabel>{t("frameColor")}</SectionLabel>
        <div className="grid grid-cols-3 gap-2">
          {FRAME_COLOR_OPTIONS.map((color) => {
            const active = settings.frameColor === color.id;
            return (
              <button
                key={color.id}
                type="button"
                aria-pressed={active}
                onClick={() => patch({ frameColor: color.id })}
                className={`group flex min-h-20 flex-col items-center justify-center gap-2 rounded-xl border p-2 transition-all sm:p-3 ${
                  active
                    ? "border-primary bg-secondary/40"
                    : "border-line bg-surface-raised hover:border-primary/30 hover:bg-secondary/20"
                }`}
              >
                <span
                  className={`h-9 w-9 rounded-full transition-shadow ${
                    color.border ? "border border-control-border" : ""
                  } ${
                    active
                      ? "ring-2 ring-primary ring-offset-2 ring-offset-surface-raised"
                      : "group-hover:ring-1 group-hover:ring-control-border group-hover:ring-offset-1 group-hover:ring-offset-surface-raised"
                  }`}
                  style={{ backgroundColor: color.swatch }}
                />
                <span
                  className={`text-xs font-medium ${
                    active ? "text-ink" : "text-ink-muted"
                  }`}
                >
                  {t(color.labelKey)}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <Slider
        label={t("borderWidth")}
        value={settings.borderScale}
        min={MIN_BORDER_SCALE}
        max={MAX_BORDER_SCALE}
        step={0.05}
        valueLabel={`${Math.round(settings.borderScale * 100)}%`}
        minLabel={t("borderThin")}
        maxLabel={t("borderThick")}
        resetValue={DEFAULT_BORDER_SCALE}
        onChange={(value) => patch({ borderScale: value })}
      />

      <Slider
        label={t("cornerRadius")}
        value={settings.cornerRadius}
        min={MIN_CORNER_RADIUS}
        max={MAX_CORNER_RADIUS}
        step={0.005}
        valueLabel={`${Math.round(settings.cornerRadius * 1000) / 10}%`}
        minLabel={t("cornerSharp")}
        maxLabel={t("cornerRound")}
        resetValue={DEFAULT_CORNER_RADIUS}
        onChange={(value) => patch({ cornerRadius: value })}
      />

      <div className="space-y-2">
        <SectionLabel>{t("shadow")}</SectionLabel>
        <div className="space-y-2">
          <Switch
            checked={settings.previewShadow}
            onChange={(checked) => patch({ previewShadow: checked })}
            label={t("previewShadow")}
          />
          <Switch
            checked={settings.exportShadow}
            onChange={(checked) => patch({ exportShadow: checked })}
            label={t("exportShadow")}
          />
        </div>
      </div>
    </div>
  );
}
