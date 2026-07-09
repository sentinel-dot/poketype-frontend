"use client";

import { getPixelSpriteUrl } from "@/lib/apiclient";
import type { GraveyardEntry } from "@/lib/soullinkTypes";

interface GraveyardPanelProps {
  entries: GraveyardEntry[];
  onClose: () => void;
}

export default function GraveyardPanel({ entries, onClose }: GraveyardPanelProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: "oklch(0 0 0 / 0.72)", backdropFilter: "blur(4px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="glass-card flex max-h-[80vh] w-full max-w-md flex-col p-5 animate-fade-in-up">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-base font-black text-foreground">
            <span aria-hidden>🪦</span> Friedhof
            <span className="text-sm font-semibold text-muted-foreground">({entries.length})</span>
          </h2>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg"
            style={{ background: "oklch(0.95 0 0 / 0.08)", border: "1px solid oklch(0.95 0 0 / 0.12)", color: "oklch(0.5 0 0)" }}
            aria-label="Schließen"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {entries.length === 0 ? (
          <p className="rounded-xl border border-border bg-card px-4 py-8 text-center text-sm text-muted-foreground/60">
            Noch keine gefallenen Pokémon. Bleibt so! 🙏
          </p>
        ) : (
          <div className="flex flex-col gap-1.5 overflow-y-auto">
            {entries.map((e, idx) => (
              <div
                key={`${e.pokemonId}-${e.seatId ?? "x"}-${idx}`}
                className="flex items-center gap-3 rounded-xl border border-border bg-card px-3 py-2"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={getPixelSpriteUrl(e.pokemonId)}
                  alt=""
                  width={36}
                  height={36}
                  loading="lazy"
                  decoding="async"
                  className="grayscale opacity-60"
                  style={{ imageRendering: "pixelated" }}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground/80">
                    {e.pokemonName ?? `#${e.pokemonId}`}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {e.displayName ?? "—"}
                    {e.routeLabel ? ` · ${e.routeLabel}` : ""}
                  </p>
                </div>
                <span aria-hidden className="text-sm opacity-50">☠</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
