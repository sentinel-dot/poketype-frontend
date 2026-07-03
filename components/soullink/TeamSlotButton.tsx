"use client";

import { useState, useEffect } from "react";
import { getAnimatedSpriteUrl, getPixelSpriteUrl } from "@/lib/apiclient";
import { usePokemonTypes } from "@/lib/pokemonTypeCache";
import { getTypeGradient, getTypeBorderColor } from "@/lib/types";
import type { SoulLinkTeamSlot } from "@/lib/soullinkTypes";

interface TeamSlotButtonProps {
  slot: SoulLinkTeamSlot;
  onClick: () => void;
  isOwn: boolean;
}

export default function TeamSlotButton({ slot, onClick, isOwn }: TeamSlotButtonProps) {
  const [useFallbackSprite, setUseFallbackSprite] = useState(false);
  const { types, loading: typesLoading } = usePokemonTypes(
    slot.pokemonId,
    slot.pokemonName
  );

  useEffect(() => {
    setUseFallbackSprite(false);
  }, [slot.pokemonId]);

  const isEmpty = slot.status === "empty";
  const isDead = slot.status === "dead";
  const displayName = slot.nickname ?? slot.pokemonName;
  const spriteUrl = slot.pokemonId
    ? useFallbackSprite
      ? getPixelSpriteUrl(slot.pokemonId)
      : getAnimatedSpriteUrl(slot.pokemonId)
    : null;

  const background = isEmpty
    ? "oklch(0.95 0 0 / 0.03)"
    : isDead
    ? "oklch(0.95 0 0 / 0.04)"
    : types.length > 0
    ? getTypeGradient(types, 0.28)
    : typesLoading
    ? "oklch(0.95 0 0 / 0.04)"
    : getTypeGradient([], 0.28);

  const borderColor = isEmpty
    ? "oklch(0.95 0 0 / 0.08)"
    : isDead
    ? "oklch(0.55 0.22 15 / 0.25)"
    : types.length > 0
    ? getTypeBorderColor(types, 0.4)
    : "oklch(0.95 0 0 / 0.10)";

  return (
    <button
      onClick={isOwn ? onClick : undefined}
      disabled={!isOwn}
      aria-label={
        isEmpty
          ? `Slot ${slot.slot} leer`
          : `${slot.pokemonName ?? "Pokémon"} in Slot ${slot.slot}`
      }
      className={`relative flex min-h-0 min-w-0 flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-1 transition-all duration-200 ${
        isOwn && !isEmpty ? "hover:brightness-110 hover:scale-[1.02]" : ""
      } ${types.length > 0 && !isEmpty ? "animate-fade-in" : ""}`}
      style={{
        background,
        border: `1.5px solid ${borderColor}`,
        cursor: isOwn ? "pointer" : "default",
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
            onError={() => setUseFallbackSprite(true)}
            className={`h-14 w-14 object-contain transition-all ${
              isDead ? "grayscale opacity-40" : "drop-shadow-md"
            }`}
            style={{ imageRendering: "pixelated" }}
          />
          {displayName && (
            <span className="max-w-full truncate px-0.5 text-[9px] font-semibold leading-tight text-foreground/70">
              {displayName}
            </span>
          )}
          {isDead && (
            <span
              className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-black"
              style={{
                background: "oklch(0.55 0.22 15 / 0.85)",
                color: "white",
              }}
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
