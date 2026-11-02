"use client";

import { AlertIcon } from "@/components/ui/icons";
import type { ExifData } from "@/lib/exif";
import { useI18n } from "@/lib/i18n/context";

type ExifEditorProps = {
  data: ExifData;
  onChange: (data: ExifData) => void;
  showNoExifWarning?: boolean;
};

const fields: { key: keyof ExifData; labelKey: string }[] = [
  { key: "make", labelKey: "make" },
  { key: "model", labelKey: "model" },
  { key: "focalLength", labelKey: "focalLength" },
  { key: "aperture", labelKey: "aperture" },
  { key: "shutterSpeed", labelKey: "shutterSpeed" },
  { key: "iso", labelKey: "iso" },
];

export function ExifEditor({
  data,
  onChange,
  showNoExifWarning,
}: ExifEditorProps) {
  const { t } = useI18n();

  return (
    <section className="space-y-5">
      <p className="text-sm leading-6 text-ink-muted">{t("cameraHint")}</p>

      {showNoExifWarning && (
        <p
          role="status"
          className="flex gap-2 rounded-xl border border-warning/25 bg-warning/5 px-3 py-3 text-sm leading-6 text-ink"
        >
          <AlertIcon className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
          <span>{t("noExif")}</span>
        </p>
      )}

      <div className="grid gap-4">
        {fields.map(({ key, labelKey }) => (
          <label key={key} className="block">
            <span className="section-label mb-2">{t(labelKey)}</span>
            <input
              type="text"
              value={data[key]}
              onChange={(event) =>
                onChange({ ...data, [key]: event.target.value })
              }
              autoComplete="off"
              spellCheck={false}
              className="field"
            />
          </label>
        ))}
      </div>
    </section>
  );
}
