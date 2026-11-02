"use client";

import { SectionLabel } from "@/components/ui/SectionLabel";
import { Segmented } from "@/components/ui/Segmented";
import { Slider } from "@/components/ui/Slider";
import { Switch } from "@/components/ui/Switch";
import {
  DEFAULT_TEXT_SCALE,
  MAX_TEXT_SCALE,
  MIN_TEXT_SCALE,
  type FrameSettings,
  type TextAlign,
} from "@/lib/frame-settings";
import { useI18n } from "@/lib/i18n/context";

type TextSettingsProps = {
  settings: FrameSettings;
  onChange: (settings: FrameSettings) => void;
};

export function TextSettings({ settings, onChange }: TextSettingsProps) {
  const { t } = useI18n();

  const patch = (partial: Partial<FrameSettings>) =>
    onChange({ ...settings, ...partial });

  const displayToggles = [
    { key: "showShotOn", labelKey: "toggleShotOn" },
    { key: "showMake", labelKey: "toggleMake" },
    { key: "showSpecs", labelKey: "toggleSpecs" },
  ] as const;

  return (
    <div className="space-y-6">
      <Slider
        label={t("textSize")}
        value={settings.textScale}
        min={MIN_TEXT_SCALE}
        max={MAX_TEXT_SCALE}
        step={0.05}
        valueLabel={`${Math.round(settings.textScale * 100)}%`}
        minLabel={t("textSizeSmall")}
        maxLabel={t("textSizeLarge")}
        resetValue={DEFAULT_TEXT_SCALE}
        onChange={(value) => patch({ textScale: value })}
      />

      <div className="space-y-2">
        <SectionLabel>{t("textAlign")}</SectionLabel>
        <Segmented
          value={settings.textAlign}
          options={(["left", "center", "right"] as TextAlign[]).map(
            (align) => ({
              value: align,
              label: t(`textAlign_${align}`),
            }),
          )}
          onChange={(align) => patch({ textAlign: align })}
          ariaLabel={t("textAlign")}
          columns={3}
        />
      </div>

      <div>
        <SectionLabel className="mb-2">{t("signature")}</SectionLabel>
        <input
          type="text"
          value={settings.signature}
          onChange={(event) => patch({ signature: event.target.value })}
          placeholder={t("signaturePlaceholder")}
          autoComplete="off"
          spellCheck={false}
          className="field"
        />
        <p className="mt-2 text-sm leading-6 text-ink-muted">
          {t("signatureHint")}
        </p>
      </div>

      <div className="space-y-2">
        <SectionLabel>{t("displayItems")}</SectionLabel>
        <div className="space-y-2">
          {settings.template !== "minimal" ? (
            displayToggles.map(({ key, labelKey }) => (
              <Switch
                key={key}
                checked={settings[key]}
                onChange={(checked) => patch({ [key]: checked })}
                label={t(labelKey)}
              />
            ))
          ) : (
            <Switch
              checked={settings.showSpecs}
              onChange={(checked) => patch({ showSpecs: checked })}
              label={t("toggleSpecs")}
            />
          )}
        </div>
      </div>
    </div>
  );
}
