"use client";

import { useState } from "react";
import { fetchMatchup, ApiError } from "@/lib/apiclient";
import type { MatchupResponse } from "@/lib/types";
import SearchBar from "@/components/SearchBar";
import PokemonCard from "@/components/PokemonCard";

type SearchState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; data: MatchupResponse }
  | { status: "error"; message: string };

const EXAMPLES = ["Glurak", "Pikachu", "Bisaflor", "Gengar", "Mewtwo"];

export default function Page() {
  const [state, setState] = useState<SearchState>({ status: "idle" });

  async function handleSearch(name: string, gen: number) {
    setState({ status: "loading" });
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

  function handleExample(name: string) {
    handleSearch(name, 9);
  }

  return (
    <>
      {/* ── Header ───────────────────────────────────────────────── */}
      <header
        className="sticky top-0 z-20 border-b border-border"
        style={{
          background: "oklch(0.09 0.035 260 / 0.85)",
          backdropFilter: "blur(20px) saturate(1.5)",
          WebkitBackdropFilter: "blur(20px) saturate(1.5)",
        }}
      >
        <div className="max-w-2xl mx-auto px-5 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
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
              <h1 className="text-xl font-black tracking-tight leading-none text-foreground">
                Pokétype
              </h1>
              <p className="text-[11px] text-muted-foreground mt-0.5 font-medium tracking-widest uppercase">
                Typ-Matchup Analyse
              </p>
            </div>
          </div>

          <div
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-muted-foreground"
            style={{ background: "var(--subtle)", border: "1px solid var(--subtle-foreground)" }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block"
              style={{ boxShadow: "0 0 6px oklch(0.75 0.18 150 / 0.8)" }}
            />
            Gen I – IX
          </div>
        </div>
      </header>

      {/* ── Main ─────────────────────────────────────────────────── */}
      <main className="flex-1 max-w-2xl w-full mx-auto px-4 sm:px-5 py-6 sm:py-8 flex flex-col gap-6">
        <SearchBar onSearch={handleSearch} loading={state.status === "loading"} />

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
              {EXAMPLES.map((ex) => (
                <button
                  key={ex}
                  onClick={() => handleExample(ex)}
                  className="px-3.5 py-1.5 rounded-full text-sm font-medium text-foreground/70 hover:text-foreground transition-colors cursor-pointer active:scale-95"
                  style={{
                    background: "var(--subtle)",
                    border: "1px solid var(--subtle-foreground)",
                  }}
                >
                  {ex}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Loading */}
        {state.status === "loading" && (
          <div className="flex flex-col items-center gap-5 py-16 animate-fade-in" aria-live="polite" aria-busy="true">
            <div className="pokeball">
              <div className="pokeball-top" />
              <div className="pokeball-mid" />
              <div className="pokeball-bot" />
            </div>
            <div className="text-center">
              <p className="text-foreground/80 font-medium">Lade Daten…</p>
              <p className="text-muted-foreground text-xs mt-1">Verbinde mit PokéAPI</p>
            </div>
          </div>
        )}

        {/* Error */}
        {state.status === "error" && (
          <div
            className="rounded-2xl px-5 py-4 flex items-start gap-3.5 animate-fade-in-up"
            style={{
              background: "oklch(0.55 0.22 15 / 0.07)",
              border: "1px solid oklch(0.55 0.22 15 / 0.22)",
            }}
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

        {/* Result */}
        {state.status === "success" && <PokemonCard data={state.data} />}
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
