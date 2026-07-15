/** Guess MIME when iOS Photos leaves file.type empty. */
export function guessImageMime(name: string): string {
  const lower = name.toLowerCase();
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".gif")) return "image/gif";
  if (lower.endsWith(".heic") || lower.endsWith(".heif")) return "image/heic";
  return "image/jpeg";
}

/**
 * Copy File bytes before the <input> is cleared / unmounted.
 * iOS Safari otherwise invalidates the File reference.
 */
export async function snapshotFiles(list: FileList | File[]): Promise<File[]> {
  const files = Array.from(list);
  const out: File[] = [];
  for (const file of files) {
    const buffer = await file.arrayBuffer();
    out.push(
      new File([buffer], file.name || "photo.jpg", {
        type: file.type || guessImageMime(file.name),
        lastModified: file.lastModified,
      }),
    );
  }
  return out;
}
