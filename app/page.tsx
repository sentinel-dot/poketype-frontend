"use client";

import { useState } from "react";
import Link from "next/link";
import { fetchMatchup, fetchEvolution, ApiError } from "@/lib/apiclient";
import type { MatchupResponse, EvolutionResponse } from "@/lib/types";
import { TYPE_COLORS, getContrastColor } from "@/lib/types";
import SearchBar from "@/components/SearchBar";
import PokemonCard from "@/components/PokemonCard";
import EvolutionCard from "@/components/EvolutionCard";
import AccountBar from "@/components/AccountBar";

type SearchState =
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

const EXAMPLES: { name: string; type: string }[] = [
  { name: "Glurak", type: "fire" },
  { name: "Pikachu", type: "electric" },
  { name: "Bisaflor", type: "grass" },
  { name: "Gengar", type: "ghost" },
  { name: "Mewtwo", type: "psychic" },
];

export default function Page() {
  const [state, setState] = useState<SearchState>({ status: "idle" });
  const [evoState, setEvoState] = useState<EvoState>({ status: "idle" });
  const [activeTab, setActiveTab] = useState<Tab>("matchup");
  const [currentGen, setCurrentGen] = useState(9);

  async function handleSearch(name: string, gen: number) {
    setState({ status: "loading" });
    setEvoState({ status: "idle" });
    setActiveTab("matchup");
    setCurrentGen(gen);

    try {
      const data = await fetchMatchup(name, gen);
      setState({ status: "success", data });
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 404) {
          setState({ status: "error", message: `Pokémon „${name}" nicht gefunden.` });
        } else if (err.status === 422 || err.status === 400) {
          setState({ status: "error", message: err.message });
        } else {
          setState({ status: "error", message: `Fehler: ${err.message}` });
        }
      } else {
        setState({ status: "error", message: "Netzwerkfehler – ist die API erreichbar?" });
      }
    }
  }

  async function handleTabChange(tab: Tab) {
    setActiveTab(tab);

    if (tab === "evolution" && state.status === "success" && evoState.status === "idle") {
      setEvoState({ status: "loading" });
      try {
        const data = await fetchEvolution(state.data.pokemon);
        setEvoState({ status: "success", data });
      } catch (err) {
        const msg =
          err instanceof ApiError ? err.message : "Entwicklungsdaten konnten nicht geladen werden.";
        setEvoState({ status: "error", message: msg });
      }
    }
  }

  function handleExample(name: string) {
    handleSearch(name, 9);
  }

  const showTabs = state.status === "success";

  return (
    <>
      {/* ── Header ───────────────────────────────────────────────── */}
      <header className="glass-panel sticky top-0 z-20 border-b border-border">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-4 px-5 py-4">
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
              style={{
                background: "linear-gradient(135deg, var(--primary), oklch(0.44 0.22 15))",
                boxShadow: "0 4px 14px var(--primary-glow)",
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="1.5" />
                <path d="M2 12h8M14 12h8" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                <circle cx="12" cy="12" r="2.5" fill="white" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-black leading-none tracking-tight text-foreground">
                Pokétype
              </h1>
              <p className="mt-0.5 text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
                Typ-Matchup Analyse
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/soullink/create"
              className="btn-primary hidden items-center gap-1.5 px-3.5 py-2 text-xs sm:flex"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              SoulLink
            </Link>

            <AccountBar />
          </div>
        </div>
      </header>

      {/* ── Main ─────────────────────────────────────────────────── */}
      <main className="flex-1 max-w-2xl w-full mx-auto px-4 sm:px-5 py-6 sm:py-8 flex flex-col gap-6">
        <SearchBar onSearch={handleSearch} loading={state.status === "loading"} />

        {/* Tabs (only when a pokemon is loaded) */}
        {showTabs && (
          <div className="glass-panel flex gap-1 self-start rounded-xl p-1">
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

        {/* Idle */}
        {state.status === "idle" && (
          <div className="flex flex-col items-center text-center py-10 gap-6 animate-fade-in-up">
            <div
              className="w-20 h-20 rounded-3xl flex items-center justify-center"
              style={{
                background: "oklch(0.55 0.22 15 / 0.08)",
                border: "1px solid oklch(0.55 0.22 15 / 0.18)",
                boxShadow: "0 0 40px oklch(0.55 0.22 15 / 0.06)",
              }}
            >
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="var(--primary)" strokeWidth="1.5" strokeOpacity="0.6" />
                <path d="M2 12h8M14 12h8" stroke="var(--primary)" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.8" />
                <circle cx="12" cy="12" r="2.5" fill="var(--primary)" />
              </svg>
            </div>

            <div>
              <p className="text-muted-foreground leading-relaxed max-w-sm text-sm">
                Gib den Namen eines Pokémon ein (Deutsch oder Englisch) und wähle eine Generation.
              </p>
              <p className="mt-1 text-muted-foreground/60 text-xs">Alle 18 Typen · Gen I bis IX</p>
            </div>

            <div className="flex flex-wrap justify-center gap-2">
              {EXAMPLES.map((ex) => {
                const bg = TYPE_COLORS[ex.type] ?? "#888";
                const fg = getContrastColor(bg);
                return (
                  <button
                    key={ex.name}
                    onClick={() => handleExample(ex.name)}
                    className="cursor-pointer rounded-full px-3.5 py-1.5 text-sm font-semibold transition-all duration-150 hover:scale-105 active:scale-95"
                    style={{
                      background: bg,
                      color: fg,
                      boxShadow: `0 2px 10px ${bg}44, inset 0 1px 0 oklch(1 0 0 / 0.15)`,
                    }}
                  >
                    {ex.name}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Loading (matchup) */}
        {state.status === "loading" && (
          <div className="flex flex-col items-center gap-5 py-16 animate-fade-in" aria-live="polite" aria-busy="true">
            <div className="pokeball">
              <div className="pokeball-top" />
              <div className="pokeball-mid" />
              <div className="pokeball-bot" />
            </div>
            <div className="text-center">
              <p className="text-foreground/80 font-medium">Lade Daten…</p>
              <p className="text-muted-foreground text-xs mt-1">Verbinde mit API</p>
            </div>
          </div>
        )}

        {/* Error */}
        {state.status === "error" && (
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
              <p className="text-sm mt-0.5" style={{ color: "oklch(0.65 0.15 15)" }}>{state.message}</p>
            </div>
          </div>
        )}

        {/* Matchup tab */}
        {state.status === "success" && activeTab === "matchup" && (
          <PokemonCard data={state.data} />
        )}

        {/* Evolution tab */}
        {state.status === "success" && activeTab === "evolution" && (
          <>
            {evoState.status === "loading" && (
              <div className="flex flex-col items-center gap-5 py-16 animate-fade-in" aria-live="polite" aria-busy="true">
                <div className="pokeball">
                  <div className="pokeball-top" />
                  <div className="pokeball-mid" />
                  <div className="pokeball-bot" />
                </div>
                <p className="text-foreground/80 font-medium text-sm">Lade Entwicklungskette…</p>
              </div>
            )}

            {evoState.status === "error" && (
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
                  <p className="text-sm mt-0.5" style={{ color: "oklch(0.65 0.15 15)" }}>{evoState.message}</p>
                </div>
              </div>
            )}

            {evoState.status === "success" && (
              <EvolutionCard
                data={evoState.data}
                currentId={state.data.pokemonId ?? 0}
                onSelect={(nameEN) => handleSearch(nameEN, currentGen)}
              />
            )}
          </>
        )}
      </main>

      {/* ── Footer ───────────────────────────────────────────────── */}
      <footer className="text-center py-5 text-xs text-muted-foreground/50 border-t border-border">
        Daten von{" "}
        <a
          href="https://pokeapi.co"
          target="_blank"
          rel="noopener noreferrer"
          className="text-muted-foreground hover:text-foreground transition-colors font-medium"
        >
          PokéAPI
        </a>
        <span className="mx-2 opacity-30">·</span>
        Pokétype v2.0
      </footer>
    </>
  );
}
