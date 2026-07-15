"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import type { Encounter, EncounterOutcome } from "@/lib/soullinkTypes";
import { useRoomStore, useUsedSpecies } from "@/lib/soullinkStore";
import type { PokemonSuggestion } from "@/lib/apiclient";
import { getFamilyKey } from "@/lib/soullinkApi";
import PokemonSearchInput from "./PokemonSearchInput";

interface EncounterCellEditorProps {
  seatId: string;
  routeId: string;
  routeLabel: string;
  playerName: string | null;
  encounter: Encounter | null;
  onClose: () => void;
}

const OUTCOMES: { value: EncounterOutcome; label: string; bg: string; border: string }[] = [
  { value: "caught", label: "✓ Gefangen", bg: "oklch(0.55 0.18 150 / 0.18)", border: "oklch(0.55 0.18 150 / 0.45)" },
  { value: "dead", label: "☠ Tot", bg: "oklch(0.55 0.22 15 / 0.18)", border: "oklch(0.55 0.22 15 / 0.45)" },
  { value: "fled", label: "🏃 Geflohen", bg: "oklch(0.65 0.2 60 / 0.16)", border: "oklch(0.65 0.2 60 / 0.45)" },
];

const OUTCOME_LABEL: Record<string, string> = {
  caught: "bereits gefangen",
  dead: "bereits gestorben",
  fled: "bereits geflüchtet",
};

export default function EncounterCellEditor({
  seatId,
  routeId,
  routeLabel,
  playerName,
  encounter,
  onClose,
}: EncounterCellEditorProps) {
  const params = useParams<{ roomCode: string }>();
  const roomCode = params.roomCode;
  const socket = useRoomStore((s) => s.socket);
  const upsertEncounter = useRoomStore((s) => s.upsertEncounter);
  const removeEncounterCell = useRoomStore((s) => s.removeEncounterCell);
  const usedSpecies = useUsedSpecies(seatId);

  const [selected, setSelected] = useState<PokemonSuggestion | null>(
    encounter
      ? { id: encounter.pokemonId, nameDE: encounter.pokemonName ?? null, nameEN: null }
      : null
  );
  const [outcome, setOutcome] = useState<EncounterOutcome>(encounter?.outcome ?? "caught");
  const [level, setLevel] = useState(encounter?.level != null ? String(encounter.level) : "");
  const [nickname, setNickname] = useState(encounter?.nickname ?? "");
  const [isShiny, setIsShiny] = useState(encounter?.isShiny === true);
  const [familyKey, setFamilyKey] = useState<number | null>(encounter?.familyKey ?? null);

  useEffect(() => {
    let cancelled = false;
    if (!selected) {
      setFamilyKey(null);
      return;
    }
    getFamilyKey(selected.id).then((key) => {
      if (!cancelled) setFamilyKey(key);
    });
    return () => {
      cancelled = true;
    };
  }, [selected]);

  // Dupes clause: warn if this evolution family was already used by this player
  // on another route.
  const dupeWarning = useMemo(() => {
    if (familyKey == null) return null;
    return usedSpecies.find((u) => u.familyKey === familyKey && u.pokemonId !== encounter?.pokemonId) ?? null;
  }, [familyKey, usedSpecies, encounter?.pokemonId]);

  function handleSave() {
    if (!selected || !socket) return;
    const lvl = level.trim() === "" ? null : Math.max(1, Math.min(100, parseInt(level, 10) || 0));
    const patch = {
      pokemonId: selected.id,
      outcome,
      nickname: nickname.trim() || null,
      level: lvl,
      isShiny,
    };
    // Optimistic — server broadcast reconciles familyKey.
    upsertEncounter({
      seatId,
      routeId,
      familyKey: familyKey ?? selected.id,
      pokemonId: selected.id,
      pokemonName: selected.nameDE ?? selected.nameEN ?? null,
      outcome,
      nickname: patch.nickname,
      level: lvl,
      isShiny,
    });
    socket.emit("encounter:set", { roomCode, seatId, routeId, patch });
    onClose();
  }

  function handleClear() {
    if (!socket) return;
    removeEncounterCell(seatId, routeId); // optimistic
    socket.emit("encounter:clear", { roomCode, seatId, routeId });
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center px-4"
      style={{ background: "oklch(0 0 0 / 0.72)", backdropFilter: "blur(4px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="glass-card max-h-[90vh] w-full max-w-sm overflow-y-auto p-5 animate-fade-in-up">
        <div className="mb-4">
          <h2 className="text-sm font-bold text-foreground">Begegnung bearbeiten</h2>
          <p className="text-xs text-muted-foreground">
            <span className="font-semibold text-foreground/80">{routeLabel}</span>
            {playerName ? ` · ${playerName}` : ""}
          </p>
        </div>

        <div className="flex flex-col gap-3.5">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Pokémon</label>
            <PokemonSearchInput value={selected} onChange={setSelected} usedSpecies={usedSpecies} />
          </div>

          {dupeWarning && (
            <div
              className="flex items-start gap-2 rounded-xl px-3 py-2.5 text-xs"
              style={{ background: "oklch(0.65 0.2 60 / 0.10)", border: "1px solid oklch(0.65 0.2 60 / 0.30)", color: "oklch(0.82 0.16 70)" }}
              role="alert"
            >
              <span aria-hidden>⚠</span>
              <span>
                Diese Entwicklungslinie wurde {OUTCOME_LABEL[dupeWarning.outcome] ?? "bereits genutzt"}
                {dupeWarning.pokemonName ? ` (${dupeWarning.pokemonName})` : ""}
                {dupeWarning.routeLabel ? ` auf ${dupeWarning.routeLabel}` : ""}. Dupes-Klausel!
              </span>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Ausgang</label>
            <div className="flex gap-2">
              {OUTCOMES.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => setOutcome(o.value)}
                  className="flex-1 rounded-xl py-2 text-xs font-bold transition-all duration-200"
                  style={{
                    background: outcome === o.value ? o.bg : "oklch(0.95 0 0 / 0.04)",
                    border: `1.5px solid ${outcome === o.value ? o.border : "oklch(0.95 0 0 / 0.08)"}`,
                    color: outcome === o.value ? "oklch(0.9 0 0)" : "oklch(0.5 0 0)",
                  }}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Level</label>
              <input
                type="number"
                min={1}
                max={100}
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                placeholder="—"
                className="input-field"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Nickname <span className="font-normal normal-case text-muted-foreground/40">(opt.)</span>
              </label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                maxLength={50}
                placeholder="—"
                className="input-field"
              />
            </div>
          </div>

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
        </div>

        <div className="mt-5 flex gap-2">
          <button onClick={handleSave} disabled={!selected || !socket} className="btn-primary flex-1 disabled:shadow-none">
            Speichern
          </button>
          {encounter && (
            <button onClick={handleClear} className="btn-ghost">
              Löschen
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
