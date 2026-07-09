"use client";

import { memo, useMemo, useState, useEffect } from "react";
import {
  getAnimatedSpriteUrl,
  getPixelSpriteUrl,
  getShinyAnimatedSpriteUrl,
  getShinyPixelSpriteUrl,
} from "@/lib/apiclient";
import { usePokemonTypes } from "@/lib/pokemonTypeCache";
import { getTypeGradient, getTypeBorderColor } from "@/lib/types";
import type { SoulLinkTeamSlot } from "@/lib/soullinkTypes";

interface TeamSlotButtonProps {
  slot: SoulLinkTeamSlot;
  onClick: () => void;
  isOwn: boolean;
  levelCap?: number | null;
  highlight?: boolean;
}

function TeamSlotButtonImpl({ slot, onClick, isOwn, levelCap, highlight }: TeamSlotButtonProps) {
  const [useFallbackSprite, setUseFallbackSprite] = useState(false);
  const { types, loading: typesLoading } = usePokemonTypes(slot.pokemonId, slot.pokemonName);

  useEffect(() => {
    setUseFallbackSprite(false);
  }, [slot.pokemonId]);

  const isEmpty = slot.status === "empty";
  const isDead = slot.status === "dead";
  const isShiny = slot.isShiny === true;
  const isClickable = isOwn || !isEmpty;
  const displayName = slot.nickname ?? slot.pokemonName;
  const overCap = levelCap != null && slot.level != null && slot.level > levelCap;

  const spriteUrl = useMemo(() => {
    if (!slot.pokemonId) return null;
    if (useFallbackSprite) {
      return isShiny ? getShinyPixelSpriteUrl(slot.pokemonId) : getPixelSpriteUrl(slot.pokemonId);
    }
    return isShiny ? getShinyAnimatedSpriteUrl(slot.pokemonId) : getAnimatedSpriteUrl(slot.pokemonId);
  }, [slot.pokemonId, useFallbackSprite, isShiny]);

  const background = useMemo(() => {
    if (isEmpty) return "oklch(0.95 0 0 / 0.03)";
    if (isDead) return "oklch(0.95 0 0 / 0.04)";
    if (types.length > 0) return getTypeGradient(types, 0.28);
    return "oklch(0.95 0 0 / 0.04)";
  }, [isEmpty, isDead, types]);

  const borderColor = useMemo(() => {
    if (highlight) return "oklch(0.80 0.18 15 / 0.7)";
    if (isEmpty) return "oklch(0.95 0 0 / 0.08)";
    if (isDead) return "oklch(0.55 0.22 15 / 0.25)";
    if (types.length > 0) return getTypeBorderColor(types, 0.4);
    return "oklch(0.95 0 0 / 0.10)";
  }, [highlight, isEmpty, isDead, types]);

  return (
    <button
      onClick={isClickable ? onClick : undefined}
      disabled={!isClickable}
      aria-label={isEmpty ? `Slot ${slot.slot} leer` : `${slot.pokemonName ?? "Pokémon"} in Slot ${slot.slot}`}
      className={`relative flex min-h-0 min-w-0 flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-1 transition-all duration-200 ${
        isClickable && !isEmpty ? "hover:brightness-110 hover:scale-[1.02]" : ""
      }`}
      style={{
        background,
        border: `1.5px solid ${borderColor}`,
        boxShadow: highlight ? "0 0 0 2px oklch(0.80 0.18 15 / 0.25)" : undefined,
        cursor: isClickable ? "pointer" : "default",
        opacity: typesLoading && !isEmpty ? 0.85 : 1,
      }}
    >
      {isEmpty ? (
        <span className="text-xl font-bold" style={{ color: "oklch(0.95 0 0 / 0.18)" }}>
          {isOwn ? "+" : "·"}
        </span>
      ) : (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={spriteUrl!}
            alt={slot.pokemonName ?? ""}
            width={56}
            height={56}
            loading="lazy"
            decoding="async"
            onError={() => setUseFallbackSprite(true)}
            className={`h-14 w-14 object-contain transition-all ${
              isDead ? "grayscale opacity-40" : "drop-shadow-md"
            }`}
            style={{ imageRendering: "pixelated" }}
          />
          {displayName && (
            <span className="flex max-w-full items-center gap-0.5 truncate px-0.5 text-[9px] font-semibold leading-tight text-foreground/70">
              {slot.level != null && (
                <span style={{ color: overCap ? "oklch(0.80 0.18 15)" : "oklch(0.6 0 0)" }}>
                  Lv{slot.level}
                </span>
              )}
              <span className="truncate">{displayName}</span>
            </span>
          )}
          {isShiny && (
            <span className="absolute left-1 top-1 text-[11px] leading-none" aria-label="Schillernd" title="Schillernd">
              ✨
            </span>
          )}
          {overCap && (
            <span
              className="absolute bottom-1 right-1 flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-black"
              style={{ background: "oklch(0.65 0.2 60 / 0.9)", color: "white" }}
              title={`Über Level-Cap (${levelCap})`}
              aria-label="Über Level-Cap"
            >
              !
            </span>
          )}
          {isDead && (
            <span
              className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-black"
              style={{ background: "oklch(0.55 0.22 15 / 0.85)", color: "white" }}
              aria-label="Tot"
            >
              ✕
            </span>
          )}
        </>
      )}
    </button>
  );
}

const TeamSlotButton = memo(TeamSlotButtonImpl);
export default TeamSlotButton;
