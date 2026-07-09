"use client";

import { useToastStore, type ToastVariant } from "@/lib/toastStore";

const VARIANT_STYLE: Record<ToastVariant, { bg: string; border: string; color: string }> = {
  info: {
    bg: "oklch(0.55 0.18 250 / 0.12)",
    border: "oklch(0.55 0.18 250 / 0.30)",
    color: "oklch(0.80 0.14 250)",
  },
  success: {
    bg: "oklch(0.55 0.18 150 / 0.12)",
    border: "oklch(0.55 0.18 150 / 0.30)",
    color: "oklch(0.75 0.15 150)",
  },
  error: {
    bg: "oklch(0.55 0.22 15 / 0.12)",
    border: "oklch(0.55 0.22 15 / 0.30)",
    color: "oklch(0.78 0.16 15)",
  },
  warning: {
    bg: "oklch(0.62 0.16 70 / 0.12)",
    border: "oklch(0.62 0.16 70 / 0.30)",
    color: "oklch(0.80 0.14 70)",
  },
};

export default function Toaster() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);

  if (toasts.length === 0) return null;

  return (
    <div className="pointer-events-none fixed bottom-4 left-1/2 z-[100] flex w-full max-w-sm -translate-x-1/2 flex-col gap-2 px-4">
      {toasts.map((t) => {
        const style = VARIANT_STYLE[t.variant];
        return (
          <div
            key={t.id}
            role="status"
            className="pointer-events-auto flex items-center gap-3 rounded-xl px-4 py-3 text-sm shadow-lg animate-fade-in-up"
            style={{
              background: style.bg,
              border: `1px solid ${style.border}`,
              color: style.color,
              backdropFilter: "blur(12px)",
            }}
          >
            <span className="flex-1 font-medium">{t.message}</span>
            {t.actionLabel && t.onAction && (
              <button
                onClick={() => {
                  t.onAction!();
                  dismiss(t.id);
                }}
                className="shrink-0 rounded-lg px-2.5 py-1 text-xs font-bold underline-offset-2 transition-colors hover:underline"
              >
                {t.actionLabel}
              </button>
            )}
            <button
              onClick={() => dismiss(t.id)}
              className="shrink-0 opacity-60 transition-opacity hover:opacity-100"
              aria-label="Schließen"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        );
      })}
    </div>
  );
}
