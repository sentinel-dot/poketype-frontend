"use client";

import { useState, useEffect } from "react";
import { getAnimatedSpriteUrl, getPixelSpriteUrl } from "@/lib/apiclient";
import type { SoulLinkTeamSlot } from "@/lib/soullinkTypes";

interface TeamSlotButtonProps {
  slot: SoulLinkTeamSlot;
  onClick: () => void;
  isOwn: boolean;
}

export default function TeamSlotButton({ slot, onClick, isOwn }: TeamSlotButtonProps) {
  const [useFallbackSprite, setUseFallbackSprite] = useState(false);

  useEffect(() => {
    setUseFallbackSprite(false);
  }, [slot.pokemonId]);

  const isEmpty = slot.status === "empty";
  const isDead = slot.status === "dead";
  const spriteUrl = slot.pokemonId
    ? useFallbackSprite
      ? getPixelSpriteUrl(slot.pokemonId)
      : getAnimatedSpriteUrl(slot.pokemonId)
    : null;

  return (
    <button
      onClick={isOwn ? onClick : undefined}
      disabled={!isOwn}
      aria-label={
        isEmpty
          ? `Slot ${slot.slot} leer`
          : `${slot.pokemonName ?? "Pokémon"} in Slot ${slot.slot}`
      }
      className="relative flex min-h-0 min-w-0 items-center justify-center rounded-lg transition-all duration-150"
      style={{
        background: isEmpty
          ? "oklch(0.95 0 0 / 0.03)"
          : isDead
          ? "oklch(0.95 0 0 / 0.04)"
          : "oklch(0.55 0.22 15 / 0.08)",
        border: `1px solid ${
          isEmpty
            ? "oklch(0.95 0 0 / 0.08)"
            : isDead
            ? "oklch(0.95 0 0 / 0.06)"
            : "oklch(0.55 0.22 15 / 0.22)"
        }`,
        cursor: isOwn ? "pointer" : "default",
      }}
    >
      {isEmpty ? (
        <span className="text-base font-bold" style={{ color: "oklch(0.95 0 0 / 0.18)" }}>
          {isOwn ? "+" : "·"}
        </span>
      ) : (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={spriteUrl!}
            alt={slot.pokemonName ?? ""}
            onError={() => setUseFallbackSprite(true)}
            className={`h-11 w-11 object-contain transition-all ${
              isDead ? "grayscale opacity-40" : "drop-shadow-sm"
            }`}
            style={{ imageRendering: "pixelated" }}
          />
          {slot.level != null && (
            <span
              className="absolute bottom-0.5 right-1 text-[9px] font-black leading-none"
              style={{ color: "oklch(0.65 0 0)" }}
            >
              {slot.level}
            </span>
          )}
        </>
      )}
    </button>
  );
}
