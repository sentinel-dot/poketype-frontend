"use client";

import { useState } from "react";
import { getArtworkUrl } from "@/lib/apiclient";
import type { MatchupResponse, Multiplier } from "@/lib/types";
import { TYPE_COLORS, hexToRgb } from "@/lib/types";
import TypeChip from "@/components/TypeChip";
import MatchupSection from "@/components/MatchupSection";

interface Props {
  data: MatchupResponse;
}

const MATCHUP_ORDER: Multiplier[] = ["4", "2", "0.5", "0.25", "0"];

export default function PokemonCard({ data }: Props) {
  const [imgError, setImgError] = useState(false);
  const artworkUrl = data.pokemonId && !imgError ? getArtworkUrl(data.pokemonId) : null;

  // Type-based gradient for the card header
  const primaryHex = TYPE_COLORS[data.types[0]?.toLowerCase()] ?? "#1a2744";
  const secondaryHex = data.types[1]
    ? (TYPE_COLORS[data.types[1].toLowerCase()] ?? primaryHex)
    : primaryHex;

  const pc = hexToRgb(primaryHex);
  const sc = hexToRgb(secondaryHex);

  const headerGradient =
    data.types.length > 1
      ? `linear-gradient(135deg, rgba(${pc.r},${pc.g},${pc.b},0.35) 0%, rgba(${sc.r},${sc.g},${sc.b},0.25) 100%)`
      : `linear-gradient(135deg, rgba(${pc.r},${pc.g},${pc.b},0.35) 0%, rgba(${pc.r},${pc.g},${pc.b},0.12) 100%)`;

  const totalTypes = (Object.values(data.matchup) as string[][]).flat().length;

  return (
    <article
      className="rounded-2xl overflow-hidden animate-fade-in-up"
      style={{
        background: "oklch(0.95 0 0 / 0.034)",
        border: "1px solid oklch(0.95 0 0 / 0.08)",
        boxShadow: "0 32px 64px oklch(0 0 0 / 0.45), inset 0 1px 0 oklch(0.95 0 0 / 0.07)",
      }}
    >
      {/* ── Header ──────────────────────────────────────────────── */}
      <div
        className="relative p-5 sm:p-6 overflow-hidden"
        style={{ background: headerGradient, borderBottom: "1px solid oklch(0.95 0 0 / 0.07)" }}
      >
        {/* Decorative radial blobs */}
        <div
          className="absolute -right-8 -top-8 w-40 h-40 rounded-full pointer-events-none"
          style={{ background: `radial-gradient(circle, rgba(${pc.r},${pc.g},${pc.b},0.2) 0%, transparent 70%)` }}
        />
        <div
          className="absolute right-4 -bottom-10 w-28 h-28 rounded-full pointer-events-none"
          style={{ background: `radial-gradient(circle, rgba(${sc.r},${sc.g},${sc.b},0.15) 0%, transparent 70%)` }}
        />

        <div className="relative flex gap-4 sm:gap-5 items-center">
          {/* Sprite */}
          <div className="flex-shrink-0">
            {artworkUrl ? (
              <div
                className="w-24 h-24 sm:w-28 sm:h-28 flex items-center justify-center rounded-2xl"
                style={{
                  background: "oklch(0.95 0 0 / 0.06)",
                  border: "1px solid oklch(0.95 0 0 / 0.1)",
                  boxShadow: `0 8px 32px rgba(${pc.r},${pc.g},${pc.b},0.3)`,
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  className="w-20 h-20 sm:w-24 sm:h-24 object-contain animate-bounce drop-shadow-2xl"
                  style={{ animationDuration: "4s", animationTimingFunction: "ease-in-out" }}
                  src={artworkUrl}
                  alt={data.pokemon}
                  onError={() => setImgError(true)}
                />
              </div>
            ) : (
              <div
                className="w-24 h-24 rounded-2xl flex items-center justify-center text-4xl font-black text-white"
                style={{
                  background: `linear-gradient(135deg, rgba(${pc.r},${pc.g},${pc.b},0.6), rgba(${sc.r},${sc.g},${sc.b},0.4))`,
                  border: "1px solid oklch(0.95 0 0 / 0.1)",
                }}
              >
                {data.pokemon.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            {data.pokemonId && (
              <p className="text-[11px] font-bold tracking-widest text-foreground/30 uppercase mb-1">
                #{String(data.pokemonId).padStart(4, "0")}
              </p>
            )}
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight text-foreground">
              {data.pokemon.charAt(0).toUpperCase() + data.pokemon.slice(1)}
            </h2>
            <div className="flex flex-wrap gap-1.5 mt-2.5">
              {data.types.map((t) => (
                <TypeChip key={t} type={t} size="md" />
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-2.5 font-medium">
              Generation {data.generation}
            </p>
          </div>
        </div>
      </div>

      {/* ── Matchup ─────────────────────────────────────────────── */}
      <div className="p-4 sm:p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Typ-Matchup
          </h3>
          <span
            className="text-xs font-semibold px-2 py-0.5 rounded-full text-muted-foreground"
            style={{ background: "oklch(0.95 0 0 / 0.05)", border: "1px solid oklch(0.95 0 0 / 0.07)" }}
          >
            {totalTypes} Typen
          </span>
        </div>

        <div className="flex flex-col gap-2">
          {MATCHUP_ORDER.map((m) => (
            <MatchupSection key={m} multiplier={m} types={data.matchup[m] ?? []} />
          ))}
          <MatchupSection multiplier="1" types={data.matchup["1"] ?? []} collapsible />
        </div>
      </div>
    </article>
  );
}
