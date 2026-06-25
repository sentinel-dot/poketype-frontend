"use client";

import type { SoulLinkTeamSlot } from "@/lib/soullinkTypes";

interface TeamSlotButtonProps {
  slot: SoulLinkTeamSlot;
  onClick: () => void;
  isOwn: boolean;
}

export default function TeamSlotButton({ slot, onClick, isOwn }: TeamSlotButtonProps) {
  const isEmpty = slot.status === "empty";
  const isDead = slot.status === "dead";
  const spriteUrl = slot.pokemonId
    ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${slot.pokemonId}.png`
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
      className="relative flex min-w-0 items-center justify-center rounded-lg transition-all duration-150"
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
        <span className="text-sm font-bold" style={{ color: "oklch(0.95 0 0 / 0.18)" }}>
          {isOwn ? "+" : "·"}
        </span>
      ) : (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={spriteUrl!}
            alt={slot.pokemonName ?? ""}
            className={`h-8 w-8 object-contain transition-all ${
              isDead ? "grayscale opacity-30" : "drop-shadow-sm"
            }`}
          />
          {slot.level != null && (
            <span
              className="absolute bottom-0 right-0.5 text-[8px] font-black leading-none"
              style={{ color: "oklch(0.65 0 0)" }}
            >
              {slot.level}
            </span>
          )}
          {isDead && (
            <span
              className="absolute inset-0 flex items-center justify-center text-xs font-black"
              style={{ color: "oklch(0.65 0.2 15)" }}
            >
              ✕
            </span>
          )}
        </>
      )}
    </button>
  );
}
