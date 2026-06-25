"use client";

export default function EmptySeat({ position }: { position: number }) {
  return (
    <section
      className="flex h-full flex-col items-center justify-center rounded-2xl"
      style={{
        border: "1.5px dashed oklch(0.95 0 0 / 0.1)",
        background: "oklch(0.10 0.02 260 / 0.5)",
      }}
    >
      <div
        className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3"
        style={{
          background: "oklch(0.55 0.22 15 / 0.07)",
          border: "1px solid oklch(0.55 0.22 15 / 0.18)",
        }}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="1.5" strokeOpacity="0.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <line x1="19" y1="8" x2="19" y2="14" />
          <line x1="16" y1="11" x2="22" y2="11" />
        </svg>
      </div>
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground/40 mb-1">Platz {position}</p>
      <p className="text-sm font-semibold text-muted-foreground">Warte auf Spieler…</p>
    </section>
  );
}
