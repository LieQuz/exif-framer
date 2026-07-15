"use client";

import {
  ASPECT_PRESETS,
  DEFAULT_BORDER_SCALE,
  DEFAULT_CORNER_RADIUS,
  DEFAULT_JPEG_QUALITY,
  DEFAULT_TEXT_SCALE,
  MAX_BORDER_SCALE,
  MAX_CORNER_RADIUS,
  MAX_JPEG_QUALITY,
  MAX_TEXT_SCALE,
  MIN_BORDER_SCALE,
  MIN_CORNER_RADIUS,
  MIN_JPEG_QUALITY,
  MIN_TEXT_SCALE,
  TEMPLATES,
  type AspectPreset,
  type ExportFormat,
  type FrameColor,
  type FrameSettings,
  type FrameTemplate,
  type TextAlign,
} from "@/lib/frame-settings";
import { useI18n } from "@/lib/i18n/context";

type FrameControlsProps = {
  settings: FrameSettings;
  onChange: (settings: FrameSettings) => void;
};

const sliderClass =
  "h-1.5 w-full cursor-pointer appearance-none rounded-full bg-stone-200 accent-stone-800 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-stone-800";

const segmentBtn = (active: boolean) =>
  `rounded-full px-2.5 py-1.5 text-[11px] font-medium transition-colors sm:px-3 sm:text-xs ${
    active
      ? "bg-stone-800 text-white"
      : "text-stone-500 hover:text-stone-800"
  }`;

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="mb-2 block text-xs font-medium uppercase tracking-wider text-stone-400">
      {children}
    </span>
  );
}

