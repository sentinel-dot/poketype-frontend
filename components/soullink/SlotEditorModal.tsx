"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import type { SoulLinkTeamSlot, SlotStatus } from "@/lib/soullinkTypes";
import { POOL_TO_MAX_DEX } from "@/lib/soullinkTypes";
import { useRoomStore } from "@/lib/soullinkStore";
import type { PokemonSuggestion } from "@/lib/apiclient";
import { getAnimatedSpriteUrl, getPixelSpriteUrl } from "@/lib/apiclient";
import PokemonSearchInput from "./PokemonSearchInput";

interface SlotEditorModalProps {
  seatId: string;
  slotNumber: number;
  slot: SoulLinkTeamSlot;
  onClose: () => void;
}

const inputCls =
  "w-full rounded-xl border border-border bg-card px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/40 outline-none transition-all duration-200 focus:border-primary/40 focus:ring-2 focus:ring-primary/10";

export default function SlotEditorModal({
  seatId,
  slotNumber,
  slot,
  onClose,
}: SlotEditorModalProps) {
  const params = useParams<{ roomCode: string }>();
  const roomCode = params.roomCode;
  const room = useRoomStore((s) => s.room);
  const socket = useRoomStore((s) => s.socket);

  const maxDex = room ? POOL_TO_MAX_DEX[room.pokemonPool] : null;

  const [selectedPokemon, setSelectedPokemon] = useState<PokemonSuggestion | null>(
    slot.pokemonId
      ? { id: slot.pokemonId, nameDE: slot.pokemonName ?? null, nameEN: null }
      : null
  );
  const [nickname, setNickname] = useState(slot.nickname ?? "");
  const [level, setLevel] = useState<string>(slot.level != null ? String(slot.level) : "");
  const [status, setStatus] = useState<SlotStatus>(
    slot.status === "empty" ? "alive" : slot.status
  );
  const [poolError, setPoolError] = useState<string | null>(null);

  function handleSave() {
    if (!selectedPokemon || !socket) return;
    if (maxDex != null && selectedPokemon.id > maxDex) {
      setPoolError(`Dieses Pokémon ist nicht im Pool dieser Room (bis #${maxDex}).`);
      return;
    }
    setPoolError(null);
    const lvl = level ? parseInt(level, 10) : null;
    if (lvl !== null && (isNaN(lvl) || lvl < 1 || lvl > 100)) return;
    socket.emit("team-slot:update", {
      roomCode,
      seatId,
      slot: slotNumber,
      patch: {
        pokemonId: selectedPokemon.id,
        nickname: nickname.trim() || null,
        level: lvl,
        status,
      },
    });
    onClose();
  }

  function handleClear() {
    if (!socket) return;
    socket.emit("team-slot:clear", { roomCode, seatId, slot: slotNumber });
    onClose();
  }

  const [spriteFallback, setSpriteFallback] = useState(false);

  useEffect(() => {
    setSpriteFallback(false);
  }, [selectedPokemon?.id]);

  const spriteUrl = selectedPokemon
    ? spriteFallback
      ? getPixelSpriteUrl(selectedPokemon.id)
      : getAnimatedSpriteUrl(selectedPokemon.id)
    : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: "oklch(0 0 0 / 0.72)", backdropFilter: "blur(4px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-sm rounded-2xl p-5"
        style={{
          background: "oklch(0.11 0.03 260 / 0.97)",
          border: "1px solid oklch(0.95 0 0 / 0.1)",
          boxShadow: "0 32px 64px oklch(0 0 0 / 0.55), inset 0 1px 0 oklch(0.95 0 0 / 0.06)",
        }}
      >
        {/* Modal header */}
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {spriteUrl && (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={spriteUrl}
                  alt={selectedPokemon?.nameDE ?? ""}
                  onError={() => setSpriteFallback(true)}
                  className="h-10 w-10 object-contain"
                  style={{ imageRendering: "pixelated" }}
                />
              </>
            )}
            <h2 className="text-sm font-bold text-foreground">
              Slot {slotNumber} bearbeiten
            </h2>
          </div>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg transition-colors"
            style={{
              background: "oklch(0.95 0 0 / 0.05)",
              border: "1px solid oklch(0.95 0 0 / 0.08)",
              color: "oklch(0.5 0 0)",
            }}
            aria-label="Schließen"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex flex-col gap-3.5">
          {/* Pokémon search */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Pokémon
            </label>
            <PokemonSearchInput
              value={selectedPokemon}
              onChange={(pokemon) => {
                setSelectedPokemon(pokemon);
                setPoolError(null);
              }}
            />
            {poolError && (
              <p className="text-xs text-red-400/90">{poolError}</p>
            )}
          </div>

          {/* Nickname + Level row */}
          <div className="flex gap-2.5">
            <div className="flex flex-col gap-1.5 flex-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Nickname <span className="text-muted-foreground/40 normal-case font-normal">(opt.)</span>
              </label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                maxLength={50}
                placeholder="z. B. Flammi"
                className={inputCls}
              />
            </div>

            <div className="flex flex-col gap-1.5 w-20">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Level
              </label>
              <input
                type="number"
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                min={1}
                max={100}
                placeholder="1–100"
                className={inputCls}
              />
            </div>
          </div>

          {/* Status toggle */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Status
            </label>
            <div className="flex gap-2">
              {(["alive", "dead"] as SlotStatus[]).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatus(s)}
                  className="flex-1 rounded-xl py-2.5 text-xs font-bold transition-all duration-200"
                  style={{
                    background:
                      status === s
                        ? s === "alive"
                          ? "oklch(0.55 0.18 150 / 0.15)"
                          : "oklch(0.55 0.22 15 / 0.15)"
                        : "oklch(0.95 0 0 / 0.04)",
                    border: `1.5px solid ${
                      status === s
                        ? s === "alive"
                          ? "oklch(0.55 0.18 150 / 0.4)"
                          : "oklch(0.55 0.22 15 / 0.4)"
                        : "oklch(0.95 0 0 / 0.08)"
                    }`,
                    color:
                      status === s
                        ? s === "alive"
                          ? "oklch(0.72 0.18 150)"
                          : "oklch(0.75 0.18 15)"
                        : "oklch(0.4 0 0)",
                  }}
                >
                  {s === "alive" ? "✓ Lebt" : "✕ Tot"}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="mt-5 flex gap-2">
          <button
            onClick={handleSave}
            disabled={!selectedPokemon || !socket}
            className="flex-1 rounded-xl py-2.5 text-sm font-bold text-white transition-all duration-200 disabled:opacity-40 active:scale-[0.98]"
            style={{
              background: "linear-gradient(135deg, var(--primary), oklch(0.44 0.22 15))",
              boxShadow:
                selectedPokemon && socket ? "0 4px 14px var(--primary-glow)" : "none",
            }}
          >
            Speichern
          </button>
          {slot.status !== "empty" && (
            <button
              onClick={handleClear}
              className="rounded-xl px-3 py-2.5 text-xs font-semibold transition-all duration-200"
              style={{
                background: "oklch(0.55 0.22 15 / 0.07)",
                border: "1px solid oklch(0.55 0.22 15 / 0.22)",
                color: "oklch(0.65 0.15 15)",
              }}
            >
              Leeren
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

