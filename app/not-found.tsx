import Link from "next/link";
import { ApertureIcon, ArrowLeftIcon } from "@/components/ui/icons";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-surface px-4 py-16">
      <div className="w-full max-w-md rounded-[28px] border border-line bg-surface-raised p-8 text-center shadow-card">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-surface-raised shadow-soft">
          <ApertureIcon className="h-6 w-6" />
        </span>
        <p className="mt-6 font-mono text-xs uppercase tracking-[0.18em] text-ink-muted">
          404
        </p>
        <h1 className="mt-3 font-display text-2xl font-semibold tracking-tight text-ink">
          ページが見つかりません
        </h1>
        <p className="mt-1 text-sm font-medium text-ink-muted">Page not found</p>
        <p className="mt-4 text-base leading-7 text-ink-muted">
          URL が変わったか、ページが削除された可能性があります。
          <br />
          The URL may have changed, or the page may have been removed.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-medium text-surface-raised shadow-action transition-colors hover:bg-primary-hover"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          EXIF Framer に戻る
        </Link>
      </div>
    </main>
  );
}