export function FrameControls({ settings, onChange }: FrameControlsProps) {
  const { t } = useI18n();

  const patch = (partial: Partial<FrameSettings>) =>
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
      {/* Template */}
      <div>
        <SectionLabel>{t("template")}</SectionLabel>
        <div className="flex flex-wrap gap-1 rounded-full border border-stone-200 bg-white p-0.5">
          {TEMPLATES.map((template) => (
            <button
              key={template}
              type="button"
              onClick={() => selectTemplate(template)}
              className={segmentBtn(settings.template === template)}
            >
              {t(`template_${template}`)}
            </button>
          ))}
        </div>
      </div>

      {/* Aspect */}
      <div>
        <SectionLabel>{t("aspectPreset")}</SectionLabel>
        <div className="inline-flex rounded-full border border-stone-200 bg-white p-0.5">
          {ASPECT_PRESETS.map((preset: AspectPreset) => (
            <button
              key={preset}
              type="button"
              onClick={() => patch({ aspectPreset: preset })}
              className={segmentBtn(settings.aspectPreset === preset)}
            >
              {t(`aspect_${preset}`)}
            </button>
          ))}
        </div>
      </div>

      {/* Frame color */}
      <div>
        <SectionLabel>{t("frameColor")}</SectionLabel>
        <div className="flex gap-2">
          {(
            [
              { id: "white", swatch: "#FFFFFF", border: true },
              { id: "offwhite", swatch: "#F7F4EF", border: true },
              { id: "black", swatch: "#111111", border: false },
            ] as const
          ).map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => patch({ frameColor: c.id as FrameColor })}
              title={t(`frameColor_${c.id}`)}
              aria-label={t(`frameColor_${c.id}`)}
              className={`h-9 w-9 rounded-full transition-shadow ${
                settings.frameColor === c.id
                  ? "ring-2 ring-stone-800 ring-offset-2"
                  : "hover:ring-1 hover:ring-stone-300 hover:ring-offset-1"
              } ${c.border ? "border border-stone-200" : ""}`}
              style={{ backgroundColor: c.swatch }}
            />
          ))}
        </div>
      </div>

      {/* Border thickness */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <SectionLabel>{t("borderWidth")}</SectionLabel>
          <span className="text-xs tabular-nums text-stone-500">
            {Math.round(settings.borderScale * 100)}%
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-stone-400">{t("borderThin")}</span>
          <input
            type="range"
            min={MIN_BORDER_SCALE}
            max={MAX_BORDER_SCALE}
            step={0.05}
            value={settings.borderScale}
            onChange={(e) => patch({ borderScale: Number(e.target.value) })}
            className={sliderClass}
            aria-label={t("borderWidth")}
          />
          <span className="text-xs text-stone-400">{t("borderThick")}</span>
        </div>
        {settings.borderScale !== DEFAULT_BORDER_SCALE && (
          <button
            type="button"
            onClick={() => patch({ borderScale: DEFAULT_BORDER_SCALE })}
            className="text-xs text-stone-400 transition-colors hover:text-stone-600"
          >
            {t("reset")}
          </button>
        )}
      </div>

      {/* Corner radius */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <SectionLabel>{t("cornerRadius")}</SectionLabel>
          <span className="text-xs tabular-nums text-stone-500">
            {Math.round(settings.cornerRadius * 1000) / 10}%
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-stone-400">{t("cornerSharp")}</span>
          <input
            type="range"
            min={MIN_CORNER_RADIUS}
            max={MAX_CORNER_RADIUS}
            step={0.005}
            value={settings.cornerRadius}
            onChange={(e) => patch({ cornerRadius: Number(e.target.value) })}
            className={sliderClass}
            aria-label={t("cornerRadius")}
          />
          <span className="text-xs text-stone-400">{t("cornerRound")}</span>
        </div>
        {settings.cornerRadius !== DEFAULT_CORNER_RADIUS && (
          <button
            type="button"
            onClick={() => patch({ cornerRadius: DEFAULT_CORNER_RADIUS })}
            className="text-xs text-stone-400 transition-colors hover:text-stone-600"
          >
            {t("reset")}
          </button>
        )}
      </div>

      {/* Shadow */}
      <div>
        <SectionLabel>{t("shadow")}</SectionLabel>
        <div className="space-y-2">
          <label className="flex cursor-pointer items-center justify-between rounded-lg border border-stone-200 bg-white px-3 py-2.5">
            <span className="text-sm text-stone-700">{t("previewShadow")}</span>
            <input
              type="checkbox"
              checked={settings.previewShadow}
              onChange={(e) => patch({ previewShadow: e.target.checked })}
              className="h-4 w-4 rounded border-stone-300 accent-stone-800"
            />
          </label>
          <label className="flex cursor-pointer items-center justify-between rounded-lg border border-stone-200 bg-white px-3 py-2.5">
            <span className="text-sm text-stone-700">{t("exportShadow")}</span>
            <input
              type="checkbox"
              checked={settings.exportShadow}
              onChange={(e) => patch({ exportShadow: e.target.checked })}
              className="h-4 w-4 rounded border-stone-300 accent-stone-800"
            />
          </label>
        </div>
      </div>

      {/* Text size */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <SectionLabel>{t("textSize")}</SectionLabel>
          <span className="text-xs tabular-nums text-stone-500">
            {Math.round(settings.textScale * 100)}%
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-stone-400">{t("textSizeSmall")}</span>
          <input
            type="range"
            min={MIN_TEXT_SCALE}
            max={MAX_TEXT_SCALE}
            step={0.05}
            value={settings.textScale}
            onChange={(e) => patch({ textScale: Number(e.target.value) })}
            className={sliderClass}
            aria-label={t("textSize")}
          />
          <span className="text-xs text-stone-400">{t("textSizeLarge")}</span>
        </div>
        {settings.textScale !== DEFAULT_TEXT_SCALE && (
          <button
            type="button"
            onClick={() => patch({ textScale: DEFAULT_TEXT_SCALE })}
            className="text-xs text-stone-400 transition-colors hover:text-stone-600"
          >
            {t("reset")}
          </button>
        )}
      </div>

      {/* Text align */}
      <div>
        <SectionLabel>{t("textAlign")}</SectionLabel>
        <div className="inline-flex rounded-full border border-stone-200 bg-white p-0.5">
          {(["left", "center", "right"] as TextAlign[]).map((align) => (
            <button
              key={align}
              type="button"
              onClick={() => patch({ textAlign: align })}
              className={segmentBtn(settings.textAlign === align)}
            >
              {t(`textAlign_${align}`)}
            </button>
          ))}
        </div>
      </div>

      {/* Signature / watermark */}
      <div>
        <SectionLabel>{t("signature")}</SectionLabel>
        <input
          type="text"
          value={settings.signature}
          onChange={(e) => patch({ signature: e.target.value })}
          placeholder={t("signaturePlaceholder")}
          className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-stone-800 outline-none transition-colors placeholder:text-stone-300 focus:border-stone-400"
        />
        <p className="mt-1.5 text-xs text-stone-400">{t("signatureHint")}</p>
      </div>

      {/* Display toggles — hide ones that don't apply to minimal */}
      {settings.template !== "minimal" && (
        <div>
          <SectionLabel>{t("displayItems")}</SectionLabel>
          <div className="space-y-2">
            {(
              [
                { key: "showShotOn", label: "toggleShotOn" },
                { key: "showMake", label: "toggleMake" },
                { key: "showSpecs", label: "toggleSpecs" },
              ] as const
            ).map(({ key, label }) => (
              <label
                key={key}
                className="flex cursor-pointer items-center justify-between rounded-lg border border-stone-200 bg-white px-3 py-2.5"
              >
                <span className="text-sm text-stone-700">{t(label)}</span>
                <input
                  type="checkbox"
                  checked={settings[key]}
                  onChange={(e) => patch({ [key]: e.target.checked })}
                  className="h-4 w-4 rounded border-stone-300 accent-stone-800"
                />
              </label>
            ))}
          </div>
        </div>
      )}

      {settings.template === "minimal" && (
        <div>
          <SectionLabel>{t("displayItems")}</SectionLabel>
          <label className="flex cursor-pointer items-center justify-between rounded-lg border border-stone-200 bg-white px-3 py-2.5">
            <span className="text-sm text-stone-700">{t("toggleSpecs")}</span>
            <input
              type="checkbox"
              checked={settings.showSpecs}
              onChange={(e) => patch({ showSpecs: e.target.checked })}
              className="h-4 w-4 rounded border-stone-300 accent-stone-800"
            />
          </label>
        </div>
      )}

      {/* Export format */}
      <div className="space-y-3">
        <div>
          <SectionLabel>{t("exportFormat")}</SectionLabel>
          <div className="inline-flex rounded-full border border-stone-200 bg-white p-0.5">
            {(["png", "jpeg"] as ExportFormat[]).map((format) => (
              <button
                key={format}
                type="button"
                onClick={() => patch({ exportFormat: format })}
                className={segmentBtn(settings.exportFormat === format)}
              >
                {format.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {settings.exportFormat === "jpeg" && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wider text-stone-400">
                {t("jpegQuality")}
              </span>
              <span className="text-xs tabular-nums text-stone-500">
                {Math.round(settings.jpegQuality * 100)}%
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-stone-400">{t("qualityLow")}</span>
              <input
                type="range"
                min={MIN_JPEG_QUALITY}
                max={MAX_JPEG_QUALITY}
                step={0.01}
                value={settings.jpegQuality}
                onChange={(e) =>
                  patch({ jpegQuality: Number(e.target.value) })
                }
                className={sliderClass}
                aria-label={t("jpegQuality")}
              />
              <span className="text-xs text-stone-400">{t("qualityHigh")}</span>
            </div>
            {settings.jpegQuality !== DEFAULT_JPEG_QUALITY && (
              <button
                type="button"
                onClick={() => patch({ jpegQuality: DEFAULT_JPEG_QUALITY })}
                className="text-xs text-stone-400 transition-colors hover:text-stone-600"
              >
                {t("reset")}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
