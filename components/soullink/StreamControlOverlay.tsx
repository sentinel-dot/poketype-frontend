"use client";

interface StreamStartCTAProps {
  label: string;
  sublabel?: string;
  onClick: () => void;
  icon: "camera" | "screen";
  accent?: "green" | "blue";
}

export function StreamStartCTA({
  label,
  sublabel,
  onClick,
  icon,
  accent = "green",
}: StreamStartCTAProps) {
  const palette =
    accent === "green"
      ? {
          soft: "oklch(0.55 0.18 150 / 0.12)",
          border: "oklch(0.55 0.18 150 / 0.3)",
          text: "oklch(0.7 0.18 150)",
          glow: "oklch(0.55 0.18 150 / 0.08)",
        }
      : {
          soft: "oklch(0.55 0.22 250 / 0.12)",
          border: "oklch(0.55 0.22 250 / 0.3)",
          text: "oklch(0.7 0.18 250)",
          glow: "oklch(0.55 0.22 250 / 0.08)",
        };

  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex flex-col items-center gap-3 rounded-2xl px-6 py-5 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
      style={{
        background: "oklch(0.12 0.025 260 / 0.85)",
        border: `1px solid ${palette.border}`,
        boxShadow: `0 0 24px ${palette.glow}`,
      }}
    >
      <div
        className="flex h-12 w-12 items-center justify-center rounded-xl transition-colors duration-200"
        style={{
          background: palette.soft,
          border: `1px solid ${palette.border}`,
          color: palette.text,
        }}
      >
        {icon === "camera" ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <path d="M23 7l-7 5 7 5V7z" />
            <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
          </svg>
        ) : (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
            <line x1="8" y1="21" x2="16" y2="21" />
            <line x1="12" y1="17" x2="12" y2="21" />
          </svg>
        )}
      </div>
      <div className="text-center">
        <span className="block text-sm font-semibold text-foreground/90">{label}</span>
        {sublabel && (
          <span className="mt-0.5 block text-[11px] text-muted-foreground/60">{sublabel}</span>
        )}
      </div>
    </button>
  );
}

interface StreamStopChipProps {
  label: string;
  onClick: () => void;
  accent?: "green" | "blue";
}

export function StreamStopChip({ label, onClick, accent = "green" }: StreamStopChipProps) {
  const colors =
    accent === "green"
      ? { border: "oklch(0.55 0.18 150 / 0.4)", text: "oklch(0.7 0.18 150)", dot: "oklch(0.55 0.18 150)" }
      : { border: "oklch(0.55 0.22 250 / 0.4)", text: "oklch(0.7 0.18 250)", dot: "oklch(0.55 0.22 250)" };

  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold transition-all duration-200 hover:brightness-110"
      style={{
        background: "oklch(0.08 0.02 260 / 0.88)",
        border: `1px solid ${colors.border}`,
        backdropFilter: "blur(8px)",
        color: colors.text,
      }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ background: colors.dot, boxShadow: `0 0 6px ${colors.dot}` }}
      />
      {label}
    </button>
  );
}

export function StreamPermissionError({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="flex max-w-[220px] flex-col items-center gap-3 px-4 text-center">
      <div
        className="rounded-xl px-3 py-2 text-[11px] leading-relaxed text-foreground/75"
        style={{
          background: "oklch(0.55 0.22 15 / 0.08)",
          border: "1px solid oklch(0.55 0.22 15 / 0.25)",
        }}
      >
        {message}
      </div>
      <button
        type="button"
        onClick={onRetry}
        className="text-[11px] font-semibold text-muted-foreground/70 underline-offset-2 hover:text-foreground hover:underline"
      >
        Erneut versuchen
      </button>
    </div>
  );
}

export function StreamUnavailableHint() {
  return (
    <div className="flex flex-col items-center gap-2 px-4 text-center">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.25">
        <path d="M23 7l-7 5 7 5V7z" />
        <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
        <line x1="1" y1="1" x2="23" y2="23" />
      </svg>
      <span className="text-[11px] text-muted-foreground/50">Streaming nicht verfügbar</span>
    </div>
  );
}
