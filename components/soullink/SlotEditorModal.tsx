"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import type { SoulLinkTeamSlot, SlotStatus } from "@/lib/soullinkTypes";
import { useRoomStore, useUsedSpecies } from "@/lib/soullinkStore";
import type { PokemonSuggestion } from "@/lib/apiclient";
import { getAnimatedSpriteUrl, getPixelSpriteUrl, getShinyAnimatedSpriteUrl, getShinyPixelSpriteUrl } from "@/lib/apiclient";
import { prefetchPokemonTypes, usePokemonTypes } from "@/lib/pokemonTypeCache";
import { getTypeGradient, getTypeBorderColor } from "@/lib/types";
import { getFamilyKey, addEncounter } from "@/lib/soullinkApi";
import { toast } from "@/lib/toastStore";
import TypeChip from "@/components/TypeChip";
import PokemonSearchInput from "./PokemonSearchInput";

interface SlotEditorModalProps {
  seatId: string;
  slotNumber: number;
  slot: SoulLinkTeamSlot;
  levelCap?: number | null;
  onClose: () => void;
}

const OUTCOME_LABEL: Record<string, string> = {
  caught: "bereits gefangen",
  dead: "bereits gestorben",
  fled: "bereits geflüchtet",
};

export default function SlotEditorModal({
  seatId,
  slotNumber,
  slot,
  levelCap,
  onClose,
}: SlotEditorModalProps) {
  const params = useParams<{ roomCode: string }>();
  const roomCode = params.roomCode;
  const socket = useRoomStore((s) => s.socket);
  const myToken = useRoomStore((s) => s.myToken);
  const updateSlotOptimistic = useRoomStore((s) => s.updateSlot);
  const usedSpecies = useUsedSpecies(seatId);

  const [selectedPokemon, setSelectedPokemon] = useState<PokemonSuggestion | null>(
    slot.pokemonId
      ? { id: slot.pokemonId, nameDE: slot.pokemonName ?? null, nameEN: null }
      : null
  );
  const [nickname, setNickname] = useState(slot.nickname ?? "");
  const [level, setLevel] = useState(slot.level != null ? String(slot.level) : "");
  const [route, setRoute] = useState(slot.route ?? slot.encounterLabel ?? "");
  const [isShiny, setIsShiny] = useState(slot.isShiny === true);
  const [status, setStatus] = useState<SlotStatus>(
    slot.status === "empty" ? "alive" : slot.status
  );
  const [dupeFamilyKey, setDupeFamilyKey] = useState<number | null>(null);

  const { types } = usePokemonTypes(
    selectedPokemon?.id ?? null,
    selectedPokemon?.nameDE ?? selectedPokemon?.nameEN ?? null
  );

  useEffect(() => {
    if (selectedPokemon) {
      prefetchPokemonTypes(
        selectedPokemon.id,
        selectedPokemon.nameDE ?? selectedPokemon.nameEN
      );
    }
  }, [selectedPokemon]);

  // Resolve the evolution family of the selection for the dupes check.
  useEffect(() => {
    let cancelled = false;
    if (!selectedPokemon) {
      setDupeFamilyKey(null);
      return;
    }
    getFamilyKey(selectedPokemon.id).then((key) => {
      if (!cancelled) setDupeFamilyKey(key);
    });
    return () => {
      cancelled = true;
    };
  }, [selectedPokemon]);

  // Warn (only) if this family was already encountered on THIS seat.
  const dupeWarning = useMemo(() => {
    if (dupeFamilyKey == null) return null;
    const hit = usedSpecies.find(
      (u) => u.familyKey === dupeFamilyKey && u.pokemonId !== slot.pokemonId
    );
    return hit ?? null;
  }, [dupeFamilyKey, usedSpecies, slot.pokemonId]);

  function buildPatch() {
    const lvl = level.trim() === "" ? null : Math.max(1, Math.min(100, parseInt(level, 10) || 0));
    return {
      pokemonId: selectedPokemon!.id,
      nickname: nickname.trim() || null,
      level: lvl,
      route: route.trim() || null,
      encounterLabel: route.trim() || null,
      isShiny,
      status,
    };
  }

  function handleSave() {
    if (!selectedPokemon || !socket) return;
    const patch = buildPatch();
    // Optimistic — apply instantly, server broadcast reconciles.
    updateSlotOptimistic(seatId, slotNumber, {
      ...patch,
      pokemonName: selectedPokemon.nameDE ?? selectedPokemon.nameEN ?? null,
    });
    socket.emit("team-slot:update", { roomCode, seatId, slot: slotNumber, patch });
    onClose();
  }

  function handleClear() {
    if (!socket) return;
    socket.emit("team-slot:clear", { roomCode, seatId, slot: slotNumber });
    onClose();
  }

  async function handleFled() {
    if (!selectedPokemon || !myToken) return;
    try {
      await addEncounter(roomCode, seatId, selectedPokemon.id, "fled", route.trim() || null, myToken);
      toast.info(`${selectedPokemon.nameDE ?? selectedPokemon.nameEN ?? "Pokémon"} als geflüchtet vermerkt.`);
      onClose();
    } catch {
      toast.error("Konnte Fluchtversuch nicht speichern.");
    }
  }

  const [spriteFallback, setSpriteFallback] = useState(false);

  useEffect(() => {
    setSpriteFallback(false);
  }, [selectedPokemon?.id]);

  const spriteUrl = selectedPokemon
    ? spriteFallback
      ? isShiny
        ? getShinyPixelSpriteUrl(selectedPokemon.id)
        : getPixelSpriteUrl(selectedPokemon.id)
      : isShiny
      ? getShinyAnimatedSpriteUrl(selectedPokemon.id)
      : getAnimatedSpriteUrl(selectedPokemon.id)
    : null;

  const previewGradient =
    types.length > 0 ? getTypeGradient(types, 0.35) : "oklch(0.95 0 0 / 0.04)";
  const previewBorder =
    types.length > 0 ? getTypeBorderColor(types, 0.45) : "oklch(0.95 0 0 / 0.08)";

  const overCap =
    levelCap != null && level.trim() !== "" && (parseInt(level, 10) || 0) > levelCap;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: "oklch(0 0 0 / 0.72)", backdropFilter: "blur(4px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="glass-card max-h-[90vh] w-full max-w-sm overflow-y-auto p-5 animate-fade-in-up">
        {/* Modal header with type preview */}
        <div
          className="-mx-5 -mt-5 mb-5 rounded-t-2xl px-5 py-4 transition-all duration-300"
          style={{
            background: previewGradient,
            borderBottom: `1px solid ${previewBorder}`,
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {spriteUrl && (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={spriteUrl}
                    alt={selectedPokemon?.nameDE ?? ""}
                    onError={() => setSpriteFallback(true)}
                    className="h-12 w-12 object-contain drop-shadow-md"
                    style={{ imageRendering: "pixelated" }}
                  />
                </>
              )}
              <div>
                <h2 className="text-sm font-bold text-foreground">
                  Slot {slotNumber} bearbeiten
                </h2>
                {types.length > 0 && (
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {types.map((t) => (
                      <TypeChip key={t} type={t} size="sm" />
                    ))}
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="flex h-7 w-7 items-center justify-center rounded-lg transition-colors"
              style={{
                background: "oklch(0.95 0 0 / 0.08)",
                border: "1px solid oklch(0.95 0 0 / 0.12)",
                color: "oklch(0.5 0 0)",
              }}
              aria-label="Schließen"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-3.5">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Pokémon
            </label>
            <PokemonSearchInput
              value={selectedPokemon}
              onChange={setSelectedPokemon}
              usedSpecies={usedSpecies}
            />
          </div>

          {/* Dupes-clause warning (non-blocking) */}
          {dupeWarning && (
            <div
              className="flex items-start gap-2 rounded-xl px-3 py-2.5 text-xs"
              style={{
                background: "oklch(0.65 0.2 60 / 0.10)",
                border: "1px solid oklch(0.65 0.2 60 / 0.30)",
                color: "oklch(0.82 0.16 70)",
              }}
              role="alert"
            >
              <span aria-hidden>⚠</span>
              <span>
                Diese Entwicklungslinie wurde {OUTCOME_LABEL[dupeWarning.outcome] ?? "bereits genutzt"}
                {dupeWarning.pokemonName ? ` (${dupeWarning.pokemonName})` : ""}. Dupes-Klausel!
              </span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Level
              </label>
              <input
                type="number"
                min={1}
                max={100}
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                placeholder="—"
                className="input-field"
                style={overCap ? { borderColor: "oklch(0.65 0.2 60 / 0.5)" } : undefined}
              />
              {overCap && (
                <span className="text-[10px]" style={{ color: "oklch(0.82 0.16 70)" }}>
                  Über Level-Cap ({levelCap})
                </span>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Route / Ort
              </label>
              <input
                type="text"
                value={route}
                onChange={(e) => setRoute(e.target.value)}
                maxLength={100}
                placeholder="z. B. Route 1"
                className="input-field"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Nickname{" "}
              <span className="font-normal normal-case text-muted-foreground/40">(opt.)</span>
            </label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              maxLength={50}
              placeholder="z. B. Flammi"
              className="input-field"
            />
          </div>

          {/* Shiny toggle */}
          <button
            type="button"
            onClick={() => setIsShiny((v) => !v)}
            className="flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-bold transition-all"
            style={{
              background: isShiny ? "oklch(0.75 0.15 90 / 0.14)" : "oklch(0.95 0 0 / 0.04)",
              border: `1.5px solid ${isShiny ? "oklch(0.75 0.15 90 / 0.4)" : "oklch(0.95 0 0 / 0.08)"}`,
              color: isShiny ? "oklch(0.82 0.15 90)" : "oklch(0.5 0 0)",
            }}
          >
            <span>✨ Schillernd (Shiny)</span>
            <span>{isShiny ? "AN" : "AUS"}</span>
          </button>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
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

        <div className="mt-5 flex gap-2">
          <button
            onClick={handleSave}
            disabled={!selectedPokemon || !socket}
            className="btn-primary flex-1 disabled:shadow-none"
          >
            Speichern
          </button>
          {slot.status !== "empty" && (
            <button onClick={handleClear} className="btn-ghost">
              Leeren
            </button>
          )}
        </div>

        {selectedPokemon && myToken && (
          <button
            onClick={handleFled}
            className="mt-2 w-full rounded-xl py-2 text-xs font-semibold transition-colors"
            style={{
              background: "oklch(0.95 0 0 / 0.03)",
              border: "1px solid oklch(0.95 0 0 / 0.08)",
              color: "oklch(0.6 0 0)",
            }}
            title="Als geflüchtet vermerken (zählt für die Dupes-Klausel, kommt nicht ins Team)"
          >
            🏃 Als geflüchtet vermerken
          </button>
        )}
      </div>
    </div>
  );
}
