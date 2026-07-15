"use client";

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
    <div className="space-y-4">
      {showNoExifWarning && (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
          {t("noExif")}
        </p>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        {fields.map(({ key, labelKey }) => (
          <label key={key} className="block">
            <span className="mb-1 block text-xs font-medium uppercase tracking-wider text-stone-400">
              {t(labelKey)}
            </span>
            <input
              type="text"
              value={data[key]}
              onChange={(e) => onChange({ ...data, [key]: e.target.value })}
              className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-stone-800 outline-none transition-colors placeholder:text-stone-300 focus:border-stone-400"
            />
          </label>
        ))}
      </div>
    </div>
  );
}
