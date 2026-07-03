"use client";

import { useState, useEffect } from "react";
import { fetchMatchup, fetchEvolution, ApiError } from "@/lib/apiclient";
import type { MatchupResponse, EvolutionResponse } from "@/lib/types";
import PokemonCard from "@/components/PokemonCard";
import EvolutionCard from "@/components/EvolutionCard";

interface PokemonDetailModalProps {
  pokemonName: string;
  onEdit?: () => void;
  onClose: () => void;
}

type MatchupState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; data: MatchupResponse }
  | { status: "error"; message: string };

type EvoState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; data: EvolutionResponse }
  | { status: "error"; message: string };

type Tab = "matchup" | "evolution";

// Detail-Daten werden gegen die volle Typ-Tabelle (inkl. Fairy) berechnet,
// konsistent mit usePokemonTypes, das ebenfalls Gen 9 nutzt.
const DETAIL_GEN = 9;

function Spinner({ label }: { label: string }) {
  return (
    <div
      className="flex flex-col items-center gap-5 py-16 animate-fade-in"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="pokeball">
        <div className="pokeball-top" />
        <div className="pokeball-mid" />
        <div className="pokeball-bot" />
      </div>
      <p className="text-foreground/80 font-medium text-sm">{label}</p>
    </div>
  );
}

function ErrorCard({ message }: { message: string }) {
  return (
    <div
      className="glass-card flex animate-fade-in-up items-start gap-3.5 border border-primary/22 bg-primary/7 px-5 py-4"
      role="alert"
    >
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
        style={{ background: "oklch(0.55 0.22 15 / 0.15)" }}
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2.5" strokeLinecap="round">
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </div>
      <div>
        <p className="font-semibold text-sm" style={{ color: "oklch(0.72 0.2 15)" }}>Fehler</p>
        <p className="text-sm mt-0.5" style={{ color: "oklch(0.65 0.15 15)" }}>{message}</p>
      </div>
    </div>
  );
}

export default function PokemonDetailModal({
  pokemonName,
  onEdit,
  onClose,
}: PokemonDetailModalProps) {
  // currentName erlaubt Navigation innerhalb des Modals (Klick auf Entwicklungs-Tile).
  const [currentName, setCurrentName] = useState(pokemonName);
  const [state, setState] = useState<MatchupState>({ status: "idle" });
  const [evoState, setEvoState] = useState<EvoState>({ status: "idle" });
  const [activeTab, setActiveTab] = useState<Tab>("matchup");

  useEffect(() => {
    let cancelled = false;
    setState({ status: "loading" });
    setEvoState({ status: "idle" });
    setActiveTab("matchup");

    fetchMatchup(currentName, DETAIL_GEN)
      .then((data: MatchupResponse) => {
        if (!cancelled) setState({ status: "success", data });
      })
      .catch((err) => {
        if (cancelled) return;
        const message =
          err instanceof ApiError && err.status === 404
            ? `Pokémon „${currentName}" nicht gefunden.`
            : err instanceof ApiError
            ? err.message
            : "Netzwerkfehler – ist die API erreichbar?";
        setState({ status: "error", message });
      });

    return () => {
      cancelled = true;
    };
  }, [currentName]);

  function handleTabChange(tab: Tab) {
    setActiveTab(tab);
    if (tab === "evolution" && state.status === "success" && evoState.status === "idle") {
      setEvoState({ status: "loading" });
      fetchEvolution(state.data.pokemon)
        .then((data: EvolutionResponse) => setEvoState({ status: "success", data }))
        .catch((err) => {
          const message =
            err instanceof ApiError
              ? err.message
              : "Entwicklungsdaten konnten nicht geladen werden.";
          setEvoState({ status: "error", message });
        });
    }
  }

  const showTabs = state.status === "success";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6"
      style={{ background: "oklch(0 0 0 / 0.72)", backdropFilter: "blur(4px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="glass-card flex max-h-full w-full max-w-md flex-col overflow-hidden p-5 animate-fade-in-up">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {onEdit && (
              <button
                onClick={onEdit}
                className="btn-ghost flex items-center gap-1.5 px-3 py-1.5 text-xs"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 20h9" />
                  <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z" />
                </svg>
                Bearbeiten
              </button>
            )}
          </div>
          <button
            onClick={onClose}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-colors"
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

        {/* Tabs */}
        {showTabs && (
          <div className="glass-panel mb-4 flex gap-1 self-start rounded-xl p-1">
            {(["matchup", "evolution"] as Tab[]).map((tab) => {
              const active = activeTab === tab;
              return (
                <button
                  key={tab}
                  onClick={() => handleTabChange(tab)}
                  className="cursor-pointer rounded-lg px-4 py-1.5 text-sm font-semibold transition-all duration-200"
                  style={{
                    background: active ? "var(--primary)" : "transparent",
                    color: active ? "white" : "oklch(0.6 0.06 260)",
                    boxShadow: active ? "0 2px 12px var(--primary-glow)" : "none",
                  }}
                >
                  {tab === "matchup" ? "Matchup" : "Entwicklung"}
                </button>
              );
            })}
          </div>
        )}

        {/* Content (scrollable) */}
        <div className="min-h-0 flex-1 overflow-y-auto">
          {state.status === "loading" && <Spinner label="Lade Daten…" />}
          {state.status === "error" && <ErrorCard message={state.message} />}

          {state.status === "success" && activeTab === "matchup" && (
            <PokemonCard data={state.data} />
          )}

          {state.status === "success" && activeTab === "evolution" && (
            <>
              {evoState.status === "loading" && <Spinner label="Lade Entwicklungskette…" />}
              {evoState.status === "error" && <ErrorCard message={evoState.message} />}
              {evoState.status === "success" && (
                <EvolutionCard
                  data={evoState.data}
                  currentId={state.data.pokemonId ?? 0}
                  onSelect={(nameEN) => setCurrentName(nameEN)}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
