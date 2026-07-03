"use client";

const POSITION_ACCENT: Record<number, { bg: string; border: string }> = {
  1: { bg: "var(--player-1)", border: "var(--player-1-border)" },
  2: { bg: "var(--player-2)", border: "var(--player-2-border)" },
  3: { bg: "var(--player-3)", border: "var(--player-3-border)" },
};

export default function EmptySeat({ position }: { position: number }) {
  const accent = POSITION_ACCENT[position] ?? POSITION_ACCENT[1];

  return (
    <section
      className="flex h-full flex-col items-center justify-center rounded-2xl"
      style={{
        border: `1.5px dashed ${accent.border}`,
        background: accent.bg,
      }}
    >
      <div className="relative mb-4">
        <div
          className="absolute inset-0 animate-ping rounded-2xl opacity-30"
          style={{ background: accent.border }}
        />
        <div
          className="relative flex h-14 w-14 items-center justify-center rounded-2xl"
          style={{
            background: "oklch(0.55 0.22 15 / 0.10)",
            border: `1px solid ${accent.border}`,
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="1.5" strokeOpacity="0.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <line x1="19" y1="8" x2="19" y2="14" />
            <line x1="16" y1="11" x2="22" y2="11" />
          </svg>
        </div>
      </div>
      <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">
        Platz {position}
      </p>
      <p className="text-sm font-semibold text-muted-foreground">Warte auf Spieler…</p>
      <p className="mt-2 max-w-[140px] text-center text-[10px] text-muted-foreground/40">
        Einladungslink im Header teilen
      </p>
    </section>
  );
}
