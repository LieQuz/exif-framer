export type FrameColor = "white" | "offwhite" | "black";
export type TextAlign = "center" | "left" | "right";
export type ExportFormat = "png" | "jpeg";
export type FrameTemplate = "shoton" | "minimal" | "film";
export type AspectPreset = "original" | "square";

export type FrameSettings = {
  template: FrameTemplate;
  aspectPreset: AspectPreset;
  textScale: number;
  frameColor: FrameColor;
  /** Scales side/top border thickness (0.5–2) */
  borderScale: number;
  textAlign: TextAlign;
  showShotOn: boolean;
  showMake: boolean;
  showSpecs: boolean;
  /** Optional signature / watermark under the caption */
  signature: string;
  /** 0–1 relative corner radius */
  cornerRadius: number;
  /** Soft drop shadow in the on-screen preview */
  previewShadow: boolean;
  /** Bake shadow into the downloaded file */
  exportShadow: boolean;
  exportFormat: ExportFormat;
  /** JPEG quality 0.5–1 */
  jpegQuality: number;
};

export const DEFAULT_TEXT_SCALE = 1;
export const MIN_TEXT_SCALE = 0.6;
export const MAX_TEXT_SCALE = 1.8;

export const DEFAULT_BORDER_SCALE = 1;
export const MIN_BORDER_SCALE = 0.5;
export const MAX_BORDER_SCALE = 2;

export const DEFAULT_CORNER_RADIUS = 0;
export const MIN_CORNER_RADIUS = 0;
export const MAX_CORNER_RADIUS = 0.08;

export const DEFAULT_JPEG_QUALITY = 0.92;
export const MIN_JPEG_QUALITY = 0.5;
export const MAX_JPEG_QUALITY = 1;

export const defaultFrameSettings = (): FrameSettings => ({
  template: "shoton",
  aspectPreset: "original",
  textScale: DEFAULT_TEXT_SCALE,
  frameColor: "white",
  borderScale: DEFAULT_BORDER_SCALE,
  textAlign: "center",
  showShotOn: true,
  showMake: true,
  showSpecs: true,
  signature: "",
  cornerRadius: DEFAULT_CORNER_RADIUS,
  previewShadow: true,
  exportShadow: false,
  exportFormat: "png",
  jpegQuality: DEFAULT_JPEG_QUALITY,
});

export const FRAME_COLORS: Record<
  FrameColor,
  { bg: string; muted: string; bold: string }
> = {
  white: { bg: "#FFFFFF", muted: "#8A8A8A", bold: "#111111" },
  offwhite: { bg: "#F7F4EF", muted: "#8A857C", bold: "#1A1814" },
  black: { bg: "#111111", muted: "#9A9A9A", bold: "#F5F5F5" },
};

export const TEMPLATES: FrameTemplate[] = ["shoton", "minimal", "film"];
export const ASPECT_PRESETS: AspectPreset[] = ["original", "square"];
